import mongoose from "mongoose";

import {
  PAYMENT_METHOD_VALUES,
  PRICING_TYPE_VALUES,
  CALCULATION_TYPE_VALUES,
  APPLICABLE_ON_VALUES,
} from "../../../constants/payment.constants.js";

const paymentConfigSchema = new mongoose.Schema(
  {
    // =============================
    // Service Identification
    // =============================
    entityType: {
      type: String, // PAN, ENROLLMENT, AGREEMENT, etc.
      required: true,
      index: true,
    },

    entityCode: {
      type: String, // NEW_REGISTRATION, NEW_IND_PHYSICAL, etc.
      required: true,
      index: true,
    },

    // =============================
    // Allowed Payment Methods
    // =============================
    allowedMethods: {
      type: [
        {
          type: String,
          enum: PAYMENT_METHOD_VALUES,
        },
      ],
      required: true,
    },

    // =============================
    // Pricing Type
    // =============================
    pricingType: {
      type: String,
      enum: PRICING_TYPE_VALUES,
      required: true,
    },

    // =============================
    // Amount Rules (NOT calculated)
    // =============================
    amount: {
      currency: {
        type: String,
        default: "INR",
      },

      baseAmount: {
        type: Number, // used only if STATIC
        min: 0,
      },

      charges: {
        _id: false,
        type: [
          {
            chargeType: String,

            calculationType: {
              type: String,
              enum: CALCULATION_TYPE_VALUES,
            },

            value: Number,

            applicableOn: [
              {
                type: String,
                enum: APPLICABLE_ON_VALUES,
              },
            ],
          },
        ],
        default: [],
      },

      taxes: {
        type: [
          {
            _id: false,
            taxType: String,
            rate: Number,
          },
        ],
        default: [],
      },
    },

    // =============================
    // Audit & Control
    // =============================
    isActive: {
      type: Boolean,
      default: true,
    },

    version: {
      type: Number,
      default: 1,
    },

    configuredBy: String,
    updatedBy: String,
  },
  {
    timestamps: true,
  },
);

// =============================
// Compound Unique Index
// =============================
paymentConfigSchema.index({ entityType: 1, entityCode: 1 }, { unique: true });

export const PaymentConfig = mongoose.model(
  "PaymentConfig",
  paymentConfigSchema,
);
