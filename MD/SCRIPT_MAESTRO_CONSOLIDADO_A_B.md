# 🚀 SCRIPT MAESTRO CONSOLIDADO: A + B (TODO JUNTO)

**Código 100% listo para copiar-pegar. Sin pensar. Sin dudas.**

---

## 📋 ÍNDICE RÁPIDO

```
SCRIPT A: SERVICIOS PROFESIONALES
├── 1. ServicesPage.jsx (Landing de servicios)
├── 2. ServiceCard.jsx (Componente tarjeta)
├── 3. ServiceRequestModal.jsx (Formulario)
├── 4. App.jsx (Actualización)
└── 5. Header.jsx (Actualización)

SCRIPT B: COMISIONES + CIERRE
├── 1. ServiceOrdersPage.jsx (Dashboard de órdenes)
├── 2. ServiceOrderCard.jsx (Tarjeta de orden)
├── 3. ServiceOrderDetailPanel.jsx (Panel de detalles)
├── 4. CommissionsPage.jsx (Dashboard de comisiones)
├── 5. DashboardPage.jsx (Actualización - nuevas tabs)
└── 6. App.jsx (Actualización - nuevas rutas)
```

---

---

# 🔵 PARTE 1: SCRIPT A - SERVICIOS PROFESIONALES

---

## 📦 ARCHIVO 1: `src/pages/ServicesPage.jsx`

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
      "✓ 2 rondas de revisión",
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
    console.log("Orden creada:", formData);
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

## 📦 ARCHIVO 2: `src/components/Services/ServiceCard.jsx`

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

