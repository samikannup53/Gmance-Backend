import { PAYMENT_GATEWAYS } from "../../../config/payment.config.js";

export const getPaymentGateway = (provider) => {
  const gateway = PAYMENT_GATEWAYS[provider];

  if (!gateway) {
    throw new Error(`Unsupported payment gateway: ${provider}`);
  }

  return gateway;
};
