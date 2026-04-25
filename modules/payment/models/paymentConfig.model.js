import mongoose from "mongoose";

import {
  PAYMENT_METHOD_VALUES,
  PRICING_TYPE_VALUES,
  CALCULATION_TYPE_VALUES,
  APPLICABLE_ON_VALUES,
  ENTITY_TYPE_VALUES,
  ENTITY_CODE_VALUES,
  BREAKDOWN_CODE_VALUES,
  BREAKDOWN_CATEGORY_VALUES,
  CHARGE_TYPE,
} from "../../../constants/payment.constants.js";

const paymentConfigSchema = new mongoose.Schema(
  {
    // ======================================================
    // SERVICE IDENTIFICATION
    // ======================================================
    entityType: {
      type: String,
      enum: ENTITY_TYPE_VALUES,
      required: true,
      index: true,
    },

    entityCode: {
      type: String,
      enum: ENTITY_CODE_VALUES,
      required: true,
      index: true,
    },

    // ======================================================
    // PAYMENT METHODS
    // ======================================================
    allowedMethods: {
      type: [{ type: String, enum: PAYMENT_METHOD_VALUES }],
      required: true,
    },

    // ======================================================
    // PRICING TYPE
    // ======================================================
    pricingType: {
      type: String,
      enum: PRICING_TYPE_VALUES,
      required: true,
    },

    // ======================================================
    // AMOUNT CONFIGURATION
    // ======================================================
    amount: {
      currency: { type: String, default: "INR" },
      baseAmount: { type: Number, min: 0 },

      // ------------------------------
      // Base Amount Breakdown
      // ------------------------------
      breakdown: {
        type: [
          {
            _id: false,
            code: { type: String, enum: BREAKDOWN_CODE_VALUES, required: true },
            category: {
              type: String,
              enum: BREAKDOWN_CATEGORY_VALUES,
              required: true,
            },
            amount: { type: Number, required: true, min: 0 },
          },
        ],
        default: [],
      },

      // ------------------------------
      // Additional Charges
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
            calculationType: { type: String, enum: CALCULATION_TYPE_VALUES },
            value: Number,
            applicableOn: [{ type: String, enum: APPLICABLE_ON_VALUES }],
          },
        ],
        default: [],
      },

      // ------------------------------
      // Taxes
      // ------------------------------
      taxes: {
        type: [{ _id: false, taxType: String, rate: Number }],
        default: [],
      },
    },

    // ======================================================
    // AUDIT & CONTROL
    // ======================================================
    isActive: { type: Boolean, default: true },
    version: { type: Number, default: 1 },
    configuredBy: String,
    updatedBy: String,
  },
  {
    timestamps: true,
  },
);

// ======================================================
// UNIQUE INDEX
// ======================================================
paymentConfigSchema.index({ entityType: 1, entityCode: 1 }, { unique: true });

export const PaymentConfig = mongoose.model(
  "PaymentConfig",
  paymentConfigSchema,
);
