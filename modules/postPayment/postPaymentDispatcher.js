import { handleUserEnrollmentPaymentSuccess } from "./handlers/userEnrollment.handler.js";

export const postPaymentDispatcher = async (payment) => {
  const { entityType } = payment;

  switch (entityType) {
    case "USER_ENROLLMENT":
      await handleUserEnrollmentPaymentSuccess(payment);
      break;

    // future:
    // case "WALLET_TOPUP":
    //   await handleWalletTopup(payment);
    //   break;

    default:
      throw new Error(`No post-payment handler for entityType: ${entityType}`);
  }
};
