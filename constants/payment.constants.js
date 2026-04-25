// =============================
// Payment Gateways
// =============================
export const PAYMENT_GATEWAY = {
  RAZORPAY: "RAZORPAY",
  PAYTM: "PAYTM",
};

// =============================
// Payment Flow (Business Intent)
// =============================
export const PAYMENT_FLOW = {
  PAY: "PAY", // User pays system
  COLLECT: "COLLECT", // System collects from user
};

// =============================
// Payment Methods (Execution Mode)
// =============================
export const PAYMENT_METHOD = {
  DIRECT: "DIRECT", // Manual transfer (UPI / Bank / Cash)
  GATEWAY: "GATEWAY", // Online gateway (Razorpay, etc.)
  WALLET: "WALLET", // Internal wallet debit
};

// Reusable method values (avoid repetition)
export const PAYMENT_METHOD_VALUES = Object.values(PAYMENT_METHOD);

// =============================
// Pricing Types
// =============================
export const PRICING_TYPE = {
  STATIC: "STATIC", // Fixed amount
  DYNAMIC: "DYNAMIC", // Runtime/user/DB-driven amount
};

export const PRICING_TYPE_VALUES = Object.values(PRICING_TYPE);

// =============================
// Charge Types
// =============================
export const CHARGE_TYPE = {
  PAYMENT_GATEWAY_FEE: "PAYMENT_GATEWAY_FEE",
};

// =============================
// Charge Calculation Types
// =============================
export const CALCULATION_TYPE = {
  FLAT: "FLAT", // Fixed amount
  PERCENTAGE: "PERCENTAGE", // % based
};

export const CALCULATION_TYPE_VALUES = Object.values(CALCULATION_TYPE);

// =============================
// Charge Applicability
// =============================
// Reusing PAYMENT_METHOD to avoid duplication
export const APPLICABLE_ON = PAYMENT_METHOD;
export const APPLICABLE_ON_VALUES = PAYMENT_METHOD_VALUES;

// =============================
// Entity Types (Service Groups)
// =============================
export const PAYMENT_ENTITY = {
  ENROLLMENT: "ENROLLMENT",
  WALLET: "WALLET",
  AGREEMENT: "AGREEMENT",
  PRODUCT: "PRODUCT",
  UTILITY: "UTILITY",
};

export const PAYMENT_ENTITY_VALUES = Object.values(PAYMENT_ENTITY);

// =============================
// Payment Status Lifecycle
// =============================
export const PAYMENT_STATUS = {
  CREATED: "CREATED",
  PENDING: "PENDING",
  VERIFICATION_PENDING: "VERIFICATION_PENDING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
};

export const PAYMENT_STATUS_VALUES = Object.values(PAYMENT_STATUS);
