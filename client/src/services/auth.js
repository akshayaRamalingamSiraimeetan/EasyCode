import api from "./api";

export const register = async (formData) => {
  return api.post("/auth/register", {
    username: formData.username,
    email: formData.email,
    password: formData.password,
  });
};

