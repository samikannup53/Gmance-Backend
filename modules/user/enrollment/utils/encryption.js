import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";

const getEncryptionKey = () => {
  const secret = process.env.APP_ENCRYPTION_SECRET;

  if (!secret) {
    throw new Error("APP_ENCRYPTION_SECRET is not defined");
  }

  return crypto.createHash("sha256").update(secret).digest();
};

// Encrypt Data using AES-256-GCM
export const encrypt = (value) => {
  if (!value) return null;

  const key = getEncryptionKey();

  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(value, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  // Store IV, Auth Tag, and Encrypted Data together (hex-encoded)
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
};

// Decrypt Data using AES-256-GCM
export const decrypt = (cipherText) => {
  if (!cipherText) return null;

  const parts = cipherText.split(":");

  if (parts.length !== 3) {
    throw new Error("Invalid encrypted value");
  }

  const [ivHex, authTagHex, encrypted] = parts;

  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
};
