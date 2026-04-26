import UserEnrollment from "../../user/enrollment/models/enrollment.model.js";
import {
  ENROLLMENT_PROGRESS,
  ENROLLMENT_PROGRESS_STATUS_MAP,
} from "../../../config/constants.config.js";

export const handleUserEnrollmentPaymentSuccess = async (payment) => {
  const { entityId, entityCode, referenceId } = payment;

  const enrollment = await UserEnrollment.findOne({ trnId: entityId });

  if (!enrollment) {
    const error = new Error("Enrollment Record Not Found");
    error.isOperational = true;
    throw error;
  }

  if (enrollment.enrollmentType !== entityCode) {
    const error = new Error("Enrollment Type does not match Payment");
    error.isOperational = true;
    throw error;
  }

  const paymentBlock = enrollment.process?.payment;

  if (paymentBlock?.status === "SUCCESS") {
    const error = new Error("Payment has already been Verified");
    error.isOperational = true;
    throw error;
  }

  if (enrollment.enrollmentProgress !== ENROLLMENT_PROGRESS.PAYMENT_PENDING) {
    const error = new Error("Enrollment is not in the Paymnt Stage");
    error.isOperational = true;
    throw error;
  }

  enrollment.process.payment.status = "SUCCESS";
  enrollment.process.payment.paidAt = new Date();
  enrollment.process.payment.referenceId = referenceId;

  const progress = ENROLLMENT_PROGRESS.PAYMENT_COMPLETED;

  enrollment.enrollmentProgress = progress;
  enrollment.enrollmentStatus = ENROLLMENT_PROGRESS_STATUS_MAP[progress];

  await enrollment.save();
};
