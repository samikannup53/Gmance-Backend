import { Payment } from "../models/payment.model.js";
import { PaymentAttempt } from "../models/paymentAttempt.model.js";

import {
  PAYMENT_STATUS,
  PAYMENT_METHOD,
} from "../../../constants/payment.constants.js";

export const initiatePayment = async (req, res) => {
  try {
    const {
      entityType,
      entityId,
      flow,
      method,
      amount,
      initiatedBy,
      idempotencyKey,
      meta,
    } = req.body;

    // 1. Idempotency check
    if (idempotencyKey) {
      const existing = await Payment.findOne({ idempotencyKey });
      if (existing) {
        return res.json(existing);
      }
    }

    // 2. Create Payment
    const payment = await Payment.create({
      referenceId: `PAY-${Date.now()}`, // simple for now
      entityType,
      entityId,
      flow,
      method,
      amount,
      initiatedBy,
      idempotencyKey,
      meta,

      status: PAYMENT_STATUS.CREATED,

      statusHistory: [
        {
          status: PAYMENT_STATUS.CREATED,
          note: "Payment initiated",
        },
      ],
    });

    return res.status(201).json(payment);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to initiate payment",
    });
  }
};
