// Import necessary modules and initialize the Express app
import express from "express";
import cors from "cors";

import preEnrollmentRoutes from "./modules/user/enrollment/routes/preEnrollmentRoutes.js";

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

export default app;
