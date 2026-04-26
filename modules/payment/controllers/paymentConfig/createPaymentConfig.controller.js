import { PaymentConfig } from "../../models/paymentConfig.model.js";

import {
  PAYMENT_METHOD_VALUES,
  PRICING_TYPE_VALUES,
  CALCULATION_TYPE_VALUES,
  APPLICABLE_ON_VALUES,
  ENTITY_TYPE_VALUES,
  ENTITY_CODE,
  BREAKDOWN_CODE_VALUES,
  BREAKDOWN_CATEGORY_VALUES,
  CHARGE_TYPE,
} from "../../../../constants/payment.constants.js";

export const createPaymentConfig = async (req, res) => {
  try {
    const { entityType, entityCode, allowedMethods, pricingType, amount } =
      req.body || {};

    // TEMP: Replace later with req.user.id
    const adminId = "SYSTEM_ADMIN";

    // ======================================================
    // Required Fields Validation
    // ======================================================
    if (!entityType || !entityCode || !pricingType) {
      return res.status(400).json({
        success: false,
        message: "Entity Type, Entity Code And Pricing Type Are Required",
      });
    }

    // ======================================================
    // Entity Validation
    // ======================================================
    if (!ENTITY_TYPE_VALUES.includes(entityType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Entity Type",
      });
    }

    const validCodes = Object.values(ENTITY_CODE[entityType] || {});
    if (!validCodes.includes(entityCode)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Entity Code For Given Entity Type",
      });
    }

    // ======================================================
    // Allowed Methods Validation
    // ======================================================
    if (
      !Array.isArray(allowedMethods) ||
      allowedMethods.length === 0 ||
      !allowedMethods.every((m) => PAYMENT_METHOD_VALUES.includes(m))
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid Or Empty Allowed Methods",
      });
    }

    // ======================================================
    // Pricing Type Validation
    // ======================================================
    if (!PRICING_TYPE_VALUES.includes(pricingType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Pricing Type",
      });
    }

    // ======================================================
    // Amount Validation
    // ======================================================
    if (!amount || typeof amount !== "object") {
      return res.status(400).json({
        success: false,
        message: "Amount Object Is Required",
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
          message: "Valid Base Amount Is Required For Static Pricing",
        });
      }
    }

    // ======================================================
    // Breakdown Validation
    // ======================================================
    if (Array.isArray(amount.breakdown) && amount.breakdown.length > 0) {
      let sum = 0;

      for (const item of amount.breakdown) {
        if (!BREAKDOWN_CODE_VALUES.includes(item.code)) {
          return res.status(400).json({
            success: false,
            message: "Invalid Breakdown Code",
          });
        }

        if (!BREAKDOWN_CATEGORY_VALUES.includes(item.category)) {
          return res.status(400).json({
            success: false,
            message: "Invalid Breakdown Category",
          });
        }

        if (typeof item.amount !== "number" || item.amount < 0) {
          return res.status(400).json({
            success: false,
            message: "Invalid Breakdown Amount",
          });
        }

        sum += item.amount;
      }

      if (amount.baseAmount !== undefined && sum !== amount.baseAmount) {
        return res.status(400).json({
          success: false,
          message: "Breakdown Total Must Match Base Amount",
        });
      }
    }

    // ======================================================
    // Charges Validation
    // ======================================================
    if (Array.isArray(amount.charges) && amount.charges.length > 0) {
      for (const charge of amount.charges) {
        if (
          charge.chargeType &&
          !Object.values(CHARGE_TYPE).includes(charge.chargeType)
        ) {
          return res.status(400).json({
            success: false,
            message: "Invalid Charge Type",
          });
        }

        if (
          !charge.calculationType ||
          !CALCULATION_TYPE_VALUES.includes(charge.calculationType)
        ) {
          return res.status(400).json({
            success: false,
            message: "Invalid Charge Calculation Type",
          });
        }

        if (typeof charge.value !== "number") {
          return res.status(400).json({
            success: false,
            message: "Invalid Charge Value",
          });
        }

        if (
          charge.applicableOn &&
          (!Array.isArray(charge.applicableOn) ||
            !charge.applicableOn.every((a) => APPLICABLE_ON_VALUES.includes(a)))
        ) {
          return res.status(400).json({
            success: false,
            message: "Invalid Applicable On Values",
          });
        }
      }
    }

    // ======================================================
    // Taxes Validation
    // ======================================================
    if (Array.isArray(amount.taxes) && amount.taxes.length > 0) {
      for (const tax of amount.taxes) {
        if (typeof tax.rate !== "number") {
          return res.status(400).json({
            success: false,
            message: "Invalid Tax Rate",
          });
        }
      }
    }

    // ======================================================
    // Create Payment Config
    // ======================================================
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
      message: "Payment Config Created Successfully",
      data: paymentConfig,
    });
  } catch (error) {
    console.error("[createPaymentConfig] Error:", {
      message: error.message,
      stack: error.stack,
      body: req.body,
      time: new Date().toISOString(),
    });

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Config Already Exists For This Entity Type And Entity Code",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
