import { Payment } from "../../models/payment.model.js";
import { PaymentAttempt } from "../../models/paymentAttempt.model.js";
import { handlePaymentSuccess } from "../../services/handlePaymentSuccess.service.js";
import {
  PAYMENT_STATUS,
  PAYMENT_ATTEMPT_STATUS,
} from "../../../constants/payment.constants.js";

const formatEntity = (entity) =>
  entity
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

export const verifyDirectPayment = async (req, res) => {
  try {
    const { paymentId, decision, remarks } = req.body;

    const payment = await Payment.findById(paymentId);
    const attempt = await PaymentAttempt.findById(payment?.currentAttemptId);

    if (!payment || !attempt) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    if (attempt.method !== "DIRECT") {
      return res.status(400).json({
        success: false,
        message: "Not a direct payment",
      });
    }

    // =========================
    // APPROVED
    // =========================
    if (decision === "APPROVED") {
      attempt.status = PAYMENT_ATTEMPT_STATUS.SUCCESS;
      attempt.lifecycle.paidAt = new Date();

      payment.status = PAYMENT_STATUS.SUCCESS;
    }

    // =========================
    // REJECTED
    // =========================
    if (decision === "REJECTED") {
      attempt.status = PAYMENT_ATTEMPT_STATUS.FAILED;
      attempt.failureReason = remarks;

      payment.status = PAYMENT_STATUS.FAILED;
    }

    payment.verification = {
      verifiedBy: "ADMIN",
      verifiedAt: new Date(),
      remarks,
    };

    await attempt.save();
    await payment.save();

    // =========================
    // POST PAYMENT (ONLY IF APPROVED)
    // =========================
    if (decision === "APPROVED" && payment.status === PAYMENT_STATUS.SUCCESS) {
      try {
        await handlePaymentSuccess(payment);

        return res.status(200).json({
          success: true,
          message: "Payment successful",
        });
      } catch (error) {
        // Business errors
        if (error.isOperational) {
          return res.status(200).json({
            success: true,
            message: `Payment successful. However, ${error.message}`,
          });
        }

        // System errors
        console.error("[verifyDirectPayment] PostPayment Error:", {
          message: error.message,
          stack: error.stack,
          paymentId,
          time: new Date().toISOString(),
        });

        return res.status(200).json({
          success: true,
          message: `Payment successful. However, ${formatEntity(
            payment.entityType,
          )} update failed. Please retry.`,
        });
      }
    }

    // =========================
    // REJECTED RESPONSE
    // =========================
    return res.status(200).json({
      success: true,
      message: `Payment ${decision.toLowerCase()}`,
    });
  } catch (error) {
    // System / Unexpected Errors
    console.error("[verifyDirectPayment] System Error:", {
      message: error.message,
      stack: error.stack,
      body: req.body,
      time: new Date().toISOString(),
    });

    return res.status(500).json({
      success: false,
      message: "Verification failed",
    });
  }
};
