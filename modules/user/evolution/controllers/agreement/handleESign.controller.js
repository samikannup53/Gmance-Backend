// handleESign.controller.js

import Evolution from "../../models/evolution.model.js";

export const handleESign = async (req, res) => {
  try {
    const ernId = req.params.ernId;
    const { action } = req.body;

    const record = await Evolution.findOne({ ernId: ernId });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Record not found",
      });
    }

    // =========================
    // INITIATE
    // =========================
    if (action === "INITIATE") {
      record.agreement.eSign.status = "INITIATED";
      record.agreement.eSign.requestId = "legality-request-id";
      record.agreement.eSign.initiatedAt = new Date();
    }

    // =========================
    // COMPLETE
    // =========================
    if (action === "COMPLETE") {
      record.agreement.eSign.status = "SIGNED";
      record.agreement.eSign.signedUrl = "signed-url";
      record.agreement.eSign.completedAt = new Date();

      record.currentStage = "ACTIVATION";
    }

    await record.save();

    return res.status(200).json({
      success: true,
      message: `eSign ${action.toLowerCase()} successful`,
    });
  } catch (error) {
    console.error("[handleESign] Error:", error);

    return res.status(500).json({
      success: false,
      message: "eSign handling failed",
    });
  }
};
