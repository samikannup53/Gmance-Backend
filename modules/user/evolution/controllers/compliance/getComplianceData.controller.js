// getComplianceData.controller.js

import Evolution from "../../models/evolution.model.js";
import Enrollment from "../../../enrollment/models/enrollment.model.js";

export const getComplianceData = async (req, res) => {
  try {
    const ernId = req.params.ernId;

    const enrollment = await Enrollment.findOne({ ernId: ernId });
    const evolutionWorkflow = await Evolution.findOne({ ernId: ernId });

    if (!enrollment || !evolutionWorkflow) {
      return res.status(404).json({
        success: false,
        message: "Record not found",
      });
    }

    if (evolutionWorkflow.currentStage !== "COMPLIANCE") {
      return res.status(400).json({
        success: false,
        message: "Invalid stage",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        enrollment: enrollment,
        evolutionWorkflow: evolutionWorkflow,
      },
    });
  } catch (error) {
    console.error("[getComplianceData] Error:", {
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
