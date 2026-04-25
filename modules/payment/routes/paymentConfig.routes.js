import express from "express";
import {
  createPaymentConfig,
  deletePaymentConfig,
  getAllPaymentConfigs,
  getPaymentConfigById,
  togglePaymentConfigStatus,
  updatePaymentConfig,
} from "../controllers/paymentConfig.controller.js";

const ROUTER = express.Router();

// Initiate Payment
ROUTER.post("/create", createPaymentConfig);
ROUTER.get("/", getAllPaymentConfigs);
ROUTER.get("/:id", getPaymentConfigById);
ROUTER.patch("/:id", updatePaymentConfig);
ROUTER.patch("/:id/status", togglePaymentConfigStatus);
ROUTER.delete("/:id", deletePaymentConfig);

export default ROUTER;
