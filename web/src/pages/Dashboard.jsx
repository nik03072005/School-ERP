import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Dashboard() {
  const { user, logout } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  if (user.role === "teaching_staff") {
    return <Navigate to="/teacher/attendance" replace />;
  }

  return (
    <div className="panel basic-dashboard">
      <h1>
        Welcome, {user.first_name} {user.last_name}
      </h1>
      <p>This web release currently focuses on complete admin workflows.</p>
      <div className="chip-row">
        <span className="role-badge">Role: {user.role}</span>
        <span className="status-badge status-pending">Status: {user.status}</span>
      </div>
      <div className="item-actions">
        <Link className="btn btn-secondary" to="/">
          Back Home
        </Link>
        <button type="button" className="btn btn-ghost" onClick={logout}>
          Sign Out
        </button>
      </div>
    </div>
  );
}

export default Dashboard;