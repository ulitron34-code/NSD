import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import ProtectedRoute from "./components/Layout/ProtectedRoute";
import Header from "./components/Layout/Header";
import Toast from "./components/Shared/Toast";
import LoadingSpinner from "./components/Shared/LoadingSpinner";
import "./App.css";

const BlogPage = lazy(() => import("./pages/BlogPage"));
const CertificationsPage = lazy(() => import("./pages/CertificationsPage"));
const LoginComponent = lazy(() => import("./components/Auth/LoginComponent"));
const SignupComponent = lazy(() => import("./components/Auth/SignupComponent"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const ServicesPage = lazy(() => import("./pages/ServicesPage"));
const SecurityTraceabilityPage = lazy(() => import("./pages/SecurityTraceabilityPage"));
const InternationalPage = lazy(() => import("./pages/InternationalPage"));
const ForApplicantsPage = lazy(() => import("./pages/ForApplicantsPage"));
const ForFundersPage = lazy(() => import("./pages/ForFundersPage"));
const ServiceOrdersPage = lazy(() => import("./pages/ServiceOrdersPage"));
const CommissionsPage = lazy(() => import("./pages/CommissionsPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const SharedDataRoomPage = lazy(() => import("./pages/SharedDataRoomPage"));
const OtorganteDashboard = lazy(() => import("./pages/OtorganteDashboard"));

function AppContent() {
  return (
    <>
      <Router>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<><Header isLanding={true} /><LandingPage /></>} />
            <Route path="/login" element={<><Header /><LoginComponent /></>} />
            <Route path="/signup" element={<><Header /><SignupComponent /></>} />
            <Route path="/privacy" element={<><Header /><PrivacyPage /></>} />
            <Route path="/terms" element={<><Header /><TermsPage /></>} />
            <Route path="/contact" element={<><Header /><ContactPage /></>} />
            <Route path="/blog" element={<><Header isLanding={true} /><BlogPage /></>} />
            <Route path="/certifications" element={<><Header isLanding={true} /><CertificationsPage /></>} />
            <Route path="/services" element={<><Header isLanding={true} /><ServicesPage /></>} />
            <Route path="/security" element={<><Header isLanding={true} /><SecurityTraceabilityPage /></>} />
            <Route path="/international" element={<><Header isLanding={true} /><InternationalPage /></>} />
            <Route path="/for-applicants" element={<><Header isLanding={true} /><ForApplicantsPage /></>} />
            <Route path="/for-funders" element={<><Header isLanding={true} /><ForFundersPage /></>} />
            <Route path="/shared-data-room/:token" element={<SharedDataRoomPage />} />
            <Route path="/service-orders" element={<ProtectedRoute><><Header /><ServiceOrdersPage /></></ProtectedRoute>} />
            <Route path="/commissions" element={<ProtectedRoute><><Header /><CommissionsPage /></></ProtectedRoute>} />
            <Route path="/otorgantes" element={<ProtectedRoute><><Header /><OtorganteDashboard /></></ProtectedRoute>} />
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
            <Route path="/checkout" element={<ProtectedRoute><><Header /><CheckoutPage /></></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Suspense>
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
