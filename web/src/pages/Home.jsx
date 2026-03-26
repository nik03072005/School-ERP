import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Home() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="home-page">
      <section className="home-hero">
        <p className="hero-kicker">School ERP Platform</p>
        <h1>Admissions, Approvals, and Accounts in One Admin Workspace</h1>
        <p>
          A streamlined control center to review pending accounts, validate admission forms,
          and maintain user records with clear status tracking.
        </p>

        <div className="hero-actions">
          {isAuthenticated ? (
            <Link className="btn btn-primary" to={user?.role === "admin" ? "/admin" : "/dashboard"}>
              Open Workspace
            </Link>
          ) : (
            <Link className="btn btn-primary" to="/login">
              Sign In
            </Link>
          )}
          <a className="btn btn-secondary" href="https://vite.dev" target="_blank" rel="noreferrer">
            Platform Docs
          </a>
        </div>
      </section>
    </div>
  );
}

export default Home;