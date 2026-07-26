"use strict";

const SUPPORTED_LANGUAGES = ["python", "c", "cpp", "java"];

/**
 * Validates POST /execute  –  { language, code, input }
 */
function validateExecute(req, res, next) {
  const { language, code, input } = req.body;

  if (!language || typeof language !== "string") {
    return res.status(400).json({ success: false, message: "language is required." });
  }

  if (!SUPPORTED_LANGUAGES.includes(language)) {
    return res.status(400).json({
      success: false,
      message: `Unsupported language "${language}". Supported: ${SUPPORTED_LANGUAGES.join(", ")}.`,
    });
  }

  if (!code || typeof code !== "string") {
    return res.status(400).json({ success: false, message: "code is required." });
  }

  if (typeof input !== "string") {
    return res.status(400).json({ success: false, message: "input must be a string." });
  }

  next();
}

/**
 * Validates POST /judge  –  { language, code, testCases }
 */
function validateJudge(req, res, next) {
  const { language, code, testCases } = req.body;

  if (!language || typeof language !== "string") {
    return res.status(400).json({ success: false, message: "language is required." });
  }

  if (!SUPPORTED_LANGUAGES.includes(language)) {
    return res.status(400).json({
      success: false,
      message: `Unsupported language "${language}". Supported: ${SUPPORTED_LANGUAGES.join(", ")}.`,
    });
  }

  if (!code || typeof code !== "string") {
    return res.status(400).json({ success: false, message: "code is required." });
  }

  if (!Array.isArray(testCases) || testCases.length === 0) {
    return res.status(400).json({ success: false, message: "testCases must be a non-empty array." });
  }

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    if (typeof tc.input !== "string" || typeof tc.expectedOutput !== "string") {
      return res.status(400).json({
        success: false,
        message: `testCases[${i}] must have string fields input and expectedOutput.`,
      });
    }
  }

  next();
}

module.exports = { validateExecute, validateJudge };
