// controllers/payment/getPayment.controller.js

import { Payment } from "../../models/payment.model.js";

export const getPaymentById = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findById(paymentId);

    if (!payment) {
      const error = new Error("Payment record not found");
      error.isOperational = true;
      throw error;
    }

    return res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    if (!error.isOperational) {
      console.error("[getPaymentById] System Error:", error);
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
