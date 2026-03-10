import axios from "axios";
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "school_erp_token";

const API = axios.create({
  baseURL: "http://192.168.11.235:5000/api",
  timeout: 10000,
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