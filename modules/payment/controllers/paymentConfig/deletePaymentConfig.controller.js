import mongoose from "mongoose";
import { PaymentConfig } from "../../models/paymentConfig.model.js";

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
