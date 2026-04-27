// ======================================================
// EVOLUTION STAGES
// ======================================================
export const USER_EVOLUTION_STAGES = {
  COMPLIANCE: "COMPLIANCE",
  AGREEMENT: "AGREEMENT",
  ACTIVATION: "ACTIVATION",
};

export const USER_EVOLUTION_STAGE_VALUES = Object.values(USER_EVOLUTION_STAGES);

// ======================================================
// EVOLUTION STATUS (GLOBAL)
// ======================================================
export const USER_EVOLUTION_STATUS = {
  UNDER_EVOLUTION: "UNDER_EVOLUTION",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  HOLD: "HOLD",
};

export const USER_EVOLUTION_STATUS_VALUES = Object.values(
  USER_EVOLUTION_STATUS,
);

// ======================================================
// COMPLIANCE SECTION STATUS
// ======================================================
export const USER_COMPLIANCE_SECTION_STATUS = {
  PENDING: "PENDING",
  IGO: "IGO",
  NIGO: "NIGO",
};

export const USER_COMPLIANCE_SECTION_STATUS_VALUES = Object.values(
  USER_COMPLIANCE_SECTION_STATUS,
);

// ======================================================
// COMPLIANCE FINAL STATUS
// ======================================================
export const USER_COMPLIANCE_FINAL_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  HOLD: "HOLD",
  REJECTED: "REJECTED",
};

export const USER_COMPLIANCE_FINAL_STATUS_VALUES = Object.values(
  USER_COMPLIANCE_FINAL_STATUS,
);

// ======================================================
// AGREEMENT STATUS (PIPELINE)
// ======================================================
export const USER_AGREEMENT_STATUS = {
  PENDING: "PENDING",
  STAMP_UPLOADED: "STAMP_UPLOADED",
  GENERATED: "GENERATED",
  REVIEWED: "REVIEWED",
  ESIGN_INITIATED: "ESIGN_INITIATED",
  SIGNED: "SIGNED",
  FAILED: "FAILED",
};

export const USER_AGREEMENT_STATUS_VALUES = Object.values(
  USER_AGREEMENT_STATUS,
);

// ======================================================
// AGREEMENT REVIEW STATUS
// ======================================================
export const USER_AGREEMENT_REVIEW_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
};

export const USER_AGREEMENT_REVIEW_STATUS_VALUES = Object.values(
  USER_AGREEMENT_REVIEW_STATUS,
);

// ======================================================
// ESIGN STATUS
// ======================================================
export const USER_ESIGN_STATUS = {
  PENDING: "PENDING",
  INITIATED: "INITIATED",
  SIGNED: "SIGNED",
  FAILED: "FAILED",
};

export const USER_ESIGN_STATUS_VALUES = Object.values(USER_ESIGN_STATUS);

// ======================================================
// ACTIVATION STATUS
// ======================================================
export const USER_ACTIVATION_STATUS = {
  PENDING: "PENDING",
  ACTIVATED: "ACTIVATED",
};

export const USER_ACTIVATION_STATUS_VALUES = Object.values(
  USER_ACTIVATION_STATUS,
);
