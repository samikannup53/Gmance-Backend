import express from "express";

import {
  startPreEnrollment,
  verifyEmailOtp,
  sendMobileOtp,
  verifyMobileOtp,
  onboardingConsent,
  verifyOnboardingConsentOtp,
  completePreEnrollment,
  resendOtpHandler,
} from "../controllers/preEnrollmentController.js";

const ROUTER = express.Router();

ROUTER.post("/start", startPreEnrollment);
ROUTER.post("/verify-email-otp", verifyEmailOtp);
ROUTER.post("/send-mobile-otp", sendMobileOtp);
ROUTER.post("/verify-mobile-otp", verifyMobileOtp);
ROUTER.post("/onboarding-consent", onboardingConsent);
ROUTER.post("/verify-onboarding-consent-otp", verifyOnboardingConsentOtp);
ROUTER.post("/complete", completePreEnrollment);
ROUTER.post("/resend-otp", resendOtpHandler);

export default ROUTER;
