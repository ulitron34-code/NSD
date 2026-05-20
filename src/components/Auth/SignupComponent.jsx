import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useNotification } from "../../hooks/useNotification";
import { authService } from "../../services/auth.service";
import { validateEmail, validatePassword } from "../../utils/validators";
import { COLORS } from "../../utils/constants";

export default function SignupComponent() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { addNotification } = useNotification();
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    role: "solicitante", // "solicitante" o "otorgante"
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

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden";
    }

    if (!formData.role) {
      newErrors.role = "Selecciona un tipo de usuario";
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
      const response = await authService.signup(
        formData.email,
        formData.password,
        formData.role
      );

      if (response.success) {
        const userData = {
          id: response.data.user_id,
          email: formData.email,
          role: formData.role,
        };
        login(userData, response.data.access_token);
        addNotification("¡Cuenta creada exitosamente!", "success");
        navigate("/dashboard");
      } else {
        addNotification(response.error, "error");
      }
    } catch (error) {
      console.error("Signup error:", error);
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
        maxWidth: "500px",
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
          Crear Cuenta
        </h1>
        <p style={{
          color: COLORS.textMuted,
          textAlign: "center",
          marginBottom: "2rem",
          fontSize: "0.95rem",
        }}>
          Únete a NSD International Finance
        </p>

        <form onSubmit={handleSubmit}>
          {/* Role Selection */}
          <div style={{marginBottom: "1.5rem"}}>
            <label style={{
              display: "block",
              color: COLORS.navy,
              fontWeight: "600",
              marginBottom: "0.5rem",
              fontSize: "0.9rem",
            }}>
              ¿Eres?
            </label>
            <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem"}}>
              {[
                {value: "solicitante", label: "Solicitante"},
                {value: "otorgante", label: "Otorgante"},
              ].map((option) => (
                <label
                  key={option.value}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    cursor: "pointer",
                    padding: "0.75rem",
                    border: `2px solid ${formData.role === option.value ? COLORS.gold : COLORS.border}`,
                    borderRadius: "6px",
                    background: formData.role === option.value ? COLORS.goldPale : "transparent",
                    transition: "all 0.3s",
                  }}
                >
                  <input
                    type="radio"
                    name="role"
                    value={option.value}
                    checked={formData.role === option.value}
                    onChange={handleChange}
                    style={{cursor: "pointer"}}
                  />
                  <span style={{fontWeight: "600", fontSize: "0.9rem"}}>
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

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
              }}
            />
            {errors.email && (
              <p style={{color: "#D32F2F", fontSize: "0.8rem", marginTop: "0.25rem"}}>
                {errors.email}
              </p>
            )}
          </div>

          {/* Password Input */}
          <div style={{marginBottom: "1.5rem"}}>
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
              }}
            />
            {errors.password && (
              <p style={{color: "#D32F2F", fontSize: "0.8rem", marginTop: "0.25rem"}}>
                {errors.password}
              </p>
            )}
          </div>

          {/* Confirm Password Input */}
          <div style={{marginBottom: "2rem"}}>
            <label style={{
              display: "block",
              color: COLORS.navy,
              fontWeight: "600",
              marginBottom: "0.5rem",
              fontSize: "0.9rem",
            }}>
              Confirmar Contraseña
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                border: errors.confirmPassword ? `2px solid #D32F2F` : `1px solid ${COLORS.border}`,
                borderRadius: "6px",
                fontSize: "0.95rem",
              }}
            />
            {errors.confirmPassword && (
              <p style={{color: "#D32F2F", fontSize: "0.8rem", marginTop: "0.25rem"}}>
                {errors.confirmPassword}
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
            }}
          >
            {isLoading ? "Creando cuenta..." : "Crear Cuenta"}
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
            ¿Ya tienes cuenta?{" "}
            <a
              onClick={() => navigate("/login")}
              style={{
                color: COLORS.gold,
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Inicia sesión
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