## 📦 ARCHIVO 3: `src/components/Services/ServiceRequestModal.jsx`

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

    if (!formData.projectName || !formData.email) {
      addNotification("Completa los campos obligatorios", "error");
      return;
    }

    setIsSubmitting(true);

    try {
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

## 📦 ACTUALIZACIÓN 4: `src/App.jsx` - SCRIPT A

**Encuentra la sección imports y agrega:**

```javascript
import ServicesPage from "./pages/ServicesPage";
```

**Y en `<Routes>`, agrega esta ruta (después de /blog y antes de /dashboard):**

```javascript
<Route path="/services" element={<><Header /><ServicesPage /></>} />
```

---

## 📦 ACTUALIZACIÓN 5: `src/components/Layout/Header.jsx` - SCRIPT A

**En el navbar/menú, busca donde están los otros links y agrega:**

```javascript
<a href="/services" style={{color: COLORS.white, textDecoration: "none", fontSize: "0.95rem"}}>
  Servicios
</a>
```

O si usas React Router:

```javascript
<Link to="/services" style={{color: COLORS.white, textDecoration: "none"}}>
  Servicios
</Link>
```

---

---

# 🔴 PARTE 2: SCRIPT B - COMISIONES + CIERRE

---

## 📦 ARCHIVO 1: `src/pages/ServiceOrdersPage.jsx`

```javascript
import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { COLORS } from "../utils/constants";
import ServiceOrderCard from "../components/Services/ServiceOrderCard";
import ServiceOrderDetailPanel from "../components/Services/ServiceOrderDetailPanel";

const MOCK_ORDERS = [
  {
    id: "order-1",
    serviceId: "business-plan",
    serviceName: "Business Plan Profesional",
    projectName: "Desarrollo Inmobiliario Tech Park",
    status: "in_progress",
    progress: 65,
    amount: 2500,
    specialist: {
      id: "spec-1",
      name: "Carlos Mendoza",
      email: "carlos@nsd.com",
      avatar: "CM",
    },
    createdAt: "2026-05-15",
    expectedDelivery: "2026-05-25",
    timeline: [
      { date: "2026-05-15", event: "Orden creada", status: "completed" },
      { date: "2026-05-16", event: "Especialista asignado", status: "completed" },
      { date: "2026-05-20", event: "Análisis de mercado completado", status: "completed" },
      { date: "2026-05-22", event: "Revisión interna", status: "in_progress" },
      { date: "2026-05-25", event: "Entrega final", status: "pending" },
    ],
  },
  {
    id: "order-2",
    serviceId: "financial-analysis",
    serviceName: "Análisis Financiero Avanzado",
    projectName: "Planta Solar Las Dunas",
    status: "completed",
    progress: 100,
    amount: 1500,
    specialist: {
      id: "spec-2",
      name: "Ana García",
      email: "ana@nsd.com",
      avatar: "AG",
    },
    createdAt: "2026-05-10",
    completedAt: "2026-05-18",
    timeline: [
      { date: "2026-05-10", event: "Orden creada", status: "completed" },
      { date: "2026-05-11", event: "Especialista asignado", status: "completed" },
      { date: "2026-05-15", event: "DCF modelado", status: "completed" },
      { date: "2026-05-18", event: "Análisis entregado", status: "completed" },
    ],
  },
];

export default function ServiceOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState(MOCK_ORDERS);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [filter, setFilter] = useState("all");

  const filteredOrders = filter === "all"
    ? orders
    : orders.filter((o) => o.status === filter);

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setShowDetailPanel(true);
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      pending: COLORS.amber,
      in_progress: COLORS.navy,
      completed: COLORS.green,
    };
    return colors[status] || COLORS.textMuted;
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: "Pendiente",
      in_progress: "En Progreso",
      completed: "Completado",
    };
    return labels[status] || status;
  };

  const totalSpent = orders.reduce((sum, order) => sum + order.amount, 0);
  const completedOrders = orders.filter((o) => o.status === "completed").length;
  const activeOrders = orders.filter((o) => o.status !== "completed").length;

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{
          color: COLORS.navy,
          fontSize: "2rem",
          fontWeight: 800,
          marginBottom: "0.5rem",
        }}>
          Mis Órdenes de Servicio
        </h1>
        <p style={{ color: COLORS.textMuted }}>
          Gestiona tus solicitudes de servicios profesionales
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        gap: "1.5rem",
        marginBottom: "2.5rem",
      }}>
        {[
          { label: "Órdenes Totales", value: orders.length, color: COLORS.navy },
          { label: "Órdenes Activas", value: activeOrders, color: COLORS.amber },
          { label: "Completadas", value: completedOrders, color: COLORS.green },
          { label: "Gasto Total", value: `$${totalSpent.toLocaleString()}`, color: COLORS.gold },
        ].map((stat, i) => (
          <div key={i} style={{
            background: "white",
            padding: "1.5rem",
            borderRadius: "8px",
            border: `1px solid ${COLORS.border}`,
            borderTop: `4px solid ${stat.color}`,
          }}>
            <p style={{
              color: COLORS.textMuted,
              fontSize: "0.85rem",
              marginBottom: "0.5rem",
              textTransform: "uppercase",
              fontWeight: 600,
            }}>
              {stat.label}
            </p>
            <p style={{
              color: COLORS.navy,
              fontSize: "1.8rem",
              fontWeight: 800,
            }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{
        display: "flex",
        gap: "1rem",
        marginBottom: "2rem",
        flexWrap: "wrap",
      }}>
        {[
          { value: "all", label: "Todas" },
          { value: "in_progress", label: "En Progreso" },
          { value: "completed", label: "Completadas" },
          { value: "pending", label: "Pendientes" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            style={{
              padding: "0.6rem 1.2rem",
              background: filter === f.value ? COLORS.gold : "white",
              color: filter === f.value ? COLORS.navy : COLORS.navy,
              border: `1px solid ${filter === f.value ? COLORS.gold : COLORS.border}`,
              borderRadius: "6px",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: "0.9rem",
              transition: "all 0.3s",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div style={{
          background: "white",
          padding: "3rem 2rem",
          borderRadius: "8px",
          textAlign: "center",
          border: `1px solid ${COLORS.border}`,
        }}>
          <p style={{ color: COLORS.textMuted, fontSize: "1.1rem" }}>
            No hay órdenes en este estado.
          </p>
          <p style={{ color: COLORS.textMuted, marginTop: "0.5rem" }}>
            <a href="/services" style={{ color: COLORS.gold, textDecoration: "none" }}>
              Ver servicios disponibles
            </a>
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "1.5rem" }}>
          {filteredOrders.map((order) => (
            <ServiceOrderCard
              key={order.id}
              order={order}
              onViewDetails={handleViewDetails}
              statusColor={getStatusBadgeColor(order.status)}
              statusLabel={getStatusLabel(order.status)}
            />
          ))}
        </div>
      )}

      {/* Detail Panel */}
      {showDetailPanel && selectedOrder && (
        <ServiceOrderDetailPanel
          order={selectedOrder}
          onClose={() => setShowDetailPanel(false)}
        />
      )}
    </div>
  );
}
```

---

## 📦 ARCHIVO 2: `src/components/Services/ServiceOrderCard.jsx`

```javascript
import React from "react";
import { COLORS } from "../../utils/constants";

export default function ServiceOrderCard({ order, onViewDetails, statusColor, statusLabel }) {
  const getProgressColor = (progress) => {
    if (progress < 33) return COLORS.amber;
    if (progress < 66) return COLORS.navy;
    return COLORS.green;
  };

  return (
    <div style={{
      background: "white",
      padding: "1.5rem",
      borderRadius: "8px",
      border: `1px solid ${COLORS.border}`,
      display: "grid",
      gridTemplateColumns: "1fr auto",
      alignItems: "center",
      gap: "2rem",
      transition: "all 0.3s",
      cursor: "pointer",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)";
      e.currentTarget.style.transform = "translateY(-2px)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.boxShadow = "none";
      e.currentTarget.style.transform = "translateY(0)";
    }}>
      {/* Left side */}
      <div>
        <div style={{ marginBottom: "1rem" }}>
          <p style={{
            color: COLORS.gold,
            fontSize: "0.8rem",
            fontWeight: 600,
            marginBottom: "0.25rem",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}>
            {order.serviceName}
          </p>
          <h3 style={{
            color: COLORS.navy,
            fontSize: "1.2rem",
            fontWeight: 700,
            marginBottom: "0.5rem",
          }}>
            {order.projectName}
          </h3>
          <p style={{ color: COLORS.textMuted, fontSize: "0.9rem" }}>
            Iniciado: {new Date(order.createdAt).toLocaleDateString('es-MX')}
          </p>
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "0.5rem",
          }}>
            <p style={{
              color: COLORS.textMuted,
              fontSize: "0.85rem",
              fontWeight: 600,
            }}>
              Progreso
            </p>
            <p style={{
              color: getProgressColor(order.progress),
              fontSize: "0.85rem",
              fontWeight: 700,
            }}>
              {order.progress}%
            </p>
          </div>
          <div style={{
            height: "6px",
            background: COLORS.bg,
            borderRadius: "999px",
            overflow: "hidden",
          }}>
            <div style={{
              height: "100%",
              width: `${order.progress}%`,
              background: getProgressColor(order.progress),
              transition: "width 0.6s ease",
            }} />
          </div>
        </div>

        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
        }}>
          <div style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: COLORS.gold,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: "0.85rem",
            color: COLORS.navy,
          }}>
            {order.specialist.avatar}
          </div>
          <div>
            <p style={{
              color: COLORS.navy,
              fontWeight: 600,
              fontSize: "0.9rem",
            }}>
              {order.specialist.name}
            </p>
            <p style={{
              color: COLORS.textMuted,
              fontSize: "0.8rem",
            }}>
              Especialista
            </p>
          </div>
        </div>
      </div>

      {/* Right side */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: "1.5rem",
      }}>
        <div style={{ textAlign: "right" }}>
          <div style={{
            display: "inline-block",
            padding: "0.4rem 0.9rem",
            background: statusColor,
            color: "white",
            borderRadius: "20px",
            fontWeight: 600,
            fontSize: "0.8rem",
            marginBottom: "0.75rem",
          }}>
            {statusLabel}
          </div>
          <p style={{
            color: COLORS.navy,
            fontSize: "1.4rem",
            fontWeight: 800,
          }}>
            ${order.amount.toLocaleString()}
          </p>
          <p style={{
            color: COLORS.textMuted,
            fontSize: "0.85rem",
          }}>
            Entrega: {new Date(order.expectedDelivery || order.completedAt).toLocaleDateString('es-MX')}
          </p>
        </div>

        <button
          onClick={() => onViewDetails(order)}
          style={{
            padding: "0.7rem 1.5rem",
            background: COLORS.navy,
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontWeight: 600,
            cursor: "pointer",
            fontSize: "0.9rem",
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = "translateY(-1px)";
            e.target.style.boxShadow = "0 4px 12px rgba(27,58,92,0.3)";
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = "none";
          }}
        >
          Ver Detalles
        </button>
      </div>
    </div>
  );
}
```

---

## 📦 ARCHIVO 3: `src/components/Services/ServiceOrderDetailPanel.jsx`

```javascript
import React, { useState } from "react";
import { COLORS } from "../../utils/constants";

export default function ServiceOrderDetailPanel({ order, onClose }) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      id: 1,
      author: "Carlos Mendoza",
      role: "Especialista",
      message: "Hola, he revisado tu proyecto. Necesito algunos documentos adicionales.",
      timestamp: "2026-05-20 10:30",
    },
  ]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setMessages((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        author: "Tú",
        role: "Cliente",
        message: message,
        timestamp: new Date().toLocaleString(),
      },
    ]);
    setMessage("");
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      right: 0,
      height: "100%",
      width: "100%",
      maxWidth: "450px",
      background: "white",
      boxShadow: "-2px 0 12px rgba(0,0,0,0.15)",
      overflowY: "auto",
      zIndex: 999,
      animation: "slideInRight 0.3s ease",
    }}>
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>

      {/* Header */}
      <div style={{
        padding: "1.5rem",
        borderBottom: `1px solid ${COLORS.border}`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: COLORS.bg,
      }}>
        <div>
          <h2 style={{
            color: COLORS.navy,
            fontSize: "1.2rem",
            fontWeight: 700,
            marginBottom: "0.25rem",
          }}>
            {order.projectName}
          </h2>
          <p style={{
            color: COLORS.textMuted,
            fontSize: "0.85rem",
          }}>
            {order.serviceName}
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

      {/* Timeline */}
      <div style={{ padding: "2rem 1.5rem", borderBottom: `1px solid ${COLORS.border}` }}>
        <h3 style={{
          color: COLORS.navy,
          fontSize: "0.95rem",
          fontWeight: 700,
          marginBottom: "1.5rem",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}>
          Timeline
        </h3>

        <div style={{ position: "relative", paddingLeft: "2rem" }}>
          {order.timeline.map((item, i) => (
            <div key={i} style={{ marginBottom: "1.5rem", position: "relative" }}>
              <div style={{
                position: "absolute",
                left: "-2rem",
                top: "0",
                width: "16px",
                height: "16px",
                borderRadius: "50%",
                background: item.status === "completed" ? COLORS.green : item.status === "in_progress" ? COLORS.amber : COLORS.border,
                border: `2px solid white`,
              }} />

              {i < order.timeline.length - 1 && (
                <div style={{
                  position: "absolute",
                  left: "-1.92rem",
                  top: "16px",
                  width: "2px",
                  height: "30px",
                  background: COLORS.border,
                }} />
              )}

              <div>
                <p style={{
                  color: item.status === "completed" ? COLORS.green : item.status === "in_progress" ? COLORS.amber : COLORS.textMuted,
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  marginBottom: "0.25rem",
                }}>
                  {item.event}
                </p>
                <p style={{
                  color: COLORS.textMuted,
                  fontSize: "0.8rem",
                }}>
                  {item.date}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat */}
      <div style={{
        padding: "1.5rem",
        display: "flex",
        flexDirection: "column",
        height: "calc(100% - 400px)",
      }}>
        <h3 style={{
          color: COLORS.navy,
          fontSize: "0.95rem",
          fontWeight: 700,
          marginBottom: "1rem",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}>
          Chat con Especialista
        </h3>

        <div style={{
          flex: 1,
          overflowY: "auto",
          marginBottom: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}>
          {messages.map((msg) => (
            <div key={msg.id} style={{
              background: msg.role === "Cliente" ? COLORS.navy : COLORS.bg,
              color: msg.role === "Cliente" ? "white" : COLORS.text,
              padding: "0.9rem 1rem",
              borderRadius: "8px",
              fontSize: "0.9rem",
              lineHeight: 1.5,
            }}>
              <p style={{
                fontWeight: 600,
                marginBottom: "0.25rem",
                fontSize: "0.85rem",
                opacity: 0.8,
              }}>
                {msg.author}
              </p>
              <p style={{ marginBottom: "0.5rem" }}>{msg.message}</p>
              <p style={{
                fontSize: "0.75rem",
                opacity: 0.6,
              }}>
                {msg.timestamp}
              </p>
            </div>
          ))}
        </div>

        <form onSubmit={handleSendMessage} style={{
          display: "flex",
          gap: "0.5rem",
        }}>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Escribe tu mensaje..."
            style={{
              flex: 1,
              padding: "0.7rem 1rem",
              border: `1px solid ${COLORS.border}`,
              borderRadius: "6px",
              fontSize: "0.9rem",
            }}
          />
          <button
            type="submit"
            style={{
              padding: "0.7rem 1.2rem",
              background: COLORS.gold,
              color: COLORS.navy,
              border: "none",
              borderRadius: "6px",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: "0.9rem",
            }}
          >
            Enviar
          </button>
        </form>
      </div>

      {/* Footer */}
      <div style={{
        padding: "1.5rem",
        borderTop: `1px solid ${COLORS.border}`,
        background: COLORS.bg,
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1rem",
        }}>
          <div>
            <p style={{
              color: COLORS.textMuted,
              fontSize: "0.75rem",
              textTransform: "uppercase",
              fontWeight: 600,
              marginBottom: "0.25rem",
            }}>
              Monto
            </p>
            <p style={{
              color: COLORS.navy,
              fontWeight: 700,
              fontSize: "1.2rem",
            }}>
              ${order.amount.toLocaleString()}
            </p>
          </div>
          <div>
            <p style={{
              color: COLORS.textMuted,
              fontSize: "0.75rem",
              textTransform: "uppercase",
              fontWeight: 600,
              marginBottom: "0.25rem",
            }}>
              Entrega Estimada
            </p>
            <p style={{
              color: COLORS.navy,
              fontWeight: 700,
              fontSize: "1rem",
            }}>
              {new Date(order.expectedDelivery).toLocaleDateString('es-MX')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 📦 ARCHIVO 4: `src/pages/CommissionsPage.jsx`

```javascript
import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { COLORS } from "../utils/constants";

const MOCK_COMMISSIONS = [
  {
    id: "closure-1",
    projectName: "Desarrollo Inmobiliario Tech Park",
    solicitanteName: "Juan Carlos López",
    creditAmount: 500000,
    commissionRate: 0.02,
    commission: 10000,
    closureDate: "2026-05-15",
    status: "completed",
    solicitantEmail: "juan@example.com",
  },
  {
    id: "closure-2",
    projectName: "Planta Solar Las Dunas",
    solicitanteName: "María García Rodríguez",
    creditAmount: 750000,
    commissionRate: 0.02,
    commission: 15000,
    closureDate: "2026-05-10",
    status: "completed",
    solicitantEmail: "maria@example.com",
  },
  {
    id: "closure-3",
    projectName: "Fondo de Inversión Tech Startup",
    solicitanteName: "Roberto Martínez",
    creditAmount: 250000,
    commissionRate: 0.02,
    commission: 5000,
    closureDate: "2026-05-20",
    status: "pending",
    solicitantEmail: "roberto@example.com",
  },
];

export default function CommissionsPage() {
  const { user } = useAuth();
  const [closures, setClosures] = useState(MOCK_COMMISSIONS);
  const [filter, setFilter] = useState("all");

  const filteredClosures = filter === "all"
    ? closures
    : closures.filter((c) => c.status === filter);

  const totalCommissions = closures
    .filter((c) => c.status === "completed")
    .reduce((sum, c) => sum + c.commission, 0);

  const pendingCommissions = closures
    .filter((c) => c.status === "pending")
    .reduce((sum, c) => sum + c.commission, 0);

  const totalCredit = closures.reduce((sum, c) => sum + c.creditAmount, 0);

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{
          color: COLORS.navy,
          fontSize: "2rem",
          fontWeight: 800,
          marginBottom: "0.5rem",
        }}>
          Dashboard de Comisiones
        </h1>
        <p style={{ color: COLORS.textMuted }}>
          Gestiona tus comisiones por cierre de créditos
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        gap: "1.5rem",
        marginBottom: "2.5rem",
      }}>
        {[
          { label: "Comisiones Completadas", value: `$${totalCommissions.toLocaleString()}`, color: COLORS.green },
          { label: "Comisiones Pendientes", value: `$${pendingCommissions.toLocaleString()}`, color: COLORS.amber },
          { label: "Crédito Total Colocado", value: `$${totalCredit.toLocaleString()}`, color: COLORS.gold },
          { label: "Cierres Totales", value: closures.length, color: COLORS.navy },
        ].map((stat, i) => (
          <div key={i} style={{
            background: "white",
            padding: "1.5rem",
            borderRadius: "8px",
            border: `1px solid ${COLORS.border}`,
            borderTop: `4px solid ${stat.color}`,
          }}>
            <p style={{
              color: COLORS.textMuted,
              fontSize: "0.85rem",
              marginBottom: "0.5rem",
              textTransform: "uppercase",
              fontWeight: 600,
            }}>
              {stat.label}
            </p>
            <p style={{
              color: COLORS.navy,
              fontSize: "1.8rem",
              fontWeight: 800,
            }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{
        display: "flex",
        gap: "1rem",
        marginBottom: "2rem",
      }}>
        {[
          { value: "all", label: "Todas" },
          { value: "completed", label: "Pagadas" },
          { value: "pending", label: "Pendientes" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            style={{
              padding: "0.6rem 1.2rem",
              background: filter === f.value ? COLORS.gold : "white",
              color: filter === f.value ? COLORS.navy : COLORS.navy,
              border: `1px solid ${filter === f.value ? COLORS.gold : COLORS.border}`,
              borderRadius: "6px",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: "0.9rem",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{
        background: "white",
        borderRadius: "8px",
        border: `1px solid ${COLORS.border}`,
        overflow: "hidden",
      }}>
        <table style={{
          width: "100%",
          borderCollapse: "collapse",
        }}>
          <thead>
            <tr style={{ background: COLORS.bg, borderBottom: `1px solid ${COLORS.border}` }}>
              {["Proyecto", "Solicitante", "Monto Crédito", "Comisión", "Fecha", "Estado"].map((header) => (
                <th
                  key={header}
                  style={{
                    padding: "1rem",
                    textAlign: "left",
                    color: COLORS.navy,
                    fontWeight: 600,
                    fontSize: "0.9rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredClosures.map((closure) => (
              <tr
                key={closure.id}
                style={{
                  borderBottom: `1px solid ${COLORS.border}`,
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = COLORS.bg;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <td style={{
                  padding: "1rem",
                  color: COLORS.navy,
                  fontWeight: 600,
                  fontSize: "0.95rem",
                }}>
                  {closure.projectName}
                </td>
                <td style={{
                  padding: "1rem",
                  color: COLORS.text,
                  fontSize: "0.95rem",
                }}>
                  {closure.solicitanteName}
                </td>
                <td style={{
                  padding: "1rem",
                  color: COLORS.navy,
                  fontWeight: 600,
                  fontSize: "0.95rem",
                }}>
                  ${closure.creditAmount.toLocaleString()}
                </td>
                <td style={{
                  padding: "1rem",
                  color: COLORS.gold,
                  fontWeight: 700,
                  fontSize: "0.95rem",
                }}>
                  ${closure.commission.toLocaleString()}
                </td>
                <td style={{
                  padding: "1rem",
                  color: COLORS.textMuted,
                  fontSize: "0.95rem",
                }}>
                  {new Date(closure.closureDate).toLocaleDateString('es-MX')}
                </td>
                <td style={{
                  padding: "1rem",
                }}>
                  <span style={{
                    display: "inline-block",
                    padding: "0.4rem 0.9rem",
                    background: closure.status === "completed" ? COLORS.green : COLORS.amber,
                    color: "white",
                    borderRadius: "20px",
                    fontWeight: 600,
                    fontSize: "0.8rem",
                  }}>
                    {closure.status === "completed" ? "Pagada" : "Pendiente"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredClosures.length === 0 && (
        <div style={{
          background: "white",
          padding: "3rem 2rem",
          borderRadius: "8px",
          textAlign: "center",
          border: `1px solid ${COLORS.border}`,
          marginTop: "2rem",
        }}>
          <p style={{ color: COLORS.textMuted, fontSize: "1.1rem" }}>
            No hay cierres en este estado.
          </p>
        </div>
      )}
    </div>
  );
}
```

---

## 📦 ACTUALIZACIÓN 5: `src/pages/DashboardPage.jsx` - SCRIPT B

**Encuentra donde está `const tabs = [...]` y REEMPLAZA con esto:**

```javascript
const tabs = [
  { id: "inicio",       label: "Inicio",              icon: "🏠" },
  { id: "solicitantes", label: "Solicitantes",       icon: "👥" },
  { id: "cumplimiento", label: "Cumplimiento",       icon: "✓"  },
  { id: "proyectos",    label: "Mis Proyectos",      icon: "📁" },
  { id: "otorgantes",   label: "Otorgantes",         icon: "🏦" },
  { id: "servicios",    label: "Mis Servicios",      icon: "💼" },
  { id: "comisiones",   label: "Comisiones",         icon: "💰" },
];
```

**Luego, encuentra la función `renderContent()` y AGREGA estos casos:**

```javascript
case "servicios": 
  return <ServiceOrdersPage />;
case "comisiones": 
  return <CommissionsPage />;
```

**Y al inicio del archivo, AGREGA estos imports:**

```javascript
import ServiceOrdersPage from "../pages/ServiceOrdersPage";
import CommissionsPage from "../pages/CommissionsPage";
```

---

## 📦 ACTUALIZACIÓN 6: `src/App.jsx` - SCRIPT B

**Agrega estos imports al inicio:**

```javascript
import ServiceOrdersPage from "./pages/ServiceOrdersPage";
import CommissionsPage from "./pages/CommissionsPage";
```

**Y en `<Routes>`, agrega estas rutas (después de /services y antes de /dashboard):**

```javascript
<Route path="/service-orders" element={<ProtectedRoute><><Header /><ServiceOrdersPage /></></ProtectedRoute>} />
<Route path="/commissions" element={<ProtectedRoute><><Header /><CommissionsPage /></></ProtectedRoute>} />
```

---

---

# ✅ CHECKLIST FINAL (A + B)

## SCRIPT A: SERVICIOS PROFESIONALES

```
[ ] Creado: src/pages/ServicesPage.jsx
[ ] Creado: src/components/Services/ServiceCard.jsx
[ ] Creado: src/components/Services/ServiceRequestModal.jsx
[ ] Actualizado: src/App.jsx (import + ruta /services)
[ ] Actualizado: src/components/Layout/Header.jsx (link en navbar)
[ ] Ejecutado: npm run dev
[ ] Verificado: /services carga sin errores
[ ] Verificado: Modal abre al hacer clic
[ ] Verificado: Formulario envía correctamente
```

## SCRIPT B: COMISIONES + CIERRE

```
[ ] Creado: src/pages/ServiceOrdersPage.jsx
[ ] Creado: src/components/Services/ServiceOrderCard.jsx
[ ] Creado: src/components/Services/ServiceOrderDetailPanel.jsx
[ ] Creado: src/pages/CommissionsPage.jsx
[ ] Actualizado: src/pages/DashboardPage.jsx (tabs + cases + imports)
[ ] Actualizado: src/App.jsx (imports + rutas)
[ ] Ejecutado: npm run dev
[ ] Verificado: Dashboard tiene 2 nuevas tabs (Servicios + Comisiones)
[ ] Verificado: Timeline aparece en panel de detalles
[ ] Verificado: Chat funciona (mock)
[ ] Verificado: Tabla de comisiones carga sin errores
```

---

# 🚀 PRÓXIMO PASO

Cuando todo esté copiado y funcionando:

1. ✅ SCRIPT A (Servicios) está en landing
2. ✅ SCRIPT B (Comisiones) está en dashboard

**SIGUIENTE:** Conectar todo a APIs reales
- Service Orders API
- Commissions API
- Payment Gateway (Stripe)

**¿LISTO PARA COPIAR?** ⚡

Descarga los dos documentos anteriores y empieza por SCRIPT A primero. Cuando ese funcione, pasa a SCRIPT B.

¿Necesitas que profundice en algo específico? 💪
