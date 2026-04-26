import { validateUserEnrollmentPayment } from "./userEnrollment.validator.js";

export const PAYMENT_VALIDATORS = {
  USER_ENROLLMENT: validateUserEnrollmentPayment,
};
