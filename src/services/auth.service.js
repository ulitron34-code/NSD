import axios from "axios";
import { API_BASE_URL } from "../utils/constants";

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Interceptor para agregar token a headers
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
  // Login con email y password
  login: async (email, password) => {
    try {
      const response = await api.post("/api/auth/login", {
        email,
        password,
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      // MODO DEMO PARA NETLIFY: Si no hay conexión al backend, simular éxito
      if (error.message === "Network Error" || !error.response) {
        return {
          success: true,
          data: {
            access_token: "demo_token_123",
            user_id: 1,
            user: { email, role: "solicitante" }
          }
        };
      }
      return {
        success: false,
        error: error.response?.data?.detail || error.response?.data?.message || "Error en login",
      };
    }
  },

  // Signup / Registro
  signup: async (email, password, role = "solicitante") => {
    try {
      const response = await api.post("/api/auth/signup", {
        email,
        password,
        role,
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      // MODO DEMO PARA NETLIFY: Si no hay conexión al backend, simular éxito
      if (error.message === "Network Error" || !error.response) {
        return {
          success: true,
          data: {
            access_token: "demo_token_123",
            user_id: 1,
            user: { email, role }
          }
        };
      }
      return {
        success: false,
        error: error.response?.data?.detail || error.response?.data?.message || "Error en registro",
      };
    }
  },

  // Validar token actual
  validateToken: async () => {
    try {
      const response = await api.get("/api/auth/me");
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: "Token inválido",
      };
    }
  },

  // Logout
  logout: () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
  },
};

export default api;
