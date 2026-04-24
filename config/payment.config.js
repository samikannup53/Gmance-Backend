import Razorpay from "razorpay";
import { PAYMENT_GATEWAY } from "../constants/payment.constants.js";

// Validate Required Environment Variables
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  throw new Error("Razorpay keys missing in environment");
}

// Payment Gateway Instances
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Paytm Placeholder (Future Integration)
const paytmInstance = {
  initiatePayment: async () => {
    throw new Error("Paytm not implemented yet");
  },
};

// Exported Gateway Registry
export const PAYMENT_GATEWAYS = {
  [PAYMENT_GATEWAY.RAZORPAY]: razorpayInstance,
  [PAYMENT_GATEWAY.PAYTM]: paytmInstance,
};
