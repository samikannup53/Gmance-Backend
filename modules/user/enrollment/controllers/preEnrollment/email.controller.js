import PreEnrollment from "../../models/preEnrollment.model.js";
import { verifyOtp } from "../../../../otp/otpService.js";

// Verify EMAIL OTP
export const verifyPreEnrollmentEmailOtp = async (req, res) => {
  try {
    const { preEnrollmentId, otp } = req.body || {};

    if (!preEnrollmentId || !otp) {
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
        message: "OTP Expired. Please restart process",
      });
    }

    if (preEnrollment.emailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email Already Verified",
      });
    }

    const otpRecord = await verifyOtp({
      referenceId: preEnrollment.otpReferences.email,
      otp,
    });

    if (otpRecord.purpose !== "EMAIL_VERIFICATION") {
      throw new Error("Invalid OTP type");
    }

    if (otpRecord.target !== preEnrollment.email) {
      throw new Error("OTP mismatch");
    }

    preEnrollment.emailVerified = true;
    preEnrollment.otpReferences.email = null;
    preEnrollment.status = "EMAIL_VERIFIED";

    await preEnrollment.save();

    return res.status(200).json({
      success: true,
      message: "Email Verified Successfully",
    });
  } catch (error) {
    console.error("[verifyEmailOtp] Error:", {
      message: error.message,
      stack: error.stack,
      body: req.body,
      time: new Date().toISOString(),
    });

    return res.status(500).json({ success: false, message: error.message });
  }
};