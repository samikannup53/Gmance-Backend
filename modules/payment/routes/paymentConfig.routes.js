import express from "express";
import { createPaymentConfig } from "../controllers/paymentConfig/createPaymentConfig.controller.js";
import { getAllPaymentConfigs } from "../controllers/paymentConfig/getAllPaymentConfigs.controller.js";
import { getPaymentConfigById } from "../controllers/paymentConfig/getPaymentConfigById.controller.js";
import { updatePaymentConfig } from "../controllers/paymentConfig/updatePaymentConfig.controller.js";
import { togglePaymentConfigStatus } from "../controllers/paymentConfig/togglePaymentConfigStatus.controller.js";
import { deletePaymentConfig } from "../controllers/paymentConfig/deletePaymentConfig.controller.js";

const ROUTER = express.Router();

// Initiate Payment
ROUTER.post("/create", createPaymentConfig);
ROUTER.get("/", getAllPaymentConfigs);
ROUTER.get("/:id", getPaymentConfigById);
ROUTER.patch("/:id", updatePaymentConfig);
ROUTER.patch("/:id/status", togglePaymentConfigStatus);
ROUTER.delete("/:id", deletePaymentConfig);

export default ROUTER;
