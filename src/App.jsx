import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import BlogPage from "./pages/BlogPage";
import CertificationsPage from "./pages/CertificationsPage";
import ProtectedRoute from "./components/Layout/ProtectedRoute";
import Header from "./components/Layout/Header";
import Toast from "./components/Shared/Toast";
import LoginComponent from "./components/Auth/LoginComponent";
import SignupComponent from "./components/Auth/SignupComponent";
import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/DashboardPage";
import "./App.css";
import "./utils/i18n";

import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import ContactPage from "./pages/ContactPage";
import ProfilePage from "./pages/ProfilePage";

function AppContent() {
  const { t } = useTranslation();
  
  return (
    <>
      <Router>
        <Routes>
          {/* Landing Page (sin login) */}
          <Route path="/" element={<><Header isLanding={true} /><LandingPage /></>} />
          <Route path="/login" element={<><Header /><LoginComponent /></>} />
          <Route path="/signup" element={<><Header /><SignupComponent /></>} />
          
          {/* Public Pages */}
          <Route path="/privacy" element={<><Header /><PrivacyPage /></>} />
          <Route path="/terms" element={<><Header /><TermsPage /></>} />
          <Route path="/contact" element={<><Header /><ContactPage /></>} />
          <Route path="/blog" element={<><Header isLanding={true} /><BlogPage /></>} />
          <Route path="/certifications" element={<><Header isLanding={true} /><CertificationsPage /></>} />
          
          {/* Dashboard (protegido) */}
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
          
          {/* 404 */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
      <Toast />
    </>
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
