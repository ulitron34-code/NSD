import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { COLORS } from "../utils/constants";
import SolicitantesTab from "../components/Dashboard/SolicitantesTab";
import CumplimientoTab from "../components/Dashboard/CumplimientoTab";
import ProyectosTab from "../components/Dashboard/ProyectosTab";
import OtorgantesTab from "../components/Dashboard/OtorgantesTab";
import DashboardStats from "../components/Dashboard/DashboardStats";
import RecentActivityFeed from "../components/Dashboard/RecentActivityFeed";

const tabs = [
  { id: "inicio",       label: "Inicio",       icon: "🏠" },
  { id: "solicitantes", label: "Solicitantes",  icon: "👥" },
  { id: "cumplimiento", label: "Cumplimiento",  icon: "✓"  },
  { id: "proyectos",    label: "Mis Proyectos", icon: "📁" },
  { id: "otorgantes",   label: "Otorgantes",    icon: "🏦" },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("inicio");

  const renderContent = () => {
    switch (activeTab) {
      case "solicitantes": return <SolicitantesTab />;
      case "cumplimiento": return <CumplimientoTab />;
      case "proyectos":    return <ProyectosTab />;
      case "otorgantes":   return <OtorgantesTab />;
      default:
        return (
          <div>
            {/* Welcome Banner */}
            <div style={{
              background: "linear-gradient(135deg, #0F1F2E 0%, #1B3A5C 60%, #2A527A 100%)",
              borderRadius: "16px",
              padding: "2rem 2.5rem",
              marginBottom: "2rem",
              color: "white",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: "0 8px 32px rgba(15,31,46,0.35)",
            }}>
              <div>
                <p style={{ fontSize: "0.85rem", opacity: 0.7, marginBottom: "0.35rem", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  Bienvenido de vuelta
                </p>
                <h1 style={{ fontSize: "1.8rem", fontWeight: 800, color: "white", marginBottom: "0.5rem" }}>
                  Dashboard NSD
                </h1>
                <p style={{ opacity: 0.75, fontSize: "0.95rem" }}>
                  {user?.email}
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{
                  background: "rgba(201,168,76,0.15)",
                  border: "1px solid rgba(201,168,76,0.4)",
                  borderRadius: "12px",
                  padding: "1rem 1.5rem",
                }}>
                  <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.75rem", marginBottom: "0.25rem" }}>Sistema</p>
                  <p style={{ color: "#E4C878", fontWeight: 700, fontSize: "1.1rem" }}>🟢 Operativo</p>
                </div>
              </div>
            </div>

            {/* KPIs + Charts */}
            <DashboardStats />

            {/* Activity + Quick Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginTop: "1.5rem" }}>
              <RecentActivityFeed />

              <div className="card">
                <h2 style={{ fontSize: "1rem", fontWeight: 700, color: COLORS.navy, marginBottom: "1.25rem", letterSpacing: "0.03em" }}>
                  RESUMEN RÁPIDO
                </h2>
                <div style={{ display: "grid", gap: "0.75rem" }}>
                  {[
                    { label: "Análisis Hoy",          value: "8",  color: COLORS.navy },
                    { label: "Documentos Pendientes",  value: "3",  color: COLORS.amber },
                    { label: "Proyectos en Revisión",  value: "5",  color: COLORS.amber },
                    { label: "Lenders Disponibles",    value: "12", color: COLORS.green },
                  ].map((stat, i) => (
                    <div key={i} style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "0.875rem 1rem",
                      background: COLORS.bg,
                      borderRadius: "8px",
                      transition: "all 0.2s",
                    }}>
                      <p style={{ color: COLORS.text, fontWeight: 500, fontSize: "0.9rem" }}>{stat.label}</p>
                      <p style={{ color: stat.color, fontWeight: 800, fontSize: "1.3rem" }}>{stat.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "calc(100vh - 72px)" }}>
      {/* Sidebar */}
      <aside style={{
        width: "260px",
        background: "linear-gradient(180deg, #0F1F2E 0%, #1B3A5C 100%)",
        padding: "1.75rem 1rem",
        position: "sticky",
        top: "72px",
        maxHeight: "calc(100vh - 72px)",
        overflowY: "auto",
        flexShrink: 0,
      }}>
        {/* User info */}
        <div style={{
          padding: "1rem",
          background: "rgba(255,255,255,0.06)",
          borderRadius: "10px",
          marginBottom: "1.5rem",
          border: "1px solid rgba(255,255,255,0.1)",
        }}>
          <div style={{
            width: "40px", height: "40px", borderRadius: "50%",
            background: "linear-gradient(135deg, #C9A84C, #E4C878)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 800, fontSize: "1rem", color: "#1B3A5C",
            marginBottom: "0.75rem",
          }}>
            {user?.email?.[0]?.toUpperCase() || "U"}
          </div>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.72rem", marginBottom: "0.2rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Usuario
          </p>
          <p style={{ color: "white", fontWeight: 600, fontSize: "0.82rem", wordBreak: "break-word" }}>
            {user?.email}
          </p>
        </div>

        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", paddingLeft: "0.5rem", marginBottom: "0.75rem" }}>
          Navegación
        </p>

        <nav style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`sidebar-tab ${activeTab === tab.id ? "active" : ""}`}
            >
              <span style={{ fontSize: "1rem" }}>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Bottom divider */}
        <div style={{ marginTop: "auto", paddingTop: "2rem" }}>
          <div style={{ height: "1px", background: "rgba(255,255,255,0.08)", marginBottom: "1rem" }} />
          <p style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.7rem", textAlign: "center" }}>
            NSD International Finance
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{
        flex: 1,
        padding: "2rem",
        background: "var(--bg)",
        overflowY: "auto",
        minWidth: 0,
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
