import mongoose from "mongoose";
import { PaymentConfig } from "../../models/paymentConfig.model.js";

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
