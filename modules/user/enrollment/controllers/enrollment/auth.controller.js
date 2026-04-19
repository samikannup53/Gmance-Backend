import PreEnrollment from "../../models/preEnrollment.model.js";
import Enrollment from "../../models/enrollment.model.js";

import {
  STEPS,
  ENROLLMENT_PROGRESS,
  ENROLLMENT_PROGRESS_STATUS_MAP,
  ENROLLMENT_STATUS,
  USER_ENROLLMENT_FLOW_MODES,
} from "../../../../../config/constants.config.js";

export const completeUserEnrollmentAuth = async (req, res) => {
  try {
    const { preEnrollmentId, enrollmentFlowMode, trnId } = req.body || {};

    // =========================
    // BASIC VALIDATION
    // =========================

    if (!preEnrollmentId) {
      return res.status(400).json({
        success: false,
        message: "Missing Pre-Enrollment ID",
      });
    }

    if (!enrollmentFlowMode) {
      return res.status(400).json({
        success: false,
        message: "Missing User Enrollment Flow Mode",
      });
    }

    if (enrollmentFlowMode === USER_ENROLLMENT_FLOW_MODES.RESUME && !trnId) {
      return res.status(400).json({
        success: false,
        message: "TRN ID is required for Resuming User Enrollment",
      });
    }

    // =========================
    // RESUME FLOW
    // =========================

    if (enrollmentFlowMode === USER_ENROLLMENT_FLOW_MODES.RESUME) {
      const existingEnrollment = await Enrollment.findOne({
        trnId,
        enrollmentProgress: ENROLLMENT_PROGRESS.DRAFT,
      });

      if (!existingEnrollment) {
        return res.status(404).json({
          success: false,
          message: "User Enrollment not found for provided TRN ID",
        });
      }

      return res.status(200).json({
        success: true,
        message: "User Enrollment Resumed Successfully",
        data: {
          trnId: existingEnrollment.trnId,
          publicId: existingEnrollment.publicId,
          currentStep: existingEnrollment.enrollmentFlow.currentStep,
        },
      });
    }

    // =========================
    // PRE-ENROLLMENT VALIDATION
    // =========================

    const preEnrollment = await PreEnrollment.findById(preEnrollmentId);

    if (!preEnrollment) {
      return res.status(404).json({
        success: false,
        message: "Pre-Enrollment Session Expired or Not Found",
      });
    }

    if (preEnrollment.status === "COMPLETED") {
      return res.status(400).json({
        success: false,
        message: "Enrollment already Created from this Pre-Enrollment Session",
      });
    }

    if (
      !preEnrollment.emailVerified ||
      !preEnrollment.mobileVerified ||
      !preEnrollment.onboardingConsent?.isGranted
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Enrollment Authentication Incomplete. Please complete email/mobile verification and grant onboarding consent",
      });
    }

    const userType = preEnrollment.userType;
    const enrollmentType = preEnrollment.enrollmentType;

    const email = preEnrollment.email;
    const mobile = preEnrollment.mobile?.number?.replace(/\D/g, "").slice(-10);

    // =========================
    // EXISTING DRAFT CHECK (AUTO RESUME)
    // =========================

    const existingDraft = await Enrollment.findOne({
      $or: [{ "auth.email": email }, { "auth.mobile.number": mobile }],
      enrollmentProgress: ENROLLMENT_PROGRESS.DRAFT,
    });

    if (existingDraft) {
      return res.status(200).json({
        success: true,
        message: "Existing enrollment resumed",
        data: {
          trnId: existingDraft.trnId,
          publicId: existingDraft.publicId,
          currentStep: existingDraft.enrollmentFlow.currentStep,
        },
      });
    }

    // =========================
    // CREATE NEW ENROLLMENT
    // =========================

    const newTrnId = `TRN-${Date.now()}`;
    const publicId = `${Math.random()
      .toString(36)
      .slice(2, 10)
      .toUpperCase()}-${Date.now()}`;

    const progress = ENROLLMENT_PROGRESS.DRAFT;

    const enrollment = await Enrollment.create({
      publicId,
      trnId: newTrnId,

      userType,
      enrollmentType,
      enrollmentSource: preEnrollment.enrollmentSource,

      enrollmentProgress: progress,
      enrollmentStatus: ENROLLMENT_PROGRESS_STATUS_MAP[progress],

      enrollmentFlow: {
        mode: enrollmentFlowMode,
        currentStep: STEPS.KYC,
        stepsCompleted: [STEPS.AUTH],
      },

      auth: {
        email,
        mobile: preEnrollment.mobile,
        emailVerified: true,
        mobileVerified: true,
        onboardingConsent: preEnrollment.onboardingConsent,
      },
    });

    // Mark pre-enrollment completed
    preEnrollment.status = "COMPLETED";
    await preEnrollment.save();

    return res.status(201).json({
      success: true,
      message: "Enrollment Draft Created Successfully",
      data: {
        trnId: enrollment.trnId,
        publicId: enrollment.publicId,
      },
    });
  } catch (error) {
    console.error("[completeUserEnrollmentAuth] Error:", {
      message: error.message,
      stack: error.stack,
      body: req.body,
      time: new Date().toISOString(),
    });

    return res.status(500).json({
      success: false,
      message: "Pre-Enrollment Completion Failed",
    });
  }
};
