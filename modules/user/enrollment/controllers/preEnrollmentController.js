import PreEnrollment from "../models/preEnrollmentModel.js";
import Enrollment from "../models/enrollmentModel.js";

import { createOtp, verifyOtp, resendOtp } from "../../../otp/otpService.js";

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

    return res.status(500).json({
      success: false,
      message: error.message,
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

// Resend OTP (for both EMAIL, MOBILE, CONSENT)
export const resendOtpHandler = async (req, res) => {
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

    // Check if email or mobile already exists in DRAFT enrollments
    const email = preEnrollment.email;
    const mobile = preEnrollment.mobile?.number;

    const existingEnrollment = await Enrollment.findOne({
      $or: [{ "auth.email": email }, { "auth.mobile.number": mobile }],
      enrollmentProgress: "DRAFT",
    });

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: "Email or Mobile already Exsists",
      });
    }

    // Generate Identifiers
    const trnId = `TRN-${Date.now()}`;
    const publicId = `${Math.random()
      .toString(36)
      .slice(2, 10)
      .toUpperCase()}-${Date.now()}`;

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
