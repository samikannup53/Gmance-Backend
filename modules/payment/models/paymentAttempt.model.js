import mongoose from "mongoose";

import {
  PAYMENT_METHOD_VALUES, // ✅ cleaner import
  PAYMENT_GATEWAY,
  PAYMENT_GATEWAY_FLOW_VALUES, // ✅ added
  PAYMENT_ATTEMPT_STATUS_VALUES,
  PAYMENT_ATTEMPT_CHANNEL_VALUES,
  DIRECT_PAYMENT_METHOD_VALUES,
} from "../../../constants/payment.constants.js";

const paymentAttemptSchema = new mongoose.Schema(
  {
    // ======================================================
    // LINK TO PARENT PAYMENT
    // ======================================================
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      required: true,
    },

    // ======================================================
    // ATTEMPT SEQUENCE
    // ======================================================
    attemptNumber: {
      type: Number,
      required: true,
    },

    // ======================================================
    // IDEMPOTENCY
    // ======================================================
    idempotencyKey: {
      type: String,
      trim: true,
    },

    // ======================================================
    // EXECUTION METHOD (HIGH LEVEL)
    // ======================================================
    method: {
      type: String,
      enum: PAYMENT_METHOD_VALUES, // ✅ cleaner
      required: true,
    },

    // ======================================================
    // GATEWAY FLOW (LINK / CHECKOUT)
    // ======================================================
    gatewayFlow: {
      type: String,
      enum: PAYMENT_GATEWAY_FLOW_VALUES,
    },

    // ======================================================
    // ATTEMPT STATUS
    // ======================================================
    status: {
      type: String,
      enum: PAYMENT_ATTEMPT_STATUS_VALUES,
      required: true,
    },

    // ======================================================
    // GATEWAY EXECUTION DETAILS
    // ======================================================
    gateway: {
      provider: {
        type: String,
        enum: Object.values(PAYMENT_GATEWAY),
      },

      orderId: String,
      paymentId: String,

      paidAmount: Number,

      link: {
        url: String,
        referenceId: String,
      },

      channel: {
        type: String,
        enum: PAYMENT_ATTEMPT_CHANNEL_VALUES,
      },

      rawResponse: {
        type: Object,
        select: false,
      },
    },

    // ======================================================
    // DIRECT / MANUAL PAYMENT DETAILS
    // ======================================================
    direct: {
      method: {
        type: String,
        enum: DIRECT_PAYMENT_METHOD_VALUES,
      },

      txnRef: String,
      txnDate: Date,

      proofUrl: String,
      remarks: String,
    },

    // ======================================================
    // TIMESTAMPS (PER ATTEMPT LIFECYCLE)
    // ======================================================
    lifecycle: {
      createdAt: {
        type: Date,
        default: Date.now,
      },

      lastSentAt: Date,
      expiresAt: Date,
      paidAt: Date,
      recordedAt: Date,
    },

    // ======================================================
    // FAILURE
    // ======================================================
    failureReason: String,

    // ======================================================
    // AUDIT
    // ======================================================
    createdBy: String,
    updatedBy: String,
  },
  {
    timestamps: true,
  },
);

// ======================================================
// INDEXES
// ======================================================

paymentAttemptSchema.index(
  { paymentId: 1, attemptNumber: 1 },
  { unique: true },
);

paymentAttemptSchema.index(
  { paymentId: 1, idempotencyKey: 1 },
  { unique: true, sparse: true },
);

paymentAttemptSchema.index({ status: 1 });
paymentAttemptSchema.index({ method: 1 });

export const PaymentAttempt = mongoose.model(
  "PaymentAttempt",
  paymentAttemptSchema,
);
