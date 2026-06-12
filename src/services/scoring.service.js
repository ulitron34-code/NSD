import { error, debug, info, warn } from '../utils/logger';
import api from "./auth.service";

export const scoringService = {
  // Validar RFC
  validateRFC: async (rfc) => {
    try {
      const response = await api.post("/api/scoring/validate-rfc", { rfc });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      // MODO DEMO PARA NETLIFY: Simular backend
      if (error.message === "Network Error" || !error.response) {
        return {
          success: true,
          data: {
            status: "success",
            rfc_validation: { valid: true, status: "Activo" },
            credit_score: { score: 750, grade: "A" },
            nsd_score: 85.4,
            nsd_scoring: { final_score: 85.4, grade: "A", recommendation: "APROBADO INTERNACIONALMENTE" },
            global_risk: { global_risk: "🟢 BAJO RIESGO" },
            flags: [],
            recommendation: "APROBADO INTERNACIONALMENTE"
          }
        };
      }
      return {
        success: false,
        error: error.response?.data?.message || "Error validando RFC",
      };
    }
  },

  // Obtener historial de búsquedas
  getSearchHistory: async () => {
    try {
      const response = await api.get("/api/scoring/history");
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      if (error.message === "Network Error" || !error.response) {
        return {
          success: true,
          data: [
            { rfc: "SADU730311KF1", score: 85.4, timestamp: new Date().toISOString() }
          ]
        };
      }
      return {
        success: false,
        error: error.response?.data?.message || "Error obteniendo historial",
      };
    }
  },

  // Obtener detalles de un análisis anterior
  getAnalysisDetails: async (analysisId) => {
    try {
      const response = await api.get(`/api/scoring/${analysisId}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Error obteniendo detalles",
      };
    }
  },
};

export default scoringService;
