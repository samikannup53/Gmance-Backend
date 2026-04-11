import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    // Unique Reference ID for each OTP Entry
    referenceId: { type: String, required: true, unique: true, index: true },

    // Purpose of OTP
    purpose: {
      type: String,
      enum: [
        "EMAIL_VERIFICATION",
        "MOBILE_VERIFICATION",
        "LOGIN",
        "2FA",
        "ONBOARDING_CONSENT",
      ],
      required: true,
    },

    // Delivery Channel
    channel: {
      type: String,
      enum: ["EMAIL", "SMS", "WHATSAPP"],
      required: true,
    },

    target: { type: String, required: true, index: true }, // Actual Email or Mobile Number wher OTP is sent
    otpHash: { type: String, required: true }, // Hashed OTP

    attempts: { type: Number, default: 0 }, // Number of verification attempts made
    maxAttempts: { type: Number, default: 5 }, // Maximum allowed attempts before invalidation

    resendCount: { type: Number, default: 0 }, // Number of times OTP has been resent
    maxResends: { type: Number, default: 3 }, // Maximum allowed resends before invalidation
    resendAvailableAt: Date, // Timestamp when user can request OTP resend again

    isVerified: { type: Boolean, default: false, index: true }, // Whether OTP has been successfully verified
    verifiedAt: Date, // Timestamp of successful verification

    expiresAt: { type: Date, required: true }, // OTP Expiration Time
  },
  { timestamps: true },
);

// TTL
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("Otp", otpSchema);
