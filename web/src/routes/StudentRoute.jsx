import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function StudentRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "student") return <Navigate to="/dashboard" replace />;
  return children;
}

export default StudentRoute;
