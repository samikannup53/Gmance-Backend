import express from "express";
import multer from "multer";

import { completeUserEnrollmentAuth } from "../controllers/enrollment/auth.controller.js";
import { verifyUidKyc } from "../controllers/enrollmentController.js";

const ROUTER = express.Router();

// Multer (memory storage)
const upload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// 🔹 AUTH → Create Enrollment from PreEnrollment
ROUTER.post("/auth/complete", completeUserEnrollmentAuth);

// 🔹 KYC
ROUTER.post(
  "/:trnId/kyc/verify-uid",
  upload.fields([
    { name: "uidXml", maxCount: 1 },
    { name: "uidHardCopy", maxCount: 1 },
  ]),
  verifyUidKyc,
);

// 🔹 Generic step (later)
/// ROUTER.patch("/:trnId/step", stepController.handleStep);

export default ROUTER;
