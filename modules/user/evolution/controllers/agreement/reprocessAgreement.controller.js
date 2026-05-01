// reprocessAgreement.controller.js

import Evolution from "../../models/evolution.model.js";

export const reprocessAgreement = async (req, res) => {
  try {
    const ernId = req.params.ernId;

    const record = await Evolution.findOne({ ernId: ernId });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Record not found",
      });
    }

    // =========================
    // RESET AGREEMENT
    // =========================
    record.agreement.agreementGeneration.status = "PENDING";
    record.agreement.agreementReview.status = "PENDING";
    record.agreement.eSign.status = "PENDING";

    record.agreement.agreementGeneration.documentUrl = "";
    record.agreement.agreementGeneration.documentId = "";

    await record.save();

    return res.status(200).json({
      success: true,
      message: "Agreement reprocess triggered",
    });
  } catch (error) {
    console.error("[reprocessAgreement] Error:", error);

    return res.status(500).json({
      success: false,
      message: "Reprocess failed",
    });
  }
};
