# 🚀 SCRIPT COMPLETO A: SERVICIOS PROFESIONALES

**TODO el código para copiar-pegar directamente. Sin pensar, sin dudas.**

---

## 📦 RESUMEN

- ✅ Sección en Landing Page
- ✅ Modal/Página de Solicitud
- ✅ Componentes reutilizables
- ✅ Integración en Dashboard
- ✅ API calls mock (para cambiar después)

---

# 1️⃣ CREAR: `src/pages/ServicesPage.jsx`

**Crea un archivo NUEVO con este nombre y pega TODO esto:**

```javascript
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { COLORS } from "../utils/constants";
import Footer from "../components/Landing/Footer";
import ServiceCard from "../components/Services/ServiceCard";
import ServiceRequestModal from "../components/Services/ServiceRequestModal";

const SERVICES = [
  {
    id: "business-plan",
    icon: "📊",
    title: "Business Plan Profesional",
    description: "Plan de negocios completo con proyecciones a 10 años",
    features: [
      "Análisis de mercado exhaustivo",
      "Proyecciones financieras (10 años)",
      "Estrategia operativa y ejecutiva",
      "Análisis competitivo",
      "Plan de implementación"
    ],
    price: 2500,
    deliveryTime: "10-14 días",
    recommended: true,
  },
  {
    id: "financial-analysis",
    icon: "💰",
    title: "Análisis Financiero Avanzado",
    description: "Análisis integral de viabilidad y riesgos crediticios",
    features: [
      "DCF modelado profesional",
      "Análisis de sensibilidad",
      "Scoring crediticio NSD",
      "Métricas de rentabilidad",
      "Mapeo de riesgos"
    ],
    price: 1500,
    deliveryTime: "7-10 días",
    recommended: false,
  },
  {
    id: "pitch-deck",
    icon: "🎯",
    title: "Presentación Ejecutiva Premium",
    description: "Deck profesional para inversionistas y otorgantes",
    features: [
      "Slide deck de 20-30 páginas",
      "Narrativa ejecutiva pulida",
      "Visualizaciones de datos",
      "Anexos técnicos completos",
      "Presentación en PowerPoint + PDF"
    ],
    price: 1200,
    deliveryTime: "5-7 días",
    recommended: false,
  },
  {
    id: "combo-complete",
    icon: "⭐",
    title: "Paquete Completo (Ahorra 20%)",
    description: "Business Plan + Análisis + Presentación (Valor: $5,200)",
    features: [
      "✓ Todos los servicios anteriores",
      "✓ Descuento especial del 20%",
      "✓ Gestor de proyecto dedicado",
      "✓2 rondas de revisión",
      "✓ Entrega en 18-21 días"
    ],
    price: 4160,
    deliveryTime: "18-21 días",
    recommended: false,
  },
];

export default function ServicesPage() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  const handleRequestService = (service) => {
    setSelectedService(service);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedService(null);
  };

  const handleSubmitRequest = (formData) => {
    // Aquí va la lógica de creación de orden
    console.log("Orden creada:", formData);
    // TODO: Integrar con backend API
    setShowModal(false);
    navigate("/dashboard");
  };

  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh" }}>
      {/* Hero Section */}
      <div style={{
        background: `linear-gradient(135deg, ${COLORS.navy} 0%, ${COLORS.navyLight} 100%)`,
        color: "white",
        padding: "5rem 2rem",
        textAlign: "center",
        marginBottom: "3rem",
      }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <h1 style={{
            fontSize: "2.8rem",
            fontWeight: 800,
            marginBottom: "1rem",
            lineHeight: 1.2,
          }}>
            ¿No tienes expediente listo?
          </h1>
          <p style={{
            fontSize: "1.2rem",
            opacity: 0.9,
            marginBottom: "0.5rem",
          }}>
            Nosotros lo hacemos por ti
          </p>
          <p style={{
            fontSize: "1rem",
            opacity: 0.7,
          }}>
            Servicios profesionales de elaboración de documentos financieros para inversionistas y otorgantes.
          </p>
        </div>
      </div>

      {/* Services Grid */}
      <div style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "0 2rem 5rem",
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "2rem",
          marginBottom: "3rem",
        }}>
          {SERVICES.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onRequestService={handleRequestService}
            />
          ))}
        </div>

        {/* FAQ Section */}
        <div style={{
          background: "white",
          padding: "3rem 2rem",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          marginBottom: "3rem",
        }}>
          <h2 style={{
            color: COLORS.navy,
            fontSize: "2rem",
            marginBottom: "2rem",
            textAlign: "center",
          }}>
            Preguntas Frecuentes
          </h2>

          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "2rem",
          }}>
            {[
              {
                q: "¿Cuánto tiempo tarda?",
                a: "Depende del servicio: Business Plan 10-14 días, Análisis 7-10 días, Presentación 5-7 días.",
              },
              {
                q: "¿Qué incluye cada servicio?",
                a: "Ver detalles en las tarjetas de cada servicio. Todos incluyen revisiones y ajustes.",
              },
              {
                q: "¿Se puede acelerar la entrega?",
                a: "Sí, contáctanos directamente. Podemos hacer entregas express con costo adicional.",
              },
              {
                q: "¿Qué métodos de pago aceptan?",
                a: "Tarjeta de crédito, transferencia bancaria, y PayPal. Factura incluida.",
              },
              {
                q: "¿Si no me gusta, hay reembolso?",
                a: "Sí, garantía de satisfacción. Si no te gusta, reembolso del 100% antes de entrega final.",
              },
              {
                q: "¿Puedo mezclar servicios?",
                a: "Totalmente. Podés contratar Business Plan + Presentación por separado sin problema.",
              },
            ].map((faq, i) => (
              <div key={i} style={{
                paddingBottom: "1.5rem",
                borderBottom: `1px solid ${COLORS.border}`,
              }}>
                <p style={{
                  color: COLORS.navy,
                  fontWeight: 700,
                  marginBottom: "0.5rem",
                  fontSize: "0.95rem",
                }}>
                  {faq.q}
                </p>
                <p style={{
                  color: COLORS.textMuted,
                  fontSize: "0.9rem",
                  lineHeight: 1.6,
                }}>
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div style={{
          background: `linear-gradient(135deg, ${COLORS.navy} 0%, ${COLORS.navyLight} 100%)`,
          color: "white",
          padding: "3rem 2rem",
          borderRadius: "12px",
          textAlign: "center",
          marginBottom: "3rem",
        }}>
          <h2 style={{
            fontSize: "1.8rem",
            marginBottom: "1rem",
            fontWeight: 700,
          }}>
            ¿Listo para empezar?
          </h2>
          <p style={{
            marginBottom: "2rem",
            opacity: 0.9,
            fontSize: "1.05rem",
          }}>
            Nuestro equipo experto se pondrá en contacto en menos de 24 horas
          </p>
          <button
            onClick={() => setShowModal(true)}
            style={{
              padding: "1rem 2.5rem",
              background: COLORS.gold,
              color: COLORS.navy,
              border: "none",
              borderRadius: "6px",
              fontWeight: 700,
              fontSize: "1rem",
              cursor: "pointer",
              transition: "all 0.3s",
              boxShadow: "0 4px 12px rgba(201,168,76,0.3)",
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 8px 20px rgba(201,168,76,0.4)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 4px 12px rgba(201,168,76,0.3)";
            }}
          >
            Solicitar Servicio
          </button>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <ServiceRequestModal
          service={selectedService}
          onClose={handleModalClose}
          onSubmit={handleSubmitRequest}
        />
      )}

      <Footer />
    </div>
  );
}
```

