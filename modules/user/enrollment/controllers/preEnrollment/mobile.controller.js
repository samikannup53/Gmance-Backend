import PreEnrollment from "../../models/preEnrollment.model.js";
import { createOtp, verifyOtp } from "../../../../otp/otpService.js";

// Send MOBILE OTP
export const sendPreEnrollmentMobileOtp = async (req, res) => {
  try {
    const { preEnrollmentId, mobile } = req.body || {};

    if (!preEnrollmentId || !mobile?.number) {
      return res.status(400).json({
        success: false,
        message: "Missing Required Fields to Process",
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

    preEnrollment.mobile = mobile;
    preEnrollment.otpReferences.mobile = await createOtp({
      purpose: "MOBILE_VERIFICATION",
      channel: "WHATSAPP",
      target: mobile.number.trim(),
    });

    await preEnrollment.save();

    return res.status(200).json({
      success: true,
      message: "Mobile OTP Sent Successfully",
    });
  } catch (error) {
    console.error("[sendMobileOtp] Error:", {
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

// Verify MOBILE OTP
export const verifyPreEnrollmentMobileOtp = async (req, res) => {
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

    if (preEnrollment.mobileVerified) {
      return res.status(400).json({
        success: false,
        message: "Mobile Already Verified",
      });
    }

    if (preEnrollment.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Session expired",
      });
    }

    const otpRecord = await verifyOtp({
      referenceId: preEnrollment.otpReferences.mobile,
      otp,
    });

    if (otpRecord.purpose !== "MOBILE_VERIFICATION") {
      throw new Error("Invalid OTP type");
    }

    if (otpRecord.target !== preEnrollment.mobile.number) {
      throw new Error("OTP mismatch");
    }

    preEnrollment.mobileVerified = true;
    preEnrollment.otpReferences.mobile = null;
    preEnrollment.status = "MOBILE_VERIFIED";

    await preEnrollment.save();
    return res.status(200).json({
      success: true,
      message: "Mobile Verified Successfully",
    });
  } catch (error) {
    console.error("[verifyMobileOtp] Error:", {
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