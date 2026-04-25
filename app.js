// Import Libraries
import express from "express";
import cors from "cors";

// Import Middleware
import { attachRequestMeta } from "./middlewares/requestMeta.middleware.js";

// Import Routes
import preEnrollmentRoutes from "./modules/user/enrollment/routes/preEnrollment.routes.js";
import enrollmentRoutes from "./modules/user/enrollment/routes/enrollment.routes.js";
import paymentConfigRoutes from "./modules/payment/routes/paymentConfig.routes.js";
import paymentRoutes from "./modules/payment/routes/payment.routes.js";

const app = express();
app.set("trust proxy", true);

// Middleware Setup
app.use(cors());
app.use(express.json());

// Global Middleware to Attach Request Metadata
app.use(attachRequestMeta);

// Health Check Endpoint
app.get("/", (req, res) => {
  res.json({ message: "API is running" });
});

// Mount Routes
app.use("/api/pre-enrollment", preEnrollmentRoutes);
app.use("/api/enrollment", enrollmentRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/payment-config", paymentConfigRoutes);

export default app;
