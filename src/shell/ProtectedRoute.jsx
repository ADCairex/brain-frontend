import { Navigate } from "react-router-dom";
import { useAuth } from "@shared/context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user } = useAuth();

  if (user === undefined) return null; // still loading

  if (!user) return <Navigate to="/login" replace />;

  return children;
}
