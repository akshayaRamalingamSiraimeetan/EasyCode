/**
 * judgeClient.js
 *
 * Drop-in replacement for the local judgeService.
 * Exposes the same { execute, judge } API but delegates all execution to the
 * remote judge microservice via HTTP POST.
 *
 * Environment variable:
 *   JUDGE_SERVICE_URL  – base URL of the judge service  (e.g. http://judge:7000)
 */

"use strict";

const axios = require("axios");

const JUDGE_SERVICE_URL = process.env.JUDGE_SERVICE_URL;

if (!JUDGE_SERVICE_URL) {
  throw new Error(
    "[judgeClient] JUDGE_SERVICE_URL environment variable is not set."
  );
}

/** Shared axios instance with a sensible execution timeout (30 s). */
const client = axios.create({
  baseURL: JUDGE_SERVICE_URL,
  timeout: 30_000,
});

// ─── Helper ───────────────────────────────────────────────────────────────────

/**
 * Wraps axios calls so network / HTTP errors surface with a consistent message
 * instead of leaking axios internals to callers.
 */
async function _post(path, payload) {
  try {
    const response = await client.post(path, payload);
    return response.data;
  } catch (err) {
    // Preserve the upstream error message when the judge returned a response
    const message =
      err.response?.data?.message ??
      err.message ??
      "Unknown error from judge service";
    throw new Error(`[judgeClient] ${message}`);
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Single-run execution.  Mirrors judgeService.execute().
 * Used by the "Run Code" endpoint.
 *
 * @param {string} language
 * @param {string} code
 * @param {string} input
 * @returns {Promise<{ status: string, stdout: string, stderr: string }>}
 */
async function execute(language, code, input) {
  return _post("/execute", { language, code, input });
}

/**
 * Multi-testcase judging.  Mirrors judgeService.judge().
 * Used by the "Submit" endpoint.
 *
 * @param {string} language
 * @param {string} code
 * @param {{ input: string, expectedOutput: string }[]} testCases
 * @returns {Promise<object>}  verdict — same shape as judgeService.judge() return value
 */
async function judge(language, code, testCases) {
  return _post("/judge", { language, code, testCases });
}

module.exports = { execute, judge };
