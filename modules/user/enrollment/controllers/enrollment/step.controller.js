// step.controller.js

import * as stepService from "../services/step.service.js";

export const handleStep = async (req, res) => {
  const result = await stepService.handleStep({
    id: req.params.id,
    body: req.body,
  });

  res.json({ success: true, data: result });
};
