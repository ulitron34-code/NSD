import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useNotification } from "../../hooks/useNotification";
import { authService } from "../../services/auth.service";
import { validateEmail, validatePassword, getValidationError } from "../../utils/validators";
import { COLORS } from "../../utils/constants";

export default function LoginComponent() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { addNotification } = useNotification();
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // Errors
  const [errors, setErrors] = useState({});

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = "Email es requerido";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Email inválido";
    }

    if (!formData.password) {
      newErrors.password = "Contraseña es requerida";
    } else if (!validatePassword(formData.password)) {
      newErrors.password = "Mínimo 8 caracteres";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      addNotification("Por favor corrige los errores", "error");
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.login(formData.email, formData.password);

      if (response.success) {
        const userData = {
          id: response.data.user_id,
          email: formData.email,
          role: response.data.role,
        };
        login(userData, response.data.access_token);
        addNotification("¡Bienvenido!", "success");
        navigate("/dashboard");
      } else {
        addNotification(response.error, "error");
      }
    } catch (error) {
      console.error("Login error:", error);
      addNotification("Error en el servidor", "error");
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
        maxWidth: "450px",
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
          Acceso a Plataforma
        </h1>
        <p style={{
          color: COLORS.textMuted,
          textAlign: "center",
          marginBottom: "2rem",
          fontSize: "0.95rem",
        }}>
          Ingresa con tu email y contraseña
        </p>

        <form onSubmit={handleSubmit}>
          {/* Email Input */}
          <div style={{marginBottom: "1.5rem"}}>
            <label style={{
              display: "block",
              color: COLORS.navy,
              fontWeight: "600",
              marginBottom: "0.5rem",
              fontSize: "0.9rem",
            }}>
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="tu@email.com"
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                border: errors.email ? `2px solid #D32F2F` : `1px solid ${COLORS.border}`,
                borderRadius: "6px",
                fontSize: "0.95rem",
                fontFamily: "inherit",
                transition: "border-color 0.3s",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = COLORS.gold;
                e.target.style.outline = "none";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = errors.email ? "#D32F2F" : COLORS.border;
              }}
            />
            {errors.email && (
              <p style={{color: "#D32F2F", fontSize: "0.8rem", marginTop: "0.25rem"}}>
                {errors.email}
              </p>
            )}
          </div>

          {/* Password Input */}
          <div style={{marginBottom: "2rem"}}>
            <label style={{
              display: "block",
              color: COLORS.navy,
              fontWeight: "600",
              marginBottom: "0.5rem",
              fontSize: "0.9rem",
            }}>
              Contraseña
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                border: errors.password ? `2px solid #D32F2F` : `1px solid ${COLORS.border}`,
                borderRadius: "6px",
                fontSize: "0.95rem",
                fontFamily: "inherit",
                transition: "border-color 0.3s",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = COLORS.gold;
                e.target.style.outline = "none";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = errors.password ? "#D32F2F" : COLORS.border;
              }}
            />
            {errors.password && (
              <p style={{color: "#D32F2F", fontSize: "0.8rem", marginTop: "0.25rem"}}>
                {errors.password}
              </p>
            )}
          </div>

          {/* Submit Button */}
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
              fontWeight: "700",
              fontSize: "1rem",
              cursor: isLoading ? "not-allowed" : "pointer",
              transition: "background 0.3s",
            }}
            onMouseEnter={(e) => {
              if (!isLoading) e.target.style.background = COLORS.goldLight;
            }}
            onMouseLeave={(e) => {
              if (!isLoading) e.target.style.background = COLORS.gold;
            }}
          >
            {isLoading ? "Conectando..." : "Iniciar Sesión"}
          </button>
        </form>

        {/* Links */}
        <div style={{
          marginTop: "2rem",
          textAlign: "center",
          fontSize: "0.9rem",
          color: COLORS.textMuted,
        }}>
          <p>
            ¿No tienes cuenta?{" "}
            <a
              onClick={() => navigate("/signup")}
              style={{
                color: COLORS.gold,
                fontWeight: "600",
                cursor: "pointer",
                textDecoration: "none",
              }}
            >
              Regístrate aquí
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
