import { error, debug, info, warn } from '../utils/logger';
import axios from "axios";
import { API_URL } from "./api";

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "true";
const DEMO_EMAILS = new Set(["demo@nsd.local", "compliance.demo@nsd.local"]);

function buildDemoSession(email, role = "compliance_officer") {
  return {
    success: true,
    data: {
      access_token: "demo_token_123",
      user_id: "demo-compliance",
      user: { email, role, demo: true },
    },
  };
}

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const authService = {
  login: async (email, password) => {
    try {
      if (DEMO_MODE && DEMO_EMAILS.has(String(email).toLowerCase()) && password === "demo12345") {
        return buildDemoSession(email);
      }

      const response = await api.post("/auth/login", {
        email,
        password,
      });
      return {
        success: true,
        data: {
          access_token: response.data.token,
          user_id: response.data.user?.id,
          user: response.data.user,
        },
      };
    } catch (error) {
      if (DEMO_MODE && (error.message === "Network Error" || !error.response)) {
        return buildDemoSession(email);
      }
      const fallbackMessage =
        error.code === "ECONNABORTED"
          ? "El servidor tardó demasiado en responder. Intenta de nuevo o usa modo demo local."
          : "Error en login";

      return {
        success: false,
        error: error.response?.data?.detail || error.response?.data?.message || error.response?.data?.error || fallbackMessage,
      };
    }
  },

  signup: async (email, password, role = "solicitante") => {
    try {
      const response = await api.post("/auth/register", {
        email,
        password,
        profileType: role,
      });
      return {
        success: true,
        data: {
          access_token: response.data.token,
          user_id: response.data.user?.id,
          user: response.data.user,
        },
      };
    } catch (error) {
      if (DEMO_MODE && (error.message === "Network Error" || !error.response)) {
        return buildDemoSession(email, role);
      }
      return {
        success: false,
        error: error.response?.data?.detail || error.response?.data?.message || error.response?.data?.error || "Error en registro",
      };
    }
  },

  validateToken: async () => {
    try {
      const response = await api.get("/auth/me");
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: "Token invalido",
      };
    }
  },

  logout: () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
  },
};

export default api;
