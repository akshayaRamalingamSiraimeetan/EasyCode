"use strict";

/**
 * Centralized error handler.
 * Must be registered last in app.js (four-argument signature).
 */
// eslint-disable-next-line no-unused-vars
function errorMiddleware(err, req, res, next) {
  console.error("[Judge API] Unhandled error:", err.message);
  console.error("[Judge API] Stack:", err.stack);

  const status = err.status ?? 500;
  res.status(status).json({
    success: false,
    message: err.message ?? "Internal server error",
  });
}

module.exports = errorMiddleware;
