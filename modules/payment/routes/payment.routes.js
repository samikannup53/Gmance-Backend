import express from "express";
import { initiatePayment } from "../controllers/payment.controller.js";

const ROUTER = express.Router();

// Initiate Payment
ROUTER.post("/initiate", initiatePayment);

export default ROUTER;
