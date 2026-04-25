import mongoose from "mongoose";
import { PaymentConfig } from "../models/paymentConfig.model.js";

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
} from "../../../constants/payment.constants.js";

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

export const getAllPaymentConfigs = async (req, res) => {
  try {
    const configs = await PaymentConfig.find().sort({ createdAt: -1 }).lean();

    return res.status(200).json({
      success: true,
      message: "Payment Configs Fetched Successfully",
      totalPaymentConfigs: configs.length,
      data: configs,
    });
  } catch (error) {
    console.error("[getAllPaymentConfigs] Error:", {
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

export const getPaymentConfigById = async (req, res) => {
  try {
    const { id } = req.params;

    // =============================
    // Basic Validation
    // =============================
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Id Is Required",
      });
    }

    // =============================
    // ObjectId Validation
    // =============================
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Config ID",
      });
    }

    // =============================
    // Fetch Config
    // =============================
    const config = await PaymentConfig.findById(id).lean();

    if (!config) {
      return res.status(404).json({
        success: false,
        message: "Payment Config Not Found",
      });
    }

    // =============================
    // Success Response
    // =============================
    return res.status(200).json({
      success: true,
      message: "Payment Config Fetched Successfully",
      data: config,
    });
  } catch (error) {
    console.error("[getPaymentConfigById] Error:", {
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

export const togglePaymentConfigStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const adminId = "SYSTEM_ADMIN";

    // =============================
    // Validation
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

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Is Active Must Be Boolean",
      });
    }

    const config = await PaymentConfig.findById(id);

    if (!config) {
      return res.status(404).json({
        success: false,
        message: "Payment Config Not Found",
      });
    }

    // =============================
    // No Change Check (IMPORTANT)
    // =============================
    if (config.isActive === isActive) {
      return res.status(400).json({
        success: false,
        message: `Payment Config Is Already ${
          isActive ? "Active" : "Inactive"
        }`,
      });
    }

    // =============================
    // Update Status
    // =============================
    config.isActive = isActive;
    config.updatedBy = adminId;
    config.version += 1;

    await config.save();

    return res.status(200).json({
      success: true,
      message: `Payment Config ${
        isActive ? "Activated" : "Deactivated"
      } Successfully`,
      data: config.toObject(),
    });
  } catch (error) {
    console.error("[togglePaymentConfigStatus] Error:", {
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

export const deletePaymentConfig = async (req, res) => {
  try {
    const { id } = req.params;

    // =============================
    // Validation
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

    if (config.isActive) {
      return res.status(400).json({
        success: false,
        message: "Deactivate Config Before Deleting",
      });
    }

    // =============================
    // Hard Delete
    // =============================
    await PaymentConfig.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Payment Config Deleted Permanently",
    });
  } catch (error) {
    console.error("[deletePaymentConfig] Error:", {
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
