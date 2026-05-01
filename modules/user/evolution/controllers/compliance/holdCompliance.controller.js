// holdCompliance.controller.js

import Evolution from "../../models/evolution.model.js";

export const holdCompliance = async (req, res) => {
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
    // HOLD
    // =========================
    record.compliance.finalStatus = "HOLD";
    record.status = "HOLD";

    record.hold.isOnHold = true;
    record.hold.reason = remarks;
    record.hold.raisedBy = "ADMIN";
    record.hold.raisedAt = new Date();

    record.compliance.auditLogs.push({
      action: "HOLD",
      remark: remarks,
      performedBy: "ADMIN",
      performedAt: new Date(),
    });

    await record.save();

    return res.status(200).json({
      success: true,
      message: "Compliance put on hold",
    });
  } catch (error) {
    console.error("[holdCompliance] Error:", {
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
