import React, { useState } from "react";
import { useNotification } from "../hooks/useNotification";
import { COLORS } from "../utils/constants";
import Footer from "../components/Landing/Footer";

export default function ContactPage() {
  const { addNotification } = useNotification();
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
      addNotification("Completa todos los campos obligatorios", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      // Aquí iría llamada a API para guardar contacto
      // const response = await contactService.submitContactForm(formData);
      
      // Por ahora simulamos
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      addNotification("Mensaje enviado correctamente. Te contactaremos pronto.", "success");
      setFormData({name: "", email: "", phone: "", subject: "", message: ""});
    } catch (error) {
      addNotification("Error al enviar el mensaje", "error");
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
          Contacto y Soporte
        </h1>
        <p style={{color: COLORS.textMuted, marginBottom: "3rem", fontSize: "1.1rem"}}>
          ¿Preguntas? Nos encantaría escucharte. Estamos aquí para ayudarte.
        </p>

        <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3rem", marginBottom: "3rem"}}>
          {/* Contact Info */}
          <div>
            <h2 style={{color: COLORS.navy, fontSize: "1.5rem", marginBottom: "2rem"}}>
              Información de Contacto
            </h2>

            {[
              {icon: "📍", title: "Ubicación", content: "Ciudad de México, México"},
              {icon: "📞", title: "Teléfono", content: "+52 55 XXXX XXXX"},
              {icon: "📧", title: "Email General", content: "info@nsd.com"},
              {icon: "🔧", title: "Soporte", content: "support@nsd.com"},
              {icon: "⚖️", title: "Legal", content: "legal@nsd.com"},
              {icon: "🔐", title: "Privacidad", content: "privacidad@nsd.com"},
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
              Envíanos un Mensaje
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
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Tu nombre"
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
                  Teléfono (Opcional)
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
                  Asunto
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
                  <option>Selecciona un asunto</option>
                  <option>Consulta General</option>
                  <option>Soporte Técnico</option>
                  <option>Ventas / Cotización</option>
                  <option>Privacidad / ARCO</option>
                  <option>Otro</option>
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
                  Mensaje *
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Tu mensaje..."
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
                {isSubmitting ? "Enviando..." : "Enviar Mensaje"}
              </button>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
