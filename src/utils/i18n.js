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
      },

      hero: {
        badge: "Plataforma Activa — Fintech Boutique",
        title: "Estructura, presenta y financia",
        titleHighlight: "proyectos de alto impacto",
        description:
          "Conectamos empresas y proyectos con inversionistas internacionales mediante análisis automatizado, cumplimiento regulatorio y una red de 120+ financiadores globales.",
        cta1: "Comenzar Ahora →",
        cta2: "Hablar con un Experto",
        stat1Label: "Proyectos Estructurados",
        stat2Label: "Tasa de Éxito",
        stat3Label: "Financiadores Globales",
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
        eyebrow: "POR QUÉ NSD",
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
              "Con NSD logramos preparar nuestro expediente en 2 meses en lugar de 6. Conseguimos financiamiento de $2M de un family office europeo.",
            author: "CEO, TechStartup XYZ",
            sector: "Tecnología",
          },
          {
            company: "Desarrollos Inmobiliarios ABC",
            quote:
              "El rigor técnico y la estructura que NSD nos ayudó a armar fue crucial para cerrar una ronda de $5M con fondos de capital privado.",
            author: "Director Financiero",
            sector: "Bienes Raíces",
          },
          {
            company: "Asociación Civil de Impacto",
            quote:
              "NSD transformó nuestra propuesta de valor en números defendibles. Ahora somos elegibles para financiamiento de organismos multilaterales.",
            author: "Directora Ejecutiva",
            sector: "Impacto Social",
          },
        ],
      },

      about: {
        title: "Sobre NSD International Finance",
        whoTitle: "¿Quiénes somos?",
        whoText1:
          "NSD International Finance es una firma boutique independiente que ayuda a convertir proyectos, empresas y oportunidades de inversión en expedientes financieramente presentables, documentados y defendibles ante fuentes de capital nacionales e internacionales.",
        whoText2:
          "Nuestro equipo combina expertise en finanzas corporativas, estructuración de capital, cumplimiento regulatorio y negocios internacionales.",
        missionTitle: "Nuestra Misión",
        missionText:
          "Preparar, estructurar y acompañar empresas, proyectos e inversionistas para lograr financiamientos de calidad, bajo procesos de rigor, cumplimiento y debida diligencia internacional.",
        visionTitle: "Nuestra Visión",
        visionText:
          "Ser la firma de referencia en México y Latinoamérica para preparación de proyectos de inversión y acceso a capital privado, distinguida por rigor, transparencia y resultados.",
        valuesTitle: "Nuestros Valores",
        values: ["Rigor Técnico", "Confidencialidad", "Cumplimiento", "Transparencia", "Excelencia", "Independencia"],
      },

      history: {
        title: "Historia de NSD International Finance",
        teamTitle: "Nuestro Equipo",
        timeline: [
          { year: 2022, title: "Fundación",         desc: "NSD nace con la misión de preparar proyectos para inversionistas internacionales" },
          { year: 2023, title: "Primer Millón",      desc: "Financiamos primer proyecto por $1M USD con family office europeo" },
          { year: 2024, title: "Expansión Regional", desc: "Extensión a Latinoamérica con oficinas en Colombia y Perú" },
          { year: 2025, title: "Plataforma Digital", desc: "Lanzamiento de plataforma SaaS para análisis automatizado" },
          { year: 2026, title: "Hoy",                desc: "NSD acompaña +100 proyectos con acceso a capital privado global" },
        ],
        team: [
          { name: "Ulises Salgado", role: "Fundador & CEO",       bio: "15+ años en finanzas corporativas y SOFOM" },
          { name: "Ana García",     role: "Directora de Operaciones", bio: "Especialista en estructuración de capital" },
          { name: "Carlos López",   role: "Legal & Cumplimiento",  bio: "Abogado especializado en derecho financiero" },
        ],
      },

      pricing: {
        title: "Planes y Precios",
        subtitle: "Selecciona el plan que mejor se adapta a tus necesidades",
        popular: "MÁS POPULAR",
        currency: "USD",
        plans: [
          {
            name: "Básico",
            price: "$299",
            period: "/mes",
            desc: "Para solicitantes independientes",
            features: [
              "Análisis RFC ilimitados",
              "Score crediticio",
              "Reportes mensuales",
              "Soporte por email",
            ],
            cta: "Empezar",
          },
          {
            name: "Profesional",
            price: "$699",
            period: "/mes",
            desc: "Para empresas y startups",
            features: [
              "Todo del Plan Básico",
              "Acceso a otorgantes",
              "Soporte prioritario",
              "Análisis internacionales",
              "2-3 proyectos simultáneamente",
            ],
            cta: "Empezar",
          },
          {
            name: "Empresarial",
            price: "$899",
            period: "/mes",
            desc: "Para fondos e instituciones",
            features: [
              "Todo del Plan Profesional",
              "Acceso por API",
              "Análisis ilimitados",
              "Ejecutivo dedicado",
              "Disponibilidad garantizada 99.9%",
              "Cumplimiento específico",
            ],
            cta: "Contactar",
          },
        ],
      },

      faq: {
        title: "Preguntas Frecuentes",
        sections: [
          {
            category: "Plataforma",
            questions: [
              { q: "¿Qué es NSD International Finance?", a: "Plataforma boutique que prepara proyectos para inversionistas internacionales" },
              { q: "¿Es segura mi información?",         a: "Sí, utilizamos encriptación SSL/TLS y cumplimos LGPD/GDPR" },
              { q: "¿Cuánto cuesta?",                    a: "Planes desde $99 USD/mes. Contáctanos para presupuesto personalizado" },
            ],
          },
          {
            category: "Para Solicitantes",
            questions: [
              { q: "¿Qué necesito para comenzar?",  a: "Email, RFC válido y documentación básica" },
              { q: "¿Cuánto tarda un análisis?",    a: "Entre 2-5 minutos para análisis inicial" },
              { q: "¿Puedo mejorar mi score?",      a: "Sí, te damos recomendaciones específicas" },
            ],
          },
          {
            category: "Seguridad",
            questions: [
              { q: "¿Quién ve mis datos?",          a: "Solo personal autorizado. Nunca compartimos sin consentimiento" },
              { q: "¿Cómo reclamo mis derechos?",   a: "Contacta a privacidad@nsd.com para derechos ARCO" },
              { q: "¿Cómo elimino mis datos?",      a: "Solicita cancelación a privacidad@nsd.com" },
            ],
          },
        ],
      },

      cta: {
        eyebrow: "COMIENZA HOY",
        title: "¿Listo para transformar\ntu proyecto?",
        subtitle:
          "Accede a nuestra Plataforma de Cumplimiento y comienza el análisis de tu solicitante hoy mismo.",
        cta1: "Crear Cuenta Gratis →",
        cta2: "Hablar con un Experto",
        trust1: "🔒 Datos seguros",
        trust2: "⚡ Análisis en segundos",
        trust3: "🌎 Red global de financiadores",
      },

      footer: {
        companyName: "NSD International Finance",
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
      },

      hero: {
        badge: "Active Platform — Boutique Fintech",
        title: "Structure, present and finance",
        titleHighlight: "high-impact projects",
        description:
          "We connect companies and projects with international investors through automated analysis, regulatory compliance, and a network of 120+ global lenders.",
        cta1: "Get Started →",
        cta2: "Talk to an Expert",
        stat1Label: "Structured Projects",
        stat2Label: "Success Rate",
        stat3Label: "Global Lenders",
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
        eyebrow: "WHY NSD",
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
              "With NSD we prepared our dossier in 2 months instead of 6. We secured $2M financing from a European family office.",
            author: "CEO, TechStartup XYZ",
            sector: "Technology",
          },
          {
            company: "ABC Real Estate Developments",
            quote:
              "The technical rigor and structure that NSD helped us build was crucial to close a $5M round with private equity funds.",
            author: "CFO",
            sector: "Real Estate",
          },
          {
            company: "Impact Civil Association",
            quote:
              "NSD transformed our value proposition into defensible numbers. We are now eligible for multilateral organization financing.",
            author: "Executive Director",
            sector: "Social Impact",
          },
        ],
      },

      about: {
        title: "About NSD International Finance",
        whoTitle: "Who We Are",
        whoText1:
          "NSD International Finance is an independent boutique firm that helps convert projects, companies, and investment opportunities into financially presentable, documented, and defensible dossiers for national and international capital sources.",
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
        title: "History of NSD International Finance",
        teamTitle: "Our Team",
        timeline: [
          { year: 2022, title: "Founded",            desc: "NSD is born with the mission of preparing projects for international investors" },
          { year: 2023, title: "First Million",      desc: "We financed the first project for $1M USD with a European family office" },
          { year: 2024, title: "Regional Expansion", desc: "Expansion to Latin America with offices in Colombia and Peru" },
          { year: 2025, title: "Digital Platform",   desc: "Launch of SaaS platform for automated analysis" },
          { year: 2026, title: "Today",              desc: "NSD supports 100+ projects with access to global private capital" },
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
              { q: "What is NSD International Finance?", a: "A boutique platform that prepares projects for international investors" },
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
        trust1: "🔒 Secure data",
        trust2: "⚡ Analysis in seconds",
        trust3: "🌎 Global lender network",
      },

      footer: {
        companyName: "NSD International Finance",
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
