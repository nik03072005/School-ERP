import axios from "axios";

export const TOKEN_KEY = "school_erp_token";
export const AUTH_UNAUTHORIZED_EVENT = "auth:unauthorized";

const resolveApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  return "http://localhost:5000/api";
};

const API = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 30000,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url || "";
    const isAuthRoute = url.includes("/auth/login") || url.includes("/auth/forgot-password");

    if (status === 401 && !isAuthRoute) {
      localStorage.removeItem(TOKEN_KEY);
      window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT));
    }

    return Promise.reject(error);
  }
);

export default API;
