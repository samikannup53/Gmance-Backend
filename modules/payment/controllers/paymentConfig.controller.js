import { PaymentConfig } from "../models/paymentConfig.model.js";

import {
  PAYMENT_METHOD_VALUES,
  PRICING_TYPE_VALUES,
  CALCULATION_TYPE_VALUES,
  APPLICABLE_ON_VALUES,
} from "../../../constants/payment.constants.js";

export const createPaymentConfig = async (req, res) => {
  try {
    const { entityType, entityCode, allowedMethods, pricingType, amount } =
      req.body || {};

    // TEMP: Replace later with req.user.id
    const adminId = "SYSTEM_ADMIN";

    // =============================
    // Required Fields Validation
    // =============================
    if (!entityType || !entityCode || !pricingType) {
      return res.status(400).json({
        success: false,
        message: "entityType, entityCode, pricingType are required",
      });
    }

    // =============================
    // allowedMethods Validation
    // =============================
    if (
      !Array.isArray(allowedMethods) ||
      allowedMethods.length === 0 ||
      !allowedMethods.every((m) => PAYMENT_METHOD_VALUES.includes(m))
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid or empty allowedMethods",
      });
    }

    // =============================
    // pricingType Validation
    // =============================
    if (!PRICING_TYPE_VALUES.includes(pricingType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ricingType",
      });
    }

    // =============================
    // amount Validation
    // =============================
    if (!amount || typeof amount !== "object") {
      return res.status(400).json({
        success: false,
        message: "Amount object is required",
      });
    }

    // STATIC Pricing Rules
    if (pricingType === "STATIC") {
      if (
        amount.baseAmount === undefined ||
        typeof amount.baseAmount !== "number" ||
        amount.baseAmount < 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Valid baseAmount is required for STATIC pricing",
        });
      }
    }

    // =============================
    // Charges Validation
    // =============================
    if (Array.isArray(amount.charges) && amount.charges.length > 0) {
      for (const charge of amount.charges) {
        if (
          !charge.calculationType ||
          !CALCULATION_TYPE_VALUES.includes(charge.calculationType)
        ) {
          return res.status(400).json({
            success: false,
            message: "Invalid charge calculationType",
          });
        }

        if (typeof charge.value !== "number") {
          return res.status(400).json({
            success: false,
            message: "Invalid charge value",
          });
        }

        if (
          charge.applicableOn &&
          (!Array.isArray(charge.applicableOn) ||
            !charge.applicableOn.every((a) => APPLICABLE_ON_VALUES.includes(a)))
        ) {
          return res.status(400).json({
            success: false,
            message: "Invalid applicableOn values",
          });
        }
      }
    }

    // =============================
    // Taxes Validation
    // =============================
    if (Array.isArray(amount.taxes) && amount.taxes.length > 0) {
      for (const tax of amount.taxes) {
        if (typeof tax.rate !== "number") {
          return res.status(400).json({
            success: false,
            message: "Invalid tax rate",
          });
        }
      }
    }

    // =============================
    // Create Payment Config
    // =============================
    const paymentConfig = await PaymentConfig.create({
      entityType,
      entityCode,
      allowedMethods,
      pricingType,
      amount,
      configuredBy: adminId,
      updatedBy: adminId,
    });

    return res.status(201).json({
      success: true,
      message: "Payment config created successfully",
      data: paymentConfig,
    });
  } catch (error) {
    console.error("[createPaymentConfig] Error:", {
      message: error.message,
      stack: error.stack,
      body: req.body,
      time: new Date().toISOString(),
    });

    // Duplicate Key Error (unique index)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Config already exists for this entityType + entityCode",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
