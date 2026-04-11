// User Types
export const USER_TYPES = ["ASSOCIATE", "EMPLOYEE"];

// User Roles
export const USER_ROLES = [
  "SUPER_ADMIN",
  "OPS_ADMIN",
  "FINANCE_ADMIN",
  "SUPPORT_ADMIN",
  "USER",
  "SYSTEM",
];

// User Statuses
export const USER_STATUSES = [
  "ACTIVE",
  "INACTIVE",
  "DEACTIVATED",
  "SUSPENDED",
  "OFFBOARDED",
  "TERMINATED",
];

// User Enrollment Types
export const USER_ENROLLMENT_TYPES = [
  "NEW_REGISTRATION",
  "RENEWAL",
  "AMENDMENT",
];

// User Enrollment Flow Modes
export const USER_ENROLLMENT_FLOW_MODES = {
  NEW: "NEW",
  RESUME: "RESUME",
};

export const USER_ENROLLMENT_SECTIONS = {
  ASSOCIATE: ["AUTH", "KYC", "PAN_BANK", "PERSONAL", "KIOSK", "PREVIEW"],
  EMPLOYEE: ["AUTH", "KYC", "PAN_BANK", "PERSONAL", "PREVIEW"],
};

// User Actions Configuration based on User Type and Status
export const USER_ACTIONS_CONFIG = {
  ASSOCIATE: {
    ACTIVE: ["DEACTIVATE", "SUSPEND", "OFFBOARD"],
    DEACTIVATED: ["REACTIVATE"],
  },
  EMPLOYEE: {
    ACTIVE: ["DEACTIVATE", "SUSPEND", "TERMINATE"],
    DEACTIVATED: ["REACTIVATE"],
  },
};

// Evolution Stages
export const EVOLUTION_STAGES = [
  "ENROLLED",
  "COMPLIANCE",
  "AGREEMENT",
  "ACTIVATED",
];
