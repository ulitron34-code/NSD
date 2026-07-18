import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { COLORS } from "../utils/constants";
import Hero from "../components/Landing/Hero";
import HowItWorksSection from "../components/Landing/HowItWorksSection";
import ClientsSection from "../components/Landing/ClientsSection";
import DifferentiersSection from "../components/Landing/DifferentiersSection";
import AboutSection from "../components/Landing/AboutSection";
import PricingSection from "../components/Landing/PricingSection";
import FAQSection from "../components/Landing/FAQSection";
import CTASection from "../components/Landing/CTASection";
import Footer from "../components/Landing/Footer";
import OperatingModelSection from "../components/Landing/OperatingModelSection";
import ResponsibleAISection from "../components/Landing/ResponsibleAISection";

export default function LandingPage() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const el = document.getElementById(location.hash.substring(1));
      if (el) el.scrollIntoView({ behavior: "smooth" });
    } else {
      window.scrollTo(0, 0);
    }
  }, [location]);

  return (
    <div style={{ background: COLORS.bg }}>
      <div id="inicio"><Hero /></div>

      <HowItWorksSection />

      <OperatingModelSection />

      <ClientsSection />

      <div id="nosotros">
        <AboutSection />
      </div>

      <div id="servicios">
        <DifferentiersSection />
      </div>

      <div style={{ position: "relative", height: "clamp(320px, 42vw, 480px)", overflow: "hidden" }}>
        <img
          src="/about-full.jpg"
          alt="NEXUS Secure Due-Diligence Unit"
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </div>

      <div id="precios">
        <PricingSection />
      </div>

      <div id="faq">
        <FAQSection />
      </div>

      <ResponsibleAISection />
      <CTASection />
      <Footer />
    </div>
  );
}
