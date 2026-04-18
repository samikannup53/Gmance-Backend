import express from "express";

import { startPreEnrollmentSession } from "../controllers/preEnrollment/start.controller.js";
import { verifyPreEnrollmentEmailOtp } from "../controllers/preEnrollment/email.controller.js";
import { sendPreEnrollmentMobileOtp, verifyPreEnrollmentMobileOtp } from "../controllers/preEnrollment/mobile.controller.js";
import { initiateOnboardingConsent, verifyOnboardingConsentOtp } from "../controllers/preEnrollment/consent.controller.js";
import { resendPreEnrollmentOtp } from "../controllers/preEnrollment/otp.controller.js";

const ROUTER = express.Router();

ROUTER.post("/start", startPreEnrollmentSession);
ROUTER.post("/email/verify", verifyPreEnrollmentEmailOtp);
ROUTER.post("/mobile/send-otp", sendPreEnrollmentMobileOtp);
ROUTER.post("/mobile/verify", verifyPreEnrollmentMobileOtp);
ROUTER.post("/consent/initiate", initiateOnboardingConsent);
ROUTER.post("/consent/verify", verifyOnboardingConsentOtp);
ROUTER.post("/otp/resend", resendPreEnrollmentOtp);

export default ROUTER;
