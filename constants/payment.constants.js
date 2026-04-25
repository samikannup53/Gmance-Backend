export const PAYMENT_GATEWAY = {
  RAZORPAY: "RAZORPAY",
  PAYTM: "PAYTM",
};

export const PAYMENT_FLOW = {
  PAY: "PAY",
  COLLECT: "COLLECT",
};

export const PAYMENT_METHOD = {
  DIRECT: "DIRECT",
  GATEWAY: "GATEWAY",
};

export const PAYMENT_ENTITY = {
  ENROLLMENT: "ENROLLMENT",
  WALLET: "WALLET",
  AGREEMENT: "AGREEMENT",
  PRODUCT: "PRODUCT",
};

export const PAYMENT_STATUS = {
  CREATED: "CREATED",
  PENDING: "PENDING",
  VERIFICATION_PENDING: "VERIFICATION_PENDING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
};

export const PAYMENT_CONFIG = {
  ENROLLMENT: {
    currency: "INR",
    pricing: {
      type: "STATIC", // STATIC | DYNAMIC
      baseAmount: 799,
    },

    charges: [{ chargeType: "PLATFORM_FEE", amount: 27 }],

    taxes: [],
  },

  WALLET: {
    pricing: {
      type: "DYNAMIC", // amount comes from request (top-up)
    },
    charges: [],
    taxes: [],
    currency: "INR",
  },

  AGREEMENT: {
    pricing: {
      type: "DYNAMIC",
    },
    charges: [],
    taxes: [],
    currency: "INR",
  },

  PRODUCT: {
    pricing: {
      type: "DYNAMIC",
    },
    charges: [],
    taxes: [],
    currency: "INR",
  },
};
