import { postPaymentDispatcher } from "../../postPayment/postPaymentDispatcher.js";

export const handlePaymentSuccess = async (payment) => {
  try {
    await postPaymentDispatcher(payment);
  } catch (error) {
    console.error("[PostPayment Error]", {
      paymentId: payment._id,
      entityType: payment.entityType,
      entityId: payment.entityId,
      message: error.message,
    });
  }
};
