import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import ProtectedRoute from "./components/Layout/ProtectedRoute";
import Header from "./components/Layout/Header";
import Toast from "./components/Shared/Toast";
import LoadingSpinner from "./components/Shared/LoadingSpinner";
import NotFoundPage from "./pages/NotFoundPage";
import ErrorBoundary from "./components/common/ErrorBoundary";
import "./App.css";

// Page transition wrapper
function PageTransition({ children }) {
  const location = useLocation();
  
  useEffect(() => {
    // Scroll to top on route change
    window.scrollTo(0, 0);
  }, [location.pathname]);
  
  return (
    <div 
      className="page-transition"
      style={{
        animation: 'fadeIn 0.3s ease-out',
      }}
    >
      {children}
    </div>
  );
}

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
    <ErrorBoundary>
      <Router>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<PageTransition><><Header isLanding={true} /><LandingPage /></></PageTransition>} />
            <Route path="/login" element={<PageTransition><><Header /><LoginComponent /></></PageTransition>} />
            <Route path="/signup" element={<PageTransition><><Header /><SignupComponent /></></PageTransition>} />
            <Route path="/privacy" element={<PageTransition><><Header /><PrivacyPage /></></PageTransition>} />
            <Route path="/terms" element={<PageTransition><><Header /><TermsPage /></></PageTransition>} />
            <Route path="/contact" element={<PageTransition><><Header /><ContactPage /></></PageTransition>} />
            <Route path="/blog" element={<PageTransition><><Header isLanding={true} /><BlogPage /></></PageTransition>} />
            <Route path="/certifications" element={<PageTransition><><Header isLanding={true} /><CertificationsPage /></></PageTransition>} />
            <Route path="/services" element={<PageTransition><><Header isLanding={true} /><ServicesPage /></></PageTransition>} />
            <Route path="/security" element={<PageTransition><><Header isLanding={true} /><SecurityTraceabilityPage /></></PageTransition>} />
            <Route path="/international" element={<PageTransition><><Header isLanding={true} /><InternationalPage /></></PageTransition>} />
            <Route path="/for-applicants" element={<PageTransition><><Header isLanding={true} /><ForApplicantsPage /></></PageTransition>} />
            <Route path="/for-funders" element={<PageTransition><><Header isLanding={true} /><ForFundersPage /></></PageTransition>} />
            <Route path="/shared-data-room/:token" element={<SharedDataRoomPage />} />
            <Route path="/service-orders" element={<ProtectedRoute><PageTransition><><Header /><ServiceOrdersPage /></></PageTransition></ProtectedRoute>} />
            <Route path="/commissions" element={<ProtectedRoute><PageTransition><><Header /><CommissionsPage /></></PageTransition></ProtectedRoute>} />
            <Route path="/otorgantes" element={<ProtectedRoute><PageTransition><><Header /><OtorganteDashboard /></></PageTransition></ProtectedRoute>} />
            <Route path="/dashboard/*" element={<ProtectedRoute><PageTransition><><Header /><DashboardPage /></></PageTransition></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><PageTransition><><Header /><ProfilePage /></></PageTransition></ProtectedRoute>} />
            <Route path="/checkout" element={<ProtectedRoute><PageTransition><><Header /><CheckoutPage /></></PageTransition></ProtectedRoute>} />
            
            {/* 404 Page */}
            <Route path="/404" element={<PageTransition><NotFoundPage /></PageTransition>} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </Suspense>
      </Router>
      <Toast />
    </ErrorBoundary>
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
