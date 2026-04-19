// middlewares/requestMeta.middleware.js

export const attachRequestMeta = (req, res, next) => {
  try {
    // Actor (user/admin/system)
    const actor = {
      id: req.user?.id || req.body?.publicId || "PUBLIC",
      role: req.user?.role || "USER",
    };

    // IP (proxy-safe)
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket?.remoteAddress ||
      null;

    // Optional coordinates
    const coordinates = req.body?.coordinates || null;

    // Attach globally
    req.meta = {
      actor,
      requestInfo: {
        ip,
        coordinates,
      },
      timestamp: new Date(),
    };

    next();
  } catch (error) {
    console.error("[attachRequestMeta]", error);
    next();
  }
};
