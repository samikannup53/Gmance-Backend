import express from "express";
import multer from "multer";

import { verifyUidKyc } from "../controllers/enrollmentController.js";

const ROUTER = express.Router();

// Multer (memory storage)
const upload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit (optional but recommended)
  },
});

// KYC Route
ROUTER.post(
  "/kyc/complete",
  upload.fields([
    { name: "uidXml", maxCount: 1 },
    { name: "uidHardCopy", maxCount: 1 },
  ]),
  verifyUidKyc,
);

// ROUTER.patch("/:id/step", stepController.handleStep);

export default ROUTER;
