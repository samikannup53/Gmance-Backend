// ======================================================
// PAYMENT GATEWAYS
// ======================================================
export const PAYMENT_GATEWAY = {
  RAZORPAY: "RAZORPAY",
  PAYTM: "PAYTM",
};

// ======================================================
// PAYMENT FLOW (Business Intent)
// ======================================================
export const PAYMENT_FLOW = {
  PAY: "PAY", // User pays system
  COLLECT: "COLLECT", // System collects from user
};

// ======================================================
// GATEWAY FLOW (How Gateway Is Used)
// ======================================================
export const PAYMENT_GATEWAY_FLOW = {
  LINK: "LINK", // Admin/Employee shares payment link
  CHECKOUT: "CHECKOUT", // User completes via Razorpay UI
};

export const PAYMENT_GATEWAY_FLOW_VALUES = Object.values(PAYMENT_GATEWAY_FLOW);

// ======================================================
// PAYMENT METHODS (Execution Mode)
// ======================================================
export const PAYMENT_METHOD = {
  DIRECT: "DIRECT", // Manual (UPI / Bank / Cash)
  GATEWAY: "GATEWAY", // Online gateway
};

export const PAYMENT_METHOD_VALUES = Object.values(PAYMENT_METHOD);

// ======================================================
// PRICING TYPES
// ======================================================
export const PRICING_TYPE = {
  STATIC: "STATIC", // Fixed price
  DYNAMIC: "DYNAMIC", // Calculated at runtime
};

export const PRICING_TYPE_VALUES = Object.values(PRICING_TYPE);

// ======================================================
// CHARGES (Extra over baseAmount)
// ======================================================
export const CHARGE_TYPE = {
  PAYMENT_GATEWAY_FEE: "PAYMENT_GATEWAY_FEE",
};

export const CALCULATION_TYPE = {
  FLAT: "FLAT",
  PERCENTAGE: "PERCENTAGE",
};

export const CALCULATION_TYPE_VALUES = Object.values(CALCULATION_TYPE);

// Charges applicable on which method
export const APPLICABLE_ON = PAYMENT_METHOD;
export const APPLICABLE_ON_VALUES = PAYMENT_METHOD_VALUES;

// ======================================================
// ENTITY TYPES (Business Domains)
// ======================================================
export const ENTITY_TYPE = {
  USER_ENROLLMENT: "USER_ENROLLMENT",
  PAN: "PAN",
  UTILITY: "UTILITY",
  WALLET: "WALLET",
};

export const ENTITY_TYPE_VALUES = Object.values(ENTITY_TYPE);

// ======================================================
// ENTITY CODES (Service Actions per Domain)
// ======================================================
export const ENTITY_CODE = {
  ENROLLMENT: {
    NEW_REGISTRATION: "NEW_REGISTRATION",
    AGREEMENT_RENEWAL: "AGREEMENT_RENEWAL",
  },

  PAN: {
    NEW_IND_PHYSICAL_EPAN: "NEW_IND_PHYSICAL_EPAN",
    NEW_NONIND_PHYSICAL_EPAN: "NEW_NONIND_PHYSICAL_EPAN",
    CORR_IND_PHYSICAL_EPAN: "CORR_IND_PHYSICAL_EPAN",
    CORR_NONIND_PHYSICAL_EPAN: "CORR_NONIND_PHYSICAL_EPAN",
    NEW_IND_EPAN: "NEW_IND_EPAN",
    NEW_NONIND_EPAN: "NEW_NONIND_EPAN",
    CORR_IND_EPAN: "CORR_IND_EPAN",
    CORR_NONIND_EPAN: "CORR_NONIND_EPAN",
  },

  UTILITY: {
    FORM_GENERATION: "FORM_GENERATION",
  },
};

// Flattened list for validation
export const ENTITY_CODE_VALUES = Object.values(ENTITY_CODE).flatMap((group) =>
  Object.values(group),
);

// ======================================================
// BREAKDOWN (Base Amount Composition)
// ======================================================
export const BREAKDOWN_CODE = {
  PAN: {
    PAN_NSDL_FEE: "PAN_NSDL_FEE",
    PAN_PROCESSING_FEE: "PAN_PROCESSING_FEE",
    PAN_FORM_GENERATION_FEE: "PAN_FORM_GENERATION_FEE",
  },

  ENROLLMENT: {
    ENROLLMENT_REGISTRATION_FEE: "ENROLLMENT_REGISTRATION_FEE",
  },

  UTILITY: {
    UTILITY_FORM_GENERATION_FEE: "UTILITY_FORM_GENERATION_FEE",
  },
};

export const BREAKDOWN_CODE_VALUES = Object.values(BREAKDOWN_CODE).flatMap(
  (group) => Object.values(group),
);

// Internal vs External classification
export const BREAKDOWN_CATEGORY = {
  INTERNAL: "INTERNAL",
  EXTERNAL: "EXTERNAL",
};

export const BREAKDOWN_CATEGORY_VALUES = Object.values(BREAKDOWN_CATEGORY);

// ======================================================
// PAYMENT STATUS (Lifecycle)
// ======================================================
export const PAYMENT_STATUS = {
  CREATED: "CREATED",
  RECORDED: "RECORDED",
  VERIFICATION_PENDING: "VERIFICATION_PENDING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
};

export const PAYMENT_STATUS_VALUES = Object.values(PAYMENT_STATUS);

// ======================================================
// PAYMENT ATTEMPT STATUS (Lifecycle)
// ======================================================
export const PAYMENT_ATTEMPT_STATUS = {
  CREATED: "CREATED",
  LINK_GENERATED: "LINK_GENERATED",
  LINK_SHARED: "LINK_SHARED",
  VERIFICATION_PENDING: "VERIFICATION_PENDING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
  EXPIRED: "EXPIRED",
};

export const PAYMENT_ATTEMPT_STATUS_VALUES = Object.values(
  PAYMENT_ATTEMPT_STATUS,
);

// ======================================================
// PAYMENT ATTEMPT CHANNEL
// ======================================================
export const PAYMENT_ATTEMPT_CHANNEL = {
  SMS: "SMS",
  EMAIL: "EMAIL",
  LINK: "LINK",
};

export const PAYMENT_ATTEMPT_CHANNEL_VALUES = Object.values(
  PAYMENT_ATTEMPT_CHANNEL,
);

// ======================================================
// DIRECT PAYMENT METHODS
// ======================================================
export const DIRECT_PAYMENT_METHOD = {
  UPI: "UPI",
  NEFT: "NEFT",
  IMPS: "IMPS",
  CASH_DEPOSIT: "CASH_DEPOSIT",
};

export const DIRECT_PAYMENT_METHOD_VALUES = Object.values(
  DIRECT_PAYMENT_METHOD,
);
