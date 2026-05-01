// approveCompliance.controller.js

import Evolution from "../../models/evolution.model.js";

export const approveCompliance = async (req, res) => {
  try {
    const ernId = req.params.ernId;

    const record = await Evolution.findOne({ ernId: ernId });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Record not found",
      });
    }

    const section = record.compliance.sections;

    if (
      section.kyc.status !== "IGO" ||
      section.personal.status !== "IGO" ||
      section.pan.status !== "IGO" ||
      section.bank.status !== "IGO" ||
      section.kiosk.status !== "IGO"
    ) {
      return res.status(400).json({
        success: false,
        message: "All sections must be IGO",
      });
    }

    // =========================
    // APPROVE
    // =========================
    record.compliance.finalStatus = "APPROVED";
    record.currentStage = "AGREEMENT";

    record.compliance.auditLogs.push({
      action: "APPROVE",
      performedBy: "ADMIN",
      performedAt: new Date(),
    });

    await record.save();

    return res.status(200).json({
      success: true,
      message: "Compliance approved",
    });
  } catch (error) {
    console.error("[approveCompliance] Error:", {
      message: error.message,
      stack: error.stack,
      params: req.params,
      time: new Date().toISOString(),
    });

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
