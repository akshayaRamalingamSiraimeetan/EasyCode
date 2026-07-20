import api from "./api";

/**
 * GET /api/submissions/me?page=1&limit=20
 */
export const getMySubmissions = (page = 1, limit = 20) =>
  api.get("/submissions/me", { params: { page, limit } });

/**
 * GET /api/submissions/problem/:problemId
 */
export const getSubmissionsByProblem = (problemId) =>
  api.get(`/submissions/problem/${problemId}`);

/**
 * GET /api/submissions/:id   — includes full code
 */
export const getSubmissionById = (id) =>
  api.get(`/submissions/${id}`);
