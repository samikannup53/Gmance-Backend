import mongoose from "mongoose";
import { PaymentConfig } from "../../models/paymentConfig.model.js";

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
