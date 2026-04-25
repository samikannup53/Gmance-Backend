import mongoose from "mongoose";

const paymentConfigSchema = new mongoose.Schema(
  {
    entityType: {
      type: String,
      required: true,
      unique: true, // one config per entity
    },

    pricing: {
      type: {
        type: String,
        enum: ["STATIC", "DYNAMIC"],
        required: true,
      },

      baseAmount: Number, // used if STATIC
    },

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
          rate: { type: Number, required: true, min: 0 },
        },
      ],
      default: [],
    },

    currency: {
      type: String,
      default: "INR",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    version: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  },
);

export const PaymentConfig = mongoose.model(
  "PaymentConfig",
  paymentConfigSchema,
);
