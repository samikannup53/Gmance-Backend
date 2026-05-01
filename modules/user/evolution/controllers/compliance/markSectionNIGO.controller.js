// markNIGO.controller.js

import Evolution from "../../models/evolution.model.js";

export const markNIGO = async (req, res) => {
  try {
    const ernId = req.params.ernId;
    const section = req.body.section;
    const remarks = req.body.remarks;

    if (!remarks) {
      return res.status(400).json({
        success: false,
        message: "Remarks required",
      });
    }

    const record = await Evolution.findOne({ ernId: ernId });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Record not found",
      });
    }

    if (record.currentStage !== "COMPLIANCE") {
      return res.status(400).json({
        success: false,
        message: "Invalid stage",
      });
    }

    if (!record.compliance.sections[section]) {
      return res.status(400).json({
        success: false,
        message: "Invalid section",
      });
    }

    // =========================
    // NIGO
    // =========================
    record.compliance.sections[section].status = "NIGO";
    record.compliance.sections[section].remark = remarks;
    record.compliance.sections[section].reviewedBy = "ADMIN";
    record.compliance.sections[section].reviewedAt = new Date();

    record.compliance.auditLogs.push({
      action: "NIGO",
      section: section,
      remark: remarks,
      performedBy: "ADMIN",
      performedAt: new Date(),
    });

    await record.save();

    return res.status(200).json({
      success: true,
      message: `${section} marked as NIGO`,
    });
  } catch (error) {
    console.error("[markNIGO] Error:", {
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
