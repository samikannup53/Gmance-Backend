import { PaymentConfig } from "../../models/paymentConfig.model.js";

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
