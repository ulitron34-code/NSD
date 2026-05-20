import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  es: {
    translation: {
      // Navbar
      navbar: {
        home: "Inicio",
        about: "Nosotros",
        services: "Servicios",
        prices: "Precios",
        contact: "Contacto",
        login: "Acceder",
        logout: "Cerrar Sesión",
        dashboard: "Dashboard",
      },
      
      // Hero
      hero: {
        title: "Financiamiento empresarial con visión global",
        subtitle: "Boutique International Finance",
        description: "Preparamos, estructuramos y acompañamos proyectos, empresas y oportunidades de inversión hasta convertirlas en expedientes financieramente presentables ante inversionistas internacionales de clase mundial.",
        cta1: "Solicitar Diagnóstico Financiero",
        cta2: "Conocer Servicios",
      },
      
      // Dashboard
      dashboard: {
        title: "Dashboard",
        solicitantes: "Solicitantes",
        cumplimiento: "Cumplimiento",
        misProyectos: "Mis Proyectos",
        otorgantes: "Otorgantes",
        perfil: "Mi Perfil",
      },
      
      // Messages
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
      // Navbar
      navbar: {
        home: "Home",
        about: "About Us",
        services: "Services",
        prices: "Prices",
        contact: "Contact",
        login: "Login",
        logout: "Logout",
        dashboard: "Dashboard",
      },
      
      // Hero
      hero: {
        title: "Business financing with global vision",
        subtitle: "Boutique International Finance",
        description: "We prepare, structure and accompany projects, companies and investment opportunities to become financially presentable dossiers for world-class international investors.",
        cta1: "Request Financial Diagnosis",
        cta2: "Learn About Services",
      },
      
      // Dashboard
      dashboard: {
        title: "Dashboard",
        solicitantes: "Applicants",
        cumplimiento: "Compliance",
        misProyectos: "My Projects",
        otorgantes: "Lenders",
        perfil: "My Profile",
      },
      
      // Messages
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

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem("language") || "es",
    fallbackLng: "es",
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
