import PreEnrollment from "../../models/preEnrollment.model.js";
import { createOtp, verifyOtp } from "../../../../otp/otpService.js";

// Onboarding Consent
export const initiateOnboardingConsent = async (req, res) => {
  try {
    const { preEnrollmentId } = req.body || {};

    if (!preEnrollmentId) {
      return res.status(400).json({
        success: false,
        message: "Pre-Enrollment ID is required",
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

    const source = preEnrollment.enrollmentSource;

    // PUBLIC → Direct consent (checkbox)
    if (source === "PUBLIC") {
      preEnrollment.onboardingConsent = {
        isGranted: true,
        grantedAt: new Date(),
        obtainedVia: "CHECKBOX",
        channel: "WEB",
      };

      preEnrollment.status = "CONSENT_GRANTED";

      await preEnrollment.save();

      return res.status(200).json({
        success: true,
        message: "Consent Granted Successfully",
      });
    }

    // ADMIN → Send OTP
    if (source === "ADMIN") {
      preEnrollment.otpReferences.consent = await createOtp({
        purpose: "ONBOARDING_CONSENT",
        channel: "EMAIL",
        target: preEnrollment.email,
      });

      await preEnrollment.save();

      return res.status(200).json({
        success: true,
        message: "Consent OTP Sent to Email",
      });
    }

    return res.status(400).json({
      success: false,
      message: "Invalid Enrollment Source",
    });
  } catch (error) {
    console.error("[onboardingConsent] Error:", {
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

// Verify Consent OTP
export const verifyOnboardingConsentOtp = async (req, res) => {
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
        message: "Session expired",
      });
    }

    const otpRecord = await verifyOtp({
      referenceId: preEnrollment.otpReferences.consent,
      otp,
    });

    if (otpRecord.purpose !== "ONBOARDING_CONSENT") {
      throw new Error("Invalid OTP type");
    }

    if (otpRecord.target !== preEnrollment.email) {
      throw new Error("OTP mismatch");
    }

    preEnrollment.onboardingConsent = {
      isGranted: true,
      grantedAt: new Date(),
      obtainedVia: "OTP",
      channel: "EMAIL",
      referenceId: preEnrollment.otpReferences.consent,
    };

    preEnrollment.otpReferences.consent = null;
    preEnrollment.status = "CONSENT_GRANTED";

    await preEnrollment.save();

    return res.status(200).json({
      success: true,
      message: "Consent Verified Successfully",
    });
  } catch (error) {
    console.error("[verifyOnboardingConsentOtp] Error:", {
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