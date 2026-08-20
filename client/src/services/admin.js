import api from "./api";

/**
 * GET /api/admin/stats
 * Returns platform-wide statistics: totalUsers, totalSubmissions.
 * Only callable by admin users — the backend enforces this.
 */
export const getPlatformStats = () => api.get("/admin/stats");

/**
 * GET /api/admin/users
 * Returns paginated list of all users with statistics.
 * Only callable by admin users.
 */
export const getAllUsers = (page = 1, limit = 50, search = "") => {
  const params = new URLSearchParams({ page, limit });
  if (search) params.append("search", search);
  return api.get(`/admin/users?${params}`);
};

/**
 * GET /api/admin/users/:userId
 * Returns detailed information about a specific user.
 * Only callable by admin users.
 */
export const getUserDetails = (userId) => api.get(`/admin/users/${userId}`);
