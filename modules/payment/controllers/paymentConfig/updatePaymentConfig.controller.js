import mongoose from "mongoose";
import { PaymentConfig } from "../../models/paymentConfig.model.js";

import {
  PAYMENT_METHOD_VALUES,
  PRICING_TYPE_VALUES,
  CALCULATION_TYPE_VALUES,
  APPLICABLE_ON_VALUES,
} from "../../../../constants/payment.constants.js";

export const updatePaymentConfig = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const adminId = "SYSTEM_ADMIN";

    // =============================
    // Basic Validation
    // =============================
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Id Is Required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Id Format",
      });
    }

    const config = await PaymentConfig.findById(id);

    if (!config) {
      return res.status(404).json({
        success: false,
        message: "Payment Config Not Found",
      });
    }

    if (!config.isActive) {
      return res.status(400).json({
        success: false,
        message: "Cannot Update Inactive Payment Config",
      });
    }

    // =============================
    // Prevent Identity Change
    // =============================
    if (data.entityType || data.entityCode) {
      return res.status(400).json({
        success: false,
        message: "Entity Type And Entity Code Cannot Be Updated",
      });
    }

    // =============================
    // allowedMethods Validation
    // =============================
    if (data.allowedMethods) {
      if (
        !Array.isArray(data.allowedMethods) ||
        data.allowedMethods.length === 0 ||
        !data.allowedMethods.every((m) => PAYMENT_METHOD_VALUES.includes(m))
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid Allowed Methods",
        });
      }

      // Prevent duplicates
      if (new Set(data.allowedMethods).size !== data.allowedMethods.length) {
        return res.status(400).json({
          success: false,
          message: "Duplicate Payment Methods Not Allowed",
        });
      }

      config.allowedMethods = data.allowedMethods;
    }

    // =============================
    // pricingType Validation
    // =============================
    if (data.pricingType) {
      if (!PRICING_TYPE_VALUES.includes(data.pricingType)) {
        return res.status(400).json({
          success: false,
          message: "Invalid Pricing Type",
        });
      }

      config.pricingType = data.pricingType;
    }

    // =============================
    // Amount Validation (STRICT)
    // =============================
    if (data.amount) {
      const { currency, baseAmount, breakdown, charges, taxes } = data.amount;

      // Required structure
      if (
        typeof currency !== "string" ||
        typeof baseAmount !== "number" ||
        baseAmount < 0 ||
        !Array.isArray(breakdown) ||
        !Array.isArray(charges) ||
        !Array.isArray(taxes)
      ) {
        return res.status(400).json({
          success: false,
          message: "Complete Amount Object Is Required",
        });
      }

      // Breakdown validation
      if (breakdown.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Breakdown Cannot Be Empty",
        });
      }

      for (const item of breakdown) {
        if (
          typeof item.code !== "string" ||
          typeof item.category !== "string" ||
          typeof item.amount !== "number" ||
          item.amount < 0
        ) {
          return res.status(400).json({
            success: false,
            message: "Invalid Breakdown Configuration",
          });
        }
      }

      // BaseAmount vs Breakdown check
      const totalBreakdown = breakdown.reduce(
        (sum, item) => sum + item.amount,
        0,
      );

      if (totalBreakdown !== baseAmount) {
        return res.status(400).json({
          success: false,
          message: "Base Amount Must Match Breakdown Total",
        });
      }

      // Charges validation
      for (const charge of charges) {
        if (
          !CALCULATION_TYPE_VALUES.includes(charge.calculationType) ||
          typeof charge.value !== "number"
        ) {
          return res.status(400).json({
            success: false,
            message: "Invalid Charges Configuration",
          });
        }

        if (
          charge.applicableOn &&
          (!Array.isArray(charge.applicableOn) ||
            !charge.applicableOn.every((a) => APPLICABLE_ON_VALUES.includes(a)))
        ) {
          return res.status(400).json({
            success: false,
            message: "Invalid ApplicableOn Values",
          });
        }
      }

      // Taxes validation
      for (const tax of taxes) {
        if (
          typeof tax.taxType !== "string" ||
          typeof tax.rate !== "number" ||
          tax.rate < 0
        ) {
          return res.status(400).json({
            success: false,
            message: "Invalid Taxes Configuration",
          });
        }
      }

      // Replace full amount
      config.amount = data.amount;
    }

    // =============================
    // isActive
    // =============================
    if (typeof data.isActive === "boolean") {
      config.isActive = data.isActive;
    }

    // =============================
    // Audit
    // =============================
    config.updatedBy = adminId;
    config.version += 1;

    await config.save();

    return res.status(200).json({
      success: true,
      message: "Payment Config Updated Successfully",
      data: config.toObject(),
    });
  } catch (error) {
    console.error("[updatePaymentConfig] Error:", {
      message: error.message,
      stack: error.stack,
      body: req.body,
      time: new Date().toISOString(),
    });

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
