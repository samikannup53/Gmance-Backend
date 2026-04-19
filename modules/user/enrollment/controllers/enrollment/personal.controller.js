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

// Modes requiring full validation
const VALIDATION_MODES = [
  USER_ENROLLMENT_STEP_MODES.NEXT,
  USER_ENROLLMENT_STEP_MODES.SUBMIT,
  USER_ENROLLMENT_STEP_MODES.FINAL_SUBMIT,
];

export const completeUserEnrollmentPersonal = async (req, res) => {
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

    try {
      validateUserEnrollmentStepAccess(enrollment, STEPS.PERSONAL);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    // =========================
    // PERSONAL MAPPING + VALIDATION
    // =========================

    const personal = data?.personal || {};

    if (personal.maritalStatus) {
      enrollment.personal.maritalStatus = personal.maritalStatus;
    }

    if (personal.relativeType) {
      enrollment.personal.relativeType = personal.relativeType;
    }

    if (personal.relativeName) {
      const name = personal.relativeName.trim();

      if (name.length < 3) {
        return res.status(400).json({
          success: false,
          message: "Invalid relative name",
        });
      }

      enrollment.personal.relativeName = name;
    }

    if (personal.category) {
      enrollment.personal.category = personal.category;
    }

    if (personal.highestQualification) {
      enrollment.personal.highestQualification = personal.highestQualification;
    }

    if (personal.computerKnowledge) {
      enrollment.personal.computerKnowledge = personal.computerKnowledge;
    }

    // =========================
    // DOCUMENT MAPPING
    // =========================

    if (files.photo?.[0]) {
      enrollment.personal.documents.photo = {
        ref: "TEMP_UPLOAD",
        isConfirmed: false,
      };
    }

    if (files.pvr?.[0]) {
      enrollment.personal.documents.pvr = {
        ref: "TEMP_UPLOAD",
        isConfirmed: false,
      };
    }

    if (files.qualificationCertificate?.[0]) {
      enrollment.personal.documents.qualificationCertificate = {
        ref: "TEMP_UPLOAD",
        isConfirmed: false,
      };
    }

    // =========================
    // STRICT VALIDATION (NEXT / SUBMIT / FINAL)
    // =========================

    if (VALIDATION_MODES.includes(mode)) {
      if (!enrollment.personal.maritalStatus) {
        return res.status(400).json({
          success: false,
          message: "Marital status required",
        });
      }

      if (!enrollment.personal.relativeType) {
        return res.status(400).json({
          success: false,
          message: "Relative type required",
        });
      }

      if (!enrollment.personal.relativeName) {
        return res.status(400).json({
          success: false,
          message: "Relative name required",
        });
      }

      if (!enrollment.personal.category) {
        return res.status(400).json({
          success: false,
          message: "Category required",
        });
      }

      if (!enrollment.personal.highestQualification) {
        return res.status(400).json({
          success: false,
          message: "Qualification required",
        });
      }

      if (!enrollment.personal.computerKnowledge) {
        return res.status(400).json({
          success: false,
          message: "Computer knowledge required",
        });
      }

      if (!enrollment.personal.documents?.photo?.ref) {
        return res.status(400).json({
          success: false,
          message: "Photo not Uploaded",
        });
      }

      if (!enrollment.personal.documents?.pvr?.ref) {
        return res.status(400).json({
          success: false,
          message: "PVR Document not Uploaded",
        });
      }

      if (!enrollment.personal.documents?.qualificationCertificate?.ref) {
        return res.status(400).json({
          success: false,
          message: "Qualification Certificate not Uploaded",
        });
      }
    }

    // =========================
    // STEP PROGRESSION
    // =========================

    handleUserEnrollmentStepProgression(enrollment, STEPS.PERSONAL, mode);

    await enrollment.save();

    return res.status(200).json({
      success: true,
      message: "Personal details processed successfully",
    });
  } catch (error) {
    console.error("[completeUserEnrollmentPersonal] Error:", {
      message: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      success: false,
      message: "Unable to process personal details. Please try again",
    });
  }
};