---

# 2️⃣ CREAR: `src/components/Services/ServiceCard.jsx`

**Crea un archivo NUEVO con este nombre y pega TODO esto:**

```javascript
import React from "react";
import { COLORS } from "../../utils/constants";

export default function ServiceCard({ service, onRequestService }) {
  return (
    <div
      style={{
        background: service.recommended ? COLORS.white : COLORS.bg,
        border: service.recommended ? `2px solid ${COLORS.gold}` : `1px solid ${COLORS.border}`,
        borderRadius: "12px",
        padding: "2rem",
        boxShadow: service.recommended
          ? `0 8px 24px rgba(201,168,76,0.2)`
          : "0 2px 8px rgba(0,0,0,0.08)",
        transition: "all 0.3s",
        position: "relative",
        display: "flex",
        flexDirection: "column",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = service.recommended
          ? `0 12px 32px rgba(201,168,76,0.3)`
          : "0 8px 24px rgba(0,0,0,0.12)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = service.recommended
          ? `0 8px 24px rgba(201,168,76,0.2)`
          : "0 2px 8px rgba(0,0,0,0.08)";
      }}
    >
      {/* Recommended Badge */}
      {service.recommended && (
        <div style={{
          position: "absolute",
          top: "-12px",
          left: "50%",
          transform: "translateX(-50%)",
          background: COLORS.gold,
          color: COLORS.navy,
          padding: "0.4rem 1rem",
          borderRadius: "999px",
          fontWeight: 700,
          fontSize: "0.75rem",
          letterSpacing: "0.05em",
        }}>
          RECOMENDADO
        </div>
      )}

      {/* Icon */}
      <div style={{
        fontSize: "3rem",
        marginBottom: "1rem",
      }}>
        {service.icon}
      </div>

      {/* Title */}
      <h3
        style={{
          color: COLORS.navy,
          fontSize: "1.3rem",
          fontWeight: 700,
          marginBottom: "0.5rem",
        }}
      >
        {service.title}
      </h3>

      {/* Description */}
      <p
        style={{
          color: COLORS.textMuted,
          fontSize: "0.9rem",
          marginBottom: "1.5rem",
          lineHeight: 1.6,
          flex: 1,
        }}
      >
        {service.description}
      </p>

      {/* Features */}
      <ul
        style={{
          listStyle: "none",
          marginBottom: "1.5rem",
          fontSize: "0.85rem",
        }}
      >
        {service.features.map((feature, i) => (
          <li
            key={i}
            style={{
              color: COLORS.text,
              marginBottom: "0.5rem",
              display: "flex",
              alignItems: "flex-start",
              gap: "0.5rem",
            }}
          >
            <span style={{ color: COLORS.gold, fontWeight: 700 }}>✓</span>
            {feature}
          </li>
        ))}
      </ul>

      {/* Divider */}
      <div
        style={{
          height: "1px",
          background: COLORS.border,
          margin: "1rem 0",
        }}
      />

      {/* Price & Delivery */}
      <div style={{ marginBottom: "1.5rem" }}>
        <p style={{
          color: COLORS.textMuted,
          fontSize: "0.8rem",
          marginBottom: "0.3rem",
        }}>
          PRECIO
        </p>
        <p style={{
          color: COLORS.navy,
          fontSize: "1.8rem",
          fontWeight: 800,
          marginBottom: "0.5rem",
        }}>
          ${service.price.toLocaleString()}
        </p>
        <p style={{
          color: COLORS.textMuted,
          fontSize: "0.85rem",
        }}>
          Entrega: {service.deliveryTime}
        </p>
      </div>

      {/* CTA Button */}
      <button
        onClick={() => onRequestService(service)}
        style={{
          width: "100%",
          padding: "0.9rem 1.5rem",
          background: service.recommended ? COLORS.gold : COLORS.navy,
          color: service.recommended ? COLORS.navy : "white",
          border: "none",
          borderRadius: "6px",
          fontWeight: 700,
          fontSize: "0.95rem",
          cursor: "pointer",
          transition: "all 0.3s",
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = "translateY(-1px)";
          e.target.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = "translateY(0)";
          e.target.style.boxShadow = "none";
        }}
      >
        Solicitar Servicio
      </button>
    </div>
  );
}
```

