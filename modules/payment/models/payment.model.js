import mongoose from "mongoose";

import {
  ENTITY_TYPE_VALUES,
  PAYMENT_FLOW,
  PAYMENT_METHOD,
  PAYMENT_STATUS,
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

    entityId: {
      type: String, // internal ID like TRN-20001
      required: true,
      index: true,
    },

    // ======================================================
    // FLOW & METHOD
    // ======================================================
    flow: {
      type: String,
      enum: Object.values(PAYMENT_FLOW),
      required: true,
    },

    method: {
      type: String,
      enum: Object.values(PAYMENT_METHOD),
      required: true,
    },

    // ======================================================
    // AMOUNT SNAPSHOT (IMMUTABLE)
    // ======================================================
    amount: {
      currency: { type: String, default: "INR" },

      baseAmount: { type: Number, required: true, min: 0 },

      // ------------------------------
      // Breakdown (copied from config)
      // ------------------------------
      breakdown: {
        type: [
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
        default: [],
      },

      // ------------------------------
      // Charges (calculated at runtime)
      // ------------------------------
      charges: {
        type: [
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
        default: [],
      },

      // ------------------------------
      // Taxes
      // ------------------------------
      taxes: {
        type: [
          {
            _id: false,

            taxType: { type: String, required: true },

            rate: { type: Number, min: 0 },

            amount: { type: Number, required: true, min: 0 },
          },
        ],
        default: [],
      },

      roundOff: { type: Number, default: 0 },

      totalAmount: { type: Number, required: true, min: 1 },
    },

    // ======================================================
    // STATUS
    // ======================================================
    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.CREATED,
      index: true,
    },

    // ======================================================
    // ATTEMPTS & IDEMPOTENCY
    // ======================================================
    attemptsCount: {
      type: Number,
      default: 0,
    },

    currentAttemptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PaymentAttempt",
    },

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
    initiatedBy: {
      type: String,
      enum: ["USER", "ADMIN"],
    },

    createdBy: String,

    statusHistory: [
      {
        _id: false,
        status: String,
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
paymentSchema.index({ entityType: 1, entityId: 1 });

export const Payment = mongoose.model("Payment", paymentSchema);
