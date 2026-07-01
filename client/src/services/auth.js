import api from "./api";

export const register = async (formData) => {
  return api.post("/auth/register", {
    username: formData.username,
    email: formData.email,
    password: formData.password,
  });
};

export const login = async (formData) => {
  return api.post("/auth/login", {
    email: formData.email,
    password: formData.password,
  });
};

export const getCurrentUser = async () => {
  return api.get("/auth/me");
};