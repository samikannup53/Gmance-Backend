import PreEnrollment from "../../models/preEnrollment.model.js";
import Enrollment from "../../models/enrollment.model.js";

import {
  STEPS,
  ENROLLMENT_PROGRESS,
  ENROLLMENT_STATUS,
} from "../../../../../config/constants.config.js";

export const completeUserEnrollmentAuth = async (req, res) => {
  try {
    const { preEnrollmentId } = req.body || {};

    if (!preEnrollmentId) {
      return res.status(400).json({
        success: false,
        message: "Missing Required Fields",
      });
    }

    const preEnrollment = await PreEnrollment.findById(preEnrollmentId);

    if (!preEnrollment) {
      return res.status(404).json({
        success: false,
        message: "Pre-Enrollment Not Found",
      });
    }

    if (preEnrollment.status === "COMPLETED") {
      return res.status(400).json({
        success: false,
        message: "Enrollment already created for this session",
      });
    }

    if (
      !preEnrollment.emailVerified ||
      !preEnrollment.mobileVerified ||
      !preEnrollment.onboardingConsent?.isGranted
    ) {
      return res.status(400).json({
        success: false,
        message: "Auth flow not completed",
      });
    }

    const userType = preEnrollment.userType;
    const enrollmentType = preEnrollment.enrollmentType;

    const email = preEnrollment.email;
    const mobile = preEnrollment.mobile?.number?.replace(/\D/g, "").slice(-10);

    const existingEnrollment = await Enrollment.findOne({
      $or: [{ "auth.email": email }, { "auth.mobile.number": mobile }],
      enrollmentProgress: ENROLLMENT_PROGRESS.DRAFT,
    });

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: "Email or Mobile already exists",
      });
    }

    const trnId = `TRN-${Date.now()}`;
    const publicId = `${Math.random()
      .toString(36)
      .slice(2, 10)
      .toUpperCase()}-${Date.now()}`;

    const enrollment = await Enrollment.create({
      publicId,
      trnId,

      userType,
      enrollmentType,
      enrollmentSource: preEnrollment.enrollmentSource,

      enrollmentProgress: ENROLLMENT_PROGRESS.DRAFT,
      enrollmentStatus: ENROLLMENT_STATUS.AWAITING_SUBMISSION,

      enrollmentFlow: {
        mode: "NEW",
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
