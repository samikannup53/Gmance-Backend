import express from "express";
import multer from "multer";

import { completeUserEnrollmentAuth } from "../controllers/enrollment/auth.controller.js";
import {
  completeUserEnrollmentKyc,
  verifyUserEnrollmentUidKyc,
} from "../controllers/enrollment/kyc.controller.js";
import { completeUserEnrollmentPanBank } from "../controllers/enrollment/panBank.controller.js";
import { completeUserEnrollmentPersonal } from "../controllers/enrollment/personal.controller.js";
import { completeUserEnrollmentKiosk } from "../controllers/enrollment/kiosk.controller.js";
import { confirmUserEnrollmentPreview, getUserEnrollmentPreview } from "../controllers/enrollment/preview.controller.js";
import { finalSubmitUserEnrollment } from "../controllers/enrollment/submit.controller.js";
import { testIds } from "../controllers/enrollment/test.controller.js";

const ROUTER = express.Router();

// Multer (memory storage)
const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/zip",
      "application/xml",
      "text/xml",
      "image/jpeg",
      "image/png",
      "application/pdf",
    ];
    const allowedExtensions = [".zip", ".xml", ".jpg", ".jpeg", ".png", ".pdf"];

    const ext = file.originalname
      .toLowerCase()
      .slice(file.originalname.lastIndexOf("."));

    if (allowedTypes.includes(file.mimetype) && allowedExtensions.includes(ext))
      cb(null, true);
    else cb(new Error("Invalid file type"), false);
  },
});

const kycVerifyUpload = upload.fields([{ name: "uidXml", maxCount: 1 }]);
const kycCompleteUpload = upload.fields([{ name: "uidHardCopy", maxCount: 1 }]);
const panBankUpload = upload.fields([
  { name: "panHardCopy", maxCount: 1 },
  { name: "bankDocument", maxCount: 1 },
]);
const personalUpload = upload.fields([
  { name: "photo", maxCount: 1 },
  { name: "pvr", maxCount: 1 },
  { name: "qualificationCertificate", maxCount: 1 },
]);
const kioskUpload = upload.fields([
  { name: "kioskPhoto", maxCount: 1 },
  { name: "udyamCertificate", maxCount: 1 },
]);

// Routes (single-line clean style)
ROUTER.post("/auth/complete", completeUserEnrollmentAuth);
ROUTER.post("/kyc/verify-uid", kycVerifyUpload, verifyUserEnrollmentUidKyc);
ROUTER.post("/kyc/complete", kycCompleteUpload, completeUserEnrollmentKyc);
ROUTER.post("/pan-bank/complete", panBankUpload, completeUserEnrollmentPanBank);
ROUTER.post("/personal/complete", personalUpload, completeUserEnrollmentPersonal);
ROUTER.post("/kiosk/complete", kioskUpload, completeUserEnrollmentKiosk);
ROUTER.get("/preview", getUserEnrollmentPreview);
ROUTER.post("/preview/confirm", confirmUserEnrollmentPreview);
ROUTER.post("/submit", finalSubmitUserEnrollment);

ROUTER.get("/test-ids", testIds)

export default ROUTER;
