// rejectCompliance.controller.js

import Evolution from "../../models/evolution.model.js";

export const rejectCompliance = async (req, res) => {
  try {
    const ernId = req.params.ernId;
    const remarks = req.body.remarks;

    const record = await Evolution.findOne({ ernId: ernId });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Record not found",
      });
    }

    // =========================
    // REJECT
    // =========================
    record.compliance.finalStatus = "REJECTED";
    record.status = "REJECTED";

    record.compliance.auditLogs.push({
      action: "REJECT",
      remark: remarks,
      performedBy: "ADMIN",
      performedAt: new Date(),
    });

    await record.save();

    return res.status(200).json({
      success: true,
      message: "Compliance rejected",
    });
  } catch (error) {
    console.error("[rejectCompliance] Error:", {
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
