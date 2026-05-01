// agreement.routes.js

import express from "express";

import { uploadStampData } from "../controllers/agreement/uploadStampData.controller.js";
import { generateAgreement } from "../controllers/agreement/generateAgreement.controller.js";
import { reviewAgreement } from "../controllers/agreement/reviewAgreement.controller.js";
import { handleESign } from "../controllers/agreement/handleESign.controller.js";
import { reprocessAgreement } from "../controllers/agreement/reprocessAgreement.controller.js";

const router = express.Router();

router.post("/:ernId/stamp", uploadStampData);
router.post("/:ernId/generate", generateAgreement);
router.post("/:ernId/review", reviewAgreement);
router.post("/:ernId/esign", handleESign);

// ADMIN
router.post("/:ernId/reprocess", reprocessAgreement);

export default router;
