import { postPaymentDispatcher } from "../../postPayment/postPaymentDispatcher.js";

export const handlePaymentSuccess = async (payment) => {
  await postPaymentDispatcher(payment);
};
