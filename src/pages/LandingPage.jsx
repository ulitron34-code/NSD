// LandingPage.jsx
import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { COLORS } from "../utils/constants";
import Hero from "../components/Landing/Hero";
import ClientsSection from "../components/Landing/ClientsSection";
import DifferentiersSection from "../components/Landing/DifferentiersSection";
import TestimonialsSection from "../components/Landing/TestimonialsSection";
import AboutSection from "../components/Landing/AboutSection";
import HistorySection from "../components/Landing/HistorySection";
import PricingSection from "../components/Landing/PricingSection";
import FAQSection from "../components/Landing/FAQSection";
import CTASection from "../components/Landing/CTASection";
import SecuritySection from "../components/Landing/SecuritySection";
import IntegrationsBanner from "../components/Landing/IntegrationsBanner";
import Footer from "../components/Landing/Footer";
import OperatingModelSection from "../components/Landing/OperatingModelSection";
import BusinessModelSection from "../components/Landing/BusinessModelSection";
import InvestorPilotSection from "../components/Landing/InvestorPilotSection";
import ResponsibleAISection from "../components/Landing/ResponsibleAISection";

export default function LandingPage() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const element = document.getElementById(location.hash.substring(1));
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [location]);

  return (
    <div style={{ background: COLORS.bg }}>
      <div id="inicio"><Hero /></div>
      <ClientsSection />
      
      <div id="nosotros">
        <AboutSection />
        <HistorySection />
      </div>
      
      <div id="servicios">
        <DifferentiersSection />
        <OperatingModelSection />
      </div>

      <ResponsibleAISection />

      {/* Security and Audit Section */}
      <SecuritySection />
      <BusinessModelSection />
      <InvestorPilotSection />
      
      <div id="precios">
        <PricingSection />
      </div>
      
      <div id="faq">
        <FAQSection />
      </div>
      
      <TestimonialsSection />
      <CTASection />

      {/* Integrations banner just before Footer */}
      <IntegrationsBanner />
      <Footer />
    </div>
  );
}
