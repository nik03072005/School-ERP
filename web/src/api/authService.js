import API from "./api";

export const authService = {
  login: async (payload) => {
    const response = await API.post("/auth/login", payload);
    return response.data;
  },

  getMe: async () => {
    const response = await API.get("/auth/me");
    return response.data;
  },

  logout: async () => {
    const response = await API.post("/auth/logout");
    return response.data;
  },

  forgotPassword: async (payload) => {
    const response = await API.post("/auth/forgot-password", payload);
    return response.data;
  },

  changePassword: async (payload) => {
    const response = await API.patch("/auth/change-password", payload);
    return response.data;
  },
};
