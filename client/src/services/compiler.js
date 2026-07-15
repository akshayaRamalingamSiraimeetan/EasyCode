import api from "./api";

/**
 * Run code against custom input (no test cases).
 * POST /api/compiler/run
 */
export const runCode = (language, code, input) =>
  api.post("/compiler/run", { language, code, input });

/**
 * Submit solution for judging against all stored test cases.
 * POST /api/compiler/submit
 */
export const submitSolution = (language, code, problemId) =>
  api.post("/compiler/submit", { language, code, problemId });
