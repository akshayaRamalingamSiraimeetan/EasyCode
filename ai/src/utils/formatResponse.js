/**
 * Utility helpers for shaping AI service responses consistently.
 * All endpoints should use these so the response contract stays uniform.
 */

/**
 * Wraps a successful AI response.
 *
 * @param {string} data - The AI-generated text
 * @param {Object} [meta] - Optional metadata (model used, tokens, etc.)
 */
const success = (data, meta = {}) => ({
  success: true,
  data,
  ...meta,
});

/**
 * Wraps an error response.
 *
 * @param {string} message - Human-readable error description
 */
const failure = (message) => ({
  success: false,
  message,
});

module.exports = { success, failure };
