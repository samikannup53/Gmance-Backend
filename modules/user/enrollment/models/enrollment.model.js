import mongoose from "mongoose";
import { USER_TYPES } from "../../../../config/constants.config.js";
import { USER_ENROLLMENT_TYPES } from "../../../../config/constants.config.js";
import { USER_ENROLLMENT_FLOW_MODES } from "../../../../config/constants.config.js";
import { STEPS } from "../../../../config/constants.config.js";

const enrollmentSchema = new mongoose.Schema(
  // Schema Definition
  {
    // Identifiers
    publicId: { type: String, required: true, unique: true },
    trnId: { type: String, unique: true },
    ernId: { type: String, unique: true, sparse: true },

    // Basic Info
    userType: { type: String, enum: Object.values(USER_TYPES), required: true },
    enrollmentType: {
      type: String,
      enum: Object.values(USER_ENROLLMENT_TYPES),
      required: true,
    },
    enrollmentSource: { type: String, enum: ["PUBLIC", "ADMIN"] },
    enrollmentProgress: { type: String, default: "DRAFT" },
    enrollmentStatus: {
      type: String,
      enum: [
        "AWAITING_SUBMISSION",
        "UNDER_REVIEW",
        "APPROVED",
        "REJECTED",
        "ON_HOLD",
      ],
      default: "AWAITING_SUBMISSION",
    },

    // Flow Control
    enrollmentFlow: {
      mode: {
        type: String,
        enum: Object.values(USER_ENROLLMENT_FLOW_MODES),
        default: "NEW",
      },
      currentStep: {
        type: String,
        enum: Object.values(STEPS),
        default: STEPS.AUTH,
      },
      stepsCompleted: { type: [String], default: [] },
    },

    // AUTH SECTION
    auth: {
      email: { type: String, trim: true, lowercase: true },
      mobile: {
        countryCode: { type: String, default: "+91" },
        number: { type: String, trim: true },
      },

      emailVerified: { type: Boolean, default: false },
      mobileVerified: { type: Boolean, default: false },

      onboardingConsent: {
        isGranted: { type: Boolean, default: false },
        grantedAt: Date,
        obtainedVia: { type: String, enum: ["OTP", "CHECKBOX"] },
        channel: { type: String, enum: ["MOBILE", "EMAIL", "WEB"] },
        referenceId: String,
        meta: {
          ip: String,
          userAgent: String,
        },
      },
    },

    // KYC SECTION
    kyc: {
      source: { type: String, enum: ["UIDAI_XML", "MANUAL", "API"] },
      uidHash: { type: String, trim: true, select: false, index: true },
      uidEncrypted: { type: String, trim: true, select: false },
      uidLast4: { type: String, trim: true },

      identity: {
        fullName: String,
        dob: Date,
        gender: { type: String, enum: ["MALE", "FEMALE", "OTHER"] },
        address: String,
        photoRef: String,
        kycReferenceId: String,
      },

      documents: {
        uidXml: {
          ref: String,
        },
        uidHardCopy: {
          ref: String,
          isConfirmed: { type: Boolean, default: false },
        },
      },

      verification: {
        status: {
          type: String,
          enum: ["PENDING", "VERIFIED", "REJECTED"],
          default: "PENDING",
        },
        verifiedAt: Date,
        verifiedBy: { type: String, default: "SYSTEM" },
        source: { type: String, enum: ["UIDAI_XML", "ADMIN", "SYSTEM"] },
        remarks: { type: String, trim: true },
      },
    },

    // PAN SECTION
    pan: {
      panEncrypted: { type: String, select: false },
      last4: String,
      name: { type: String, trim: true },

      documents: {
        xml: {
          ref: String,
        },
        hardCopy: {
          ref: String,
          isConfirmed: { type: Boolean, default: false },
        },
      },

      verification: {
        status: {
          type: String,
          enum: ["PENDING", "VERIFIED", "REJECTED"],
          default: "PENDING",
        },
        verifiedAt: Date,
        verifiedBy: String,
        source: { type: String, enum: ["NSDL", "ADMIN", "SYSTEM"] },
        remarks: { type: String, trim: true },
      },
    },

    // BANK SECTION
    bank: {
      accountEncrypted: { type: String, select: false },
      accountLast4: String,

      accountType: {
        type: String,
        enum: ["SAVINGS_ACCOUNT", "CURRENT_ACCOUNT"],
      },
      accountHolderName: { type: String, trim: true },
      ifscCode: { type: String, trim: true, uppercase: true },
      bankName: { type: String, trim: true, uppercase: true },

      documents: {
        passbookOrCheque: {
          ref: String,
          isConfirmed: { type: Boolean, default: false },
        },
      },

      verification: {
        status: {
          type: String,
          enum: ["PENDING", "VERIFIED", "REJECTED"],
          default: "PENDING",
        },
        verifiedAt: Date,
        verifiedBy: String,
        source: { type: String, enum: ["BANK", "ADMIN", "SYSTEM"] },
        remarks: { type: String, trim: true },
      },
    },

    // PERSONAL SECTION
    personal: {
      maritalStatus: {
        type: String,
        enum: ["SINGLE", "MARRIED", "DIVORCED", "WIDOWED"],
      },
      relativeType: {
        type: String,
        enum: ["FATHER", "MOTHER", "SPOUSE", "GUARDIAN"],
      },
      relativeName: { type: String, trim: true },
      category: {
        type: String,
        enum: ["GENERAL", "OBC", "SC", "ST", "OTHER", "NOT_SPECIFIED"],
      },
      highestQualification: {
        type: String,
        enum: [
          "SSLC",
          "HSC",
          "DIPLOMA",
          "GRADUATE",
          "POST_GRADUATE",
          "DOCTORATE",
          "OTHER",
        ],
      },
      computerKnowledge: {
        type: String,
        enum: ["NONE", "BASIC", "INTERMEDIATE", "ADVANCED"],
      },

      documents: {
        photo: {
          ref: String,
          isConfirmed: { type: Boolean, default: false },
        },

        pvr: {
          ref: String,
          isConfirmed: { type: Boolean, default: false },
        },

        qualificationCertificate: {
          ref: String,
          isConfirmed: { type: Boolean, default: false },
        },
      },
    },

    // KIOSK SECTION (ONLY FOR ASSOCIATE)
    kiosk: {
      udyamRegNumber: { type: String, trim: true, uppercase: true },
      kioskName: { type: String, trim: true },

      premiseOwnershipType: {
        type: String,
        enum: ["OWNED", "RENTED", "LEASED"],
      },
      locationType: {
        type: String,
        enum: ["RURAL", "SEMI_URBAN", "URBAN", "METRO"],
      },

      businessCategory: {
        type: String,
        enum: ["FINANCIAL", "UTILITY", "GENERAL", "OTHER"],
      },

      address: {
        flatOrDoorNo: { type: String, trim: true },
        buildingName: { type: String, trim: true },
        roadOrStreet: { type: String, trim: true },
        areaOrLocality: { type: String, trim: true },
        taluk: { type: String, trim: true },
        district: { type: String, trim: true },
        state: { type: String, trim: true },
        country: { type: String, trim: true },
        pincode: { type: String, trim: true },
      },

      geoCoordinates: {
        latitude: Number,
        longitude: Number,
      },

      documents: {
        udyamCertificate: {
          ref: String,
          isConfirmed: { type: Boolean, default: false },
        },

        kioskPhoto: {
          ref: String,
          isConfirmed: { type: Boolean, default: false },
        },
      },
    },

    // Enrollment Process Control
    process: {
      submissionConsent: {
        isConfirmed: { type: Boolean, default: false },
        method: {
          type: String,
          enum: ["OTP", "CHECKBOX", "ESIGN"],
        },
        referenceId: String,
        confirmedBy: String,
        confirmedAt: Date,
      },

      payment: {
        isRequired: { type: Boolean, default: false },
        status: {
          type: String,
          enum: ["PENDING", "INITIATED", "SUCCESS", "FAILED"],
        },
        referenceId: String,
        paidAt: Date,
      },
    },

    // Expiration and Validity
    expiresAt: { type: Date, default: null },

    //  META INFORMATION
    meta: {
      createdBy: {
        id: String,
        role: { type: String, enum: ["USER", "ADMIN"] },
      },

      updatedBy: {
        id: String,
        role: { type: String, enum: ["USER", "ADMIN"] },
      },

      requestInfo: {
        ip: { type: String, trim: true },
        coordinates: {
          lat: { type: Number, trim: true },
          lng: { type: Number, trim: true },
        },
      },
    },
  },

  // Schema Options
  {
    timestamps: true,
    strict: true,
  },
);

// =========================
// INDEXES
// =========================

enrollmentSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("UserEnrollment", enrollmentSchema);
