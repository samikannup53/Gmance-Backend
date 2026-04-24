import mongoose from "mongoose";

import {
  PAYMENT_ENTITY,
  PAYMENT_FLOW,
  PAYMENT_METHOD,
  PAYMENT_STATUS,
} from "../constants/payment.constants.js";

const paymentSchema = new mongoose.Schema(
  {
    referenceId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    entityType: {
      type: String,
      enum: Object.values(PAYMENT_ENTITY),
      required: true,
    },

    entityId: {
      type: String, // internal ID like TRN-20001
      required: true,
      index: true,
    },

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

    amount: {
      currency: { type: String, default: "INR" },

      baseAmount: { type: Number, required: true, min: 0 },

      charges: {
        type: [
          {
            chargeType: { type: String, required: true },
            amount: { type: Number, required: true, min: 0 },
          },
        ],
        default: [],
      },

      taxes: {
        type: [
          {
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

    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.CREATED,
      index: true,
    },

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

    verification: {
      verifiedBy: String, // temporary until User model
      verifiedAt: Date,
      remarks: String,
    },

    failureReason: String,

    initiatedBy: {
      type: String,
      enum: ["USER", "ADMIN"],
    },

    createdBy: String, // temporary

    statusHistory: [
      {
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

// compound index for safety
paymentSchema.index({ entityType: 1, entityId: 1 });

export const Payment = mongoose.model("Payment", paymentSchema);
