import {
  STEPS,
  USER_ENROLLMENT_STEP_MODES,
} from "../../../../config/constants.config.js";

// 🔹 Validate Step Access
export const validateUserEnrollmentStepAccess = (enrollment, step) => {
  const currentStep = enrollment.enrollmentFlow.currentStep;

  const stepOrder = Object.values(STEPS);

  const requestedIndex = stepOrder.indexOf(step);
  const currentIndex = stepOrder.indexOf(currentStep);

  // Invalid step safety
  if (requestedIndex === -1 || currentIndex === -1) {
    throw new Error("Invalid step");
  }

  // Prevent forward jump
  if (requestedIndex > currentIndex) {
    throw new Error("Invalid step flow");
  }

  return true;
};

// 🔹 Handle Step Progression
export const handleUserEnrollmentStepProgression = (enrollment, step, mode) => {
  if (mode !== USER_ENROLLMENT_STEP_MODES.NEXT) return;

  const currentStep = enrollment.enrollmentFlow.currentStep;

  const stepOrder = Object.values(STEPS);
  const currentIndex = stepOrder.indexOf(currentStep);

  // Safety check
  if (currentIndex === -1) return;

  const completedSteps = enrollment.enrollmentFlow.stepsCompleted || [];

  if (!completedSteps.includes(step)) {
    completedSteps.push(step);
  }

  enrollment.enrollmentFlow.stepsCompleted = completedSteps;

  // Move forward only if user is on current step
  if (currentStep === step) {
    enrollment.enrollmentFlow.currentStep =
      stepOrder[currentIndex + 1] || currentStep;
  }
};
