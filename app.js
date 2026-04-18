// Import necessary modules and initialize the Express app
import express from "express";
import cors from "cors";

import preEnrollmentRoutes from "./modules/user/enrollment/routes/preEnrollment.routes.js";
import enrollmentRoutes from "./modules/user/enrollment/routes/enrollment.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "API is running",
  });
});

app.use("/api/pre-enrollment", preEnrollmentRoutes);
app.use("/api/enrollment", enrollmentRoutes);

export default app;
