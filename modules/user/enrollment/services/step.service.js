// step.service.js

import Enrollment from "../models/enrollment.model.js";
import { STEP_FLOW } from "../utils/stepFlow.js";

export const handleStep = async ({ id, body }) => {
  const { step, data, mode } = body;

  const enrollment = await Enrollment.findById(id);
  if (!enrollment) throw new Error("Enrollment not found");

  if (mode === "SAVE_DRAFT") {
    merge(enrollment, step, data);
    await enrollment.save();
    return getFlow(enrollment);
  }

  if (mode === "NEXT") {
    validate(step, data);
    merge(enrollment, step, data);
    moveNext(enrollment, step);
    await enrollment.save();

    return getFlow(enrollment);
  }
};
