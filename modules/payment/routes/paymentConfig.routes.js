import express from "express";
import { createPaymentConfig } from "../controllers/paymentConfig.controller.js";

const ROUTER = express.Router();

// Initiate Payment
ROUTER.post("/create", createPaymentConfig);

export default ROUTER;