---

# 3️⃣ CREAR: `src/components/Services/ServiceRequestModal.jsx`

**Crea un archivo NUEVO con este nombre y pega TODO esto:**

```javascript
import React, { useState } from "react";
import { useNotification } from "../../hooks/useNotification";
import { COLORS } from "../../utils/constants";

export default function ServiceRequestModal({ service, onClose, onSubmit }) {
  const { addNotification } = useNotification();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    projectName: "",
    description: "",
    sector: "",
    investmentRequired: "",
    hasDocuments: "no",
    email: "",
    phone: "",
    companyName: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validación
    if (!formData.projectName || !formData.email) {
      addNotification("Completa los campos obligatorios", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      // Aquí iría la llamada real a la API
      // const response = await serviceService.createServiceOrder(formData);
      
      // Por ahora simulamos
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      onSubmit({
        ...formData,
        serviceId: service?.id,
        serviceName: service?.title,
        price: service?.price,
      });

      addNotification("Solicitud enviada correctamente. Te contactaremos pronto.", "success");
    } catch (error) {
      console.error("Error:", error);
      addNotification("Error al enviar la solicitud", "error");
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
              {service?.title}
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
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1.5rem" }}>
          {/* Project Info */}
          <div>
            <label style={{
              display: "block",
              color: COLORS.navy,
              fontWeight: 600,
              marginBottom: "0.5rem",
              fontSize: "0.9rem",
            }}>
              Nombre del Proyecto *
            </label>
            <input
              type="text"
              name="projectName"
              value={formData.projectName}
              onChange={handleChange}
              placeholder="Ej: Desarrollo Inmobiliario XYZ"
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                border: `1px solid ${COLORS.border}`,
                borderRadius: "6px",
                fontSize: "1rem",
              }}
            />
          </div>

          {/* Description */}
          <div>
            <label style={{
              display: "block",
              color: COLORS.navy,
              fontWeight: 600,
              marginBottom: "0.5rem",
              fontSize: "0.9rem",
            }}>
              Descripción del Proyecto
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Cuéntanos brevemente sobre tu proyecto..."
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

          {/* Sector */}
          <div>
            <label style={{
              display: "block",
              color: COLORS.navy,
              fontWeight: 600,
              marginBottom: "0.5rem",
              fontSize: "0.9rem",
            }}>
              Sector
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
              <option>Selecciona un sector</option>
              <option>Tecnología</option>
              <option>Inmobiliario</option>
              <option>Agrícola</option>
              <option>Energía</option>
              <option>Fintech</option>
              <option>Salud</option>
              <option>Otro</option>
            </select>
          </div>

          {/* Investment Required */}
          <div>
            <label style={{
              display: "block",
              color: COLORS.navy,
              fontWeight: 600,
              marginBottom: "0.5rem",
              fontSize: "0.9rem",
            }}>
              Inversión Requerida (USD)
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

          {/* Has Documents */}
          <div>
            <label style={{
              display: "block",
              color: COLORS.navy,
              fontWeight: 600,
              marginBottom: "0.75rem",
              fontSize: "0.9rem",
            }}>
              ¿Ya tienes documentos del proyecto?
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
                    {option === "yes" ? "Sí, tengo documentos" : "No, empiezo desde cero"}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Contact Info */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
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
                Teléfono
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

          {/* Company Name */}
          <div>
            <label style={{
              display: "block",
              color: COLORS.navy,
              fontWeight: 600,
              marginBottom: "0.5rem",
              fontSize: "0.9rem",
            }}>
              Nombre de la Empresa/Proyecto
            </label>
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              placeholder="Tu empresa"
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                border: `1px solid ${COLORS.border}`,
                borderRadius: "6px",
                fontSize: "1rem",
              }}
            />
          </div>

          {/* Buttons */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "2rem" }}>
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
              Cancelar
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
              {isSubmitting ? "Enviando..." : "Solicitar Servicio"}
            </button>
          </div>

          {/* Terms */}
          <p style={{
            color: COLORS.textMuted,
            fontSize: "0.8rem",
            textAlign: "center",
            marginTop: "1rem",
          }}>
            Al enviar aceptas nuestros términos de servicio y política de privacidad.
          </p>
        </form>
      </div>
    </div>
  );
}
```

