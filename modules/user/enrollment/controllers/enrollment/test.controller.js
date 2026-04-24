// modules/enrollment/controllers/test.controller.js

import {
  generatePublicId,
  generateTRN,
  generateERN,
  generateUserId,
} from "../../../../../global/utils/idGenerator.util.js";

export const testIds = async (req, res) => {
  try {
    const publicId = generatePublicId();
    const trn = generateTRN();
    const ern1 = await generateERN();
    const ern2 = await generateERN();

    const associate = await generateUserId("ASSOCIATE");
    const employee = await generateUserId("EMPLOYEE");
    const admin = await generateUserId("ADMIN");

    return res.json({
      publicId,
      trn,
      ern1,
      ern2,
      associate,
      employee,
      admin,
    });
  } catch (error) {
    console.error("[counter] Error:", {
      message: error.message,
      stack: error.stack,
      body: req.body,
      time: new Date().toISOString(),
    });
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
