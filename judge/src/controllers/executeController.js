"use strict";

const judgeService = require("../services/judgeService");

/**
 * POST /execute
 *
 * Single-run execution — used by the backend "Run Code" flow.
 * Response shape is identical to the old judgeService.execute() return value.
 *
 * Request body:  { language: string, code: string, input: string }
 * Response body: { status, stdout, stderr }
 */
async function executeCode(req, res, next) {
  try {
    const { language, code, input } = req.body;

    const result = await judgeService.execute(language, code, input);

    console.log("[executeController] result:", JSON.stringify(result));
    // Always 200 — status field in the body carries the execution verdict.
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { executeCode };
