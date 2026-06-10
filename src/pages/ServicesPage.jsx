import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { COLORS } from "../utils/constants";
import ServiceCard from "../components/Services/ServiceCard";
import ServiceRequestModal from "../components/Services/ServiceRequestModal";
import Footer from "../components/Landing/Footer";
import { translateCopy, uiText } from "../utils/runtimeCopy";

// Helper components for icons to replace lucide-react and avoid npm install overhead
const BriefcaseIcon = ({ size, color, strokeWidth }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
  </svg>
);

const TrendingUpIcon = ({ size, color, strokeWidth }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
  </svg>
);

const PresentationIcon = ({ size, color, strokeWidth }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h20"/><path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3"/><path d="m7 21 5-5 5 5"/>
  </svg>
);

const StarIcon = ({ size, color, strokeWidth, fill }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

const SERVICES = [
  {
    id: "business-plan",
    icon: <BriefcaseIcon size={48} color={COLORS.navy} strokeWidth={1.5} />,
    title: "Business Plan Profesional",
    description: "Plan de negocios completo con proyecciones, estrategia, riesgos y narrativa para credito o inversion",
    features: [
      "Analisis de mercado exhaustivo",
      "Proyecciones financieras",
      "Estrategia operativa y ejecutiva",
      "Analisis competitivo",
      "Plan de implementacion",
      "Checklist documental para otorgantes"
    ],
    price: 2500,
    deliveryTime: "10-14 días",
    recommended: true,
  },
  {
    id: "financial-analysis",
    icon: <TrendingUpIcon size={48} color={COLORS.navy} strokeWidth={1.5} />,
    title: "Analisis Financiero Avanzado",
    description: "Analisis integral de viabilidad, capacidad de pago, riesgos, escenarios y lectura institucional",
    features: [
      "DCF modelado profesional",
      "Analisis de sensibilidad",
      "Scoring crediticio NSD",
      "Metricas de rentabilidad",
      "Mapeo de riesgos",
      "Observaciones para revision de credito"
    ],
    price: 1500,
    deliveryTime: "7-10 días",
    recommended: false,
  },
  {
    id: "pitch-deck",
    icon: <PresentationIcon size={48} color={COLORS.navy} strokeWidth={1.5} />,
    title: "Presentacion Ejecutiva Premium",
    description: "Deck profesional para bancos, fondos, SOFOMES, inversionistas, comites y aliados de capital",
    features: [
      "Slide deck de 20-30 paginas",
      "Narrativa ejecutiva pulida",
      "Visualizaciones de datos",
      "Anexos tecnicos completos",
      "Presentacion en PowerPoint + PDF",
      "Narrativa alineada a requisitos del otorgante"
    ],
    price: 1200,
    deliveryTime: "5-7 días",
    recommended: false,
  },
  {
    id: "combo-complete",
    icon: <StarIcon size={48} color={COLORS.gold} strokeWidth={1.5} fill={COLORS.gold} />,
    title: "Paquete Completo de Fondeo",
    description: "Business Plan + Analisis + Presentacion + data room y expediente base para revision institucional",
    features: [
      "Todos los servicios anteriores",
      "Descuento especial del 20%",
      "Gestor dedicado",
      "2 rondas de revision",
      "Entrega en 18-21 dias",
      "Preparacion para revision con IA"
    ],
    price: 4160,
    deliveryTime: "18-21 días",
    recommended: false,
  },
];

export default function ServicesPage() {
  const { i18n } = useTranslation();
  const copy = (value) => translateCopy(value, i18n.language);
  const L = (es, en) => uiText(i18n, es, en);

  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  const localizedServices = SERVICES.map((service) => ({
    ...service,
    title: copy(service.title),
    description: copy(service.description),
    features: service.features.map((feature) => copy(feature)),
    deliveryTime: copy(service.deliveryTime),
  }));

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
            {copy("Servicios profesionales NSD IF")}
          </h1>
          <p style={{
            fontSize: "1.2rem",
            opacity: 0.9,
            marginBottom: "0.5rem",
          }}>
            {copy("Preparamos tu empresa o proyecto para credito, capital, inversion o fondeo")}
          </p>
          <p style={{
            fontSize: "1rem",
            opacity: 0.7,
            marginBottom: "1.5rem",
          }}>
            {copy("Business plan, analisis financiero, pitch deck, data room y expediente documental preparado para revision\n            con IA, cumplimiento y entidades financieras.")}
          </p>
          {isLoggedIn && (
            <button
              onClick={() => navigate("/service-orders")}
              style={{
                padding: "0.8rem 1.4rem",
                background: COLORS.gold,
                color: COLORS.navy,
                border: "none",
                borderRadius: "6px",
                fontWeight: 800,
                cursor: "pointer",
                fontSize: "0.95rem",
              }}
            >
              {copy("Ver mis expedientes")}
            </button>
          )}
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
          {localizedServices.map((service) => (
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
            {copy("Preguntas Frecuentes")}
          </h2>

          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "2rem",
          }}>
            {[
              {
                q: "Cuanto tiempo tarda?",
                a: "Depende del servicio: Business Plan 10-14 dias, Analisis 7-10 dias, Presentacion 5-7 dias y paquete completo 18-21 dias.",
              },
              {
                q: "Que incluye cada servicio?",
                a: "Entregables profesionales, revision, ajustes y orientacion para que el expediente sea mas claro ante bancos, SOFOMES, fondos o aliados de capital.",
              },
              {
                q: "Se puede acelerar la entrega?",
                a: "Si, podemos evaluar entregas express con costo adicional.",
              },
              {
                q: "Se revisan documentos con IA?",
                a: "Si. El expediente puede cargarse en el data room para detectar faltantes, vencimientos, inconsistencias y observaciones antes de enviarlo a revision.",
              },
              {
                q: "Como se controla la calidad?",
                a: "Cada servicio incluye entregables definidos, revision documental, recomendaciones y aprobacion antes de cierre.",
              },
              {
                q: "Puedo mezclar servicios?",
                a: "Si. Puedes contratar servicios individuales o armar un paquete segun etapa, monto buscado, tipo de otorgante y nivel de preparacion del expediente.",
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
                  {copy(faq.q)}
                </p>
                <p style={{
                  color: COLORS.textMuted,
                  fontSize: "0.9rem",
                  lineHeight: 1.6,
                }}>
                  {copy(faq.a)}
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
            {copy("Listo para preparar un expediente revisable?")}
          </h2>
          <p style={{
            marginBottom: "2rem",
            opacity: 0.9,
            fontSize: "1.05rem",
          }}>
            {copy("Nuestro equipo revisara tu caso, definira los documentos necesarios y te ayudara a preparar una solicitud\n            mas clara para entidades financieras o aliados de capital.")}
          </p>
          <button
            onClick={() => navigate("/service-orders")}
            style={{
              padding: "1rem 2.5rem",
              background: "white",
              color: COLORS.navy,
              border: "none",
              borderRadius: "6px",
              fontWeight: 700,
              fontSize: "1rem",
              cursor: "pointer",
              marginRight: "0.75rem",
            }}
          >
            {copy("Ver mis expedientes")}
          </button>
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
            {copy("Solicitar Servicio")}
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
