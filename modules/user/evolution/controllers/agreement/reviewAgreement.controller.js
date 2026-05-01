// reviewAgreement.controller.js

import Evolution from "../../models/evolution.model.js";

export const reviewAgreement = async (req, res) => {
  try {
    const ernId = req.params.ernId;
    const { decision, remarks } = req.body;

    const record = await Evolution.findOne({ ernId: ernId });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Record not found",
      });
    }

    // =========================
    // APPROVE
    // =========================
    if (decision === "APPROVE") {
      record.agreement.agreementReview.status = "APPROVED";
    }

    // =========================
    // REJECT
    // =========================
    if (decision === "REJECT") {
      record.agreement.agreementReview.status = "REJECTED";
    }

    record.agreement.agreementReview.remark = remarks;
    record.agreement.agreementReview.reviewedBy = "ADMIN";
    record.agreement.agreementReview.reviewedAt = new Date();

    await record.save();

    return res.status(200).json({
      success: true,
      message: "Agreement review updated",
    });
  } catch (error) {
    console.error("[reviewAgreement] Error:", error);

    return res.status(500).json({
      success: false,
      message: "Review failed",
    });
  }
};
