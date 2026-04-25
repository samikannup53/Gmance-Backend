import mongoose from "mongoose";

import {
  ENTITY_TYPE_VALUES,
  ENTITY_CODE_VALUES,
  PAYMENT_FLOW,
  PAYMENT_STATUS,
  PAYMENT_STATUS_VALUES,
  BREAKDOWN_CODE_VALUES,
  BREAKDOWN_CATEGORY_VALUES,
  CHARGE_TYPE,
} from "../../../constants/payment.constants.js";

const paymentSchema = new mongoose.Schema(
  {
    // ======================================================
    // IDENTIFICATION
    // ======================================================
    referenceId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    entityType: {
      type: String,
      enum: ENTITY_TYPE_VALUES,
      required: true,
    },

    entityCode: {
      type: String,
      enum: ENTITY_CODE_VALUES,
      required: true,
    },

    entityId: {
      type: String,
      required: true,
      index: true,
    },

    // ======================================================
    // FLOW (NO METHOD HERE)
    // ======================================================
    flow: {
      type: String,
      enum: Object.values(PAYMENT_FLOW),
      required: true,
    },

    // ======================================================
    // AMOUNT SNAPSHOT (IMMUTABLE)
    // ======================================================
    amount: {
      currency: { type: String, default: "INR" },

      baseAmount: { type: Number, required: true, min: 0 },

      breakdown: [
        {
          _id: false,
          code: {
            type: String,
            enum: BREAKDOWN_CODE_VALUES,
            required: true,
          },
          category: {
            type: String,
            enum: BREAKDOWN_CATEGORY_VALUES,
            required: true,
          },
          amount: {
            type: Number,
            required: true,
            min: 0,
          },
        },
      ],

      charges: [
        {
          _id: false,
          chargeType: {
            type: String,
            enum: Object.values(CHARGE_TYPE),
            required: true,
          },
          amount: {
            type: Number,
            required: true,
            min: 0,
          },
        },
      ],

      taxes: [
        {
          _id: false,
          taxType: { type: String, required: true },
          rate: { type: Number, min: 0 },
          amount: { type: Number, required: true, min: 0 },
        },
      ],

      roundOff: { type: Number, default: 0 },

      totalAmount: { type: Number, required: true, min: 1 },
    },

    // ======================================================
    // STATUS
    // ======================================================
    status: {
      type: String,
      enum: PAYMENT_STATUS_VALUES,
      default: PAYMENT_STATUS.CREATED,
      index: true,
    },

    // ======================================================
    // ATTEMPTS
    // ======================================================
    attemptsCount: {
      type: Number,
      default: 0,
    },

    currentAttemptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PaymentAttempt",
    },

    // ======================================================
    // IDEMPOTENCY
    // ======================================================
    idempotencyKey: {
      type: String,
      index: true,
      sparse: true,
    },

    // ======================================================
    // VERIFICATION
    // ======================================================
    verification: {
      verifiedBy: String,
      verifiedAt: Date,
      remarks: String,
    },

    failureReason: String,

    // ======================================================
    // AUDIT
    // ======================================================
    initiatedBy: { type: String, enum: ["USER", "ADMIN"] },
    createdBy: String,

    statusHistory: [
      {
        _id: false,
        status: {
          type: String,
          enum: PAYMENT_STATUS_VALUES,
        },
        updatedAt: { type: Date, default: Date.now },
        updatedBy: String,
        note: String,
      },
    ],

    meta: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

// ======================================================
// INDEXES
// ======================================================
paymentSchema.index({ entityType: 1, entityCode: 1, entityId: 1 });

// Idempotency safety
paymentSchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true });

export const Payment = mongoose.model("Payment", paymentSchema);
