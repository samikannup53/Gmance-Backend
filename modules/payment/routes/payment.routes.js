import express from "express";
import { initiatePayment } from "../controllers/payment/initiatePayment.controller.js";
import { verifyGatewayPayment } from "../controllers/payment/verifyGatewayPayment.controller.js";
import { retryPostPayment } from "../controllers/payment/retryPostPayment.controller.js";
import { verifyDirectPayment } from "../controllers/payment/verifyDirectPayment.controller.js";
import { getPaymentById } from "../controllers/payment/getPaymentById.controller.js";
import { getPaymentStatus } from "../controllers/payment/getPaymentStatus.controller.js";
import { getPaymentByEntity } from "../controllers/payment/getPaymentByEntity.controller.js";
import { previewPayment } from "../controllers/payment/previewPayment.controller.js";
import { submitDirectPayment } from "../controllers/payment/directPaymentSubmit.controller.js";
import { getPayments } from "../controllers/payment/getPayments.controller.js";

const ROUTER = express.Router();

ROUTER.get("/", getPayments);
ROUTER.get("/preview", previewPayment);

ROUTER.post("/initiate", initiatePayment);
ROUTER.post("/verify/gateway-payment", verifyGatewayPayment);
ROUTER.post("/verify/direct-payment", verifyDirectPayment);
ROUTER.post("/:paymentId/retry-post-payment", retryPostPayment);
ROUTER.post("/submit/direct-payment", submitDirectPayment);

ROUTER.get("/entity/:entityType/:entityId", getPaymentByEntity);
ROUTER.get("/:paymentId/status", getPaymentStatus);
ROUTER.get("/:paymentId", getPaymentById);

export default ROUTER;
