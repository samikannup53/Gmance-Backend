import crypto from "crypto";
import { DOMParser } from "@xmldom/xmldom";
import { SignedXml } from "xml-crypto";
import fs from "fs";
import path from "path";
import xpath from "xpath";
import os from "os";
import Seven from "node-7z";
import { path7za } from "7zip-bin";

import {
  extractUidLastDigit,
  generateUidMobileHash,
} from "../utils/kycHash.js";
import { encrypt } from "../utils/encryption.js";

// Extract XML from Aadhaar ZIP using shareCode
export const extractUidXmlFromZip = async (zipBuffer, shareCode) => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "uid-"));
  const zipPath = path.join(tempDir, "file.zip");

  try {
    // 1. Save ZIP file
    fs.writeFileSync(zipPath, zipBuffer);

    // 2. Extract ZIP using password
    await new Promise((resolve, reject) => {
      const stream = Seven.extractFull(zipPath, tempDir, {
        $bin: path7za,
        password: shareCode,
      });

      stream.on("end", resolve);
      stream.on("error", reject);
    });

    // 3. Get files in folder
    const files = fs.readdirSync(tempDir);

    // 4. Find XML file
    const xmlFile = files.find((f) => f.endsWith(".xml"));
    if (!xmlFile) throw new Error("XML not found");

    // 5. Read and return XML
    const xmlPath = path.join(tempDir, xmlFile);

    return fs.readFileSync(xmlPath, "utf-8");
  } catch (err) {
    throw new Error("Invalid ZIP or wrong share code");
  } finally {
    // 6. Cleanup
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
};

// Parse UIDAI XML and extract KYC data
export const parseUidXml = (xmlBuffer) => {
  try {
    const xmlString = xmlBuffer.toString("utf-8");

    // Basic validation
    if (!xmlString.startsWith("<?xml")) {
      throw new Error("Invalid XML format");
    }

    if (!xmlString.includes("<OfflinePaperlessKyc")) {
      throw new Error("Not a UIDAI XML");
    }

    const document = new DOMParser().parseFromString(xmlString, "text/xml");

    // Detect parser errors
    const parseError = document.getElementsByTagName("parsererror");

    if (parseError.length > 0) {
      throw new Error("Malformed XML");
    }

    return { document, xmlString };
  } catch (error) {
    throw new Error(`Failed to parse UIDAI XML: ${error.message}`);
  }
};

// Verify XML signature using UIDAI public certificate
export const verifyUidXmlSignature = (xmlString, document) => {
  try {
    const signatureNode = xpath.select(
      "//*[local-name()='Signature']",
      document,
    )[0];

    if (!signatureNode) {
      throw new Error("Missing XML Signature");
    }

    // 🔥 Extract certificate from XML
    const certNode = xpath.select(
      "//*[local-name()='X509Certificate']",
      document,
    )[0];

    if (!certNode) {
      throw new Error("Certificate not found in XML");
    }

    const cert = certNode.textContent.replace(/\r?\n|\r/g, "").trim();

    const publicCert = `-----BEGIN CERTIFICATE-----\n${cert}\n-----END CERTIFICATE-----`;

    const signature = new SignedXml();

    // 🔥 THIS IS THE REAL FIX
    signature.publicCert = publicCert;

    signature.loadSignature(signatureNode);

    const isValid = signature.checkSignature(xmlString);

    if (!isValid) {
      console.error("Validation Errors:", signature.validationErrors);
      throw new Error("Invalid XML Signature");
    }

    return true;
  } catch (error) {
    throw new Error(`XML Signature Verification Failed: ${error.message}`);
  }
};

// Extract UID KYC data from the parsed XML document
export const extractUidKycData = (document) => {
  try {
    // Extract root and child nodes
    const root = document.getElementsByTagName("OfflinePaperlessKyc")[0];
    const poi = document.getElementsByTagName("Poi")[0];
    const poa = document.getElementsByTagName("Poa")[0];
    const pht = document.getElementsByTagName("Pht")[0];

    if (!root || !poi || !poa) {
      throw new Error("Invalid KYC XML structure");
    }

    if (!pht || !pht.textContent || !pht.textContent.trim()) {
      throw new Error("Missing or invalid photo in Aadhaar XML");
    }

    const referenceId = root.getAttribute("referenceId");

    // Extracted KYC data
    const uidKycData = {
      referenceId: referenceId,

      name: poi.getAttribute("name"),
      dob: poi.getAttribute("dob"),
      gender: poi.getAttribute("gender"),

      mobileHash: poi.getAttribute("m"),

      address: {
        careOf: poa.getAttribute("careof"),
        country: poa.getAttribute("country"),
        district: poa.getAttribute("dist"),
        house: poa.getAttribute("house"),
        location: poa.getAttribute("loc"),
        pincode: poa.getAttribute("pc"),
        postOffice: poa.getAttribute("po"),
        state: poa.getAttribute("state"),
        street: poa.getAttribute("street"),
        subDistrict: poa.getAttribute("subdist"),
        village: poa.getAttribute("vtc"),
      },

      photo: pht.textContent.trim(),
    };

    if (!uidKycData.referenceId || !uidKycData.mobileHash) {
      throw new Error("Missing required KYC attributes");
    }

    return uidKycData;
  } catch (error) {
    throw new Error(`KYC Verification Failed: ${error.message}`);
  }
};

// Process UID KYC from ZIP buffer, share code, and mobile number
export const processUidKyc = async ({
  zipBuffer,
  uidNumber,
  shareCode,
  mobile,
}) => {
  try {
    // 1. Extract XML
    const xmlBuffer = await extractUidXmlFromZip(zipBuffer, shareCode);

    // 2. Parse XML
    const { document, xmlString } = parseUidXml(xmlBuffer);

    // 3. Verify signature
    verifyUidXmlSignature(xmlString, document);

    // 4. Extract data
    const uidKycData = extractUidKycData(document);

    // 5. Mobile validation
    const lastDigit = extractUidLastDigit(uidKycData.referenceId);

    const computedMobileHash = generateUidMobileHash(
      mobile,
      shareCode,
      lastDigit,
    );

    if (computedMobileHash !== uidKycData.mobileHash) {
      throw new Error("The given mobile number is not registered with Aadhaar");
    }

    // 6. UID validation
    if (uidNumber.slice(-4) !== uidKycData.referenceId.slice(0, 4)) {
      throw new Error("Aadhaar number does not match XML");
    }

    // 7. Hash + encrypt
    const uidHash = crypto
      .createHash("sha256")
      .update(uidKycData.mobileHash + uidKycData.referenceId)
      .digest("hex");

    const uidEncrypted = encrypt(uidNumber);

    return {
      kycReferenceId: uidKycData.referenceId,

      uidHash,
      uidLast4: uidNumber.slice(-4),
      uidEncrypted,

      name: uidKycData.name,
      dob: uidKycData.dob,
      gender: uidKycData.gender,
      address: uidKycData.address,
      photo: uidKycData.photo,
    };
  } catch (error) {
    throw new Error(`UID KYC Verification Failed: ${error.message}`);
  }
};
