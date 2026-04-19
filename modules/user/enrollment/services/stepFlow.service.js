import {
  STEPS,
  USER_ENROLLMENT_STEP_MODES,
  USER_ENROLLMENT_SECTIONS,
} from "../../../../config/constants.config.js";

// 🔹 Get Flow Based on User Type
const getUserFlow = (userType) => {
  const flow = USER_ENROLLMENT_SECTIONS[userType];
  if (!flow || !flow.length) {
    throw new Error("Invalid user type flow configuration");
  }
  return flow;
};

// 🔹 Get Last Step Before Preview
const getLastStepBeforePreview = (userType) => {
  const flow = getUserFlow(userType);
  return flow[flow.length - 2]; // PREVIEW is last
};

// 🔹 Validate Step Access
export const validateUserEnrollmentStepAccess = (enrollment, step) => {
  const currentStep = enrollment.enrollmentFlow.currentStep;

  const stepOrder = getUserFlow(enrollment.userType);

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
  const currentStep = enrollment.enrollmentFlow.currentStep;

  const stepOrder = getUserFlow(enrollment.userType);
  const currentIndex = stepOrder.indexOf(currentStep);

  // Safety check
  if (currentIndex === -1) return;

  const completedSteps = enrollment.enrollmentFlow.stepsCompleted || [];

  if (!completedSteps.includes(step)) {
    completedSteps.push(step);
  }

  enrollment.enrollmentFlow.stepsCompleted = completedSteps;

  // SAVE_DRAFT → no movement
  if (mode === USER_ENROLLMENT_STEP_MODES.SAVE_DRAFT) return;

  // NEXT → normal step forward
  if (mode === USER_ENROLLMENT_STEP_MODES.NEXT) {
    if (currentStep === step) {
      enrollment.enrollmentFlow.currentStep =
        stepOrder[currentIndex + 1] || currentStep;
    }
  }

  // SUBMIT → move to PREVIEW
  if (mode === USER_ENROLLMENT_STEP_MODES.SUBMIT) {
    const lastStepBeforePreview = getLastStepBeforePreview(enrollment.userType);

    if (step === lastStepBeforePreview) {
      enrollment.enrollmentFlow.currentStep = STEPS.PREVIEW;
    }
  }
};
