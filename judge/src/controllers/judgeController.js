"use strict";

const judgeService = require("../services/judgeService");

/**
 * POST /judge
 *
 * Multi-testcase judging — used by the backend "Submit" flow.
 * Response shape is identical to the old judgeService.judge() return value.
 *
 * Request body:  { language: string, code: string, testCases: Array<{ input, expectedOutput }> }
 * Response body: verdict object (see judgeService.judge JSDoc for all shapes)
 */
async function judgeCode(req, res, next) {
  try {
    const { language, code, testCases } = req.body;

    const verdict = await judgeService.judge(language, code, testCases);

    console.log("[judgeController] response =", JSON.stringify(verdict));
    // Always 200 — status field in the body carries the verdict.
    return res.status(200).json(verdict);
  } catch (err) {
    next(err);
  }
}

module.exports = { judgeCode };
