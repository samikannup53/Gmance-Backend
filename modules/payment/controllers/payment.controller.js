import mongoose from "mongoose";

import { Payment } from "../models/payment.model.js";
import { PaymentAttempt } from "../models/paymentAttempt.model.js";
import { PaymentConfig } from "../models/paymentConfig.model.js";

import {
  PAYMENT_METHOD,
  PAYMENT_STATUS,
  PAYMENT_ATTEMPT_STATUS,
  PAYMENT_GATEWAY,
} from "../../../constants/payment.constants.js";

import { PAYMENT_GATEWAYS } from "../../../config/payment.config.js";

export const initiatePayment = async (req, res) => {
  try {
    const { entityType, entityCode, entityId, method, flow } = req.body || {};

    const userId =
      req.meta?.actor?.id || req.user?.id || req.body?.publicId || "SYSTEM_USER";

    // ======================================================
    // BASIC VALIDATION
    // ======================================================
    if (!entityType || !entityCode || !entityId || !method || !flow) {
      return res.status(400).json({
        success: false,
        message:
          "Entity Type, Entity Code, Entity Id, Method And Flow Are Required",
      });
    }

    // ======================================================
    // FETCH CONFIG
    // ======================================================
    const config = await PaymentConfig.findOne({
      entityType,
      entityCode,
      isActive: true,
    });

    if (!config) {
      return res.status(404).json({
        success: false,
        message: "Payment Configuration Not Found",
      });
    }

    // ======================================================
    // METHOD VALIDATION
    // ======================================================
    if (!config.allowedMethods.includes(method)) {
      return res.status(400).json({
        success: false,
        message: "Payment Method Not Allowed For This Service",
      });
    }

    // ======================================================
    // AMOUNT CALCULATION (SOURCE OF TRUTH)
    // ======================================================
    const amountConfig = config.amount;

    let total = amountConfig.baseAmount;

    const charges = [];

    for (const charge of amountConfig.charges || []) {
      if (charge.applicableOn && !charge.applicableOn.includes(method))
        continue;

      let calculated = 0;

      if (charge.calculationType === "FLAT") {
        calculated = charge.value;
      } else {
        calculated = (total * charge.value) / 100;
      }

      calculated = Math.round(calculated);

      charges.push({
        chargeType: charge.chargeType,
        amount: calculated,
      });

      total += calculated;
    }

    const taxes = [];

    for (const tax of amountConfig.taxes || []) {
      const taxAmount = Math.round((total * tax.rate) / 100);

      taxes.push({
        taxType: tax.taxType,
        rate: tax.rate,
        amount: taxAmount,
      });

      total += taxAmount;
    }

    const roundOff = Math.round(total) - total;
    total = Math.round(total);

    // ======================================================
    // CREATE PAYMENT
    // ======================================================
    const initialPaymentStatus =
      method === PAYMENT_METHOD.DIRECT
        ? PAYMENT_STATUS.VERIFICATION_PENDING
        : PAYMENT_STATUS.CREATED;

    const payment = await Payment.create({
      referenceId: `PAY-${Date.now()}`,
      entityType,
      entityCode,
      entityId,
      flow,

      amount: {
        currency: amountConfig.currency || "INR",
        baseAmount: amountConfig.baseAmount,
        breakdown: amountConfig.breakdown,
        charges,
        taxes,
        roundOff,
        totalAmount: total,
      },

      status: initialPaymentStatus,

      attemptsCount: 1,
      initiatedBy: "USER",
      createdBy: userId,
    });

    // ======================================================
    // CREATE ATTEMPT
    // ======================================================
    const attempt = await PaymentAttempt.create({
      paymentId: payment._id,
      attemptNumber: 1,
      method,

      status:
        method === PAYMENT_METHOD.DIRECT
          ? PAYMENT_ATTEMPT_STATUS.VERIFICATION_PENDING
          : PAYMENT_ATTEMPT_STATUS.CREATED,

      createdBy: userId,
    });

    payment.currentAttemptId = attempt._id;
    await payment.save();

    // ======================================================
    // DIRECT FLOW
    // ======================================================
    if (method === PAYMENT_METHOD.DIRECT) {
      return res.status(200).json({
        success: true,
        message: "Payment Initiated Successfully And Awaiting Verification",
        data: {
          paymentId: payment._id,
          attemptId: attempt._id,
          status: payment.status,
        },
      });
    }

    // ======================================================
    // GATEWAY FLOW
    // ======================================================
    if (method === PAYMENT_METHOD.GATEWAY) {
      const gateway = PAYMENT_GATEWAYS[PAYMENT_GATEWAY.RAZORPAY];

      if (!gateway) {
        return res.status(500).json({
          success: false,
          message: "Payment Gateway Not Configured",
        });
      }

      const order = await gateway.orders.create({
        amount: total * 100, // convert to paise
        currency: "INR",
        receipt: payment.referenceId,
      });

      attempt.gateway = {
        provider: PAYMENT_GATEWAY.RAZORPAY,
        orderId: order.id,
        rawResponse: order,
      };

      attempt.status = PAYMENT_ATTEMPT_STATUS.LINK_GENERATED;

      await attempt.save();

      return res.status(200).json({
        success: true,
        message: "Payment Link Generated Successfully",
        data: {
          paymentId: payment._id,
          attemptId: attempt._id,
          orderId: order.id,
          amount: total,
          currency: "INR",
        },
      });
    }

    // ======================================================
    // WALLET FLOW
    // ======================================================
    if (method === PAYMENT_METHOD.WALLET) {
      const walletService =
        req.app?.locals?.walletService || req.app?.get("walletService");

      const debitWallet =
        walletService?.debit ||
        walletService?.debitWallet ||
        walletService?.pay;

      if (typeof debitWallet !== "function") {
        const failureReason = "Wallet Service Not Configured";

        attempt.status = PAYMENT_ATTEMPT_STATUS.FAILED;
        attempt.failureReason = failureReason;
        attempt.updatedBy = userId;

        payment.status = PAYMENT_STATUS.FAILED;
        payment.failureReason = failureReason;

        await attempt.save();
        await payment.save();

        return res.status(500).json({
          success: false,
          message: failureReason,
        });
      }

      const walletResult = await debitWallet.call(walletService, {
        userId,
        amount: total,
        currency: payment.amount.currency,
        referenceId: payment.referenceId,
        paymentId: payment._id.toString(),
        attemptId: attempt._id.toString(),
        entityType,
        entityCode,
        entityId,
        flow,
      });

      const walletTransactionId =
        walletResult?.transactionId ||
        walletResult?.walletTxnId ||
        walletResult?.referenceId ||
        walletResult?.id ||
        null;

      if (walletResult?.success === false) {
        const failureReason = walletResult?.message || "Wallet Payment Failed";

        attempt.status = PAYMENT_ATTEMPT_STATUS.FAILED;
        attempt.failureReason = failureReason;
        attempt.updatedBy = userId;

        payment.status = PAYMENT_STATUS.FAILED;
        payment.failureReason = failureReason;
        payment.meta = {
          ...(payment.meta || {}),
          wallet: {
            transactionId: walletTransactionId,
            status: PAYMENT_STATUS.FAILED,
          },
        };

        await attempt.save();
        await payment.save();

        return res.status(400).json({
          success: false,
          message: failureReason,
        });
      }

      attempt.status = PAYMENT_ATTEMPT_STATUS.SUCCESS;
      attempt.lifecycle = {
        ...attempt.lifecycle,
        paidAt: new Date(),
      };
      attempt.updatedBy = userId;

      payment.status = PAYMENT_STATUS.SUCCESS;
      payment.meta = {
        ...(payment.meta || {}),
        wallet: {
          transactionId: walletTransactionId,
          status: PAYMENT_STATUS.SUCCESS,
        },
      };

      await attempt.save();
      await payment.save();

      return res.status(200).json({
        success: true,
        message: "Payment Completed Successfully",
        data: {
          paymentId: payment._id,
          attemptId: attempt._id,
          status: payment.status,
          transactionId: walletTransactionId,
        },
      });
    }
  } catch (error) {
    console.error("[initiatePayment] Error:", {
      message: error.message,
      stack: error.stack,
      body: req.body,
      time: new Date().toISOString(),
    });

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
