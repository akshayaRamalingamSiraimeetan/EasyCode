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

/* ===========================
   Test Case Service Functions
=========================== */

/*
 * Get all test cases for a problem
 */
export const getTestCases = async (problemId) => {
  return api.get(`/problems/${problemId}/testcases`);
};

/*
 * Create a test case for a problem
 */
export const createTestCase = async (problemId, data) => {
  return api.post(`/problems/${problemId}/testcases`, data);
};

/*
 * Update a test case by its UUID
 */
export const updateTestCase = async (tcId, data) => {
  return api.put(`/problems/testcases/${tcId}`, data);
};

/*
 * Delete a test case by its UUID
 */
export const deleteTestCase = async (tcId) => {
  return api.delete(`/problems/testcases/${tcId}`);
};