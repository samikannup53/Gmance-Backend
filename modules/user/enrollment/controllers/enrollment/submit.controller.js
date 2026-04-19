import Enrollment from "../../models/enrollment.model.js";
import {
  STEPS,
  ENROLLMENT_PROGRESS,
  ENROLLMENT_STATUS,
  ENROLLMENT_PROGRESS_STATUS_MAP,
  USER_ENROLLMENT_SECTIONS,
} from "../../../../../config/constants.config.js";

export const finalSubmitUserEnrollment = async (req, res) => {
  try {
    const { trnId } = req.body;

    // BASIC VALIDATION
    if (!trnId) {
      return res.status(400).json({
        success: false,
        message: "trnId is required",
      });
    }

    // FETCH ENROLLMENT
    const enrollment = await Enrollment.findOne({ trnId }).select(
      "+kyc.uidEncrypted +pan.panEncrypted +bank.accountEncrypted",
    );

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: "Enrollment not found",
      });
    }

    // INVALID STATE
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

    // STEP VALIDATION
    if (enrollment.enrollmentFlow.currentStep !== STEPS.PREVIEW) {
      return res.status(400).json({
        success: false,
        message: "Invalid step flow",
      });
    }

    // FLOW CHECK
    const requiresKiosk = USER_ENROLLMENT_SECTIONS[
      enrollment.userType
    ]?.includes(STEPS.KIOSK);

    // =========================
    // SECTION DATA VALIDATION
    // =========================

    // SECTION DATA VALIDATION

    // AUTH
    if (
      !enrollment.auth?.email ||
      !enrollment.auth?.mobile?.countryCode ||
      !enrollment.auth?.mobile?.number ||
      enrollment.auth?.emailVerified !== true ||
      enrollment.auth?.mobileVerified !== true ||
      enrollment.auth?.onboardingConsent?.isGranted !== true
    ) {
      return res.status(400).json({
        success: false,
        message: "AUTH Details Incomplete",
      });
    }

    // KYC
    if (
      !enrollment.kyc?.uidEncrypted ||
      !enrollment.kyc?.uidLast4 ||
      !enrollment.kyc?.identity?.fullName ||
      !enrollment.kyc?.identity?.dob ||
      !enrollment.kyc?.identity?.gender ||
      !enrollment.kyc?.identity?.address ||
      !enrollment.kyc?.verification?.status
    ) {
      return res.status(400).json({
        success: false,
        message: "KYC Details Incomplete",
      });
    }

    // PAN
    if (
      !enrollment.pan?.panEncrypted ||
      !enrollment.pan?.last4 ||
      !enrollment.pan?.name
    ) {
      return res.status(400).json({
        success: false,
        message: "PAN Details Incomplete",
      });
    }

    // BANK
    if (
      !enrollment.bank?.accountEncrypted ||
      !enrollment.bank?.accountLast4 ||
      !enrollment.bank?.accountHolderName ||
      !enrollment.bank?.accountType ||
      !enrollment.bank?.bankName ||
      !enrollment.bank?.ifscCode
    ) {
      return res.status(400).json({
        success: false,
        message: "BANK Details Incomplete",
      });
    }

    // PERSONAL
    if (
      !enrollment.personal?.category ||
      !enrollment.personal?.computerKnowledge ||
      !enrollment.personal?.highestQualification ||
      !enrollment.personal?.maritalStatus ||
      !enrollment.personal?.relativeName ||
      !enrollment.personal?.relativeType
    ) {
      return res.status(400).json({
        success: false,
        message: "PERSONAL Details Incomplete",
      });
    }

    // KIOSK (FLOW BASED)
    if (
      requiresKiosk &&
      (!enrollment.kiosk?.kioskName ||
        !enrollment.kiosk?.businessCategory ||
        !enrollment.kiosk?.locationType ||
        !enrollment.kiosk?.premiseOwnershipType ||
        !enrollment.kiosk?.udyamRegNumber ||
        !enrollment.kiosk?.address?.flatOrDoorNo ||
        !enrollment.kiosk?.address?.roadOrStreet ||
        !enrollment.kiosk?.address?.areaOrLocality ||
        !enrollment.kiosk?.address?.district ||
        !enrollment.kiosk?.address?.state ||
        !enrollment.kiosk?.address?.pincode ||
        !enrollment.kiosk?.address?.country ||
        enrollment.kiosk?.geoCoordinates?.latitude == null ||
        enrollment.kiosk?.geoCoordinates?.longitude == null)
    ) {
      return res.status(400).json({
        success: false,
        message: "KIOSK Details Incomplete",
      });
    }

    // =========================
    // FILE VALIDATION
    // =========================

    if (!enrollment.kyc?.documents?.uidHardCopy?.ref) {
      return res.status(400).json({
        success: false,
        message: "KYC UID Hard Copy not uploaded",
      });
    }

    if (!enrollment.pan?.documents?.hardCopy?.ref) {
      return res.status(400).json({
        success: false,
        message: "PAN Hard Copy not uploaded",
      });
    }

    if (!enrollment.bank?.documents?.passbookOrCheque?.ref) {
      return res.status(400).json({
        success: false,
        message: "Bank document not uploaded",
      });
    }

    if (!enrollment.personal?.documents?.photo?.ref) {
      return res.status(400).json({
        success: false,
        message: "Photo not uploaded",
      });
    }

    if (!enrollment.personal?.documents?.pvr?.ref) {
      return res.status(400).json({
        success: false,
        message: "PVR not uploaded",
      });
    }

    if (!enrollment.personal?.documents?.qualificationCertificate?.ref) {
      return res.status(400).json({
        success: false,
        message: "Qualification certificate not uploaded",
      });
    }

    if (requiresKiosk && !enrollment.kiosk?.documents?.udyamCertificate?.ref) {
      return res.status(400).json({
        success: false,
        message: "Udyam certificate not uploaded",
      });
    }

    if (requiresKiosk && !enrollment.kiosk?.documents?.kioskPhoto?.ref) {
      return res.status(400).json({
        success: false,
        message: "Kiosk photo not uploaded",
      });
    }

    // =========================
    // CONFIRMATION VALIDATION
    // =========================

    if (!enrollment.kyc.documents.uidHardCopy.isConfirmed) {
      return res.status(400).json({
        success: false,
        message: "KYC UID Hard Copy not confirmed",
      });
    }

    if (!enrollment.pan.documents.hardCopy.isConfirmed) {
      return res.status(400).json({
        success: false,
        message: "PAN Hard Copy not confirmed",
      });
    }

    if (!enrollment.bank.documents.passbookOrCheque.isConfirmed) {
      return res.status(400).json({
        success: false,
        message: "Bank document not confirmed",
      });
    }

    if (!enrollment.personal.documents.photo.isConfirmed) {
      return res.status(400).json({
        success: false,
        message: "Photo not confirmed",
      });
    }

    if (!enrollment.personal.documents.pvr.isConfirmed) {
      return res.status(400).json({
        success: false,
        message: "PVR not confirmed",
      });
    }

    if (!enrollment.personal.documents.qualificationCertificate.isConfirmed) {
      return res.status(400).json({
        success: false,
        message: "Qualification certificate not confirmed",
      });
    }

    if (
      requiresKiosk &&
      !enrollment.kiosk.documents.udyamCertificate.isConfirmed
    ) {
      return res.status(400).json({
        success: false,
        message: "Udyam certificate not confirmed",
      });
    }

    if (requiresKiosk && !enrollment.kiosk.documents.kioskPhoto.isConfirmed) {
      return res.status(400).json({
        success: false,
        message: "Kiosk photo not confirmed",
      });
    }

    // =========================
    // CONSENT VALIDATION
    // =========================

    if (!enrollment.process?.submissionConsent?.isConfirmed) {
      return res.status(400).json({
        success: false,
        message: "Submission consent not provided",
      });
    }

    // =========================
    // FINAL STATE TRANSITION
    // =========================

    const progress = ENROLLMENT_PROGRESS.SUBMITTED;

    enrollment.enrollmentProgress = progress;
    enrollment.enrollmentStatus = ENROLLMENT_PROGRESS_STATUS_MAP[progress];

    enrollment.meta.updatedBy = req.meta.actor;
    enrollment.meta.requestInfo = req.meta.requestInfo;

    // SAVE
    await enrollment.save();

    return res.status(200).json({
      success: true,
      message: "Enrollment submitted successfully",
    });
  } catch (error) {
    console.error("[finalSubmitUserEnrollment] Error:", {
      message: error.message,
      stack: error.stack,
      body: req.body,
      time: new Date().toISOString(),
    });

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
