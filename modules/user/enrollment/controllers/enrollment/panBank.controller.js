import Enrollment from "../../models/enrollment.model.js";
import {
  STEPS,
  ENROLLMENT_PROGRESS,
  USER_ENROLLMENT_STEP_MODES,
} from "../../../../../config/constants.config.js";

import {
  validateUserEnrollmentStepAccess,
  handleUserEnrollmentStepProgression,
} from "../../services/stepFlow.service.js";

import { encrypt } from "../../utils/encryption.js";

// Modes requiring full validation
const VALIDATION_MODES = [
  USER_ENROLLMENT_STEP_MODES.NEXT,
  USER_ENROLLMENT_STEP_MODES.SUBMIT,
  USER_ENROLLMENT_STEP_MODES.FINAL_SUBMIT,
];

export const completeUserEnrollmentPanBank = async (req, res) => {
  try {
    const { trnId, mode } = req.body;

    const data =
      typeof req.body.data === "string"
        ? JSON.parse(req.body.data)
        : req.body.data;

    const files = req.files || {};

    // =========================
    // BASIC VALIDATION
    // =========================

    if (!trnId || !mode) {
      return res.status(400).json({
        success: false,
        message: "trnId and mode are required",
      });
    }

    const enrollment = await Enrollment.findOne({
      trnId,
      enrollmentProgress: ENROLLMENT_PROGRESS.DRAFT,
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: "Enrollment not found",
      });
    }

    // =========================
    // FLOW VALIDATION
    // =========================

    if (enrollment.enrollmentProgress !== ENROLLMENT_PROGRESS.DRAFT) {
      return res.status(400).json({
        success: false,
        message: "Invalid enrollment stage",
      });
    }

    // Validate step access
    try {
      validateUserEnrollmentStepAccess(enrollment, STEPS.PAN_BANK);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    // =========================
    // PAN MAPPING + VALIDATION
    // =========================

    const pan = data?.pan || {};

    if (pan.number) {
      const normalizedPan = pan.number.trim().toUpperCase();

      if (normalizedPan.length !== 10) {
        return res.status(400).json({
          success: false,
          message: "Invalid PAN number",
        });
      }

      enrollment.pan.panEncrypted = encrypt(normalizedPan);
      enrollment.pan.last4 = normalizedPan.slice(-4);
    }

    if (pan.name) {
      const name = pan.name.trim();

      if (name.length < 3) {
        return res.status(400).json({
          success: false,
          message: "Invalid PAN name",
        });
      }

      enrollment.pan.name = name;
    }

    // PAN DOCUMENT
    if (files.panHardCopy?.[0]) {
      enrollment.pan.documents.hardCopy = {
        ref: "TEMP_UPLOAD",
        isConfirmed: false,
      };
    }

    // =========================
    // BANK MAPPING + VALIDATION
    // =========================

    const bank = data?.bank || {};

    if (bank.accountNumber) {
      const normalizedAccount = bank.accountNumber.replace(/\D/g, "");

      if (normalizedAccount.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Invalid account number",
        });
      }

      enrollment.bank.accountEncrypted = encrypt(normalizedAccount);
      enrollment.bank.accountLast4 = normalizedAccount.slice(-4);
    }

    if (bank.accountHolderName) {
      const name = bank.accountHolderName.trim();

      if (name.length < 3) {
        return res.status(400).json({
          success: false,
          message: "Invalid account holder name",
        });
      }

      enrollment.bank.accountHolderName = name;
    }

    if (bank.accountType) {
      enrollment.bank.accountType = bank.accountType;
    }

    if (bank.ifscCode) {
      const normalizedIfsc = bank.ifscCode.trim().toUpperCase();

      if (normalizedIfsc.length !== 11) {
        return res.status(400).json({
          success: false,
          message: "Invalid IFSC code",
        });
      }

      enrollment.bank.ifscCode = normalizedIfsc;
    }

    if (bank.bankName) {
      const name = bank.bankName.trim();

      if (name.length < 2) {
        return res.status(400).json({
          success: false,
          message: "Invalid bank name",
        });
      }

      enrollment.bank.bankName = name;
    }

    // BANK DOCUMENT
    if (files.bankDocument?.[0]) {
      enrollment.bank.documents.passbookOrCheque = {
        ref: "TEMP_UPLOAD",
        isConfirmed: false,
      };
    }

    // =========================
    // STRICT VALIDATION (NEXT / SUBMIT / FINAL)
    // =========================

    if (VALIDATION_MODES.includes(mode)) {
      if (!enrollment.pan.last4) {
        return res.status(400).json({
          success: false,
          message: "PAN number required",
        });
      }

      if (!enrollment.pan.name) {
        return res.status(400).json({
          success: false,
          message: "Name as per PAN required",
        });
      }

      if (!enrollment.pan.documents?.hardCopy?.ref) {
        return res.status(400).json({
          success: false,
          message: "PAN hard copy required",
        });
      }

      if (!enrollment.bank.accountLast4) {
        return res.status(400).json({
          success: false,
          message: "Account number required",
        });
      }

      if (!enrollment.bank.accountHolderName) {
        return res.status(400).json({
          success: false,
          message: "Account holder name required",
        });
      }

      if (!enrollment.bank.accountType) {
        return res.status(400).json({
          success: false,
          message: "Account type required",
        });
      }

      if (!enrollment.bank.ifscCode) {
        return res.status(400).json({
          success: false,
          message: "IFSC code required",
        });
      }

      if (!enrollment.bank.bankName) {
        return res.status(400).json({
          success: false,
          message: "Bank name required",
        });
      }

      if (!enrollment.bank.documents?.passbookOrCheque?.ref) {
        return res.status(400).json({
          success: false,
          message: "Bank document required",
        });
      }
    }

    // =========================
    // STEP PROGRESSION
    // =========================

    handleUserEnrollmentStepProgression(enrollment, STEPS.PAN_BANK, mode);

    await enrollment.save();

    return res.status(200).json({
      success: true,
      message: "PAN & Bank details processed successfully",
    });
  } catch (error) {
    console.error("[completeUserEnrollmentPanBank] Error:", {
      message: error.message,
      stack: error.stack,
    });

    return res.status(400).json({
      success: false,
      message: "Unable to process PAN & Bank details. Please try again",
    });
  }
};
