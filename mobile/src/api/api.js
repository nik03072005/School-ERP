import axios from "axios";
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "school_erp_token";
const CLOUD_API_URL = "https://school-erp-c90u.onrender.com/api";

const resolveApiBaseUrl = () => {
  // Optional explicit override.
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) return envUrl.trim();

  // Always default to deployed backend.
  return CLOUD_API_URL;
};

const API = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 30000,
});

// Inject Bearer token on every request
API.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // SecureStore not available (e.g. web preview) — skip
  }
  return config;
});

export default API;