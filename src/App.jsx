import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import ProtectedRoute from "./components/Layout/ProtectedRoute";
import Header from "./components/Layout/Header";
import Toast from "./components/Shared/Toast";
import "./App.css";
import "./utils/i18n";

// Landing y rutas críticas — carga inmediata
import LandingPage from "./pages/LandingPage";
import LoginComponent from "./components/Auth/LoginComponent";
import SignupComponent from "./components/Auth/SignupComponent";

// Rutas secundarias — lazy load
const DashboardPage     = lazy(() => import("./pages/DashboardPage"));
const ProfilePage       = lazy(() => import("./pages/ProfilePage"));
const PrivacyPage       = lazy(() => import("./pages/PrivacyPage"));
const TermsPage         = lazy(() => import("./pages/TermsPage"));
const ContactPage       = lazy(() => import("./pages/ContactPage"));
const BlogPage          = lazy(() => import("./pages/BlogPage"));
const CertificationsPage = lazy(() => import("./pages/CertificationsPage"));
const ServicesPage      = lazy(() => import("./pages/ServicesPage"));
const ServiceOrdersPage = lazy(() => import("./pages/ServiceOrdersPage"));
const CheckoutPage      = lazy(() => import("./pages/CheckoutPage"));
const SharedDataRoomPage = lazy(() => import("./pages/SharedDataRoomPage"));
const NotFoundPage      = lazy(() => import("./pages/NotFoundPage"));

const Loader = () => (
  <div style={{
    minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center",
    color: "#6B6560", fontSize: "0.9rem",
  }}>
    Cargando...
  </div>
);

function AppContent() {
  return (
    <Router>
      <Suspense fallback={<Loader />}>
        <Routes>
          {/* Landing */}
          <Route path="/" element={<><Header isLanding={true} /><LandingPage /></>} />

          {/* Auth */}
          <Route path="/login"  element={<><Header /><LoginComponent /></>} />
          <Route path="/signup" element={<><Header /><SignupComponent /></>} />

          {/* Páginas públicas */}
          <Route path="/privacy"        element={<><Header /><PrivacyPage /></>} />
          <Route path="/terms"          element={<><Header /><TermsPage /></>} />
          <Route path="/contact"        element={<><Header /><ContactPage /></>} />
          <Route path="/blog"           element={<><Header isLanding={true} /><BlogPage /></>} />
          <Route path="/certifications" element={<><Header isLanding={true} /><CertificationsPage /></>} />
          <Route path="/services"       element={<><Header isLanding={true} /><ServicesPage /></>} />
          <Route path="/shared-data-room/:token" element={<><Header /><SharedDataRoomPage /></>} />

          {/* Dashboard protegido */}
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute>
                <><Header /><DashboardPage /></>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <><Header /><ProfilePage /></>
              </ProtectedRoute>
            }
          />
          <Route
            path="/service-orders"
            element={
              <ProtectedRoute>
                <><Header /><ServiceOrdersPage /></>
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <><Header /><CheckoutPage /></>
              </ProtectedRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<><Header /><NotFoundPage /></>} />
        </Routes>
      </Suspense>
      <Toast />
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </AuthProvider>
  );
}
