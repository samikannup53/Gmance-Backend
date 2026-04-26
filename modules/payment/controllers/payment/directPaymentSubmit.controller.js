// controllers/payment/directSubmit.controller.js

import { Payment } from "../../models/payment.model.js";
import { PaymentAttempt } from "../../models/paymentAttempt.model.js";

import {
  PAYMENT_METHOD,
  PAYMENT_ATTEMPT_STATUS,
} from "../../../../constants/payment.constants.js";

export const submitDirectPayment = async (req, res) => {
  try {
    const { paymentId, txnRef, txnDate, proofUrl, remarks } = req.body;

    const payment = await Payment.findById(paymentId);
    const attempt = await PaymentAttempt.findById(payment?.currentAttemptId);

    if (!payment || !attempt) {
      const error = new Error("Payment record not found");
      error.isOperational = true;
      throw error;
    }

    if (attempt.method !== PAYMENT_METHOD.DIRECT) {
      const error = new Error("Invalid payment method for direct submission");
      error.isOperational = true;
      throw error;
    }

    attempt.direct = {
      txnRef,
      txnDate,
      proofUrl,
      remarks,
    };

    attempt.status = PAYMENT_ATTEMPT_STATUS.VERIFICATION_PENDING;

    await attempt.save();

    return res.status(200).json({
      success: true,
      message: "Payment details submitted successfully",
    });
  } catch (error) {
    if (!error.isOperational) {
      console.error("[submitDirectPayment] System Error:", error);
    }

    if (error.isOperational) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
