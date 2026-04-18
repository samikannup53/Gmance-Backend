import mongoose from "mongoose";

import {
  USER_TYPES,
  USER_ENROLLMENT_TYPES,
} from "../../../../config/constants.config.js";

const preEnrollmentSchema = new mongoose.Schema(
  {
    enrollmentSource: {
      type: String,
      enum: ["PUBLIC", "ADMIN"],
      required: true,
    },

    userType: {
      type: String,
      enum: Object.values(USER_TYPES),
      required: true,
    },

    enrollmentType: {
      type: String,
      enum: Object.values(USER_ENROLLMENT_TYPES),
      required: true,
    },

    email: { type: String, trim: true, required: true, lowercase: true },
    mobile: {
      countryCode: { type: String, default: "+91" },
      number: { type: String, trim: true },
    },

    emailVerified: { type: Boolean, default: false },
    mobileVerified: { type: Boolean, default: false },

    onboardingConsent: {
      isGranted: { type: Boolean, default: false },
      grantedAt: Date,
      obtainedVia: { type: String, enum: ["OTP", "CHECKBOX"] },
      channel: { type: String, enum: ["MOBILE", "EMAIL", "WEB"] },
      referenceId: String,
    },
    status: {
      type: String,
      enum: [
        "INIT",
        "EMAIL_VERIFIED",
        "MOBILE_VERIFIED",
        "BOTH_VERIFIED",
        "CONSENT_GRANTED",
        "COMPLETED",
      ],
      default: "INIT",
    },
    otpReferences: { email: String, mobile: String, consent: String }, // Store OTP reference IDs for verification
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true },
);

preEnrollmentSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("PreEnrollment", preEnrollmentSchema);
