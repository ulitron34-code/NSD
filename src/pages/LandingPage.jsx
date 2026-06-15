import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { COLORS } from "../utils/constants";
import Hero from "../components/Landing/Hero";
import HowItWorksSection from "../components/Landing/HowItWorksSection";
import ClientsSection from "../components/Landing/ClientsSection";
import DifferentiersSection from "../components/Landing/DifferentiersSection";
import TestimonialsSection from "../components/Landing/TestimonialsSection";
import AboutSection from "../components/Landing/AboutSection";
import PricingSection from "../components/Landing/PricingSection";
import FAQSection from "../components/Landing/FAQSection";
import CTASection from "../components/Landing/CTASection";
import Footer from "../components/Landing/Footer";

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

      <ClientsSection />

      <div id="nosotros">
        <AboutSection />
      </div>

      <div id="servicios">
        <DifferentiersSection />
      </div>

      <TestimonialsSection />

      <div id="precios">
        <PricingSection />
      </div>

      <div id="faq">
        <FAQSection />
      </div>

      <CTASection />
      <Footer />
    </div>
  );
}
