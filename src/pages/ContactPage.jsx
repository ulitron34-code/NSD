import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNotification } from "../hooks/useNotification";
import { COLORS } from "../utils/constants";
import Footer from "../components/Landing/Footer";
import { BRAND } from "../config/brand";
import { uiText } from "../utils/runtimeCopy";

export default function ContactPage() {
  const { addNotification } = useNotification();
  const { i18n } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({...prev, [name]: value}));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.message) {
      addNotification(uiText(i18n, "Completa todos los campos obligatorios", "Complete all required fields"), "error");
      return;
    }

    setIsSubmitting(true);

    try {
      // Aquí iría llamada a API para guardar contacto
      // const response = await contactService.submitContactForm(formData);
      
      // Por ahora simulamos
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      addNotification(uiText(i18n, "Mensaje enviado correctamente. Te contactaremos pronto.", "Message sent successfully. We will contact you soon."), "success");
      setFormData({name: "", email: "", phone: "", subject: "", message: ""});
    } catch (error) {
      addNotification(uiText(i18n, "Error al enviar el mensaje", "Error sending the message"), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{background: COLORS.bg, minHeight: "100vh"}}>
      <div style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "4rem 2rem 2rem",
      }}>
        <h1 style={{
          color: COLORS.navy,
          fontSize: "2.5rem",
          marginBottom: "1rem",
          borderLeft: `4px solid ${COLORS.gold}`,
          paddingLeft: "1rem",
        }}>
          {uiText(i18n, "Contacto y Soporte", "Contact and Support")}
        </h1>
        <p style={{color: COLORS.textMuted, marginBottom: "3rem", fontSize: "1.1rem"}}>
          {uiText(i18n, "¿Preguntas? Nos encantaría escucharte. Estamos aquí para ayudarte.", "Questions? We would be glad to hear from you. We are here to help.")}
        </p>

        <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3rem", marginBottom: "3rem"}}>
          {/* Contact Info */}
          <div>
            <h2 style={{color: COLORS.navy, fontSize: "1.5rem", marginBottom: "2rem"}}>
              {uiText(i18n, "Información de Contacto", "Contact Information")}
            </h2>

            {[
              {icon: "📍", title: uiText(i18n, "Ubicación", "Location"), content: BRAND.location},
              {icon: "📞", title: uiText(i18n, "Teléfono", "Phone"), content: BRAND.contactPhone},
              {icon: "📧", title: uiText(i18n, "Email General", "General Email"), content: BRAND.contactEmail},
              {icon: "🔧", title: uiText(i18n, "Soporte", "Support"), content: "support@nsd.com"},
              {icon: "⚖️", title: uiText(i18n, "Legal", "Legal"), content: "legal@nsd.com"},
              {icon: "🔐", title: uiText(i18n, "Privacidad", "Privacy"), content: "privacidad@nsd.com"},
            ].map((item, i) => (
              <div key={i} style={{
                marginBottom: "2rem",
                padding: "1.5rem",
                background: COLORS.white,
                borderRadius: "8px",
                borderLeft: `4px solid ${COLORS.gold}`,
              }}>
                <p style={{fontSize: "1.8rem", marginBottom: "0.5rem"}}>{item.icon}</p>
                <p style={{color: COLORS.navy, fontWeight: "600", marginBottom: "0.25rem"}}>
                  {item.title}
                </p>
                <p style={{color: COLORS.textMuted}}>{item.content}</p>
              </div>
            ))}
          </div>

          {/* Contact Form */}
          <div>
            <h2 style={{color: COLORS.navy, fontSize: "1.5rem", marginBottom: "2rem"}}>
              {uiText(i18n, "Envíanos un Mensaje", "Send Us a Message")}
            </h2>

            <form onSubmit={handleSubmit} style={{
              background: COLORS.white,
              padding: "2rem",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}>
              {/* Name */}
              <div style={{marginBottom: "1.5rem"}}>
                <label style={{
                  display: "block",
                  color: COLORS.navy,
                  fontWeight: "600",
                  marginBottom: "0.5rem",
                  fontSize: "0.9rem",
                }}>
                  {uiText(i18n, "Nombre Completo *", "Full Name *")}
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={uiText(i18n, "Tu nombre", "Your name")}
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: "6px",
                    fontSize: "1rem",
                  }}
                />
              </div>

              {/* Email */}
              <div style={{marginBottom: "1.5rem"}}>
                <label style={{
                  display: "block",
                  color: COLORS.navy,
                  fontWeight: "600",
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

              {/* Phone */}
              <div style={{marginBottom: "1.5rem"}}>
                <label style={{
                  display: "block",
                  color: COLORS.navy,
                  fontWeight: "600",
                  marginBottom: "0.5rem",
                  fontSize: "0.9rem",
                }}>
                  {uiText(i18n, "Teléfono (Opcional)", "Phone (Optional)")}
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

              {/* Subject */}
              <div style={{marginBottom: "1.5rem"}}>
                <label style={{
                  display: "block",
                  color: COLORS.navy,
                  fontWeight: "600",
                  marginBottom: "0.5rem",
                  fontSize: "0.9rem",
                }}>
                  {uiText(i18n, "Asunto", "Subject")}
                </label>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: "6px",
                    fontSize: "1rem",
                  }}
                >
                  <option>{uiText(i18n, "Selecciona un asunto", "Select a subject")}</option>
                  <option>{uiText(i18n, "Consulta General", "General Inquiry")}</option>
                  <option>{uiText(i18n, "Soporte Técnico", "Technical Support")}</option>
                  <option>{uiText(i18n, "Ventas / Cotización", "Sales / Quote")}</option>
                  <option>{uiText(i18n, "Privacidad / ARCO", "Privacy / ARCO Rights")}</option>
                  <option>{uiText(i18n, "Otro", "Other")}</option>
                </select>
              </div>

              {/* Message */}
              <div style={{marginBottom: "1.5rem"}}>
                <label style={{
                  display: "block",
                  color: COLORS.navy,
                  fontWeight: "600",
                  marginBottom: "0.5rem",
                  fontSize: "0.9rem",
                }}>
                  {uiText(i18n, "Mensaje *", "Message *")}
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder={uiText(i18n, "Tu mensaje...", "Your message...")}
                  rows="5"
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: "6px",
                    fontSize: "1rem",
                    fontFamily: "inherit",
                    resize: "vertical",
                  }}
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: "100%",
                  padding: "0.9rem",
                  background: isSubmitting ? "rgba(201,168,76,0.6)" : COLORS.gold,
                  color: COLORS.navy,
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: "600",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  fontSize: "1rem",
                }}
              >
                {isSubmitting ? uiText(i18n, "Enviando...", "Sending...") : uiText(i18n, "Enviar Mensaje", "Send Message")}
              </button>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
