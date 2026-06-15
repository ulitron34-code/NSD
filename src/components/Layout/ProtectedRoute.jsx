import { useAuth } from "../../hooks/useAuth";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function ProtectedRoute({ children }) {
  const { isLoggedIn, isLoading, login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const demoMode = import.meta.env.VITE_DEMO_MODE === "true";

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      if (!demoMode) {
        navigate("/login", { replace: true });
        return;
      }
      login({ id: "demo-compliance", email: "compliance.demo@nsd.local", role: "compliance_officer", demo: true }, "demo_token_123");
    }
  }, [demoMode, isLoading, isLoggedIn, login, navigate]);

  if (isLoading) {
    return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontSize: "1.5rem" }}>{t("messages.loading")}</div>;
  }

  if (!isLoggedIn) {
    return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontSize: "1.1rem" }}>{demoMode ? t("auth.startingDemo") : t("auth.redirectingLogin")}</div>;
  }

  return children;
}
