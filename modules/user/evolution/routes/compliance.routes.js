// /modules/user/evolution/routes/compliance.routes.js

import express from "express";

import { getComplianceData } from "../controllers/compliance/getComplianceData.controller.js";
import { markIGO } from "../controllers/compliance/markIGO.controller.js";
import { markNIGO } from "../controllers/compliance/markNIGO.controller.js";
import { approveCompliance } from "../controllers/compliance/approveCompliance.controller.js";
import { rejectCompliance } from "../controllers/compliance/rejectCompliance.controller.js";
import { holdCompliance } from "../controllers/compliance/holdCompliance.controller.js";

const ROUTER = express.Router();

ROUTER.get("/:ernId", getComplianceData);

ROUTER.post("/:ernId/igo", markIGO);
ROUTER.post("/:ernId/nigo", markNIGO);

ROUTER.post("/:ernId/approve", approveCompliance);
ROUTER.post("/:ernId/reject", rejectCompliance);
ROUTER.post("/:ernId/hold", holdCompliance);

export default ROUTER;
