import Enrollment from "../../models/enrollment.model.js";
import { processUidKyc } from "../../services/uidKycService.js";
import {
  STEPS,
  ENROLLMENT_PROGRESS,
} from "../../../../../config/constants.config.js";

// Verify UID KYC (Process + Save)
export const verifyUserEnrollmentUidKyc = async (req, res) => {
  try {
    const { trnId, uidNumber, shareCode } = req.body;

    if (!trnId || !uidNumber || !shareCode) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const uidXmlFile = req.files?.uidXml?.[0];

    if (!uidXmlFile) {
      return res.status(400).json({
        success: false,
        message: "UID XML file is required",
      });
    }

    const enrollment = await Enrollment.findOne({ trnId });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: "Enrollment not found",
      });
    }

    if (enrollment.enrollmentProgress !== ENROLLMENT_PROGRESS.DRAFT) {
      return res.status(400).json({
        success: false,
        message: "Invalid enrollment stage",
      });
    }

    if (enrollment.enrollmentFlow.currentStep !== STEPS.KYC) {
      return res.status(400).json({
        success: false,
        message: "Invalid step flow",
      });
    }

    if (enrollment.kyc?.verification?.status === "VERIFIED") {
      return res.status(400).json({
        success: false,
        message: "KYC already completed",
      });
    }

    const normalizedMobile = enrollment.auth.mobile?.number
      ?.replace(/\D/g, "")
      .slice(-10);

    if (!normalizedMobile) {
      return res.status(400).json({
        success: false,
        message: "Mobile not available for KYC validation",
      });
    }

    const kycData = await processUidKyc({
      zipBuffer: uidXmlFile.buffer,
      uidNumber,
      shareCode,
      mobile: normalizedMobile,
    });

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
        uidXml: { ref: kycData.kycReferenceId },
        uidHardCopy: {
          ref: null, // not uploaded yet
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

    await enrollment.save();

    return res.status(200).json({
      success: true,
      message: "KYC verified successfully",
    });
  } catch (error) {
    console.error("[verifyUserEnrollmentUidKyc] Error:", {
      message: error.message,
      stack: error.stack,
    });

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Complete KYC Step (Move Flow)
export const completeUserEnrollmentKyc = async (req, res) => {
  try {
    const { trnId } = req.body;

    if (!trnId) {
      return res.status(400).json({
        success: false,
        message: "trnId is required",
      });
    }

    const enrollment = await Enrollment.findOne({ trnId });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: "Enrollment not found",
      });
    }

    if (enrollment.enrollmentProgress !== ENROLLMENT_PROGRESS.DRAFT) {
      return res.status(400).json({
        success: false,
        message: "Invalid enrollment stage",
      });
    }

    if (enrollment.enrollmentFlow.currentStep !== STEPS.KYC) {
      return res.status(400).json({
        success: false,
        message: "Invalid step flow",
      });
    }

    // Ensure KYC verified
    if (enrollment.kyc?.verification?.status !== "VERIFIED") {
      return res.status(400).json({
        success: false,
        message: "KYC not completed yet",
      });
    }

    // FILE VALIDATION (THIS WAS MISSING FOR YOUR FLOW)
    const uidHardCopyFile = req.files?.uidHardCopy?.[0];

    if (!uidHardCopyFile) {
      return res.status(400).json({
        success: false,
        message: "UID hard copy is required",
      });
    }

    // Later replace with actual storage logic
    enrollment.kyc.documents.uidHardCopy = {
      ref: "TEMP_UPLOAD",
      isConfirmed: false,
    };

    // Step progression
    if (!enrollment.enrollmentFlow.stepsCompleted.includes(STEPS.KYC)) {
      enrollment.enrollmentFlow.stepsCompleted.push(STEPS.KYC);
    }

    enrollment.enrollmentFlow.currentStep = STEPS.PAN_BANK;

    await enrollment.save();

    return res.status(200).json({
      success: true,
      message: "KYC step completed successfully",
    });
  } catch (error) {
    console.error("[completeUserEnrollmentKyc] Error:", {
      message: error.message,
      stack: error.stack,
    });

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
