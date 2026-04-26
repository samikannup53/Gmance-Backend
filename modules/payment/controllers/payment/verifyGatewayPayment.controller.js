import crypto from "crypto";
import { Payment } from "../../models/payment.model.js";
import { PaymentAttempt } from "../../models/paymentAttempt.model.js";
import {
  PAYMENT_STATUS,
  PAYMENT_ATTEMPT_STATUS,
} from "../../../../constants/payment.constants.js";

export const verifyGatewayPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      paymentId,
    } = req.body;

    // =========================
    // SIGNATURE VERIFY
    // =========================
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid signature",
      });
    }

    // =========================
    // FETCH PAYMENT + ATTEMPT
    // =========================
    const payment = await Payment.findById(paymentId);
    const attempt = await PaymentAttempt.findById(payment.currentAttemptId);

    if (!payment || !attempt) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    // =========================
    // UPDATE ATTEMPT
    // =========================
    attempt.status = PAYMENT_ATTEMPT_STATUS.SUCCESS;
    attempt.gateway.paymentId = razorpay_payment_id;
    attempt.lifecycle.paidAt = new Date();

    // =========================
    // UPDATE PAYMENT
    // =========================
    payment.status = PAYMENT_STATUS.SUCCESS;

    await attempt.save();
    await payment.save();

    // =========================
    // TRIGGER BENEFITS
    // =========================
    // await handlePaymentSuccess(payment);

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Verification failed",
    });
  }
};
