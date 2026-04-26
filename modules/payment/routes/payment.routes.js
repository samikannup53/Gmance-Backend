import express from "express";
import { initiatePayment } from "../controllers/payment/initiatePayment.controller.js";
import { verifyGatewayPayment } from "../controllers/payment/verifyGatewayPayment.controller.js";
import { retryPostPayment } from "../controllers/payment/retryPostPayment.controller.js";

const ROUTER = express.Router();

// Initiate Payment
ROUTER.post("/initiate", initiatePayment);
ROUTER.post("/verify", verifyGatewayPayment);
ROUTER.post("/:paymentId/retry-post-payment", retryPostPayment);

export default ROUTER;
