import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Dashboard() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (user.role === "admin") return <Navigate to="/admin" replace />;
  if (user.role === "teaching_staff" || user.role === "non_teaching_staff") return <Navigate to="/teacher" replace />;
  if (user.role === "student") return <Navigate to="/student" replace />;

  return <Navigate to="/login" replace />;
}

export default Dashboard;
