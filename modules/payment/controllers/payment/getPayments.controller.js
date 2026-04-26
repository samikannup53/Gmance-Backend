// controllers/payment/getPayments.controller.js

import { Payment } from "../../models/payment.model.js";

export const getPayments = async (req, res) => {
  try {
    let { page = 1, limit = 10, status, entityType, q, from, to } = req.query;

    // =========================
    // PAGINATION
    // =========================
    page = parseInt(page);
    limit = parseInt(limit);

    const allowedLimits = [10, 25, 50, 100];
    if (!allowedLimits.includes(limit)) limit = 10;
    if (page < 1) page = 1;

    const skip = (page - 1) * limit;

    // =========================
    // FILTER
    // =========================
    const filter = {};

    if (status) filter.status = status;
    if (entityType) filter.entityType = entityType;

    // =========================
    // SEARCH (referenceId / entityId)
    // =========================
    if (q) {
      filter.$or = [
        { referenceId: { $regex: q, $options: "i" } },
        { entityId: { $regex: q, $options: "i" } },
      ];
    }

    // =========================
    // DATE FILTER
    // =========================
    if (from || to) {
      filter.createdAt = {};

      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    // =========================
    // FETCH DATA
    // =========================
    const [items, total] = await Promise.all([
      Payment.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select(
          "_id referenceId entityType entityId status amount.totalAmount createdAt",
        ),

      Payment.countDocuments(filter),
    ]);

    // =========================
    // RESPONSE
    // =========================
    return res.status(200).json({
      success: true,
      data: {
        items,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("[getPayments] System Error:", {
      message: error.message,
      stack: error.stack,
      query: req.query,
      time: new Date().toISOString(),
    });

    return res.status(500).json({
      success: false,
      message: "Failed to fetch payments",
    });
  }
};
