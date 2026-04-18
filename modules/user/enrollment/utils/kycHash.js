import crypto from "crypto";

// Extract last digit from referenceId
export const extractUidLastDigit = (referenceId) => {
  const last4 = referenceId.slice(0, 4); // Get the Last 4 digits of AADHAAR (First 4 digitsof referenceId)
  const lastDigit = parseInt(last4.slice(-1), 10); // Get the Last digit of AADHAAR
  return lastDigit === 0 ? 1 : lastDigit; // Return 1 if last digit is 0, else return the last digit
};

// UIDAI Mobile Hash
export const generateUidMobileHash = (mobile, shareCode, lastDigit) => {
  // ALWAYS normalize here (final safety)
  const normalizedMobile = mobile.replace(/\D/g, "").slice(-10);

  let hash = crypto
    .createHash("sha256")
    .update(normalizedMobile + shareCode, "utf8")
    .digest("hex");

  for (let i = 1; i < lastDigit; i++) {
    hash = crypto.createHash("sha256").update(hash, "utf8").digest("hex");
  }

  return hash;
};
