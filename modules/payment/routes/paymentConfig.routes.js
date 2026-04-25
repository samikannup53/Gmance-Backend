import express from "express";
import {
  createPaymentConfig,
  deletePaymentConfig,
  getAllPaymentConfigs,
  getPaymentConfigById,
  updatePaymentConfig,
} from "../controllers/paymentConfig.controller.js";

const ROUTER = express.Router();

// Initiate Payment
ROUTER.post("/create", createPaymentConfig);
ROUTER.get("/", getAllPaymentConfigs);
ROUTER.get("/:id", getPaymentConfigById);
ROUTER.put("/:id", updatePaymentConfig);
ROUTER.delete("/:id", deletePaymentConfig);

export default ROUTER;
