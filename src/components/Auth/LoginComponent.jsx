import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useNotification } from "../../hooks/useNotification";
import { authService } from "../../services/auth.service";
import { validateEmail, validatePassword } from "../../utils/validators";
import { COLORS } from "../../utils/constants";
import { useTranslation } from "react-i18next";
import { uiText } from "../../utils/runtimeCopy";

export default function LoginComponent() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { addNotification } = useNotification();
  const { i18n } = useTranslation();
  const demoMode = import.meta.env.VITE_DEMO_MODE === "true";
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = uiText(i18n, "Email es requerido", "Email is required");
    } else if (!validateEmail(formData.email)) {
      newErrors.email = uiText(i18n, "Email invalido", "Invalid email");
    }

    if (!formData.password) {
      newErrors.password = uiText(i18n, "Contraseña es requerida", "Password is required");
    } else if (!validatePassword(formData.password)) {
      newErrors.password = uiText(i18n, "Minimo 8 caracteres", "Minimum 8 characters");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const enterDemo = () => {
    if (!demoMode) {
      addNotification(uiText(i18n, "Modo demo desactivado en este entorno", "Demo mode is disabled in this environment"), "warning");
      return;
    }

    login(
      {
        id: "demo-compliance",
        email: "compliance.demo@nsd.local",
        role: "compliance_officer",
        demo: true,
      },
      "demo_token_123"
    );
    addNotification(uiText(i18n, "Modo demo iniciado", "Demo mode started"), "success");
    navigate("/dashboard");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      addNotification(uiText(i18n, "Por favor corrige los errores", "Please fix the errors"), "error");
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.login(formData.email, formData.password);

      if (response.success) {
        const userData = {
          id: response.data.user_id,
          email: formData.email,
          role: response.data.user?.role || response.data.role || "compliance_officer",
          demo: response.data.user?.demo,
        };
        login(userData, response.data.access_token);
        addNotification(uiText(i18n, "Bienvenido", "Welcome"), "success");
        navigate("/dashboard");
      } else {
        addNotification(response.error || uiText(i18n, "No se pudo iniciar sesión", "Could not sign in"), "error");
      }
    } catch (error) {
      console.error("Login error:", error);
      addNotification(uiText(i18n, "Error en el servidor", "Server error"), "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "calc(100vh - 80px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: COLORS.bg,
      padding: "2rem",
    }}>
      <div style={{
        width: "100%",
        maxWidth: "470px",
        background: COLORS.white,
        padding: "3rem",
        borderRadius: "12px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
      }}>
        <h1 style={{
          color: COLORS.navy,
          fontSize: "1.8rem",
          marginBottom: "0.5rem",
          textAlign: "center",
        }}>
          {uiText(i18n, "Acceso a NEXUS Platform", "Access NEXUS Platform")}
        </h1>
        <p style={{
          color: COLORS.textMuted,
          textAlign: "center",
          marginBottom: "1.5rem",
          fontSize: "0.95rem",
        }}>
          {uiText(i18n, "Ingresa al centro de cumplimiento, expedientes y auditoria.", "Enter the compliance, files and audit center.")}
        </p>

        {demoMode && (
          <>
            <button
              type="button"
              onClick={enterDemo}
              style={{
                width: "100%",
                padding: "0.9rem",
                background: "rgba(27,58,92,0.08)",
                color: COLORS.navy,
                border: `1px solid ${COLORS.border}`,
                borderRadius: "8px",
                fontWeight: 800,
                fontSize: "0.98rem",
                cursor: "pointer",
                marginBottom: "1rem",
              }}
            >
              {uiText(i18n, "Entrar en modo demo", "Enter Demo Mode")}
            </button>

            <div style={{
              background: COLORS.goldPale,
              color: COLORS.amber,
              borderRadius: "8px",
              padding: "0.8rem 1rem",
              fontSize: "0.85rem",
              fontWeight: 600,
              marginBottom: "1.5rem",
            }}>
              {uiText(i18n, "Demo local: usa demo@nsd.local / demo12345 o el boton de modo demo.", "Local demo: use demo@nsd.local / demo12345 or the demo mode button.")}
            </div>
          </>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ display: "block", color: COLORS.navy, fontWeight: 700, marginBottom: "0.5rem", fontSize: "0.9rem" }}>
              {uiText(i18n, "Email", "Email")}
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="tu@email.com"
              style={{
                border: errors.email ? "2px solid #D32F2F" : `1px solid ${COLORS.border}`,
              }}
            />
            {errors.email && <p style={{ color: "#D32F2F", fontSize: "0.8rem", marginTop: "0.25rem" }}>{errors.email}</p>}
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", color: COLORS.navy, fontWeight: 700, marginBottom: "0.5rem", fontSize: "0.9rem" }}>
              {uiText(i18n, "Contraseña", "Password")}
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="********"
              style={{
                border: errors.password ? "2px solid #D32F2F" : `1px solid ${COLORS.border}`,
              }}
            />
            {errors.password && <p style={{ color: "#D32F2F", fontSize: "0.8rem", marginTop: "0.25rem" }}>{errors.password}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: "100%",
              padding: "0.9rem",
              background: isLoading ? "rgba(201, 168, 76, 0.6)" : COLORS.gold,
              color: COLORS.navy,
              border: "none",
              borderRadius: "6px",
              fontWeight: 800,
              fontSize: "1rem",
              cursor: isLoading ? "not-allowed" : "pointer",
            }}
          >
            {isLoading ? uiText(i18n, "Conectando...", "Connecting...") : uiText(i18n, "Iniciar sesión", "Sign In")}
          </button>
        </form>

        <div style={{ marginTop: "2rem", textAlign: "center", fontSize: "0.9rem", color: COLORS.textMuted }}>
          <p>
            {uiText(i18n, "No tienes cuenta?", "Do not have an account?")}{" "}
            <a
              onClick={() => navigate("/signup")}
              style={{ color: COLORS.gold, fontWeight: 700, cursor: "pointer", textDecoration: "none" }}
            >
              {uiText(i18n, "Registrate aqui", "Register here")}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
