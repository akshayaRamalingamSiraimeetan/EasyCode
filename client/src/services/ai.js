import api from "./api";

/**
 * Request a hint from the server.
 *
 * The client talks to the Express server only — never directly to the AI service.
 * The Express server handles auth, fetches the problem from MongoDB,
 * and forwards a clean payload to the AI microservice.
 *
 * @param {Object} params
 * @param {string} params.problemId  - UUID of the problem
 * @param {string} params.language   - e.g. "cpp", "python", "java"
 * @param {string} params.userCode   - The user's current code (can be empty)
 * @param {number} params.hintLevel  - 1 | 2 | 3
 * @returns {Promise<string>} - The hint text
 */
export const requestHint = async ({ problemId, language, userCode, hintLevel }) => {
  const { data } = await api.post("/ai/hint", {
    problemId,
    language,
    userCode,
    hintLevel,
  });

  return data.hint;
};
