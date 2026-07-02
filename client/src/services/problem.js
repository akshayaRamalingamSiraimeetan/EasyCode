import api from "./api";

/*
 * Get all problems
 */
export const getAllProblems = async () => {
  return api.get("/problems");
};

/*
 * Get problem by ID
 */
export const getProblemById = async (id) => {
  return api.get(`/problems/${id}`);
};

/*
 * Create problem
 */
export const createProblem = async (problemData) => {
  return api.post("/problems", problemData);
};

/*
 * Update problem
 */
export const updateProblem = async (id, problemData) => {
  return api.put(`/problems/${id}`, problemData);
};

/*
 * Delete problem
 */
export const deleteProblem = async (id) => {
  return api.delete(`/problems/${id}`);
};