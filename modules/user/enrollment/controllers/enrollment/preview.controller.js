import Enrollment from "../../models/enrollment.model.js";
import {
  STEPS,
  ENROLLMENT_PROGRESS,
  USER_ENROLLMENT_SECTIONS,
} from "../../../../../config/constants.config.js";

import { decrypt } from "../../utils/encryption.js";

export const getUserEnrollmentPreview = async (req, res) => {
  try {
    const { trnId, mobile } = req.body;
    // Basic Validation
    if (!trnId) {
      return res.status(400).json({
        success: false,
        message: "trnId is required",
      });
    }
    // Fetch enrollment with necessary encrypted fields
    const enrollment = await Enrollment.findOne({ trnId })
      .select("+kyc.uidEncrypted +pan.panEncrypted +bank.accountEncrypted")
      .lean();

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: "Enrollment not found",
      });
    }

    if (enrollment.enrollmentProgress !== ENROLLMENT_PROGRESS.DRAFT) {
      return res.status(400).json({
        success: false,
        message: `Enrollment is currently in ${enrollment.enrollmentProgress
          .toLowerCase()
          .replace(/_/g, " ")
          .replace(/\b\w/g, (l) =>
            l.toUpperCase(),
          )} Stage. This action is not allowed.`,
      });
    }

    // Step Access Validation
    if (enrollment.enrollmentFlow.currentStep !== STEPS.PREVIEW) {
      return res.status(400).json({
        success: false,
        message: "Preview not available at this stage",
      });
    }

    // Public Enrollment Access Validation
    if (enrollment.enrollmentSource === "PUBLIC") {
      if (!mobile) {
        return res.status(400).json({
          success: false,
          message: "Mobile number is required",
        });
      }

      const normalizedInput = mobile.replace(/\D/g, "").slice(-10);
      const storedMobile = enrollment?.auth?.mobile?.number
        ?.replace(/\D/g, "")
        .slice(-10);

      if (normalizedInput !== storedMobile) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized access",
        });
      }
    }

    // Build response data with decrypted fields
    const responseData = { ...enrollment };

    // Decrypt sensitive fields for preview
    responseData.preview = {
      uid: enrollment.kyc?.uidEncrypted
        ? decrypt(enrollment.kyc.uidEncrypted)
        : null,

      pan: enrollment.pan?.panEncrypted
        ? decrypt(enrollment.pan.panEncrypted)
        : null,

      bankAccount: enrollment.bank?.accountEncrypted
        ? decrypt(enrollment.bank.accountEncrypted)
        : null,
    };

    // Remove Sensitive Encrypted Fields from Main Response
    if (responseData.kyc) delete responseData.kyc.uidEncrypted;
    if (responseData.pan) delete responseData.pan.panEncrypted;
    if (responseData.bank) delete responseData.bank.accountEncrypted;

    // Respond with preview data
    return res.status(200).json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error("[getUserEnrollmentPreview] Error:", {
      message: error.message,
      stack: error.stack,
      body: req.body,
      time: new Date().toISOString(),
    });

    return res.status(500).json({
      success: false,
      message: "Unable to Fetch Enrollment Preview, Please try again later",
    });
  }
};

