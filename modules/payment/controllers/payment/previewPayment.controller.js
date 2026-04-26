// controllers/payment/previewPayment.controller.js

import { PaymentConfig } from "../../models/paymentConfig.model.js";
import { PAYMENT_VALIDATORS } from "../../validators/paymentValidatorRegistry.js";

export const previewPayment = async (req, res) => {
  try {
    const { entityType, entityCode, entityId, method } = req.query;

    if (!entityType || !entityCode || !entityId || !method) {
      const error = new Error("Missing required query parameters");
      error.isOperational = true;
      throw error;
    }

    // =========================
    // ENTITY VALIDATION
    // =========================
    const validator = PAYMENT_VALIDATORS[entityType];

    if (!validator) {
      const error = new Error("Unsupported payment entity type");
      error.isOperational = true;
      throw error;
    }

    await validator({ entityId, entityCode });

    // =========================
    // FETCH CONFIG
    // =========================
    const paymentConfig = await PaymentConfig.findOne({
      entityType,
      entityCode,
      isActive: true,
    });

    if (!paymentConfig) {
      const error = new Error("Payment configuration not available");
      error.isOperational = true;
      throw error;
    }

    if (!paymentConfig.allowedMethods.includes(method)) {
      const error = new Error("Payment method not allowed");
      error.isOperational = true;
      throw error;
    }

    // =========================
    // CALCULATE AMOUNT
    // =========================
    const {
      baseAmount,
      breakdown,
      charges = [],
      taxes = [],
    } = paymentConfig.amount;

    let total = Math.round(baseAmount * 100);

    const appliedCharges = [];
    const appliedTaxes = [];

    for (const charge of charges) {
      if (charge.applicableOn && !charge.applicableOn.includes(method))
        continue;

      const value =
        charge.calculationType === "FLAT"
          ? charge.value * 100
          : (total * charge.value) / 100;

      const amt = Math.round(value);
      total += amt;

      appliedCharges.push({
        chargeType: charge.chargeType,
        amount: amt / 100,
      });
    }

    for (const tax of taxes) {
      const amt = Math.round((total * tax.rate) / 100);
      total += amt;

      appliedTaxes.push({
        taxType: tax.taxType,
        rate: tax.rate,
        amount: amt / 100,
      });
    }

    // =========================
    // RESPONSE
    // =========================
    return res.status(200).json({
      success: true,
      data: {
        entityType,
        entityCode,
        entityId,
        currency: "INR",
        baseAmount,
        breakdown,
        charges: appliedCharges,
        taxes: appliedTaxes,
        totalAmount: total / 100,
      },
    });
  } catch (error) {
    if (!error.isOperational) {
      console.error("[previewPayment] System Error:", {
        message: error.message,
        stack: error.stack,
        query: req.query,
        time: new Date().toISOString(),
      });
    }

    if (error.isOperational) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
