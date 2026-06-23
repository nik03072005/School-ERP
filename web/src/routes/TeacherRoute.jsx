import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function TeacherRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "teaching_staff" && user.role !== "non_teaching_staff") {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

export default TeacherRoute;
