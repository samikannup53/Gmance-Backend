import express from "express";
import multer from "multer";

import { completeUserEnrollmentAuth } from "../controllers/enrollment/auth.controller.js";
import {
  completeUserEnrollmentKyc,
  verifyUserEnrollmentUidKyc,
} from "../controllers/enrollment/kyc.controller.js";

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

// Routes (single-line clean style)
ROUTER.post("/auth/complete", completeUserEnrollmentAuth);
ROUTER.post("/kyc/verify-uid", kycVerifyUpload, verifyUserEnrollmentUidKyc);
ROUTER.post("/kyc/complete", kycCompleteUpload, completeUserEnrollmentKyc);

export default ROUTER;
