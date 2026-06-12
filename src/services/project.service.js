import { error, debug, info, warn } from '../utils/logger';
import api from "./auth.service";

export const projectService = {
  // Obtener todos los proyectos del usuario
  getProjects: async (status = null) => {
    try {
      const params = status ? { status } : {};
      const response = await api.get("/api/projects", { params });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Error obteniendo proyectos",
      };
    }
  },

  // Obtener un proyecto específico
  getProject: async (projectId) => {
    try {
      const response = await api.get(`/api/projects/${projectId}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Error obteniendo proyecto",
      };
    }
  },

  // Crear nuevo proyecto
  createProject: async (projectData) => {
    try {
      const response = await api.post("/api/projects", projectData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Error creando proyecto",
      };
    }
  },

  // Actualizar proyecto
  updateProject: async (projectId, projectData) => {
    try {
      const response = await api.put(`/api/projects/${projectId}`, projectData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Error actualizando proyecto",
      };
    }
  },

  // Eliminar proyecto
  deleteProject: async (projectId) => {
    try {
      const response = await api.delete(`/api/projects/${projectId}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Error eliminando proyecto",
      };
    }
  },
};

export default projectService;
