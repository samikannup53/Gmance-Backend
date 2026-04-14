import crypto from "crypto";
import Otp from "./otpModel.js";

// Generate a random OTP of specified length
const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP

// Hash the OTP using SHA256
const hashOtp = (otp) => crypto.createHash("sha256").update(otp).digest("hex");

// Generate Reference ID for OTP
const generateReferenceId = () =>
  `OTP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

// Create OTP for a given purpose, channel, and target
export const createOtp = async ({ purpose, channel, target }) => {
  // Basic rate limit (1 OTP per 60 sec per target+purpose)
  const recentOtp = await Otp.findOne({
    target,
    purpose,
    createdAt: { $gte: new Date(Date.now() - 60 * 1000) },
  });

  if (recentOtp) {
    throw new Error("Please wait before requesting another OTP");
  }

  const otp = generateOtp();
  const otpHash = hashOtp(otp);
  const referenceId = generateReferenceId();

  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes

  await Otp.create({
    referenceId,
    purpose,
    channel,
    target,
    otpHash,
    expiresAt,
  });

  console.log(
    `OTP for ${purpose} sent to ${target} via ${channel}: ${otp} (Reference ID: ${referenceId})`,
  );

  return referenceId; // Return OTP for testing purposes (remove in production)
};

// Verify OTP using reference ID and user-provided OTP
export const verifyOtp = async ({ referenceId, otp }) => {
  const record = await Otp.findOne({ referenceId });

  if (!record) {
    throw new Error("Invalid OTP reference");
  }

  if (record.isVerified) {
    throw new Error("OTP already Used");
  }

  if (record.expiresAt < new Date()) {
    throw new Error("OTP expired");
  }

  if (record.attempts >= record.maxAttempts) {
    throw new Error("Max attempts exceeded");
  }

  const hashedOtp = hashOtp(otp);

  if (hashedOtp !== record.otpHash) {
    record.attempts += 1;
    await record.save();
    throw new Error("Invalid OTP");
  }

  record.isVerified = true;
  record.verifiedAt = new Date();

  await record.save();

  return record;
};

// Resend OTP with limits and cooldown
export const resendOtp = async (referenceId) => {
  const record = await Otp.findOne({ referenceId });

  if (!record) throw new Error("Invalid reference");

  if (record.isVerified) throw new Error("OTP already used");

  if (record.resendCount >= record.maxResends) {
    throw new Error("Max resend limit reached");
  }

  if (record.resendAvailableAt && record.resendAvailableAt > new Date()) {
    throw new Error("Please wait before resending");
  }

  const otp = generateOtp();

  record.otpHash = hashOtp(otp);
  record.resendCount += 1;
  record.resendAvailableAt = new Date(Date.now() + 30 * 1000);
  record.expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await record.save();

  console.log("Resent OTP:", otp);

  return true;
};
