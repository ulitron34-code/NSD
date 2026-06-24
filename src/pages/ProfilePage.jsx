import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNotification } from "../hooks/useNotification";
import { COLORS } from "../utils/constants";
import ApiKeysPanel from "../components/Profile/ApiKeysPanel";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { addNotification } = useNotification();
  const [activeTab, setActiveTab] = useState("perfil");
  const [editMode, setEditMode] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: "Usuario",
    company: "",
    phone: "",
    address: "",
  });

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({...prev, [name]: value}));
  };

  const handleSaveProfile = async () => {
    // Aquí iría llamada a API para guardar perfil
    addNotification("Perfil actualizado correctamente", "success");
    setEditMode(false);
  };

  const handleLogout = () => {
    logout();
    addNotification("Sesión cerrada", "success");
  };

  return (
    <div style={{display: "flex", minHeight: "calc(100vh - 80px)"}}>
      {/* Sidebar */}
      <aside style={{
        width: "250px",
        background: COLORS.navy,
        color: COLORS.white,
        padding: "2rem 1rem",
        position: "sticky",
        top: "80px",
      }}>
        <div style={{marginBottom: "2rem", textAlign: "center"}}>
          <div style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            background: COLORS.gold,
            margin: "0 auto 1rem",
          }}></div>
          <p style={{fontWeight: "600", fontSize: "0.95rem"}}>{user?.email}</p>
        </div>

        <hr style={{borderColor: "rgba(255,255,255,0.2)", margin: "1.5rem 0"}} />

        <nav style={{display: "flex", flexDirection: "column", gap: "0.5rem"}}>
          {[
            {id: "perfil", label: "Mi Perfil", icon: "👤"},
            {id: "seguridad", label: "Seguridad", icon: "🔒"},
            {id: "apikeys", label: "API Keys", icon: "🔑"},
            {id: "historial", label: "Historial", icon: "📊"},
            {id: "descargas", label: "Descargas", icon: "📥"},
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                background: activeTab === item.id ? COLORS.gold : "transparent",
                color: activeTab === item.id ? COLORS.navy : COLORS.white,
                border: "none",
                padding: "0.75rem 1rem",
                borderRadius: "6px",
                cursor: "pointer",
                textAlign: "left",
                fontWeight: activeTab === item.id ? "600" : "400",
                transition: "all 0.3s",
              }}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </nav>

        <hr style={{borderColor: "rgba(255,255,255,0.2)", margin: "1.5rem 0"}} />

        <button
          onClick={handleLogout}
          style={{
            width: "100%",
            padding: "0.75rem 1rem",
            background: "transparent",
            color: COLORS.white,
            border: `2px solid ${COLORS.white}`,
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          🚪 Cerrar Sesión
        </button>
      </aside>

      {/* Main Content */}
      <main style={{
        flex: 1,
        padding: "2rem",
        background: COLORS.bg,
      }}>
        <div style={{maxWidth: "900px"}}>
          {/* Mi Perfil */}
          {activeTab === "perfil" && (
            <div>
              <h1 style={{color: COLORS.navy, fontSize: "2rem", marginBottom: "2rem"}}>
                Mi Perfil
              </h1>

              {editMode ? (
                <div style={{
                  background: COLORS.white,
                  padding: "2rem",
                  borderRadius: "8px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                }}>
                  <div style={{display: "grid", gap: "1.5rem"}}>
                    {[
                      {label: "Nombre Completo", name: "fullName"},
                      {label: "Empresa", name: "company"},
                      {label: "Teléfono", name: "phone"},
                      {label: "Dirección", name: "address"},
                    ].map((field) => (
                      <div key={field.name}>
                        <label style={{
                          display: "block",
                          color: COLORS.navy,
                          fontWeight: "600",
                          marginBottom: "0.5rem",
                        }}>
                          {field.label}
                        </label>
                        <input
                          type="text"
                          name={field.name}
                          value={profileData[field.name]}
                          onChange={handleProfileChange}
                          style={{
                            width: "100%",
                            padding: "0.75rem 1rem",
                            border: `1px solid ${COLORS.border}`,
                            borderRadius: "6px",
                          }}
                        />
                      </div>
                    ))}
                  </div>

                  <div style={{display: "flex", gap: "1rem", marginTop: "2rem"}}>
                    <button
                      onClick={handleSaveProfile}
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
                      Guardar Cambios
                    </button>
                    <button
                      onClick={() => setEditMode(false)}
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
              ) : (
                <div style={{
                  background: COLORS.white,
                  padding: "2rem",
                  borderRadius: "8px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                }}>
                  {[
                    {label: "Email", value: user?.email},
                    {label: "Nombre", value: profileData.fullName},
                    {label: "Empresa", value: profileData.company || "No especificado"},
                    {label: "Teléfono", value: profileData.phone || "No especificado"},
                  ].map((item, i) => (
                    <div key={i} style={{
                      display: "grid",
                      gridTemplateColumns: "150px 1fr",
                      gap: "2rem",
                      padding: "1rem 0",
                      borderBottom: i < 3 ? `1px solid ${COLORS.border}` : "none",
                    }}>
                      <p style={{color: COLORS.textMuted, fontWeight: "600"}}>
                        {item.label}
                      </p>
                      <p style={{color: COLORS.navy}}>{item.value}</p>
                    </div>
                  ))}

                  <button
                    onClick={() => setEditMode(true)}
                    style={{
                      marginTop: "2rem",
                      padding: "0.75rem 2rem",
                      background: COLORS.gold,
                      color: COLORS.navy,
                      border: "none",
                      borderRadius: "6px",
                      fontWeight: "600",
                      cursor: "pointer",
                    }}
                  >
                    Editar Perfil
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Seguridad */}
          {activeTab === "seguridad" && (
            <div>
              <h1 style={{color: COLORS.navy, fontSize: "2rem", marginBottom: "2rem"}}>
                Seguridad
              </h1>
              <div style={{
                background: COLORS.white,
                padding: "2rem",
                borderRadius: "8px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              }}>
                <div style={{marginBottom: "2rem"}}>
                  <h3 style={{color: COLORS.navy, fontWeight: "600", marginBottom: "1rem"}}>
                    Cambiar Contraseña
                  </h3>
                  <button style={{
                    padding: "0.75rem 1.5rem",
                    background: COLORS.gold,
                    color: COLORS.navy,
                    border: "none",
                    borderRadius: "6px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}>
                    Cambiar Contraseña
                  </button>
                </div>

                <hr style={{borderColor: COLORS.border, margin: "2rem 0"}} />

                <div>
                  <h3 style={{color: COLORS.navy, fontWeight: "600", marginBottom: "1rem"}}>
                    Autenticación de Dos Factores
                  </h3>
                  <p style={{color: COLORS.textMuted, marginBottom: "1rem"}}>
                    Protege tu cuenta con autenticación de dos factores
                  </p>
                  <button style={{
                    padding: "0.75rem 1.5rem",
                    background: "transparent",
                    color: COLORS.navy,
                    border: `2px solid ${COLORS.gold}`,
                    borderRadius: "6px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}>
                    Configurar 2FA
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* API Keys */}
          {activeTab === "apikeys" && (
            <ApiKeysPanel />
          )}

          {/* Historial */}
          {activeTab === "historial" && (
            <div>
              <h1 style={{color: COLORS.navy, fontSize: "2rem", marginBottom: "2rem"}}>
                Historial de Análisis
              </h1>
              <div style={{
                background: COLORS.white,
                padding: "2rem",
                borderRadius: "8px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              }}>
                <p style={{color: COLORS.textMuted}}>
                  Sin análisis previos. Comienza un nuevo análisis en el dashboard.
                </p>
              </div>
            </div>
          )}

          {/* Descargas */}
          {activeTab === "descargas" && (
            <div>
              <h1 style={{color: COLORS.navy, fontSize: "2rem", marginBottom: "2rem"}}>
                Centro de Descargas
              </h1>
              <div style={{
                background: COLORS.white,
                padding: "2rem",
                borderRadius: "8px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              }}>
                <p style={{color: COLORS.textMuted, marginBottom: "2rem"}}>
                  Descarga tus reportes, documentos y análisis.
                </p>
                <p style={{color: COLORS.textMuted}}>
                  Sin reportes disponibles aún.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