---

# 4️⃣ ACTUALIZAR: `src/App.jsx`

**En tu `App.jsx`, encuentra la sección de rutas y agrega ESTA ruta (cópiala exactamente):**

```javascript
// Agrega esta import al inicio
import ServicesPage from "./pages/ServicesPage";

// Y agrega ESTA ruta en el <Routes> (después de /blog y antes de /dashboard):
<Route path="/services" element={<><Header /><ServicesPage /></>} />
```

**Ejemplo de cómo se vería completo:**

```javascript
<Routes>
  {/* Landing Page (sin login) */}
  <Route path="/" element={<><Header isLanding={true} /><LandingPage /></>} />
  <Route path="/login" element={<><Header /><LoginComponent /></>} />
  <Route path="/signup" element={<><Header /><SignupComponent /></>} />
  
  {/* Public Pages */}
  <Route path="/privacy" element={<><Header /><PrivacyPage /></>} />
  <Route path="/terms" element={<><Header /><TermsPage /></>} />
  <Route path="/contact" element={<><Header /><ContactPage /></>} />
  <Route path="/blog" element={<><Header isLanding={true} /><BlogPage /></>} />
  <Route path="/certifications" element={<><Header isLanding={true} /><CertificationsPage /></>} />
  <Route path="/services" element={<><Header /><ServicesPage /></>} /> {/* ← NUEVA */
  
  {/* Dashboard (protegido) */}
  <Route path="/dashboard/*" element={<ProtectedRoute><><Header /><DashboardPage /></></ProtectedRoute>} />
  <Route path="/profile" element={<ProtectedRoute><><Header /><ProfilePage /></></ProtectedRoute>} />
  
  {/* 404 */}
  <Route path="*" element={<Navigate to="/" />} />
</Routes>
```

