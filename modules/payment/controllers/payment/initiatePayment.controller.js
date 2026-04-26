import { Payment } from "../../models/payment.model.js";
import { PaymentAttempt } from "../../models/paymentAttempt.model.js";
import { PaymentConfig } from "../../models/paymentConfig.model.js";

import {
  PAYMENT_METHOD,
  PAYMENT_STATUS,
  PAYMENT_ATTEMPT_STATUS,
  PAYMENT_GATEWAY,
  PAYMENT_GATEWAY_FLOW,
  PAYMENT_FLOW,
} from "../../../../constants/payment.constants.js";

import { PAYMENT_GATEWAYS } from "../../../../config/payment.config.js";
import { PAYMENT_VALIDATORS } from "../../validators/paymentValidatorRegistry.js";

export const initiatePayment = async (req, res) => {
  try {
    const {
      entityType,
      entityCode,
      entityId,
      method,
      actorRole,
      idempotencyKey,
    } = req.body;

    const userId = "SYSTEM_USER";

    // ==================================================================
    // BASIC VALIDATION
    // ==================================================================
    if (!entityType || !entityCode || !entityId || !method || !actorRole) {
      return res.status(400).json({
        success: false,
        message: "Missing Required Fields",
      });
    }

    // ==================================================================
    // ENTITY VALIDATION
    // ==================================================================
    const validator = PAYMENT_VALIDATORS[entityType];

    if (!validator) {
      return res.status(400).json({
        success: false,
        message: "Unsupported Payment Entity Type",
      });
    }

    await validator({ entityId, entityCode });

    // ==================================================================
    // FETCH PAYMENT FROM PAYMENT CONFIG (DB)
    // ==================================================================
    const paymentConfig = await PaymentConfig.findOne({
      entityType,
      entityCode,
      isActive: true,
    });

    if (!paymentConfig) {
      return res.status(400).json({
        success: false,
        message: "Payment not yet configured for this Entity",
      });
    }

    if (!paymentConfig.allowedMethods.includes(method)) {
      return res.status(400).json({
        success: false,
        message: "Payment method not allowed for this Entity",
      });
    }

    // ==================================================================
    // PAYMENT FLOW (COLLECT / PAY)
    // ==================================================================
    const flow =
      actorRole === "ADMIN" || actorRole === "EMPLOYEE"
        ? PAYMENT_FLOW.COLLECT
        : PAYMENT_FLOW.PAY;

    // ==================================================================
    // GATEWAY FLOW
    // ==================================================================
    const gatewayFlow =
      method === PAYMENT_METHOD.GATEWAY
        ? actorRole === "ADMIN" || actorRole === "EMPLOYEE"
          ? PAYMENT_GATEWAY_FLOW.LINK
          : PAYMENT_GATEWAY_FLOW.CHECKOUT
        : undefined;

    // ==================================================================
    // FIND OR CREATE PAYMENT
    // ==================================================================
    let payment = await Payment.findOne({
      entityType,
      entityCode,
      entityId,
      status: { $ne: PAYMENT_STATUS.SUCCESS },
    });

    if (!payment) {
      const {
        baseAmount,
        breakdown,
        charges = [],
        taxes = [],
      } = paymentConfig.amount;

      let total = Math.round(baseAmount * 100);

      const appliedCharges = [];
      const appliedTaxes = [];

      for (const charge of charges) {
        if (charge.applicableOn && !charge.applicableOn.includes(method))
          continue;

        const value =
          charge.calculationType === "FLAT"
            ? charge.value * 100
            : (total * charge.value) / 100;

        const amt = Math.round(value);
        total += amt;

        appliedCharges.push({
          chargeType: charge.chargeType,
          amount: amt / 100,
        });
      }

      for (const tax of taxes) {
        const amt = Math.round((total * tax.rate) / 100);
        total += amt;

        appliedTaxes.push({
          taxType: tax.taxType,
          rate: tax.rate,
          amount: amt / 100,
        });
      }

      payment = await Payment.create({
        referenceId: `PAY-${Date.now()}`,
        entityType,
        entityCode,
        entityId,
        flow,
        amount: {
          currency: "INR",
          baseAmount,
          breakdown,
          charges: appliedCharges,
          taxes: appliedTaxes,
          totalAmount: total / 100,
        },
        status:
          method === PAYMENT_METHOD.DIRECT
            ? PAYMENT_STATUS.VERIFICATION_PENDING
            : PAYMENT_STATUS.CREATED,
        attemptsCount: 0,
        initiatedBy: actorRole,
        createdBy: userId,
      });
    }

    // =========================
    // IDEMPOTENCY (ATTEMPT LEVEL)
    // =========================
    if (idempotencyKey) {
      const existingAttempt = await PaymentAttempt.findOne({
        paymentId: payment._id,
        idempotencyKey,
      });

      if (existingAttempt) {
        return res.status(200).json({
          success: true,
          message: "Payment attempt already exists",
          data: {
            paymentId: payment._id,
            attemptId: existingAttempt._id,
            attemptNumber: existingAttempt.attemptNumber,
          },
        });
      }
    }

    // =========================
    // CREATE ATTEMPT
    // =========================
    const attemptNumber = payment.attemptsCount + 1;

    const attempt = await PaymentAttempt.create({
      paymentId: payment._id,
      attemptNumber,
      method,
      gatewayFlow,
      idempotencyKey,
      status:
        method === PAYMENT_METHOD.DIRECT
          ? PAYMENT_ATTEMPT_STATUS.VERIFICATION_PENDING
          : PAYMENT_ATTEMPT_STATUS.CREATED,
      createdBy: userId,
    });

    payment.attemptsCount = attemptNumber;
    payment.currentAttemptId = attempt._id;
    payment.flow = flow;

    await payment.save();

    // =========================
    // DIRECT
    // =========================
    if (method === PAYMENT_METHOD.DIRECT) {
      return res.status(200).json({
        success: true,
        message: "Awaiting Verification from Payment Team",
        data: {
          paymentId: payment._id,
          attemptId: attempt._id,
          attemptNumber,
        },
      });
    }

    // =========================
    // GATEWAY
    // =========================
    const gateway = PAYMENT_GATEWAYS[PAYMENT_GATEWAY.RAZORPAY];

    const order = await gateway.orders.create({
      amount: Math.round(payment.amount.totalAmount * 100),
      currency: "INR",
      receipt: payment.referenceId,
    });

    attempt.gateway = {
      provider: PAYMENT_GATEWAY.RAZORPAY,
      orderId: order.id,
    };

    attempt.status = PAYMENT_ATTEMPT_STATUS.LINK_GENERATED;

    await attempt.save();

    return res.status(200).json({
      success: true,
      message:
        gatewayFlow === PAYMENT_GATEWAY_FLOW.LINK
          ? "Payment link generated"
          : "Proceed to payment",
      data: {
        paymentId: payment._id,
        attemptId: attempt._id,
        attemptNumber,
        orderId: order.id,
        amount: payment.amount.totalAmount,
        currency: "INR",
        gatewayFlow,
        key:
          gatewayFlow === PAYMENT_GATEWAY_FLOW.CHECKOUT
            ? process.env.RAZORPAY_KEY_ID
            : undefined,
      },
    });
  } catch (error) {
    // System / Unexpected Errors
    if (!error.isOperational) {
      console.error("[initiatePayment] System Error:", {
        message: error.message,
        stack: error.stack,
        body: req.body,
        time: new Date().toISOString(),
      });
    }

    // Business / Validation Errors
    if (error.isOperational) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    // System errors (hidden)
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
