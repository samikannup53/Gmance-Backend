import mongoose from "mongoose";

import {
  PAYMENT_METHOD,
  PAYMENT_GATEWAY,
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
    // EXECUTION METHOD (HIGH LEVEL)
    // ======================================================
    method: {
      type: String,
      enum: Object.values(PAYMENT_METHOD), // DIRECT / GATEWAY / WALLET
      required: true,
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
        select: false, // prevents heavy payload in normal queries
      },
    },

    // ======================================================
    // DIRECT / MANUAL PAYMENT DETAILS
    // ======================================================
    direct: {
      method: {
        type: String,
        enum: DIRECT_PAYMENT_METHOD_VALUES, // UPI / NEFT / IMPS / CASH_DEPOSIT
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

      lastSentAt: Date, // link sent
      expiresAt: Date, // link expiry
      paidAt: Date, // payment completed
      recordedAt: Date, // manual entry recorded
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
    timestamps: true, // createdAt, updatedAt (document level)
  },
);

// ======================================================
// INDEXES
// ======================================================

// Prevent duplicate attempt numbers per payment
paymentAttemptSchema.index(
  { paymentId: 1, attemptNumber: 1 },
  { unique: true },
);

// Optional: faster lookup of attempts by status
paymentAttemptSchema.index({ status: 1 });

// Optional: filter by method quickly
paymentAttemptSchema.index({ method: 1 });

export const PaymentAttempt = mongoose.model(
  "PaymentAttempt",
  paymentAttemptSchema,
);
