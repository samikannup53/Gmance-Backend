import PreEnrollment from "../../models/preEnrollment.model.js";
import { createOtp } from "../../../../otp/otpService.js";

// Controller to Start Pre-Enrollment Session
export const startPreEnrollmentSession = async (req, res) => {
  try {
    const { email, enrollmentSource } = req.body || {};

    if (!email || !enrollmentSource) {
      return res.status(400).json({
        success: false,
        message: "Email and Enrollment Source are Required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const preEnrollment = await PreEnrollment.create({
      email: normalizedEmail,
      enrollmentSource,
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
      message: "Email OTP Sent Successfully",
      data: { preEnrollmentId: preEnrollment._id },
    });
  } catch (error) {
    console.error("[startPreEnrollment] Error:", {
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