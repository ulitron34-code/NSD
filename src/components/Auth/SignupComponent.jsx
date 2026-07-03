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
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    role: "solicitante",
    consentLFPDPPP: false,
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = "Email es requerido";
    else if (!validateEmail(formData.email)) newErrors.email = "Email invalido";

    if (!formData.password) newErrors.password = "Contraseña es requerida";
    else if (!validatePassword(formData.password)) newErrors.password = "Minimo 8 caracteres";

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Las contrasenas no coinciden";
    }
    if (!formData.role) newErrors.role = "Selecciona un tipo de usuario";
    if (!formData.consentLFPDPPP) newErrors.consentLFPDPPP = "Debes aceptar el aviso de privacidad para continuar";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      addNotification("Por favor corrige los errores", "error");
      return;
    }

    setIsLoading(true);
    const consentTimestamp = new Date().toISOString();
    try {
      const response = await authService.signup(formData.email, formData.password, formData.role, {
        consentLFPDPPP: true,
        consentTimestamp,
        avisoPrivacidadVersion: "1.0",
      });
      if (response.success) {
        login({ id: response.data.user_id, email: formData.email, role: formData.role }, response.data.access_token);
        addNotification("Cuenta creada exitosamente", "success");
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
    <div style={{ minHeight: "calc(100vh - 80px)", display: "flex", alignItems: "center", justifyContent: "center", background: COLORS.bg, padding: "2rem" }}>
      <div style={{ width: "100%", maxWidth: "520px", background: COLORS.white, padding: "3rem", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
        <h1 style={{ color: COLORS.navy, fontSize: "1.8rem", marginBottom: "0.5rem", textAlign: "center" }}>
          Crear cuenta
        </h1>
        <p style={{ color: COLORS.textMuted, textAlign: "center", marginBottom: "2rem", fontSize: "0.95rem" }}>
          Unete a NEXUS Platform y prueba los modulos de solicitante, otorgante o administracion.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", color: COLORS.navy, fontWeight: 700, marginBottom: "0.5rem", fontSize: "0.9rem" }}>
              Perfil de usuario
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
              {[
                { value: "solicitante", label: "Solicitante" },
                { value: "otorgante", label: "Otorgante" },
                { value: "analista", label: "NEXUS" },
              ].map((option) => (
                <label key={option.value} style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.4rem",
                  cursor: "pointer",
                  padding: "0.75rem",
                  border: `2px solid ${formData.role === option.value ? COLORS.gold : COLORS.border}`,
                  borderRadius: "6px",
                  background: formData.role === option.value ? COLORS.goldPale : "transparent",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                }}>
                  <input type="radio" name="role" value={option.value} checked={formData.role === option.value} onChange={handleChange} />
                  {option.label}
                </label>
              ))}
            </div>
          </div>

          {[
            ["email", "Email", "email", "tu@email.com"],
            ["password", "Contraseña", "password", "********"],
            ["confirmPassword", "Confirmar contrasena", "password", "********"],
          ].map(([name, label, type, placeholder]) => (
            <div key={name} style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", color: COLORS.navy, fontWeight: 700, marginBottom: "0.5rem", fontSize: "0.9rem" }}>
                {label}
              </label>
              <input
                type={type}
                name={name}
                value={formData[name]}
                onChange={handleChange}
                placeholder={placeholder}
                style={{ border: errors[name] ? "2px solid #D32F2F" : `1px solid ${COLORS.border}` }}
              />
              {errors[name] && <p style={{ color: "#D32F2F", fontSize: "0.8rem", marginTop: "0.25rem" }}>{errors[name]}</p>}
            </div>
          ))}

          {/* Consentimiento LFPDPPP */}
          <div style={{ marginBottom: "1.5rem", padding: "1rem", background: "#F8F7F4", borderRadius: "8px", border: errors.consentLFPDPPP ? "1.5px solid #D32F2F" : "1px solid rgba(27,58,92,0.1)" }}>
            <label style={{ display: "flex", gap: "0.75rem", cursor: "pointer", alignItems: "flex-start" }}>
              <input
                type="checkbox"
                name="consentLFPDPPP"
                checked={formData.consentLFPDPPP}
                onChange={handleChange}
                style={{ marginTop: "3px", accentColor: COLORS.gold, width: "16px", height: "16px", flexShrink: 0 }}
              />
              <span style={{ fontSize: "0.82rem", color: COLORS.text, lineHeight: 1.5 }}>
                He leído y acepto el{" "}
                <a href="/privacy" target="_blank" style={{ color: COLORS.gold, fontWeight: 700 }}>
                  Aviso de Privacidad
                </a>{" "}
                de NEXUS Secure Due-Diligence Unit y consiento el tratamiento de mis datos personales conforme a la{" "}
                <strong>Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP)</strong>.
              </span>
            </label>
            {errors.consentLFPDPPP && (
              <p style={{ color: "#D32F2F", fontSize: "0.8rem", margin: "0.5rem 0 0 1.75rem" }}>{errors.consentLFPDPPP}</p>
            )}
          </div>

          <button type="submit" disabled={isLoading} style={{
            width: "100%",
            padding: "0.9rem",
            background: isLoading ? "rgba(201, 168, 76, 0.6)" : COLORS.gold,
            color: COLORS.navy,
            border: "none",
            borderRadius: "6px",
            fontWeight: 800,
            fontSize: "1rem",
            cursor: isLoading ? "not-allowed" : "pointer",
          }}>
            {isLoading ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>

        <div style={{ marginTop: "2rem", textAlign: "center", fontSize: "0.9rem", color: COLORS.textMuted }}>
          <p>
            Ya tienes cuenta?{" "}
            <a onClick={() => navigate("/login")} style={{ color: COLORS.gold, fontWeight: 700, cursor: "pointer" }}>
              Inicia sesión
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
