/**
 * 404 handler — catches any request to an undefined route
 */
const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

/**
 * Global error handler — catches errors thrown in any middleware or controller
 */
const errorHandler = (err, req, res, next) => {
  console.error("[AI Service Error]", err);

  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal server error.",
  });
};

module.exports = { notFound, errorHandler };
