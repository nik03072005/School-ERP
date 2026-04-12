import axios from "axios";
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "school_erp_token";
const CLOUD_API_URL = "https://school-erp-c90u.onrender.com/api";
const LAN_API_URL = "http://192.168.94.235:5000/api";

const resolveApiBaseUrl = () => {
  // Preferred override for all environments.
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) return envUrl;

  // Optional toggle for Android emulator usage.
  if (process.env.EXPO_PUBLIC_USE_ANDROID_EMULATOR === "true") {
    return "http://10.0.2.2:5000/api";
  }

  // Optional toggle for local LAN development.
  if (process.env.EXPO_PUBLIC_USE_LOCAL_LAN === "true") {
    return LAN_API_URL;
  }

  // Default to deployed backend for reliable access across devices.
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