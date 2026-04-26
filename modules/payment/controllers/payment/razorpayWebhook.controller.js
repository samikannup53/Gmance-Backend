import crypto from "crypto";
import { Payment } from "../../models/payment.model.js";
import { PaymentAttempt } from "../../models/paymentAttempt.model.js";
import {
  PAYMENT_STATUS,
  PAYMENT_ATTEMPT_STATUS,
} from "../../../constants/payment.constants.js";

export const handleRazorpayWebhook = async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"];

    // =========================
    // VERIFY WEBHOOK SIGNATURE
    // =========================
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (expectedSignature !== signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid webhook signature",
      });
    }

    const event = req.body.event;

    // =========================
    // HANDLE PAYMENT SUCCESS
    // =========================
    if (event === "payment.captured") {
      const paymentEntity = req.body.payload.payment.entity;

      const { order_id, id: razorpayPaymentId, amount } = paymentEntity;

      // =========================
      // FIND ATTEMPT USING ORDER ID
      // =========================
      const attempt = await PaymentAttempt.findOne({
        "gateway.orderId": order_id,
      });

      if (!attempt) {
        console.warn("Attempt not found for order:", order_id);
        return res.status(200).json({ success: true });
      }

      // Idempotency (webhook retry safe)
      if (attempt.status === PAYMENT_ATTEMPT_STATUS.SUCCESS) {
        return res.status(200).json({ success: true });
      }

      const payment = await Payment.findById(attempt.paymentId);

      if (!payment) {
        console.warn("Payment not found for attempt:", attempt._id);
        return res.status(200).json({ success: true });
      }

      // =========================
      // UPDATE ATTEMPT
      // =========================
      attempt.status = PAYMENT_ATTEMPT_STATUS.SUCCESS;
      attempt.gateway.paymentId = razorpayPaymentId;
      attempt.gateway.paidAmount = amount / 100;
      attempt.lifecycle.paidAt = new Date();

      // =========================
      // UPDATE PAYMENT
      // =========================
      payment.status = PAYMENT_STATUS.SUCCESS;

      // Optional history
      payment.statusHistory.push({
        status: PAYMENT_STATUS.SUCCESS,
        updatedBy: "WEBHOOK",
        note: "Payment captured via Razorpay webhook",
      });

      await attempt.save();
      await payment.save();

      // =========================
      // TRIGGER BENEFITS
      // =========================
      // await handlePaymentSuccess(payment);

      return res.status(200).json({ success: true });
    }

    // =========================
    // HANDLE PAYMENT FAILED
    // =========================
    if (event === "payment.failed") {
      const paymentEntity = req.body.payload.payment.entity;

      const { order_id } = paymentEntity;

      const attempt = await PaymentAttempt.findOne({
        "gateway.orderId": order_id,
      });

      if (!attempt) return res.status(200).json({ success: true });

      attempt.status = PAYMENT_ATTEMPT_STATUS.FAILED;
      attempt.failureReason = "Payment failed via Razorpay";

      await attempt.save();

      return res.status(200).json({ success: true });
    }

    // =========================
    // IGNORE OTHER EVENTS
    // =========================
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("[Webhook Error]:", error);
    return res.status(500).json({ success: false });
  }
};
