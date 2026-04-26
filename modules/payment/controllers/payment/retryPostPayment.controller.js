import { Payment } from "../../models/payment.model.js";
import { handlePaymentSuccess } from "../../services/handlePaymentSuccess.service.js";
import { PAYMENT_STATUS } from "../../../../constants/payment.constants.js";

export const retryPostPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findById(paymentId);

    if (!payment) {
      const error = new Error("Payment record not found");
      error.isOperational = true;
      throw error;
    }

    if (payment.status !== PAYMENT_STATUS.SUCCESS) {
      const error = new Error("Payment is not completed. Retry is not allowed");
      error.isOperational = true;
      throw error;
    }

    await handlePaymentSuccess(payment);

    return res.status(200).json({
      success: true,
      message: "Post-payment processing completed successfully",
    });
  } catch (error) {
    // System / Unexpected Errors
    if (!error.isOperational) {
      console.error("[retryPostPayment] System Error:", {
        message: error.message,
        stack: error.stack,
        params: req.params,
        time: new Date().toISOString(),
      });
    }

    // Business / Validation Errors
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
