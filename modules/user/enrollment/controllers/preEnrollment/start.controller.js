import PreEnrollment from "../../models/preEnrollment.model.js";
import { createOtp } from "../../../../otp/otpService.js";

import {
  USER_TYPES,
  USER_ENROLLMENT_TYPES,
} from "../../../../../config/constants.config.js";

// Controller to Start Pre-Enrollment Session
export const startPreEnrollmentSession = async (req, res) => {
  try {
    const { email, enrollmentSource, userType, enrollmentType } =
      req.body || {};

    if (!email || !enrollmentSource || !userType || !enrollmentType) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Validate userType
    if (!Object.values(USER_TYPES).includes(userType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user type",
      });
    }

    // Validate enrollmentType
    if (!Object.values(USER_ENROLLMENT_TYPES).includes(enrollmentType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid enrollment type",
      });
    }

    // Validate enrollmentSource
    if (!["PUBLIC", "ADMIN"].includes(enrollmentSource)) {
      return res.status(400).json({
        success: false,
        message: "Invalid enrollment source",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingSession = await PreEnrollment.findOne({
      email: normalizedEmail,
      expiresAt: { $gt: new Date() },
    });

    if (existingSession) {
      return res.status(400).json({
        success: false,
        message: "Session already active. Please verify OTP.",
      });
    }

    const preEnrollment = await PreEnrollment.create({
      email: normalizedEmail,
      enrollmentSource,
      userType,
      enrollmentType,

      otpReferences: {
        email: await createOtp({
          purpose: "EMAIL_VERIFICATION",
          channel: "EMAIL",
          target: normalizedEmail,
        }),
      },

      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    return res.status(201).json({
      success: true,
      message: "Email OTP sent successfully",
      data: { preEnrollmentId: preEnrollment._id },
    });
  } catch (error) {
    console.error("[startPreEnrollmentSession] Error:", {
      message: error.message,
      stack: error.stack,
      body: req.body,
      time: new Date().toISOString(),
    });

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
