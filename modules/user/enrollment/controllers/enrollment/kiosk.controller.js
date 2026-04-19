import Enrollment from "../../models/enrollment.model.js";

import {
  STEPS,
  ENROLLMENT_PROGRESS,
  USER_ENROLLMENT_STEP_MODES,
} from "../../../../../config/constants.config.js";

import {
  validateUserEnrollmentStepAccess,
  handleUserEnrollmentStepProgression,
} from "../../services/stepFlow.service.js";

// Modes requiring full validation
const VALIDATION_MODES = [
  USER_ENROLLMENT_STEP_MODES.NEXT,
  USER_ENROLLMENT_STEP_MODES.SUBMIT,
  USER_ENROLLMENT_STEP_MODES.FINAL_SUBMIT,
];

export const completeUserEnrollmentKiosk = async (req, res) => {
  try {
    const { trnId, mode } = req.body;

    const data =
      typeof req.body.data === "string"
        ? JSON.parse(req.body.data)
        : req.body.data;

    const files = req.files || {};

    // =========================
    // BASIC VALIDATION
    // =========================

    if (!trnId || !mode) {
      return res.status(400).json({
        success: false,
        message: "trnId and mode are required",
      });
    }

    const enrollment = await Enrollment.findOne({ trnId });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: "Enrollment not found",
      });
    }

    if (enrollment.enrollmentProgress !== ENROLLMENT_PROGRESS.DRAFT) {
      return res.status(400).json({
        success: false,
        message: `Enrollment is currently in ${enrollment.enrollmentProgress
          .toLowerCase()
          .replace(/_/g, " ")
          .replace(/\b\w/g, (l) =>
            l.toUpperCase(),
          )} Stage. This action is not allowed.`,
      });
    }

    // =========================
    // INIT SAFE STRUCTURE
    // =========================

    if (!enrollment.kiosk) enrollment.kiosk = {};
    if (!enrollment.kiosk.address) enrollment.kiosk.address = {};
    if (!enrollment.kiosk.geoCoordinates) enrollment.kiosk.geoCoordinates = {};
    if (!enrollment.kiosk.documents) enrollment.kiosk.documents = {};

    // =========================
    // STEP VALIDATION
    // =========================

    try {
      validateUserEnrollmentStepAccess(enrollment, STEPS.KIOSK);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    // =========================
    // MAPPING (DRAFT SAFE)
    // =========================

    const kioskInput = data?.kiosk || {};

    if (kioskInput.udyamRegNumber) {
      const udyam = kioskInput.udyamRegNumber.trim().toUpperCase();

      if (udyam.length < 5) {
        return res.status(400).json({
          success: false,
          message: "Invalid Udyam registration number",
        });
      }

      enrollment.kiosk.udyamRegNumber = udyam;
    }

    if (kioskInput.kioskName) {
      const name = kioskInput.kioskName.trim();

      if (name.length < 3) {
        return res.status(400).json({
          success: false,
          message: "Invalid kiosk name",
        });
      }

      enrollment.kiosk.kioskName = name;
    }

    if (kioskInput.premiseOwnershipType) {
      enrollment.kiosk.premiseOwnershipType = kioskInput.premiseOwnershipType;
    }

    if (kioskInput.locationType) {
      enrollment.kiosk.locationType = kioskInput.locationType;
    }

    if (kioskInput.businessCategory) {
      enrollment.kiosk.businessCategory = kioskInput.businessCategory;
    }

    // ADDRESS
    if (kioskInput.address) {
      const addr = kioskInput.address;
      const savedAddr = enrollment.kiosk.address;

      savedAddr.flatOrDoorNo = addr.flatOrDoorNo || savedAddr.flatOrDoorNo;

      savedAddr.buildingName = addr.buildingName || savedAddr.buildingName;

      savedAddr.roadOrStreet = addr.roadOrStreet || savedAddr.roadOrStreet;

      savedAddr.areaOrLocality =
        addr.areaOrLocality || savedAddr.areaOrLocality;

      savedAddr.taluk = addr.taluk || savedAddr.taluk;
      savedAddr.district = addr.district || savedAddr.district;
      savedAddr.state = addr.state || savedAddr.state;
      savedAddr.country = addr.country || savedAddr.country;

      if (addr.pincode) {
        const pin = addr.pincode.trim();

        if (pin.length !== 6) {
          return res.status(400).json({
            success: false,
            message: "Invalid pincode",
          });
        }

        savedAddr.pincode = pin;
      }
    }

    // GEO
    if (kioskInput.geoCoordinates) {
      const geo = kioskInput.geoCoordinates;
      const savedGeo = enrollment.kiosk.geoCoordinates;

      if (geo.latitude !== undefined) {
        savedGeo.latitude = geo.latitude;
      }

      if (geo.longitude !== undefined) {
        savedGeo.longitude = geo.longitude;
      }
    }

    // =========================
    // DOCUMENT MAPPING
    // =========================

    if (files.udyamCertificate?.[0]) {
      enrollment.kiosk.documents.udyamCertificate = {
        ref: "TEMP_UPLOAD",
        isConfirmed: false,
      };
    }

    if (files.kioskPhoto?.[0]) {
      enrollment.kiosk.documents.kioskPhoto = {
        ref: "TEMP_UPLOAD",
        isConfirmed: false,
      };
    }

    // =========================
    // STRICT VALIDATION
    // =========================

    if (VALIDATION_MODES.includes(mode)) {
      const savedKiosk = enrollment.kiosk;
      const address = savedKiosk.address || {};
      const geo = savedKiosk.geoCoordinates || {};
      const documents = savedKiosk.documents || {};

      // BASIC
      if (!savedKiosk.udyamRegNumber) {
        return res.status(400).json({
          success: false,
          message: "Udyam registration number required",
        });
      }

      if (!savedKiosk.kioskName) {
        return res.status(400).json({
          success: false,
          message: "Kiosk name required",
        });
      }

      if (!savedKiosk.premiseOwnershipType) {
        return res.status(400).json({
          success: false,
          message: "Premise ownership type required",
        });
      }

      if (!savedKiosk.locationType) {
        return res.status(400).json({
          success: false,
          message: "Location type required",
        });
      }

      if (!savedKiosk.businessCategory) {
        return res.status(400).json({
          success: false,
          message: "Business category required",
        });
      }

      // ADDRESS
      if (!address.flatOrDoorNo)
        return res
          .status(400)
          .json({ success: false, message: "Flat/Door number required" });

      if (!address.buildingName)
        return res
          .status(400)
          .json({ success: false, message: "Building name required" });

      if (!address.roadOrStreet)
        return res
          .status(400)
          .json({ success: false, message: "Road/Street required" });

      if (!address.areaOrLocality)
        return res
          .status(400)
          .json({ success: false, message: "Area/Locality required" });

      if (!address.taluk)
        return res
          .status(400)
          .json({ success: false, message: "Taluk required" });

      if (!address.district)
        return res
          .status(400)
          .json({ success: false, message: "District required" });

      if (!address.state)
        return res
          .status(400)
          .json({ success: false, message: "State required" });

      if (!address.country)
        return res
          .status(400)
          .json({ success: false, message: "Country required" });

      if (!address.pincode)
        return res
          .status(400)
          .json({ success: false, message: "Pincode required" });

      // GEO
      if (geo.latitude === undefined || geo.longitude === undefined) {
        return res.status(400).json({
          success: false,
          message: "Geo coordinates required",
        });
      }

      if (geo.latitude < -90 || geo.latitude > 90) {
        return res.status(400).json({
          success: false,
          message: "Invalid latitude",
        });
      }

      if (geo.longitude < -180 || geo.longitude > 180) {
        return res.status(400).json({
          success: false,
          message: "Invalid longitude",
        });
      }

      // DOCUMENTS
      if (!documents.kioskPhoto?.ref) {
        return res.status(400).json({
          success: false,
          message: "Kiosk photo required",
        });
      }

      if (!documents.udyamCertificate?.ref) {
        return res.status(400).json({
          success: false,
          message: "Udyam certificate required",
        });
      }
    }

    // =========================
    // STEP PROGRESSION
    // =========================

    handleUserEnrollmentStepProgression(enrollment, STEPS.KIOSK, mode);

    await enrollment.save();

    return res.status(200).json({
      success: true,
      message: "Kiosk details processed successfully",
    });
  } catch (error) {
    console.error("[completeUserEnrollmentKiosk] Error:", {
      message: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      success: false,
      message: "Unable to process kiosk details. Please try again",
    });
  }
};
