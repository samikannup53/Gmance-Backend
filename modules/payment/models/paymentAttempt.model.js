import mongoose from "mongoose";

import {
  PAYMENT_METHOD,
  PAYMENT_GATEWAY,
} from "../../../constants/payment.constants.js";

const paymentAttemptSchema = new mongoose.Schema(
  {
    // Link to parent payment
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      required: true,
      index: true,
    },
    paymentReferenceId: String,

    // Attempt sequence
    attemptNumber: {
      type: Number,
      required: true,
    },

    // Method (DIRECT / GATEWAY)
    method: {
      type: String,
      enum: Object.values(PAYMENT_METHOD),
      required: true,
    },

    // Attempt status (independent of payment)
    status: {
      type: String,
      required: true,
      index: true,
    },

    // Gateway execution details
    gateway: {
      provider: {
        type: String,
        enum: Object.values(PAYMENT_GATEWAY),
      },

      orderId: String,
      paymentId: String,

      link: {
        url: String,
        referenceId: String,
      },

      channel: String, // SMS / EMAIL / LINK

      rawResponse: Object,
    },

    // Direct/manual execution details
    direct: {
      method: String, // UPI / BANK / CASH
      txnRef: String,
      txnDate: Date,

      proofUrl: String,
      remarks: String,
    },

    // Lifecycle timestamps (per attempt)
    timestamps: {
      createdAt: {
        type: Date,
        default: Date.now,
      },

      lastSentAt: Date,
      expiresAt: Date,
      paidAt: Date,
      recordedAt: Date,
    },

    failureReason: String,

    // Temporary audit fields (until User model)
    createdBy: String,
    updatedBy: String,
  },
  {
    timestamps: true,
  },
);

export const PaymentAttempt = mongoose.model(
  "PaymentAttempt",
  paymentAttemptSchema,
);
