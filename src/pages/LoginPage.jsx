import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { ROLES, createDemoUsers } from "../services/authService";
import { COLORS } from "../utils/constants";

export default function LoginPage({ onLoginSuccess }) {
  const { login, error, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showDemoInfo, setShowDemoInfo] = useState(true);
  const [demoUsers] = useState(createDemoUsers());

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      onLoginSuccess?.();
    } catch (err) {
      // Error manejado en useAuth
    }
  };

  const handleDemoLogin = async (demoEmail) => {
    try {
      await login(demoEmail, "1234");
      onLoginSuccess?.();
    } catch (err) {
      // Error manejado
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0F1F2E 0%, #1B3A5C 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem"
    }}>
      <div style={{
        maxWidth: "420px",
        width: "100%"
      }}>
        {/* LOGO/HEADER */}
        <div style={{
          textAlign: "center",
          marginBottom: "2.5rem",
          color: "white"
        }}>
          <div style={{
            fontSize: "3rem",
            marginBottom: "1rem"
          }}>
            🔐
          </div>
          <h1 style={{
            fontSize: "2rem",
            margin: "0 0 0.5rem 0",
            fontWeight: 800
          }}>
            NSD Platform
          </h1>
          <p style={{
            color: "rgba(255,255,255,0.6)",
            margin: 0,
            fontSize: "0.9rem"
          }}>
            Cumplimiento y Matching Financiero
          </p>
        </div>

        {/* FORMULARIO LOGIN */}
        <div style={{
          background: "white",
          padding: "2rem",
          borderRadius: "12px",
          boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
          marginBottom: "2rem"
        }}>
          <h2 style={{
            color: COLORS.navy,
            marginTop: 0,
            fontSize: "1.3rem",
            marginBottom: "1.5rem"
          }}>
            Inicia Sesión
          </h2>

          {error && (
            <div style={{
              background: "#FFEBEE",
              color: "#C62828",
              padding: "1rem",
              borderRadius: "8px",
              marginBottom: "1rem",
              fontSize: "0.9rem",
              fontWeight: 600
            }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: "grid", gap: "1rem" }}>
            <div>
              <label style={{
                display: "block",
                marginBottom: "0.5rem",
                color: COLORS.navy,
                fontWeight: 700,
                fontSize: "0.9rem"
              }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "6px",
                  fontSize: "1rem",
                  boxSizing: "border-box"
                }}
                required
              />
            </div>

            <div>
              <label style={{
                display: "block",
                marginBottom: "0.5rem",
                color: COLORS.navy,
                fontWeight: 700,
                fontSize: "0.9rem"
              }}>
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "6px",
                  fontSize: "1rem",
                  boxSizing: "border-box"
                }}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "0.75rem",
                background: COLORS.gold,
                color: COLORS.navy,
                border: "none",
                borderRadius: "6px",
                fontWeight: 800,
                fontSize: "1rem",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? "Cargando..." : "Inicia Sesión"}
            </button>
          </form>
        </div>

        {/* DEMO USERS */}
        <div style={{
          background: "rgba(255,255,255,0.1)",
          padding: "1.5rem",
          borderRadius: "12px",
          color: "white",
          backdropFilter: "blur(10px)"
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1rem"
          }}>
            <h3 style={{ color: COLORS.gold, margin: 0, fontSize: "1rem", fontWeight: 700 }}>
              🎯 Acceso Demo
            </h3>
            <button
              onClick={() => setShowDemoInfo(!showDemoInfo)}
              style={{
                background: "transparent",
                border: "none",
                color: "white",
                cursor: "pointer",
                fontSize: "1.2rem"
              }}
            >
              {showDemoInfo ? "▼" : "▶"}
            </button>
          </div>

          {showDemoInfo && (
            <div style={{ display: "grid", gap: "0.75rem" }}>
              {demoUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleDemoLogin(user.email)}
                  style={{
                    padding: "0.75rem",
                    background: "rgba(255,255,255,0.15)",
                    border: `1px solid ${COLORS.gold}`,
                    borderRadius: "6px",
                    color: "white",
                    cursor: "pointer",
                    fontWeight: 600,
                    textAlign: "left",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = "rgba(255,255,255,0.25)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = "rgba(255,255,255,0.15)";
                  }}
                >
                  <div style={{ fontSize: "0.9rem" }}>
                    {user.role === "solicitante" && "🏢"} {user.role === "otorgante" && "🏦"} {user.role === "nsd_admin" && "⚙️"}
                    {" "}{user.name}
                  </div>
                  <div style={{ fontSize: "0.75rem", opacity: 0.7 }}>
                    {user.email} • {user.role}
                  </div>
                </button>
              ))}
              <p style={{
                fontSize: "0.75rem",
                color: "rgba(255,255,255,0.6)",
                margin: "0.75rem 0 0 0",
                textAlign: "center"
              }}>
                Password para todos: <strong>1234</strong>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