export const confirmUserEnrollmentPreview = async (req, res) => {
  try {
    const { trnId, documentConfirmations, submissionConsent } = req.body;

    // BASIC VALIDATION
    if (!trnId) {
      return res.status(400).json({
        success: false,
        message: "trnId is required",
      });
    }

    if (!documentConfirmations || typeof documentConfirmations !== "object") {
      return res.status(400).json({
        success: false,
        message: "Document confirmations required",
      });
    }

    // FETCH ENROLLMENT
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
        message: `Enrollment is currently in ${enrollment.enrollmentProgress
          .toLowerCase()
          .replace(/_/g, " ")
          .replace(/\b\w/g, (l) =>
            l.toUpperCase(),
          )} Stage. This action is not allowed.`,
      });
    }

    // STEP VALIDATION
    if (enrollment.enrollmentFlow.currentStep !== STEPS.PREVIEW) {
      return res.status(400).json({
        success: false,
        message: "Invalid step flow",
      });
    }

    // FLOW CHECK (KIOSK REQUIRED OR NOT)
    const requiresKiosk = USER_ENROLLMENT_SECTIONS[
      enrollment.userType
    ]?.includes(STEPS.KIOSK);

    // CONFIRMATION VALIDATION
    if (!documentConfirmations?.kyc?.uidHardCopy) {
      return res.status(400).json({
        success: false,
        message: "KYC UID Hard Copy not confirmed",
      });
    }

    if (!documentConfirmations?.pan?.hardCopy) {
      return res.status(400).json({
        success: false,
        message: "PAN Hard Copy not confirmed",
      });
    }

    if (!documentConfirmations?.bank?.passbookOrCheque) {
      return res.status(400).json({
        success: false,
        message: "Bank document not confirmed",
      });
    }

    if (!documentConfirmations?.personal?.photo) {
      return res.status(400).json({
        success: false,
        message: "Photo not confirmed",
      });
    }

    if (!documentConfirmations?.personal?.pvr) {
      return res.status(400).json({
        success: false,
        message: "PVR not confirmed",
      });
    }

    if (!documentConfirmations?.personal?.qualificationCertificate) {
      return res.status(400).json({
        success: false,
        message: "Qualification certificate not confirmed",
      });
    }

    if (requiresKiosk && !documentConfirmations?.kiosk?.udyamCertificate) {
      return res.status(400).json({
        success: false,
        message: "Udyam certificate not confirmed",
      });
    }

    if (requiresKiosk && !documentConfirmations?.kiosk?.kioskPhoto) {
      return res.status(400).json({
        success: false,
        message: "Kiosk photo not confirmed",
      });
    }

    // FILE VALIDATION
    if (!enrollment.kyc?.documents?.uidHardCopy?.ref) {
      return res.status(400).json({
        success: false,
        message: "KYC UID Hard Copy not uploaded",
      });
    }

    if (!enrollment.pan?.documents?.hardCopy?.ref) {
      return res.status(400).json({
        success: false,
        message: "PAN Hard Copy not uploaded",
      });
    }

    if (!enrollment.bank?.documents?.passbookOrCheque?.ref) {
      return res.status(400).json({
        success: false,
        message: "Bank document not uploaded",
      });
    }

    if (!enrollment.personal?.documents?.photo?.ref) {
      return res.status(400).json({
        success: false,
        message: "Photo not uploaded",
      });
    }

    if (!enrollment.personal?.documents?.pvr?.ref) {
      return res.status(400).json({
        success: false,
        message: "PVR not uploaded",
      });
    }

    if (!enrollment.personal?.documents?.qualificationCertificate?.ref) {
      return res.status(400).json({
        success: false,
        message: "Qualification certificate not uploaded",
      });
    }

    if (requiresKiosk && !enrollment.kiosk?.documents?.udyamCertificate?.ref) {
      return res.status(400).json({
        success: false,
        message: "Udyam certificate not uploaded",
      });
    }

    if (requiresKiosk && !enrollment.kiosk?.documents?.kioskPhoto?.ref) {
      return res.status(400).json({
        success: false,
        message: "Kiosk photo not uploaded",
      });
    }

    // APPLY CONFIRMATIONS
    enrollment.kyc.documents.uidHardCopy.isConfirmed = true;
    enrollment.pan.documents.hardCopy.isConfirmed = true;
    enrollment.bank.documents.passbookOrCheque.isConfirmed = true;

    enrollment.personal.documents.photo.isConfirmed = true;
    enrollment.personal.documents.pvr.isConfirmed = true;
    enrollment.personal.documents.qualificationCertificate.isConfirmed = true;

    if (requiresKiosk) {
      enrollment.kiosk.documents.udyamCertificate.isConfirmed = true;
      enrollment.kiosk.documents.kioskPhoto.isConfirmed = true;
    }

    // CONSENT VALIDATION
    if (!submissionConsent?.method) {
      return res.status(400).json({
        success: false,
        message: "Submission consent required",
      });
    }

    if (!["OTP", "CHECKBOX", "ESIGN"].includes(submissionConsent.method)) {
      return res.status(400).json({
        success: false,
        message: "Invalid consent method",
      });
    }

    // SAVE CONSENT
    enrollment.process = enrollment.process || {};
    enrollment.process.submissionConsent = {
      isConfirmed: true,
      method: submissionConsent.method,
      confirmedBy: "USER",
      confirmedAt: new Date(),
      referenceId: null,
    };

    // SAVE
    await enrollment.save();

    return res.status(200).json({
      success: true,
      message: "Preview confirmed successfully",
    });
  } catch (error) {
    console.error("[confirmUserEnrollmentPreview] Error:", {
      message: error.message,
      stack: error.stack,
      body: req.body,
      time: new Date().toISOString(),
    });

    return res.status(500).json({
      success: false,
      message: "Unable to confirm preview. Please try again later",
    });
  }
};