---

# 5️⃣ ACTUALIZAR: `src/components/Layout/Header.jsx`

**En el navbar/menú, agrega un link a /services. Busca donde están los otros links y agrega:**

```javascript
<a href="/services" style={{color: COLORS.white, textDecoration: "none", fontSize: "0.95rem"}}>
  Servicios
</a>
```

O si tienes navegación con router:

```javascript
<Link to="/services" style={{color: COLORS.white, textDecoration: "none"}}>
  Servicios
</Link>
```

---

# ✅ CHECKLIST SCRIPT A

```
[ ] Creado: src/pages/ServicesPage.jsx
[ ] Creado: src/components/Services/ServiceCard.jsx
[ ] Creado: src/components/Services/ServiceRequestModal.jsx
[ ] Actualizado: src/App.jsx (import + ruta)
[ ] Actualizado: Header.jsx (link a /services)
[ ] Ejecutado: npm run dev
[ ] Verificado: /services carga sin errores
[ ] Verificado: Modal abre al hacer clic
[ ] Verificado: Formulario se completa
```

---

## 🎯 SIGUIENTE: SCRIPT B (Comisiones + Cierre)

Cuando termines SCRIPT A y todo funcione, avisame y genero **SCRIPT B COMPLETO** con:
- Dashboard de Comisiones
- Sistema de Cierre de Créditos
- Tracking de órdenes
- Todo listo para copiar-pegar también.

**¿SCRIPT A listo para copiar?** ⚡
