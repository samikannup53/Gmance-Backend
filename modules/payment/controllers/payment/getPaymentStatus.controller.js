// controllers/payment/getPaymentStatus.controller.js

import { Payment } from "../../models/payment.model.js";
import { PaymentAttempt } from "../../models/paymentAttempt.model.js";

export const getPaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findById(paymentId);

    if (!payment) {
      const error = new Error("Payment record not found");
      error.isOperational = true;
      throw error;
    }

    const attempt = await PaymentAttempt.findById(payment.currentAttemptId);

    return res.status(200).json({
      success: true,
      data: {
        paymentStatus: payment.status,
        attemptStatus: attempt?.status,
        method: attempt?.method,
      },
    });
  } catch (error) {
    if (!error.isOperational) {
      console.error("[getPaymentStatus] System Error:", error);
    }

    if (error.isOperational) {
      return res.status(404).json({
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
