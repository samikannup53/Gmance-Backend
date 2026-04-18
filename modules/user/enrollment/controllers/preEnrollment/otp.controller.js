import PreEnrollment from "../../models/preEnrollment.model.js";
import { resendOtp } from "../../../../otp/otpService.js";

// Resend OTP (for both EMAIL, MOBILE, CONSENT)
export const preEnrollmentOtpResend = async (req, res) => {
  try {
    const { preEnrollmentId, type } = req.body || {};

    if (!preEnrollmentId || !type) {
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

    if (preEnrollment.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Session expired",
      });
    }

    let referenceId;

    switch (type) {
      case "EMAIL":
        if (preEnrollment.emailVerified) {
          return res.status(400).json({
            success: false,
            message: "Email already verified",
          });
        }
        referenceId = preEnrollment.otpReferences?.email;
        break;

      case "MOBILE":
        if (preEnrollment.mobileVerified) {
          return res.status(400).json({
            success: false,
            message: "Mobile already verified",
          });
        }
        referenceId = preEnrollment.otpReferences?.mobile;
        break;

      case "CONSENT":
        if (preEnrollment.onboardingConsent?.isGranted) {
          return res.status(400).json({
            success: false,
            message: "Consent already granted",
          });
        }
        referenceId = preEnrollment.otpReferences?.consent;
        break;

      default:
        return res.status(400).json({
          success: false,
          message: "Invalid OTP type",
        });
    }

    if (!referenceId) {
      return res.status(400).json({
        success: false,
        message: "No OTP found to resend",
      });
    }

    await resendOtp(referenceId);

    return res.status(200).json({
      success: true,
      message: "OTP resent successfully",
    });
  } catch (error) {
    console.error("[resendOtpHandler] Error:", {
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