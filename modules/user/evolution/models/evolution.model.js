import mongoose from "mongoose";

import {
  USER_EVOLUTION_STAGE_VALUES,
  USER_EVOLUTION_STATUS_VALUES,
  USER_COMPLIANCE_SECTION_STATUS_VALUES,
  USER_COMPLIANCE_FINAL_STATUS_VALUES,
  USER_AGREEMENT_STATUS_VALUES,
  USER_AGREEMENT_REVIEW_STATUS_VALUES,
  USER_ESIGN_STATUS_VALUES,
  USER_ACTIVATION_STATUS_VALUES,
} from "../../../../config/constants/evolution.constants.js";

const evolutionSchema = new mongoose.Schema(
  {
    /* ---------------- IDENTIFIERS ---------------- */
    ernId: { type: String, required: true },
    trnId: String,

    userType: String,
    enrollmentType: String,

    /* ---------------- MASTER CONTROL ---------------- */
    currentStage: {
      type: String,
      enum: USER_EVOLUTION_STAGE_VALUES,
      default: "COMPLIANCE",
    },

    status: {
      type: String,
      enum: USER_EVOLUTION_STATUS_VALUES,
      default: "UNDER_EVOLUTION",
    },

    currentSection: String,

    /* ---------------- COMPLIANCE ---------------- */
    compliance: {
      finalStatus: {
        type: String,
        enum: USER_COMPLIANCE_FINAL_STATUS_VALUES,
        default: "PENDING",
      },

      sections: {
        kyc: {
          status: {
            type: String,
            enum: USER_COMPLIANCE_SECTION_STATUS_VALUES,
            default: "PENDING",
          },
          remark: String,
          reviewedBy: String,
          reviewedAt: Date,
        },

        personal: {
          status: {
            type: String,
            enum: USER_COMPLIANCE_SECTION_STATUS_VALUES,
            default: "PENDING",
          },
          remark: String,
          reviewedBy: String,
          reviewedAt: Date,
        },

        pan: {
          status: {
            type: String,
            enum: USER_COMPLIANCE_SECTION_STATUS_VALUES,
            default: "PENDING",
          },
          remark: String,
          reviewedBy: String,
          reviewedAt: Date,
        },

        bank: {
          status: {
            type: String,
            enum: USER_COMPLIANCE_SECTION_STATUS_VALUES,
            default: "PENDING",
          },
          remark: String,
          reviewedBy: String,
          reviewedAt: Date,
        },

        kiosk: {
          status: {
            type: String,
            enum: USER_COMPLIANCE_SECTION_STATUS_VALUES,
            default: "PENDING",
          },
          remark: String,
          reviewedBy: String,
          reviewedAt: Date,
        },
      },

      consolidatedRemark: String,
      reviewedBy: String,
      reviewedAt: Date,

      auditLogs: [
        {
          action: String,
          section: String,
          remark: String,
          performedBy: String,
          performedAt: Date,
        },
      ],
    },

    /* ---------------- AGREEMENT ---------------- */
    agreement: {
      isRequired: { type: Boolean, default: true },

      status: {
        type: String,
        enum: USER_AGREEMENT_STATUS_VALUES,
        default: "PENDING",
      },

      stamp: {
        status: String,
        documentUrl: String,
        documentId: String,
        certificateNumber: String,
        denomination: Number,
        issueDate: Date,
        state: String,
        purchasedBy: String,
        uploadedBy: String,
        uploadedAt: Date,
      },

      document: {
        status: String,
        templateId: String,
        templateVersion: Number,
        documentUrl: String,
        documentId: String,
        version: Number,
        generatedAt: Date,
      },

      review: {
        status: {
          type: String,
          enum: USER_AGREEMENT_REVIEW_STATUS_VALUES,
          default: "PENDING",
        },
        remark: String,
        reviewedBy: String,
        reviewedAt: Date,
      },

      esign: {
        status: {
          type: String,
          enum: USER_ESIGN_STATUS_VALUES,
          default: "PENDING",
        },
        provider: String,
        requestId: String,
        providerRefId: String,
        signedUrl: String,
        initiatedAt: Date,
        completedAt: Date,
      },

      lastError: {
        step: String,
        code: String,
        message: String,
      },

      auditLogs: [
        {
          action: String,
          step: String,
          remark: String,
          performedBy: String,
          performedAt: Date,
        },
      ],
    },

    /* ---------------- ACTIVATION ---------------- */
    activation: {
      status: {
        type: String,
        enum: USER_ACTIVATION_STATUS_VALUES,
        default: "PENDING",
      },

      paymentVerified: { type: Boolean, default: false },
      agreementVerified: { type: Boolean, default: false },

      activatedOn: Date,
      activatedBy: String,

      userId: String,
    },

    /* ---------------- HOLD ---------------- */
    hold: {
      isOnHold: { type: Boolean, default: false },
      reason: String,
      raisedBy: String,
      raisedAt: Date,
      releasedBy: String,
      releasedAt: Date,
    },
  },
  {
    timestamps: true,
    strict: true,
  },
);

/* ---------------- INDEX ---------------- */
evolutionSchema.index({ ernId: 1 });
evolutionSchema.index({ currentStage: 1, status: 1 });

export default mongoose.model("UserEvolution", evolutionSchema);
