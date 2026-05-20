import { useAuth } from "../../hooks/useAuth";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        fontSize: "1.5rem",
      }}>
        Cargando...
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" />;
  }

  return children;
}
