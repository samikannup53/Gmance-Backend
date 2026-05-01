// uploadStampData.controller.js

import Evolution from "../../models/evolution.model.js";

export const uploadStampData = async (req, res) => {
  try {
    const ernId = req.params.ernId;

    const {
      documentUrl,
      documentId,
      certificateNumber,
      denomination,
      issueDate,
      state,
      purchasedBy,
    } = req.body;

    const record = await Evolution.findOne({ ernId: ernId });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Record not found",
      });
    }

    // =========================
    // STORE STAMP DATA
    // =========================
    record.agreement.stampUpload.status = "UPLOADED";

    record.agreement.stampUpload.documentUrl = documentUrl;
    record.agreement.stampUpload.documentId = documentId;

    record.agreement.stampUpload.certificateNumber = certificateNumber;
    record.agreement.stampUpload.denomination = denomination;
    record.agreement.stampUpload.issueDate = issueDate;
    record.agreement.stampUpload.state = state;
    record.agreement.stampUpload.purchasedBy = purchasedBy;

    record.agreement.stampUpload.uploadedBy = "ADMIN";
    record.agreement.stampUpload.uploadedAt = new Date();

    await record.save();

    return res.status(200).json({
      success: true,
      message: "Stamp data stored",
    });
  } catch (error) {
    console.error("[uploadStampData] Error:", error);

    return res.status(500).json({
      success: false,
      message: "Stamp upload failed",
    });
  }
};
