export const REQUIREMENTS_MATRIX = {
  // Matriz de ejemplo para Banca Comercial - Sector Industrial
  "MX_BANCA_MFG": {
    entity: "BANCA_COMERCIAL",
    sector: "Manufacturero",
    requirements: [
      {
        code: "MFG_DOC_001",
        category: "identification",
        name: "Identificación Oficial (INE/Pasaporte)",
        is_mandatory: true,
        weight: 15,
      },
      {
        code: "MFG_DOC_002",
        category: "legal",
        name: "Acta Constitutiva y Poderes",
        is_mandatory: true,
        weight: 20,
      },
      {
        code: "MFG_FIN_001",
        category: "financial",
        name: "Estados Financieros (Últimos 3 años)",
        is_mandatory: true,
        weight: 25,
      },
      {
        code: "MFG_FIN_002",
        category: "financial",
        name: "Flujo de Caja Histórico",
        is_mandatory: true,
        weight: 15,
      },
      {
        code: "MFG_REG_001",
        category: "regulatory",
        name: "Constancia de Situación Fiscal (SAT)",
        is_mandatory: true,
        weight: 10,
      },
      {
        code: "MFG_GAR_001",
        category: "collateral",
        name: "Avalúo de Garantías Propuestas",
        is_mandatory: false,
        weight: 15,
      }
    ],
    min_dscr: 1.25,
    approval_threshold: 80
  },
  
  // Matriz de ejemplo para Family Office - Startups
  "MX_FO_STARTUP": {
    entity: "FAMILY_OFFICE",
    sector: "Tecnología / Startup",
    requirements: [
      {
        code: "START_DOC_001",
        category: "identification",
        name: "Pitch Deck y Resumen Ejecutivo",
        is_mandatory: true,
        weight: 25,
      },
      {
        code: "START_FIN_001",
        category: "financial",
        name: "Proyecciones Financieras (5 años)",
        is_mandatory: true,
        weight: 25,
      },
      {
        code: "START_LEG_001",
        category: "legal",
        name: "Cap Table (Estructura Accionaria)",
        is_mandatory: true,
        weight: 20,
      },
      {
        code: "START_OPER_001",
        category: "operational",
        name: "Métricas de Tracción (Usuarios/MRR)",
        is_mandatory: true,
        weight: 30,
      }
    ],
    min_dscr: null,
    approval_threshold: 75
  },

  // Matriz para SOFOM
  "MX_SOFOM": {
    entity: "SOFOM",
    sector: "SOFOM / Financiera No Regulada",
    requirements: [
      {
        code: "SOF_DOC_001",
        category: "regulatory",
        name: "Manual de Prevención de Lavado de Dinero (PLD/FT)",
        is_mandatory: true,
        weight: 30,
      },
      {
        code: "SOF_DOC_002",
        category: "regulatory",
        name: "Designación de Oficial de Cumplimiento y Registro SIPRES",
        is_mandatory: true,
        weight: 20,
      },
      {
        code: "SOF_FIN_001",
        category: "financial",
        name: "Estados Financieros Auditados",
        is_mandatory: true,
        weight: 30,
      },
      {
        code: "SOF_LEG_001",
        category: "legal",
        name: "Autorización para consulta de Buró de Crédito Especializado",
        is_mandatory: true,
        weight: 20,
      }
    ],
    min_dscr: 1.15,
    approval_threshold: 80
  },

  // Matriz para Fintech / ITF
  "MX_FINTECH": {
    entity: "FINTECH",
    sector: "Fintech / Institución de Tecnología Financiera",
    requirements: [
      {
        code: "FT_DOC_001",
        category: "regulatory",
        name: "Oficio de Autorización de la CNBV para Operar",
        is_mandatory: true,
        weight: 30,
      },
      {
        code: "FT_DOC_002",
        category: "operational",
        name: "Dictamen de Auditoría de Ciberseguridad",
        is_mandatory: true,
        weight: 25,
      },
      {
        code: "FT_DOC_003",
        category: "regulatory",
        name: "Manual de Control Interno y Políticas AML/KYC",
        is_mandatory: true,
        weight: 25,
      },
      {
        code: "FT_FIN_001",
        category: "financial",
        name: "Estados Financieros Dictaminados del Último Ejercicio",
        is_mandatory: false,
        weight: 20,
      }
    ],
    min_dscr: null,
    approval_threshold: 85
  },

  // Matriz para Desarrollador Inmobiliario / Real Estate
  "MX_RE_DEV": {
    entity: "DESARROLLADOR_INMOBILIARIO",
    sector: "Desarrollo Inmobiliario / Real Estate",
    requirements: [
      {
        code: "RE_DOC_001",
        category: "operational",
        name: "Licencias de Construcción, Uso de Suelo y Alineamiento",
        is_mandatory: true,
        weight: 30,
      },
      {
        code: "RE_DOC_002",
        category: "legal",
        name: "Escrituras de Propiedad o Contrato de Fideicomiso de Garantía",
        is_mandatory: true,
        weight: 30,
      },
      {
        code: "RE_DOC_003",
        category: "regulatory",
        name: "Estudio de Impacto Ambiental y Factibilidad de Servicios",
        is_mandatory: true,
        weight: 20,
      },
      {
        code: "RE_FIN_001",
        category: "financial",
        name: "Presupuesto de Obra y Calendario de Flujos / Avances",
        is_mandatory: true,
        weight: 20,
      }
    ],
    min_dscr: 1.30,
    approval_threshold: 80
  },

  // Matriz para Fondos y Deuda Privada
  "MX_PVT_DEBT": {
    entity: "FONDO_INVERSION",
    sector: "Deuda Privada y Fondos de Capital",
    requirements: [
      {
        code: "PD_DOC_001",
        category: "operational",
        name: "Memorándum de Inversión (IM) o Teaser Informativo",
        is_mandatory: true,
        weight: 35,
      },
      {
        code: "PD_DOC_002",
        category: "legal",
        name: "Acta de Comité de Inversión o Aprobación del Consejo",
        is_mandatory: true,
        weight: 25,
      },
      {
        code: "PD_FIN_001",
        category: "financial",
        name: "Track Record Histórico y Detalle de Cartera / Desembolsos",
        is_mandatory: true,
        weight: 40,
      }
    ],
    min_dscr: null,
    approval_threshold: 75
  }
};
