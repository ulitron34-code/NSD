import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  es: {
    translation: {
      navbar: {
        home: "Inicio",
        about: "Nosotros",
        services: "Servicios",
        prices: "Precios",
        contact: "Contacto",
        login: "Acceder",
        signup: "Crear Cuenta",
        logout: "Cerrar Sesión",
        dashboard: "Dashboard",
        platform: "Plataforma",
        coverage: "Cobertura global",
        industries: "Industrias",
        integrations: "Integraciones",
        modalities: "Modalidades",
        knowNsd: "Conocer NSDU",
      },

      hero: {
        badge: "Plataforma global de cumplimiento y riesgo",
        title: "Cumplimiento global.",
        titleHighlight: "Decisiones con evidencia.",
        description:
          "Centralice KYC, KYB, beneficiario final, validación fiscal y corporativa, sanciones, riesgo, expedientes y revisión financiera en una plataforma trazable, configurable y preparada para operaciones multijurisdiccionales.",
        cta1: "Conocer la plataforma",
        cta2: "Explorar la cobertura global",
        stat1Label: "Expedientes activos",
        stat2Label: "Cobertura jurisdiccional",
        stat3Label: "Módulos integrados",
      },

      clients: {
        eyebrow: "A QUIÉN SERVIMOS",
        title: "Soluciones para cada sector",
        subtitle:
          "Trabajamos con organizaciones de todos los tamaños que necesitan acceso a financiamiento internacional.",
        items: [
          { titulo: "Empresas Privadas",              desc: "Crecimiento, expansión, refinanciamiento, capital de trabajo" },
          { titulo: "Desarrolladores Inmobiliarios",  desc: "Proyectos con flujos propios, garantías, preventas" },
          { titulo: "Gobiernos y Entidades Públicas", desc: "Proyectos viables con enfoque de impacto económico y social" },
          { titulo: "Asociaciones Civiles",           desc: "Proyectos sociales con impacto medible y transparencia" },
          { titulo: "Universidades e Investigación",  desc: "Equipamiento, tecnología, laboratorios e innovación" },
          { titulo: "Inversionistas y Aliados",       desc: "Originación y análisis preliminar de oportunidades" },
        ],
      },

      differentiators: {
        eyebrow: "POR QUÉ NSDU",
        title: "Nuestros Diferenciadores",
        subtitle:
          "Combinamos tecnología de punta con experiencia humana para llevar tu proyecto al siguiente nivel.",
        items: [
          { titulo: "Enfoque Boutique",          desc: "Atención personalizada, proyectos seleccionados y acompañamiento estratégico de alto nivel en cada etapa." },
          { titulo: "Preparación Integral",      desc: "No presentamos un proyecto ante inversionistas sin expediente, narrativa financiera y estructura mínima verificada." },
          { titulo: "Equipo Multidisciplinario", desc: "Finanzas, legal, cumplimiento, análisis técnico e internacional integrados bajo un mismo techo." },
          { titulo: "Rigor Técnico",             desc: "Análisis técnico, financiero, legal y documental de clase mundial antes de cualquier presentación." },
        ],
      },

      testimonials: {
        eyebrow: "TESTIMONIOS",
        title: "Lo que dicen nuestros clientes",
        items: [
          {
            company: "TechStartup XYZ",
            quote:
              "Con NSDU logramos preparar nuestro expediente en 2 meses en lugar de 6. Conseguimos financiamiento de $2M de un family office europeo.",
            author: "CEO, TechStartup XYZ",
            sector: "Tecnología",
          },
          {
            company: "Desarrollos Inmobiliarios ABC",
            quote:
              "El rigor técnico y la estructura que NSDU nos ayudó a armar fue crucial para cerrar una ronda de $5M con fondos de capital privado.",
            author: "Director Financiero",
            sector: "Bienes Raíces",
          },
          {
            company: "Asociación Civil de Impacto",
            quote:
              "NSDU transformó nuestra propuesta de valor en números defendibles. Ahora somos elegibles para financiamiento de organismos multilaterales.",
            author: "Directora Ejecutiva",
            sector: "Impacto Social",
          },
        ],
      },

      about: {
        title: "Tecnología, experiencia y gobierno",
        whoTitle: "¿Quiénes somos?",
        whoText1:
          "NSDU International Finance es una firma tecnológica independiente que desarrolla soluciones de cumplimiento, riesgo y análisis inteligente de expedientes para organizaciones que operan en entornos regulados o toman decisiones financieras, corporativas y de inversión de alta relevancia.",
        whoText2:
          "A través de NSDU Global Compliance Platform, integramos información fiscal, corporativa, legal, financiera y reputacional en un entorno seguro y trazable. La plataforma ayuda a identificar personas y empresas, comprender estructuras de propiedad y control, detectar inconsistencias, gestionar alertas y preparar expedientes sólidos.",
        missionTitle: "Nuestra Misión",
        missionText:
          "Facilitar que organizaciones de cualquier tamaño integren procesos de conocimiento del cliente, validación empresarial, prevención de riesgos, revisión financiera y monitoreo mediante una tecnología flexible, explicable y adaptable a cada jurisdicción, sector y política interna.",
        visionTitle: "Nuestra Visión",
        visionText:
          "Ser una plataforma global de referencia, originada en México, para la gestión inteligente del cumplimiento, el riesgo y la debida diligencia en Latinoamérica y mercados internacionales; reconocida por elevar los estándares de transparencia, seguridad, trazabilidad y gobierno corporativo.",
        valuesTitle: "Principios",
        values: ["Evidencia antes que suposición", "Control humano en cada decisión", "Configuración por jurisdicción y sector", "Trazabilidad completa", "Privacidad desde el diseño", "Transparencia sobre capacidades"],
      },

      history: {
        title: "Historia de NSDU International Finance",
        teamTitle: "Nuestro Equipo",
        timeline: [
          { year: 2022, title: "Fundación",         desc: "NSDU nace con la misión de preparar proyectos para inversionistas internacionales" },
          { year: 2023, title: "Primer Millón",      desc: "Financiamos primer proyecto por $1M USD con family office europeo" },
          { year: 2024, title: "Expansión Regional", desc: "Extensión a Latinoamérica con oficinas en Colombia y Perú" },
          { year: 2025, title: "Plataforma Digital", desc: "Lanzamiento de plataforma SaaS para análisis automatizado" },
          { year: 2026, title: "Hoy",                desc: "NSDU acompaña +100 proyectos con acceso a capital privado global" },
        ],
        team: [
          { name: "Ulises Salgado", role: "Fundador & CEO",       bio: "15+ años en finanzas corporativas y SOFOM" },
          { name: "Ana García",     role: "Directora de Operaciones", bio: "Especialista en estructuración de capital" },
          { name: "Carlos López",   role: "Legal & Cumplimiento",  bio: "Abogado especializado en derecho financiero" },
        ],
      },

      pricing: {
        title: "Modalidades de implementación",
        subtitle: "Cada organización recibe una configuración conforme a su sector, volumen, países, políticas, integraciones y modelo de gobierno.",
        popular: "MÁS ADOPTADO",
        currency: "USD",
        plans: [
          {
            name: "Núcleo de Cumplimiento",
            price: "A medida",
            period: "",
            desc: "Para organizaciones que inician su proceso de cumplimiento digital",
            features: [
              "Expediente digital y onboarding",
              "KYC/KYB y beneficiario final",
              "Documentos y riesgo básico",
              "Gestión de casos",
              "Reportes y trazabilidad",
            ],
            cta: "Diseñar mi implementación",
          },
          {
            name: "Orquestación Avanzada",
            price: "A medida",
            period: "",
            desc: "Para equipos que requieren automatización y análisis inteligente",
            features: [
              "Todo del Núcleo",
              "Reglas configurables por sector",
              "Agentes de IA especializados",
              "Screening y monitoreo continuo",
              "Analítica y automatización de flujos",
            ],
            cta: "Diseñar mi implementación",
          },
          {
            name: "Infraestructura Institucional",
            price: "A medida",
            period: "",
            desc: "Para instituciones con requerimientos de integración y gobierno",
            features: [
              "Todo de Orquestación",
              "API, SSO y roles avanzados",
              "Segregación de funciones",
              "SLA y ambientes diferenciados",
              "Auditoría e integraciones empresariales",
            ],
            cta: "Iniciar evaluación",
          },
        ],
      },

      faq: {
        title: "Preguntas Frecuentes",
        sections: [
          {
            category: "Plataforma",
            questions: [
              { q: "¿Qué es NSDU Global Compliance Platform?", a: "Una plataforma SaaS global de cumplimiento, riesgo y revisión inteligente de expedientes. Centraliza KYC, KYB, beneficiario final, validación fiscal, sanciones, riesgo y monitoreo en un expediente único, configurable por jurisdicción y sector." },
              { q: "¿NSDU es exclusiva para México?", a: "No. NSDU opera con un núcleo tecnológico común y activa paquetes jurisdiccionales para México, Latinoamérica, Estados Unidos, Canadá, Emiratos Árabes Unidos y futuras jurisdicciones." },
              { q: "¿Es segura mi información?", a: "Sí. La plataforma utiliza cifrado en tránsito y en reposo, autenticación multifactor, roles y segregación de funciones, bitácora de auditoría y políticas de privacidad desde el diseño." },
              { q: "¿La plataforma garantiza el cumplimiento legal?", a: "No. NSDU ayuda a configurar, ejecutar, documentar y monitorear procesos. La organización usuaria conserva la responsabilidad de determinar sus obligaciones con asesoría local." },
            ],
          },
          {
            category: "Cobertura y validaciones",
            questions: [
              { q: "¿La plataforma valida documentos de todos los países?", a: "Puede admitir, analizar y conectar fuentes por país según la cobertura disponible. Cada validación automática depende de la fuente oficial o proveedor integrado y se declara con precisión." },
              { q: "¿Qué identificadores fiscales soporta?", a: "La plataforma cubre RFC y CURP (México), EIN/SSN/ITIN (EE.UU.), NIT (Colombia), RUC (Ecuador, Perú, Paraguay), RUT (Chile, Uruguay), CUIT (Argentina), BN (Canadá), TRN y Emirates ID (EAU), entre otros." },
              { q: "¿Qué listas de sanciones consulta?", a: "OFAC (EE.UU.), PEP internacionales, y en desarrollo: ONU, Reino Unido, Unión Europea, Canadá y EAU. Cada resultado incluye evidencia, fuente y flag de revisión humana." },
            ],
          },
          {
            category: "Decisiones e IA",
            questions: [
              { q: "¿La inteligencia artificial toma decisiones?", a: "No. Los agentes de NSDU apoyan la lectura, clasificación, comparación y síntesis de información. La aprobación, rechazo, escalamiento o excepción corresponde a las personas autorizadas por la organización." },
              { q: "¿Puede usarse para inversiones y crédito?", a: "Sí. Los módulos de revisión financiera e investor due diligence organizan información, riesgos, garantías, contratos, beneficiarios y pendientes para que el cliente final tome la decisión." },
              { q: "¿Cómo se define la implementación?", a: "Mediante un diagnóstico de procesos, jurisdicciones, volumen, módulos, usuarios, integraciones, seguridad, soporte y gobierno. Cada organización recibe una configuración específica." },
            ],
          },
          {
            category: "Seguridad y privacidad",
            questions: [
              { q: "¿Quién puede ver mis datos?", a: "Solo el personal autorizado de su organización. NSDU no comparte información sin consentimiento y aplica controles de acceso, segregación de funciones y bitácora de auditoría." },
              { q: "¿Cómo reclamo mis derechos ARCO?", a: "Contacta a privacidad@nsd.com para ejercer tus derechos de Acceso, Rectificación, Cancelación y Oposición." },
              { q: "¿Qué sucede si cambia una regulación?", a: "Los paquetes jurisdiccionales se mantienen versionados. Los cambios se analizan, configuran, prueban y documentan antes de su publicación en la plataforma." },
            ],
          },
        ],
      },

      cta: {
        eyebrow: "DISEÑA TU IMPLEMENTACIÓN",
        title: "Una plataforma global para decisiones\ninstitucionales mejor documentadas.",
        subtitle:
          "Conozca cómo NSDU puede adaptar expedientes, documentos, reglas, riesgos e integraciones a la estructura de su organización y a los países en los que opera.",
        cta1: "Conocer la plataforma",
        cta2: "Solicitar diagnóstico institucional",
        trust1: "Cifrado y trazabilidad",
        trust2: "IA con supervisión humana",
        trust3: "Cobertura multijurisdiccional",
      },

      footer: {
        companyName: "NSDU International Finance",
        companyDesc: "Preparamos empresas y proyectos para inversionistas globales.",
        navTitle: "Navegación",
        nav: {
          home: "Inicio",
          services: "Servicios",
          faq: "FAQ",
          access: "Acceso",
        },
        legalTitle: "Legal",
        legal: {
          privacy: "Privacidad",
          terms: "Términos",
          contact: "Contacto Legal",
        },
        contactTitle: "Contacto",
        rights: "Todos los derechos reservados.",
      },

      dashboard: {
        title: "Dashboard",
        solicitantes: "Solicitantes",
        cumplimiento: "Cumplimiento",
        misProyectos: "Mis Proyectos",
        otorgantes: "Otorgantes",
        perfil: "Mi Perfil",
        sesionActiva: "Sesión activa",
        miPerfil: "Mi Perfil",
        cerrarSesion: "Cerrar Sesión",
      },

      messages: {
        loading: "Cargando...",
        error: "Error",
        success: "Exitoso",
        warning: "Advertencia",
        noData: "Sin datos",
      },
      intel: {
        title: "🤖 Inteligencia Documental y Agentes IA",
        subtitle: "Clasificación automática, validación por reglas regulatorias y auditoría automatizada.",
        selectExpediente: "Seleccionar Expediente:",
        processAll: "🔄 Procesar Todo",
        validateAll: "✓ Validar Todo",
        analyzedDocs: "Documentos Analizados",
        avgScore: "Score Promedio",
        activeFlags: "Red Flags Activas",
        alerts: "Alertas",
        statusSemaphore: "Semáforo de Expediente",
        approved: "Aprobado",
        underObservation: "Bajo Observación",
        rejected: "Rechazado",
        pending: "Pendiente",
        documentStatusTitle: "Estatus Documental de Expediente",
        loadingAnalysis: "Cargando análisis...",
        fileName: "Nombre del Archivo",
        detectedType: "Tipo Detectado",
        semaphore: "Semáforo",
        compositeScore: "Score Completo",
        authenticity: "Autenticidad",
        validity: "Vigencia",
        consistency: "Consistencia",
        actions: "Acciones",
        rulesBtn: "👁️ Reglas",
        ocrBtn: "🔍 OCR",
        validateBtn: "✓ Validar",
        unclassified: "No Clasificado",
        rulesAppliedTitle: "📋 Reglas de Validación aplicadas a:",
        closeDetail: "❌ Cerrar Detalle",
        noRulesRun: "No se han corrido reglas de validación en este documento aún.",
        pass: "Aprobado",
        warningStatus: "Advertencia",
        failed: "Fallido",
        alertsPanelTitle: "Alertas y Hallazgos Críticos (Red Flags)",
        noAlertsFound: "✓ No hay Red Flags detectadas en este expediente.",
        executionLogsTitle: "Bitácora de Ejecución de Agentes IA",
        accumulatedCost: "Costo Acumulado Total:",
        financialHealth: "Gráficos de Salud Financiera & Benchmarks",
        financialBenchmarks: "Benchmarks del Sector",
        ebitdaMargin: "Margen EBITDA",
        dscr: "Cobertura de Deuda (DSCR)",
        leverageRatio: "Apalancamiento (Deuda/Patrimonio)",
        roe: "ROE (Rentabilidad sobre Capital)",
        roa: "ROA (Rentabilidad sobre Activos)",
        chatTitle: "💬 Pregúntale a tu Expediente (Doc Chat)",
        chatPlaceholder: "Escribe una pregunta sobre los documentos del expediente...",
        chatSend: "Enviar",
        chatLoading: "Auditoría IA pensando...",
        flowTitle: "📊 Visualizador de Orquestación de Agentes IA",
        flowClassifier: "1. Agente Clasificador",
        flowValidator: "2. Agente Validador",
        flowFinancial: "3. Agente Financiero",
        flowCrossRef: "4. Agente de Cruces",
        exportReport: "📥 Exportar Reporte Ejecutivo",
        sandboxTitle: "🧪 Playground de Simulación de Cumplimiento",
        sandboxOption1: "Simular CSF Inactiva",
        sandboxOption2: "Simular PDF Alterado",
        sandboxOption3: "Simular Descuadre Contable",
        sandboxReset: "Restaurar Original"
      },
    },
  },

  en: {
    translation: {
      navbar: {
        home: "Home",
        about: "About Us",
        services: "Services",
        prices: "Pricing",
        contact: "Contact",
        login: "Login",
        signup: "Sign Up",
        logout: "Logout",
        dashboard: "Dashboard",
        platform: "Platform",
        coverage: "Global coverage",
        industries: "Industries",
        integrations: "Integrations",
        modalities: "Implementation",
        knowNsd: "Know NSDU",
      },

      hero: {
        badge: "Global compliance and risk platform",
        title: "Global compliance.",
        titleHighlight: "Decisions with evidence.",
        description:
          "Centralize KYC, KYB, ultimate beneficial owner, tax and corporate validation, sanctions, risk, dossiers and financial review in a traceable, configurable platform ready for multi-jurisdictional operations.",
        cta1: "Explore the platform",
        cta2: "Explore global coverage",
        stat1Label: "Active dossiers",
        stat2Label: "Jurisdictional coverage",
        stat3Label: "Integrated modules",
      },

      clients: {
        eyebrow: "WHO WE SERVE",
        title: "Solutions for every sector",
        subtitle:
          "We work with organizations of all sizes that need access to international financing.",
        items: [
          { titulo: "Private Companies",           desc: "Growth, expansion, refinancing, working capital" },
          { titulo: "Real Estate Developers",      desc: "Projects with own cash flows, guarantees, pre-sales" },
          { titulo: "Governments & Public Entities", desc: "Viable projects with economic and social impact focus" },
          { titulo: "Non-Profit Associations",     desc: "Social projects with measurable impact and transparency" },
          { titulo: "Universities & Research",     desc: "Equipment, technology, laboratories, and innovation" },
          { titulo: "Investors & Partners",        desc: "Deal origination and preliminary opportunity analysis" },
        ],
      },

      differentiators: {
        eyebrow: "WHY NSDU",
        title: "Our Differentiators",
        subtitle:
          "We combine cutting-edge technology with human expertise to take your project to the next level.",
        items: [
          { titulo: "Boutique Focus",          desc: "Personalized attention, curated projects, and high-level strategic guidance at every stage." },
          { titulo: "Comprehensive Preparation", desc: "We never present a project to investors without a complete dossier, financial narrative, and verified minimum structure." },
          { titulo: "Multidisciplinary Team",  desc: "Finance, legal, compliance, technical, and international expertise integrated under one roof." },
          { titulo: "Technical Rigor",         desc: "World-class technical, financial, legal, and documentary analysis before any presentation." },
        ],
      },

      testimonials: {
        eyebrow: "TESTIMONIALS",
        title: "What our clients say",
        items: [
          {
            company: "TechStartup XYZ",
            quote:
              "With NSDU we prepared our dossier in 2 months instead of 6. We secured $2M financing from a European family office.",
            author: "CEO, TechStartup XYZ",
            sector: "Technology",
          },
          {
            company: "ABC Real Estate Developments",
            quote:
              "The technical rigor and structure that NSDU helped us build was crucial to close a $5M round with private equity funds.",
            author: "CFO",
            sector: "Real Estate",
          },
          {
            company: "Impact Civil Association",
            quote:
              "NSDU transformed our value proposition into defensible numbers. We are now eligible for multilateral organization financing.",
            author: "Executive Director",
            sector: "Social Impact",
          },
        ],
      },

      about: {
        title: "About NSDU International Finance",
        whoTitle: "Who We Are",
        whoText1:
          "NSDU International Finance is an independent boutique firm that helps convert projects, companies, and investment opportunities into financially presentable, documented, and defensible dossiers for national and international capital sources.",
        whoText2:
          "Our team combines expertise in corporate finance, capital structuring, regulatory compliance, and international business.",
        missionTitle: "Our Mission",
        missionText:
          "To prepare, structure, and accompany companies, projects, and investors to achieve quality financing through rigorous processes, compliance, and international due diligence.",
        visionTitle: "Our Vision",
        visionText:
          "To be the reference firm in Mexico and Latin America for investment project preparation and access to private capital, distinguished by rigor, transparency, and results.",
        valuesTitle: "Our Values",
        values: ["Technical Rigor", "Confidentiality", "Compliance", "Transparency", "Excellence", "Independence"],
      },

      history: {
        title: "History of NSDU International Finance",
        teamTitle: "Our Team",
        timeline: [
          { year: 2022, title: "Founded",            desc: "NSDU is born with the mission of preparing projects for international investors" },
          { year: 2023, title: "First Million",      desc: "We financed the first project for $1M USD with a European family office" },
          { year: 2024, title: "Regional Expansion", desc: "Expansion to Latin America with offices in Colombia and Peru" },
          { year: 2025, title: "Digital Platform",   desc: "Launch of SaaS platform for automated analysis" },
          { year: 2026, title: "Today",              desc: "NSDU supports 100+ projects with access to global private capital" },
        ],
        team: [
          { name: "Ulises Salgado", role: "Founder & CEO",             bio: "15+ years in corporate finance and SOFOM" },
          { name: "Ana García",     role: "Chief Operating Officer",    bio: "Specialist in capital structuring" },
          { name: "Carlos López",   role: "Legal & Compliance",         bio: "Attorney specialized in financial law" },
        ],
      },

      pricing: {
        title: "Plans & Pricing",
        subtitle: "Select the plan that best fits your needs",
        popular: "MOST POPULAR",
        currency: "USD",
        plans: [
          {
            name: "Basic",
            price: "$299",
            period: "/mo",
            desc: "For independent applicants",
            features: [
              "Unlimited RFC analysis",
              "Credit score",
              "Monthly reports",
              "Email support",
            ],
            cta: "Get Started",
          },
          {
            name: "Professional",
            price: "$699",
            period: "/mo",
            desc: "For companies and startups",
            features: [
              "Everything in Basic",
              "Lender network access",
              "Priority support",
              "International analysis",
              "2-3 simultaneous projects",
            ],
            cta: "Get Started",
          },
          {
            name: "Enterprise",
            price: "$899",
            period: "/mo",
            desc: "For funds and institutions",
            features: [
              "Everything in Professional",
              "API access",
              "Unlimited analysis",
              "Dedicated account manager",
              "99.9% guaranteed uptime",
              "Custom compliance",
            ],
            cta: "Contact Us",
          },
        ],
      },

      faq: {
        title: "Frequently Asked Questions",
        sections: [
          {
            category: "Platform",
            questions: [
              { q: "What is NSDU International Finance?", a: "A boutique platform that prepares projects for international investors" },
              { q: "Is my information secure?",          a: "Yes, we use SSL/TLS encryption and comply with LGPD/GDPR" },
              { q: "How much does it cost?",             a: "Plans from $99 USD/month. Contact us for a custom quote" },
            ],
          },
          {
            category: "For Applicants",
            questions: [
              { q: "What do I need to get started?",  a: "Email, valid RFC and basic documentation" },
              { q: "How long does an analysis take?", a: "Between 2-5 minutes for initial analysis" },
              { q: "Can I improve my score?",         a: "Yes, we provide specific recommendations" },
            ],
          },
          {
            category: "Security",
            questions: [
              { q: "Who can see my data?",          a: "Only authorized staff. We never share without consent" },
              { q: "How do I exercise my rights?",  a: "Contact privacidad@nsd.com for ARCO rights" },
              { q: "How do I delete my data?",      a: "Request cancellation at privacidad@nsd.com" },
            ],
          },
        ],
      },

      cta: {
        eyebrow: "GET STARTED TODAY",
        title: "Ready to transform\nyour project?",
        subtitle:
          "Access our Compliance Platform and begin your applicant analysis today.",
        cta1: "Create Free Account →",
        cta2: "Talk to an Expert",
        trust1: "Secure data",
        trust2: "Analysis in seconds",
        trust3: "Global lender network",
      },

      footer: {
        companyName: "NSDU International Finance",
        companyDesc: "We prepare companies and projects for global investors.",
        navTitle: "Navigation",
        nav: {
          home: "Home",
          services: "Services",
          faq: "FAQ",
          access: "Access",
        },
        legalTitle: "Legal",
        legal: {
          privacy: "Privacy",
          terms: "Terms",
          contact: "Legal Contact",
        },
        contactTitle: "Contact",
        rights: "All rights reserved.",
      },

      dashboard: {
        title: "Dashboard",
        solicitantes: "Applicants",
        cumplimiento: "Compliance",
        misProyectos: "My Projects",
        otorgantes: "Lenders",
        perfil: "My Profile",
        sesionActiva: "Active session",
        miPerfil: "My Profile",
        cerrarSesion: "Log Out",
      },

      messages: {
        loading: "Loading...",
        error: "Error",
        success: "Success",
        warning: "Warning",
        noData: "No data",
      },
      intel: {
        title: "🤖 Document Intelligence & AI Agents",
        subtitle: "Automated classification, compliance validation rules, and automated auditing.",
        selectExpediente: "Select Dossier:",
        processAll: "🔄 Process All",
        validateAll: "✓ Validate All",
        analyzedDocs: "Analyzed Documents",
        avgScore: "Average Score",
        activeFlags: "Active Red Flags",
        alerts: "Alerts",
        statusSemaphore: "Dossier Status Traffic Light",
        approved: "Approved",
        underObservation: "Under Observation",
        rejected: "Rejected",
        pending: "Pending",
        documentStatusTitle: "Dossier Document Status",
        loadingAnalysis: "Loading analysis...",
        fileName: "File Name",
        detectedType: "Detected Type",
        semaphore: "Traffic Light",
        compositeScore: "Composite Score",
        authenticity: "Authenticity",
        validity: "Validity",
        consistency: "Consistency",
        actions: "Actions",
        rulesBtn: "👁️ Rules",
        ocrBtn: "🔍 OCR",
        validateBtn: "✓ Validate",
        unclassified: "Unclassified",
        rulesAppliedTitle: "📋 Validation Rules applied to:",
        closeDetail: "❌ Close Details",
        noRulesRun: "No validation rules have been run on this document yet.",
        pass: "Passed",
        warningStatus: "Warning",
        failed: "Failed",
        alertsPanelTitle: "Alerts & Critical Findings (Red Flags)",
        noAlertsFound: "✓ No Red Flags detected in this dossier.",
        executionLogsTitle: "AI Agent Execution Logs",
        accumulatedCost: "Total Accumulated Cost:",
        financialHealth: "Financial Health Charts & Benchmarks",
        financialBenchmarks: "Sector Benchmarks",
        ebitdaMargin: "EBITDA Margin",
        dscr: "Debt Service Coverage Ratio (DSCR)",
        leverageRatio: "Leverage Ratio (Debt/Equity)",
        roe: "ROE (Return on Equity)",
        roa: "ROA (Return on Assets)",
        chatTitle: "💬 Ask Your Dossier (Doc Chat)",
        chatPlaceholder: "Type a question about the dossier's documents...",
        chatSend: "Send",
        chatLoading: "AI Auditor thinking...",
        flowTitle: "📊 AI Agent Orchestration Flow",
        flowClassifier: "1. Classifier Agent",
        flowValidator: "2. Validator Agent",
        flowFinancial: "3. Financial Agent",
        flowCrossRef: "4. Cross-Reference Agent",
        exportReport: "📥 Export Executive Report",
        sandboxTitle: "🧪 Compliance Simulation Playground",
        sandboxOption1: "Simulate Suspended CSF",
        sandboxOption2: "Simulate Altered PDF",
        sandboxOption3: "Simulate Out-of-balance Financials",
        sandboxReset: "Restore Original"
      },
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem("language") || "es",
  fallbackLng: "es",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
