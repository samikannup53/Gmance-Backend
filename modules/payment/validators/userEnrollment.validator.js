import UserEnrollment from "../../user/enrollment/models/enrollment.model.js";
import { ENROLLMENT_PROGRESS } from "../../../config/constants.config.js";

export const validateUserEnrollmentPayment = async ({
  entityId,
  entityCode,
}) => {
  const enrollment = await UserEnrollment.findOne({ trnId: entityId });

  if (!enrollment) {
    const error = new Error("Enrollment not found");
    error.isOperational = true;
    throw error;
  }

  if (enrollment.enrollmentType !== entityCode) {
    const error = new Error("Invalid enrollment type");
    error.isOperational = true;
    throw error;
  }

  const payment = enrollment.process?.payment;

  if (!payment?.isRequired) {
    const error = new Error("Payment not required");
    error.isOperational = true;
    throw error;
  }

  if (payment.status === "SUCCESS") {
    const error = new Error("Payment already completed");
    error.isOperational = true;
    throw error;
  }

  if (enrollment.enrollmentProgress !== ENROLLMENT_PROGRESS.PAYMENT_PENDING) {
    const error = new Error("Enrollment not in payment stage");
    error.isOperational = true;
    throw error;
  }

  return enrollment;
};
