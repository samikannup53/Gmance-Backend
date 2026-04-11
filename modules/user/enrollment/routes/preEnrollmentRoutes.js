import express from "express";

import {
  startPreEnrollment,
  verifyEmailOtp,
  sendMobileOtp,
  verifyMobileOtp,
  onboardingConsent,
  verifyOnboardingConsentOtp,
  completePreEnrollment,
} from "../controllers/preEnrollmentController.js";

const router = express.Router();

router.post("/start", startPreEnrollment);
router.post("/verify-email-otp", verifyEmailOtp);
router.post("/send-mobile-otp", sendMobileOtp);
router.post("/verify-mobile-otp", verifyMobileOtp);
router.post("/onboarding-consent", onboardingConsent);
router.post("/verify-onboarding-consent-otp", verifyOnboardingConsentOtp);
router.post("/complete", completePreEnrollment);

export default router;
