import React, { useState } from "react";
import { useNotification } from "../hooks/useNotification";
import { useTranslation } from "react-i18next";
import { COLORS } from "../utils/constants";
import Footer from "../components/Landing/Footer";

const FORMSPREE_ENDPOINT = import.meta.env.VITE_FORMSPREE_URL || "";

export default function ContactPage() {
  const { addNotification } = useNotification();
  const { i18n } = useTranslation();
  const isEn = i18n.language === "en";

  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", subject: "", message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.message) {
      addNotification(isEn ? "Please fill in all required fields" : "Completa todos los campos obligatorios", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      if (FORMSPREE_ENDPOINT) {
        const res = await fetch(FORMSPREE_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(formData),
        });
        if (!res.ok) throw new Error("Formspree error");
      } else {
        // Fallback: abre cliente de correo
        const body = encodeURIComponent(`Nombre: ${formData.name}\nEmail: ${formData.email}\nTeléfono: ${formData.phone}\nAsunto: ${formData.subject}\n\n${formData.message}`);
        window.location.href = `mailto:contacto@nsd.mx?subject=${encodeURIComponent(formData.subject || "Contacto NSD")}&body=${body}`;
      }

      addNotification(
        isEn ? "Message sent! We'll be in touch soon." : "Mensaje enviado. Te contactaremos pronto.",
        "success"
      );
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch {
      addNotification(isEn ? "Error sending message. Please try again." : "Error al enviar. Intenta de nuevo.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "0.75rem 1rem",
    border: `1px solid ${COLORS.border}`,
    borderRadius: "6px",
    fontSize: "1rem",
    fontFamily: "inherit",
    outline: "none",
    transition: "border-color 0.2s",
  };

  const contactInfo = [
    { icon: "📍", title: isEn ? "Location" : "Ubicación",      content: "Ciudad de México, México" },
    { icon: "📧", title: isEn ? "General"  : "Email General",  content: "contacto@nsd.mx" },
    { icon: "⚖️", title: "Legal",                               content: "legal@nsd.mx" },
    { icon: "🔐", title: isEn ? "Privacy"  : "Privacidad",     content: "privacidad@nsd.mx" },
  ];

  const subjects = isEn
    ? ["Select a subject", "General Inquiry", "Technical Support", "Sales / Quote", "Privacy / ARCO Rights", "Other"]
    : ["Selecciona un asunto", "Consulta General", "Soporte Técnico", "Ventas / Cotización", "Privacidad / Derechos ARCO", "Otro"];

  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "4rem 2rem 2rem" }}>
        <h1 style={{
          color: COLORS.navy,
          fontSize: "clamp(1.8rem, 4vw, 2.5rem)",
          marginBottom: "1rem",
          borderLeft: `4px solid ${COLORS.gold}`,
          paddingLeft: "1rem",
        }}>
          {isEn ? "Contact & Support" : "Contacto y Soporte"}
        </h1>
        <p style={{ color: COLORS.textMuted, marginBottom: "3rem", fontSize: "1.05rem" }}>
          {isEn ? "Questions? We'd love to hear from you." : "¿Preguntas? Nos encantaría escucharte."}
        </p>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 380px), 1fr))",
          gap: "3rem",
          marginBottom: "3rem",
        }}>
          {/* Contact info */}
          <div>
            <h2 style={{ color: COLORS.navy, fontSize: "1.4rem", marginBottom: "2rem" }}>
              {isEn ? "Contact Information" : "Información de Contacto"}
            </h2>
            {contactInfo.map((item, i) => (
              <div key={i} style={{
                marginBottom: "1.25rem",
                padding: "1.25rem",
                background: COLORS.white,
                borderRadius: "8px",
                borderLeft: `4px solid ${COLORS.gold}`,
                display: "flex",
                gap: "1rem",
                alignItems: "center",
              }}>
                <span style={{ fontSize: "1.5rem" }}>{item.icon}</span>
                <div>
                  <p style={{ color: COLORS.navy, fontWeight: "600", fontSize: "0.88rem", marginBottom: "0.2rem" }}>
                    {item.title}
                  </p>
                  <p style={{ color: COLORS.textMuted, fontSize: "0.9rem" }}>{item.content}</p>
                </div>
              </div>
            ))}

            <div style={{
              marginTop: "2rem", padding: "1.5rem",
              background: `rgba(201,168,76,0.08)`,
              borderRadius: "10px",
              border: `1px solid rgba(201,168,76,0.2)`,
            }}>
              <p style={{ color: COLORS.navy, fontWeight: 700, marginBottom: "0.5rem", fontSize: "0.9rem" }}>
                {isEn ? "⏱ Response time" : "⏱ Tiempo de respuesta"}
              </p>
              <p style={{ color: COLORS.textMuted, fontSize: "0.88rem", lineHeight: 1.6 }}>
                {isEn
                  ? "We respond within 24 business hours. For urgent matters, mention it in the subject."
                  : "Respondemos en 24 horas hábiles. Para asuntos urgentes, indícalo en el asunto."}
              </p>
            </div>
          </div>

          {/* Form */}
          <div>
            <h2 style={{ color: COLORS.navy, fontSize: "1.4rem", marginBottom: "2rem" }}>
              {isEn ? "Send us a Message" : "Envíanos un Mensaje"}
            </h2>

            <form onSubmit={handleSubmit} style={{
              background: COLORS.white,
              padding: "2rem",
              borderRadius: "12px",
              boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
            }}>
              {[
                { name: "name",  label: isEn ? "Full Name *"  : "Nombre Completo *", type: "text",  placeholder: isEn ? "Your name" : "Tu nombre",        required: true },
                { name: "email", label: isEn ? "Email *"      : "Email *",           type: "email", placeholder: "tu@email.com",                             required: true },
                { name: "phone", label: isEn ? "Phone (optional)" : "Teléfono (Opcional)", type: "tel", placeholder: "+52 55 XXXX XXXX", required: false },
              ].map((field) => (
                <div key={field.name} style={{ marginBottom: "1.25rem" }}>
                  <label style={{ display: "block", color: COLORS.navy, fontWeight: "600", marginBottom: "0.4rem", fontSize: "0.88rem" }}>
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    name={field.name}
                    value={formData[field.name]}
                    onChange={handleChange}
                    placeholder={field.placeholder}
                    required={field.required}
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = COLORS.gold}
                    onBlur={e => e.target.style.borderColor = COLORS.border}
                  />
                </div>
              ))}

              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{ display: "block", color: COLORS.navy, fontWeight: "600", marginBottom: "0.4rem", fontSize: "0.88rem" }}>
                  {isEn ? "Subject" : "Asunto"}
                </label>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  style={{ ...inputStyle, cursor: "pointer" }}
                  onFocus={e => e.target.style.borderColor = COLORS.gold}
                  onBlur={e => e.target.style.borderColor = COLORS.border}
                >
                  {subjects.map((s, i) => <option key={i}>{s}</option>)}
                </select>
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", color: COLORS.navy, fontWeight: "600", marginBottom: "0.4rem", fontSize: "0.88rem" }}>
                  {isEn ? "Message *" : "Mensaje *"}
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder={isEn ? "Your message..." : "Tu mensaje..."}
                  rows="5"
                  required
                  style={{ ...inputStyle, resize: "vertical" }}
                  onFocus={e => e.target.style.borderColor = COLORS.gold}
                  onBlur={e => e.target.style.borderColor = COLORS.border}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: "100%",
                  padding: "0.9rem",
                  background: isSubmitting ? `rgba(201,168,76,0.6)` : COLORS.gold,
                  color: COLORS.navy,
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: "700",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  fontSize: "1rem",
                  transition: "all 0.2s",
                }}
              >
                {isSubmitting
                  ? (isEn ? "Sending..." : "Enviando...")
                  : (isEn ? "Send Message" : "Enviar Mensaje")}
              </button>

              {!FORMSPREE_ENDPOINT && (
                <p style={{ color: COLORS.textMuted, fontSize: "0.75rem", marginTop: "0.75rem", textAlign: "center" }}>
                  {isEn
                    ? "ℹ️ Add VITE_FORMSPREE_URL to .env for direct submission"
                    : "ℹ️ Agrega VITE_FORMSPREE_URL en .env para envío directo"}
                </p>
              )}
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
