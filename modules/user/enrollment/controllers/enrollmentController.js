import Enrollment from "../models/enrollmentModel.js";
import { processUidKyc } from "../services/uidKycService.js";

export const verifyUidKyc = async (req, res) => {
  try {
    const { trnId, uidNumber, shareCode } = req.body;

    // Basic validation
    if (!trnId || !uidNumber || !shareCode) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // File validation
    const uidXmlFile = req.files?.uidXml?.[0];
    const uidHardCopyFile = req.files?.uidHardCopy?.[0];

    if (!uidXmlFile) {
      return res.status(400).json({
        success: false,
        message: "UID XML file is required",
      });
    }

    if (!uidHardCopyFile) {
      return res.status(400).json({
        success: false,
        message: "UID hard copy is required",
      });
    }

    // Fetch enrollment using trnId (source of truth)
    const enrollment = await Enrollment.findOne({ trnId });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: "Enrollment not found",
      });
    }

    // Flow validation
    if (enrollment.enrollmentProgress !== "DRAFT") {
      return res.status(400).json({
        success: false,
        message: "Invalid enrollment stage",
      });
    }

    // Prevent duplicate KYC
    if (enrollment.kyc?.verification?.status === "VERIFIED") {
      return res.status(400).json({
        success: false,
        message: "KYC already completed",
      });
    }

    // Process UID KYC
    const kycData = await processUidKyc({
      zipBuffer: uidXmlFile.buffer,
      uidNumber,
      shareCode,
      mobile: enrollment.auth.mobile.number.replace(/\D/g, "").slice(-10),
    });

    // Map KYC data
    enrollment.kyc = {
      source: "UIDAI_XML",

      uidHash: kycData.uidHash,
      uidEncrypted: kycData.uidEncrypted,
      uidLast4: kycData.uidLast4,

      identity: {
        fullName: kycData.name,
        dob: new Date(kycData.dob),
        gender:
          kycData.gender === "M"
            ? "MALE"
            : kycData.gender === "F"
              ? "FEMALE"
              : "OTHER",
        address: Object.values(kycData.address).filter(Boolean).join(", "),
        photoRef: kycData.photo,
        kycReferenceId: kycData.kycReferenceId,
      },

      documents: {
        uidXml: {
          ref: kycData.kycReferenceId,
        },
        uidHardCopy: {
          ref: "TEMP_UPLOAD", // replace when storage added
          isConfirmed: false,
        },
      },

      verification: {
        status: "VERIFIED",
        verifiedAt: new Date(),
        verifiedBy: "SYSTEM",
        source: "UIDAI_XML",
      },
    };

    // Update flow
    enrollment.enrollmentFlow.currentStep = "KYC";

    if (!enrollment.enrollmentFlow.stepsCompleted.includes("KYC")) {
      enrollment.enrollmentFlow.stepsCompleted.push("KYC");
    }

    await enrollment.save();

    return res.status(200).json({
      success: true,
      message: "KYC completed successfully",
      data: {
        trnId: enrollment.trnId,
        publicId: enrollment.publicId,
      },
    });
  } catch (error) {
    console.error("[completeKyc] Error:", {
      message: error.message,
      stack: error.stack,
      time: new Date().toISOString(),
    });

    return res.status(400).json({
      success: false,
      message: error.message || "KYC processing failed",
    });
  }
};
