import Enrollment from "../../models/enrollment.model.js";
import {
  STEPS,
  ENROLLMENT_PROGRESS,
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
    const enrollment = await Enrollment.findOne({
      trnId,
      enrollmentProgress: ENROLLMENT_PROGRESS.DRAFT,
    })
      .select("+kyc.uidEncrypted +pan.panEncrypted +bank.accountEncrypted")
      .lean();

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: "Enrollment not found",
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
    console.error("[getUserEnrollmentPreview]", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch preview",
    });
  }
};
