import React, { useState, useEffect } from "react";
import { useNotification } from "../../hooks/useNotification";
import { projectService } from "../../services/project.service";
import { COLORS } from "../../utils/constants";

export default function ProyectosTab() {
  const { addNotification } = useNotification();
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    sector: "",
    status: "draft",
  });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setIsLoading(true);
    const response = await projectService.getProjects();
    if (response.success) {
      setProjects(response.data);
    } else {
      addNotification(response.error, "error");
    }
    setIsLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.description) {
      addNotification("Completa todos los campos", "error");
      return;
    }

    if (selectedProject) {
      // Update
      const response = await projectService.updateProject(selectedProject.id, formData);
      if (response.success) {
        addNotification("Proyecto actualizado", "success");
        loadProjects();
      } else {
        addNotification(response.error, "error");
      }
    } else {
      // Create
      const response = await projectService.createProject(formData);
      if (response.success) {
        addNotification("Proyecto creado", "success");
        loadProjects();
      } else {
        addNotification(response.error, "error");
      }
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({title: "", description: "", sector: "", status: "draft"});
    setSelectedProject(null);
    setShowForm(false);
  };

  const handleEdit = (project) => {
    setSelectedProject(project);
    setFormData({
      title: project.title,
      description: project.description,
      sector: project.sector,
      status: project.status,
    });
    setShowForm(true);
  };

  const handleDelete = async (projectId) => {
    if (window.confirm("¿Eliminar proyecto?")) {
      const response = await projectService.deleteProject(projectId);
      if (response.success) {
        addNotification("Proyecto eliminado", "success");
        loadProjects();
      } else {
        addNotification(response.error, "error");
      }
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      "draft": COLORS.textMuted,
      "submitted": COLORS.amber,
      "approved": COLORS.green,
      "funded": COLORS.navy,
    };
    return colors[status] || COLORS.navy;
  };

  return (
    <div>
      <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem"}}>
        <h1 style={{color: COLORS.navy, fontSize: "2rem"}}>
          Mis Proyectos
        </h1>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: "0.75rem 1.5rem",
            background: COLORS.gold,
            color: COLORS.navy,
            border: "none",
            borderRadius: "6px",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          {showForm ? "Cancelar" : "+ Nuevo Proyecto"}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{
          background: COLORS.white,
          padding: "2rem",
          borderRadius: "8px",
          marginBottom: "2rem",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}>
          <form onSubmit={handleSubmit}>
            <div style={{display: "grid", gap: "1.5rem"}}>
              {/* Title */}
              <div>
                <label style={{
                  display: "block",
                  color: COLORS.navy,
                  fontWeight: "600",
                  marginBottom: "0.5rem",
                  fontSize: "0.9rem",
                }}>
                  Título del Proyecto
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Ej: Desarrollo Inmobiliario XYZ"
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: "6px",
                    fontSize: "1rem",
                  }}
                />
              </div>

              {/* Description */}
              <div>
                <label style={{
                  display: "block",
                  color: COLORS.navy,
                  fontWeight: "600",
                  marginBottom: "0.5rem",
                  fontSize: "0.9rem",
                }}>
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Descripción del proyecto..."
                  rows="5"
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: "6px",
                    fontSize: "1rem",
                    fontFamily: "inherit",
                  }}
                />
              </div>

              {/* Sector */}
              <div>
                <label style={{
                  display: "block",
                  color: COLORS.navy,
                  fontWeight: "600",
                  marginBottom: "0.5rem",
                  fontSize: "0.9rem",
                }}>
                  Sector
                </label>
                <select
                  value={formData.sector}
                  onChange={(e) => setFormData({...formData, sector: e.target.value})}
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: "6px",
                    fontSize: "1rem",
                  }}
                >
                  <option>Selecciona un sector</option>
                  <option>Tecnología</option>
                  <option>Inmobiliario</option>
                  <option>Agrícola</option>
                  <option>Energía</option>
                  <option>Otro</option>
                </select>
              </div>

              {/* Buttons */}
              <div style={{display: "flex", gap: "1rem"}}>
                <button
                  type="submit"
                  style={{
                    padding: "0.75rem 2rem",
                    background: COLORS.gold,
                    color: COLORS.navy,
                    border: "none",
                    borderRadius: "6px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  {selectedProject ? "Actualizar" : "Crear"} Proyecto
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  style={{
                    padding: "0.75rem 2rem",
                    background: "transparent",
                    color: COLORS.navy,
                    border: `2px solid ${COLORS.border}`,
                    borderRadius: "6px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Projects List */}
      <div style={{
        background: COLORS.white,
        padding: "2rem",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      }}>
        {isLoading ? (
          <p style={{color: COLORS.textMuted}}>Cargando proyectos...</p>
        ) : projects.length === 0 ? (
          <p style={{color: COLORS.textMuted}}>Sin proyectos. Crea uno nuevo para comenzar.</p>
        ) : (
          <div style={{display: "grid", gap: "1rem"}}>
            {projects.map((project) => (
              <div key={project.id} style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                alignItems: "center",
                gap: "1.5rem",
                padding: "1.5rem",
                background: COLORS.bg,
                borderRadius: "6px",
                border: `1px solid ${COLORS.border}`,
              }}>
                <div>
                  <h3 style={{color: COLORS.navy, marginBottom: "0.5rem", fontWeight: "600"}}>
                    {project.title}
                  </h3>
                  <p style={{color: COLORS.textMuted, marginBottom: "0.5rem", fontSize: "0.9rem"}}>
                    {project.description}
                  </p>
                  <div style={{display: "flex", gap: "1rem", fontSize: "0.85rem"}}>
                    <span style={{
                      color: COLORS.textMuted,
                      background: COLORS.white,
                      padding: "0.25rem 0.75rem",
                      borderRadius: "4px",
                    }}>
                      {project.sector}
                    </span>
                    <span style={{
                      color: getStatusColor(project.status),
                      fontWeight: "600",
                    }}>
                      {project.status}
                    </span>
                  </div>
                </div>

                <div style={{display: "flex", gap: "0.5rem"}}>
                  <button
                    onClick={() => handleEdit(project)}
                    style={{
                      padding: "0.5rem 1rem",
                      background: COLORS.gold,
                      color: COLORS.navy,
                      border: "none",
                      borderRadius: "4px",
                      fontWeight: "600",
                      cursor: "pointer",
                      fontSize: "0.85rem",
                    }}
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(project.id)}
                    style={{
                      padding: "0.5rem 1rem",
                      background: "#D32F2F",
                      color: COLORS.white,
                      border: "none",
                      borderRadius: "4px",
                      fontWeight: "600",
                      cursor: "pointer",
                      fontSize: "0.85rem",
                    }}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
