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
      type: mongoose.Schema.Types.ObjectId,
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
      baseAmount: { type: Number, required: true },

      charges: [
        {
          type: String,
          amount: Number,
        },
      ],

      taxes: [
        {
          type: {
            type: String,
          },
          rate: Number,
          amount: Number,
        },
      ],

      roundOff: {
        type: Number,
        default: 0,
      },

      totalAmount: {
        type: Number,
        required: true,
      },
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
    },

    verification: {
      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      verifiedAt: Date,
      remarks: String,
    },

    failureReason: String,

    initiatedBy: {
      type: String, // USER | ADMIN
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    statusHistory: [
      {
        status: String,
        updatedAt: {
          type: Date,
          default: Date.now,
        },
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        note: String,
      },
    ],

    expiresAt: Date,

    meta: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

export const Payment = mongoose.model("Payment", paymentSchema);
