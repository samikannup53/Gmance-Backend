// generateAgreement.controller.js

import Evolution from "../../models/evolution.model.js";
import Enrollment from "../../../enrollment/models/enrollment.model.js";

export const generateAgreement = async (req, res) => {
  try {
    const ernId = req.params.ernId;

    const record = await Evolution.findOne({ ernId: ernId });
    const enrollment = await Enrollment.findOne({ ernId: ernId });

    if (!record || !enrollment) {
      return res.status(404).json({
        success: false,
        message: "Record not found",
      });
    }

    if (record.agreement.stampUpload.status !== "UPLOADED") {
      return res.status(400).json({
        success: false,
        message: "Upload stamp first",
      });
    }

    // =========================
    // TEMPLATE SELECTION
    // =========================
    let templateId = "";

    if (
      enrollment.userType === "ASSOCIATE" &&
      enrollment.enrollmentType === "NEW_REGISTRATION"
    ) {
      templateId = "ASSOCIATE_NEW";
    }

    if (
      enrollment.userType === "ASSOCIATE" &&
      enrollment.enrollmentType === "AMENDMENT"
    ) {
      templateId = "ASSOCIATE_AMEND";
    }

    if (enrollment.userType === "EMPLOYEE") {
      templateId = "EMPLOYEE_STANDARD";
    }

    // =========================
    // GENERATE
    // =========================
    record.agreement.agreementGeneration.status = "GENERATED";

    record.agreement.agreementGeneration.templateId = templateId;
    record.agreement.agreementGeneration.documentUrl = "generated-url";
    record.agreement.agreementGeneration.documentId = "doc-id";
    record.agreement.agreementGeneration.generatedAt = new Date();

    await record.save();

    return res.status(200).json({
      success: true,
      message: "Agreement generated",
    });
  } catch (error) {
    console.error("[generateAgreement] Error:", error);

    return res.status(500).json({
      success: false,
      message: "Agreement generation failed",
    });
  }
};
