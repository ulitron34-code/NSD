import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useNotification } from "../../hooks/useNotification";
import { COLORS } from "../../utils/constants";
import { ordersAPI } from "../../services/api";
import { translateCopy, uiText } from "../../utils/runtimeCopy";
import { SUPPORTED_COUNTRIES } from "../../data/requisitosMinimos";

export default function ServiceRequestModal({ service, onClose, onSubmit }) {
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const { i18n } = useTranslation();
  const L = (es, en) => uiText(i18n, es, en);
  const copy = (value) => translateCopy(value, i18n.language);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    projectName: "",
    description: "",
    sector: "",
    country: "MX",
    investmentRequired: "",
    hasDocuments: "no",
    email: "",
    phone: "",
    companyName: "",
    declaredPublicPosition: "",
    declaredPublicPositionRelationship: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.projectName || !formData.email) {
      addNotification(L("Completa los campos obligatorios", "Complete the required fields"), "error");
      return;
    }

    const token = localStorage.getItem("auth_token");
    if (!token || token === "demo_token_123") {
      addNotification(L("Inicia sesion con tu usuario real antes de solicitar un servicio.", "Sign in with your real account before requesting a service."), "warning");
      navigate("/login");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create the order via backend
      const { data } = await ordersAPI.create(service?.id || "custom", service?.price || 0, {
        ...formData,
        serviceName: service?.title || L("Servicio personalizado", "Custom service"),
      });
      
      // Redirect to checkout with order details
      navigate(`/checkout?orderId=${data.id}&amount=${data.amount}`);
      
      if (onSubmit) {
        onSubmit({
          ...formData,
          serviceId: service?.id,
          serviceName: service?.title,
          price: service?.price,
        });
      }

      addNotification(L("Orden creada. Procediendo al pago...", "Order created. Proceeding to payment..."), "success");
    } catch (error) {
      console.error("Error:", error);
      addNotification(L("Error al crear la orden. Inicia sesion si no lo has hecho.", "Error creating the order. Sign in if you have not already."), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "white",
          borderRadius: "12px",
          padding: "2.5rem",
          maxWidth: "600px",
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}>
          <div>
            <h2 style={{
              color: COLORS.navy,
              fontSize: "1.6rem",
              fontWeight: 700,
              marginBottom: "0.25rem",
            }}>
              {copy(service?.title)}
            </h2>
            <p style={{
              color: COLORS.textMuted,
              fontSize: "0.9rem",
            }}>
              ${service?.price.toLocaleString()} USD
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.5rem",
              cursor: "pointer",
              color: COLORS.textMuted,
            }}
          >
            x
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1.5rem" }}>
          <div>
            <label style={{
              display: "block",
              color: COLORS.navy,
              fontWeight: 600,
              marginBottom: "0.5rem",
              fontSize: "0.9rem",
            }}>
              {L("Nombre del Proyecto *", "Project Name *")}
            </label>
            <input
              type="text"
              name="projectName"
              value={formData.projectName}
              onChange={handleChange}
              placeholder={L("Ej: Desarrollo Inmobiliario XYZ", "Example: Real Estate Development XYZ")}
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                border: `1px solid ${COLORS.border}`,
                borderRadius: "6px",
                fontSize: "1rem",
              }}
            />
          </div>

          <div>
            <label style={{
              display: "block",
              color: COLORS.navy,
              fontWeight: 600,
              marginBottom: "0.5rem",
              fontSize: "0.9rem",
            }}>
              {L("Descripcion del Proyecto", "Project Description")}
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder={L("Cuentanos brevemente sobre tu proyecto...", "Briefly tell us about your project...")}
              rows="4"
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

          <div>
            <label style={{
              display: "block",
              color: COLORS.navy,
              fontWeight: 600,
              marginBottom: "0.5rem",
              fontSize: "0.9rem",
            }}>
              {L("Sector", "Sector")}
            </label>
            <select
              name="sector"
              value={formData.sector}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                border: `1px solid ${COLORS.border}`,
                borderRadius: "6px",
                fontSize: "1rem",
              }}
            >
              <option>{L("Selecciona un sector", "Select a sector")}</option>
              <option>{L("Tecnologia", "Technology")}</option>
              <option>{L("Inmobiliario", "Real Estate")}</option>
              <option>{L("Agricola", "Agriculture")}</option>
              <option>{L("Energia", "Energy")}</option>
              <option>Fintech</option>
              <option>{L("Salud", "Healthcare")}</option>
              <option>{L("Otro", "Other")}</option>
            </select>
          </div>

          <div>
            <label style={{
              display: "block",
              color: COLORS.navy,
              fontWeight: 600,
              marginBottom: "0.5rem",
              fontSize: "0.9rem",
            }}>
              {L("Pais del proyecto", "Project country")}
            </label>
            <select
              name="country"
              value={formData.country}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                border: `1px solid ${COLORS.border}`,
                borderRadius: "6px",
                fontSize: "1rem",
              }}
            >
              {SUPPORTED_COUNTRIES.map((country) => (
                <option key={country.code} value={country.code}>
                  {L(country.es, country.en)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{
              display: "block",
              color: COLORS.navy,
              fontWeight: 600,
              marginBottom: "0.5rem",
              fontSize: "0.9rem",
            }}>
              {L("Inversion Requerida (USD)", "Required Investment (USD)")}
            </label>
            <input
              type="number"
              name="investmentRequired"
              value={formData.investmentRequired}
              onChange={handleChange}
              placeholder="Ej: 500000"
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                border: `1px solid ${COLORS.border}`,
                borderRadius: "6px",
                fontSize: "1rem",
              }}
            />
          </div>

          <div>
            <label style={{
              display: "block",
              color: COLORS.navy,
              fontWeight: 600,
              marginBottom: "0.75rem",
              fontSize: "0.9rem",
            }}>
              {L("Ya tienes documentos del proyecto?", "Do you already have project documents?")}
            </label>
            <div style={{ display: "flex", gap: "1rem" }}>
              {["no", "yes"].map((option) => (
                <label key={option} style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="hasDocuments"
                    value={option}
                    checked={formData.hasDocuments === option}
                    onChange={handleChange}
                  />
                  <span style={{ color: COLORS.text, fontSize: "0.9rem" }}>
                    {option === "yes" ? L("Si, tengo documentos", "Yes, I have documents") : L("No, empiezo desde cero", "No, I am starting from scratch")}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label style={{
              display: "block",
              color: COLORS.navy,
              fontWeight: 600,
              marginBottom: "0.5rem",
              fontSize: "0.9rem",
            }}>
              {L("Cargo publico (PEP)", "Public office (PEP)")}
            </label>
            <p style={{ color: COLORS.textMuted, fontSize: "0.78rem", marginBottom: "0.6rem", lineHeight: 1.4 }}>
              {L(
                "Requisito LFPIORPI: declara si tu o un familiar cercano/socio ocupa o ha ocupado un cargo publico. Dejalo en blanco si no aplica.",
                "LFPIORPI requirement: declare if you or a close relative/business partner holds or has held a public office. Leave blank if not applicable."
              )}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.75rem" }}>
              <input
                type="text"
                name="declaredPublicPosition"
                value={formData.declaredPublicPosition}
                onChange={handleChange}
                placeholder={L("Ej: Diputado local, Director de PEMEX...", "E.g: Local representative, PEMEX director...")}
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "6px",
                  fontSize: "1rem",
                }}
              />
              <input
                type="text"
                name="declaredPublicPositionRelationship"
                value={formData.declaredPublicPositionRelationship}
                onChange={handleChange}
                placeholder={L("Relacion: propio, conyuge, socio...", "Relationship: self, spouse, business partner...")}
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "6px",
                  fontSize: "1rem",
                }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
            <div>
              <label style={{
                display: "block",
                color: COLORS.navy,
                fontWeight: 600,
                marginBottom: "0.5rem",
                fontSize: "0.9rem",
              }}>
                Email *
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
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "6px",
                  fontSize: "1rem",
                }}
              />
            </div>
            <div>
              <label style={{
                display: "block",
                color: COLORS.navy,
                fontWeight: 600,
                marginBottom: "0.5rem",
                fontSize: "0.9rem",
              }}>
                {L("Telefono", "Phone")}
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+52 XX XXXX XXXX"
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "6px",
                  fontSize: "1rem",
                }}
              />
            </div>
          </div>

          <div>
            <label style={{
              display: "block",
              color: COLORS.navy,
              fontWeight: 600,
              marginBottom: "0.5rem",
              fontSize: "0.9rem",
            }}>
              {L("Nombre de la Empresa/Proyecto", "Company/Project Name")}
            </label>
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              placeholder={L("Tu empresa", "Your company")}
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                border: `1px solid ${COLORS.border}`,
                borderRadius: "6px",
                fontSize: "1rem",
              }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginTop: "2rem" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "0.9rem",
                background: "transparent",
                color: COLORS.navy,
                border: `2px solid ${COLORS.border}`,
                borderRadius: "6px",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: "0.95rem",
              }}
            >
              {L("Cancelar", "Cancel")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: "0.9rem",
                background: isSubmitting ? "rgba(201,168,76,0.6)" : COLORS.gold,
                color: COLORS.navy,
                border: "none",
                borderRadius: "6px",
                fontWeight: 600,
                cursor: isSubmitting ? "not-allowed" : "pointer",
                fontSize: "0.95rem",
              }}
            >
              {isSubmitting ? L("Enviando...", "Sending...") : L("Solicitar Servicio", "Request Service")}
            </button>
          </div>

          <p style={{
            color: COLORS.textMuted,
            fontSize: "0.8rem",
            textAlign: "center",
            marginTop: "1rem",
          }}>
            {L("Al enviar aceptas nuestros terminos de servicio y politica de privacidad.", "By submitting, you accept our terms of service and privacy policy.")}
          </p>
        </form>
      </div>
    </div>
  );
}

