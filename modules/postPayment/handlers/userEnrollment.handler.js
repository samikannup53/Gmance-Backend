import UserEnrollment from "../../user/enrollment/models/enrollment.model.js";
import {
  ENROLLMENT_PROGRESS,
  ENROLLMENT_PROGRESS_STATUS_MAP,
} from "../../../config/constants.config.js";

export const handleUserEnrollmentPaymentSuccess = async (payment) => {
  const { entityId, entityCode, referenceId } = payment;

  // =========================
  // FETCH ENROLLMENT
  // =========================
  const enrollment = await UserEnrollment.findOne({ trnId: entityId });

  if (!enrollment) {
    throw new Error("Enrollment not found for payment processing");
  }

  // =========================
  // VALIDATE ENTITY CODE
  // =========================
  if (enrollment.enrollmentType !== entityCode) {
    throw new Error("Enrollment type mismatch for payment");
  }

  const paymentBlock = enrollment.process?.payment;

  // =========================
  // IDEMPOTENCY CHECK
  // =========================
  if (paymentBlock?.status === "SUCCESS") {
    return; // already processed → safe exit
  }

  // =========================
  // STAGE VALIDATION
  // =========================
  if (enrollment.enrollmentProgress !== ENROLLMENT_PROGRESS.PAYMENT_PENDING) {
    throw new Error("Enrollment not in payment pending stage");
  }

  // =========================
  // UPDATE PAYMENT BLOCK
  // =========================
  enrollment.process.payment.status = "SUCCESS";
  enrollment.process.payment.paidAt = new Date();
  enrollment.process.payment.referenceId = referenceId;

  // =========================
  // UPDATE PROGRESS & STATUS
  // =========================
  const progress = ENROLLMENT_PROGRESS.PAYMENT_COMPLETED;

  enrollment.enrollmentProgress = progress;
  enrollment.enrollmentStatus = ENROLLMENT_PROGRESS_STATUS_MAP[progress];

  // =========================
  // SAVE
  // =========================
  await enrollment.save();
};
