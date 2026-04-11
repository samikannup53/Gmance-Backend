import PreEnrollment from "../models/preEnrollmentModel.js";
import Enrollment from "../models/enrollmentModel.js";
import { createOtp, verifyOtp } from "../../../otp/otpService.js";

// Create Pre-Enrollment & Send EMAIL OTP
export const startPreEnrollment = async (req, res) => {
  try {
    const { email, enrollmentSource } = req.body || {};

    if (!email || !enrollmentSource) {
      return res.status(400).json({
        success: false,
        message: "Email and Enrollment Source are Required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const otpRef = await createOtp({
      purpose: "EMAIL_VERIFICATION",
      channel: "EMAIL",
      target: normalizedEmail,
    });

    const preEnrollment = await PreEnrollment.create({
      email: normalizedEmail,
      enrollmentSource,
      otpRefs: { email: otpRef },
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
      message: "Failed to Start Pre-Enrollment",
    });
  }
};

// Verify EMAIL OTP
export const verifyEmailOtp = async (req, res) => {
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

    await verifyOtp(preEnrollment.otpRefs.email, otp);

    preEnrollment.emailVerified = true;
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

    return res.status(500).json({
      success: false,
      message: "Email Verification Failed",
    });
  }
};

// Send MOBILE OTP
export const sendMobileOtp = async (req, res) => {
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

    preEnrollment.mobile = mobile;

    const otpRef = await createOtp({
      purpose: "MOBILE_VERIFICATION",
      channel: "WHATSAPP",
      target: mobile.number.trim(),
    });

    preEnrollment.otpRefs.mobile = otpRef;

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
      message: "Mobile OTP Generation Failed",
    });
  }
};

// Verify MOBILE OTP
export const verifyMobileOtp = async (req, res) => {
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

    await verifyOtp(preEnrollment.otpRefs.mobile, otp);

    preEnrollment.mobileVerified = true;
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
      message: "Mobile Verification Failed",
    });
  }
};

// Onboarding Consent
export const onboardingConsent = async (req, res) => {
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
      const otpRef = await createOtp({
        purpose: "ONBOARDING_CONSENT",
        channel: "EMAIL",
        target: preEnrollment.email,
      });

      preEnrollment.otpRefs.consent = otpRef;

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
      message: "Onboarding Consent Failed",
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

    await verifyOtp(preEnrollment.otpRefs.consent, otp);

    preEnrollment.onboardingConsent = {
      isGranted: true,
      grantedAt: new Date(),
      obtainedVia: "OTP",
      channel: "EMAIL",
      referenceId: preEnrollment.otpRefs.consent,
    };

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
      message: "Consent Verification Failed",
    });
  }
};

// Complete Pre-Enrollment & Create Enrollment Record
export const completePreEnrollment = async (req, res) => {
  try {
    const { preEnrollmentId, userType, enrollmentType } = req.body || {};

    if (!preEnrollmentId || !userType || !enrollmentType) {
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

    // Ensure AUTH + CONSENT completed
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

    // Generate Identifiers
    const trnId = `TRN-${Date.now()}`;
    const publicId = `PUB-${Math.random()
      .toString(36)
      .slice(2, 10)
      .toUpperCase()}`;

    // Create Enrollment Record
    const enrollment = await Enrollment.create({
      publicId,
      trnId,

      userType,
      enrollmentType,
      enrollmentSource: preEnrollment.enrollmentSource,

      enrollmentProgress: "DRAFT",
      enrollmentStatus: "AWAITING_SUBMISSION",

      enrollmentFlow: {
        mode: "NEW",
        currentStep: "AUTH",
        stepsCompleted: ["AUTH"],
      },

      auth: {
        email: preEnrollment.email,
        mobile: preEnrollment.mobile,
        emailVerified: true,
        mobileVerified: true,
        onboardingConsent: preEnrollment.onboardingConsent,
      },
    });
    //   Update Pre-Enrollment Status as COMPLETED
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
    console.error("[completePreEnrollment] Error:", {
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
