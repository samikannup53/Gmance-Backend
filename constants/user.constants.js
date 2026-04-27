// ======================================================
// USER TYPES
// ======================================================
export const USER_TYPES = {
  ASSOCIATE: "ASSOCIATE",
  EMPLOYEE: "EMPLOYEE",
};

export const USER_TYPES_VALUES = Object.values(USER_TYPES);

// ======================================================
// USER ROLES
// ======================================================
export const USER_ROLES = {
  SYSTEM_ADMIN: "SYSTEM_ADMIN",
  OPS_ADMIN: "OPS_ADMIN",
  FINANCE_ADMIN: "FINANCE_ADMIN",
  SUPPORT_ADMIN: "SUPPORT_ADMIN",
  USER: "USER",
  SYSTEM: "SYSTEM",
};

export const USER_ROLES_VALUES = Object.values(USER_ROLES);

// ======================================================
// USER STATUSES
// ======================================================
export const USER_STATUSES = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  DEACTIVATED: "DEACTIVATED",
  SUSPENDED: "SUSPENDED",
  OFFBOARDED: "OFFBOARDED",
  TERMINATED: "TERMINATED",
};

export const USER_STATUSES_VALUES = Object.values(USER_STATUSES);

// ======================================================
// USER ACTIONS CONFIG (BASED ON TYPE & STATUS)
// ======================================================
export const USER_ACTIONS_CONFIG = {
  [USER_TYPES.ASSOCIATE]: {
    [USER_STATUSES.ACTIVE]: ["DEACTIVATE", "SUSPEND", "OFFBOARD"],
    [USER_STATUSES.DEACTIVATED]: ["REACTIVATE"],
  },

  [USER_TYPES.EMPLOYEE]: {
    [USER_STATUSES.ACTIVE]: ["DEACTIVATE", "SUSPEND", "TERMINATE"],
    [USER_STATUSES.DEACTIVATED]: ["REACTIVATE"],
  },
};
