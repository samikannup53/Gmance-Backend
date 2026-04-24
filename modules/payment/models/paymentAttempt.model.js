import mongoose from "mongoose";

import {
  PAYMENT_METHOD,
  PAYMENT_GATEWAY,
} from "../constants/payment.constants.js";

const paymentAttemptSchema = new mongoose.Schema(
  {
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      required: true,
      index: true,
    },

    attemptNumber: {
      type: Number,
      required: true,
    },

    method: {
      type: String,
      enum: Object.values(PAYMENT_METHOD),
      required: true,
    },

    status: {
      type: String,
      required: true,
    },

    // Gateway attempt
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

      channel: String, // SMS / EMAIL
    },

    // Direct attempt
    direct: {
      method: String,
      txnRef: String,
      txnDate: Date,

      proofUrl: String,
      remarks: String,
    },

    // Attempt lifecycle
    timestamps: {
      createdAt: { type: Date, default: Date.now },
      lastSentAt: Date,
      expiresAt: Date,
      paidAt: Date,
    },

    failureReason: String,
  },
  {
    timestamps: true,
  },
);

export const PaymentAttempt = mongoose.model("PaymentAttempt", paymentAttemptSchema);
