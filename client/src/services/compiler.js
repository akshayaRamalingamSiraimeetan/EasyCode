import api from "./api";

/**
 * Run code against all public test cases + optional custom input.
 * POST /api/compiler/run
 * @param {string} language
 * @param {string} code
 * @param {string} problemId
 * @param {string} [customInput]   omit or empty string to skip custom execution
 */
export const runCode = (language, code, problemId, customInput) =>
  api.post("/compiler/run", { language, code, problemId, input: customInput ?? "" });

/**
 * Submit solution for judging against all stored test cases (public + hidden).
 * POST /api/compiler/submit
 */
export const submitSolution = (language, code, problemId) =>
  api.post("/compiler/submit", { language, code, problemId });
