import { Navigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import usePresence from "../../hooks/usePresence";

export default function ProtectedRoute({ children }) {

  const { user, loading } = useAuth();

  usePresence(user);

  if (loading) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#09090b",
          color: "white",
          fontSize: "20px",
        }}
      >
        Loading ShieldCall...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}