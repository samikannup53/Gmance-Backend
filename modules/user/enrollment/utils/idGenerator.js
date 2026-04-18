export const generatePublicId = () =>
  `${Math.random().toString(36).slice(2, 10).toUpperCase()}-${Date.now()}`;

export const generateTRN = () => `TRN-${Date.now()}`;

export const generateERN = () => `ERN-${Date.now()}`;

export const generateUserId = () => `USR-${Date.now()}`;
