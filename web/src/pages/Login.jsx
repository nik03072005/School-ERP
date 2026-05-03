import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Login() {
	const [form, setForm] = useState({ identifier: "", password: "" });
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const { login } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();

	const handleSubmit = async (event) => {
		event.preventDefault();
		setError("");

		if (!form.identifier.trim() || !form.password) {
			setError("Email or phone number, and password are required.");
			return;
		}

		setLoading(true);

		try {
			const user = await login({
				identifier: form.identifier.trim(),
				password: form.password,
			});

			const from = location.state?.from?.pathname;
			if (from) {
				navigate(from, { replace: true });
			} else if (user.role === "admin") {
				navigate("/admin", { replace: true });
			} else {
				navigate("/dashboard", { replace: true });
			}
		} catch (err) {
			setError(err?.response?.data?.message || "Login failed. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="auth-page">
			<div className="auth-card">
				<p className="auth-kicker">Kidz Galaxy</p>
				<h1>Sign In</h1>
				<p className="auth-copy">Access administration tools and student management workflows.</p>

				{error ? <p className="alert error">{error}</p> : null}

				<form onSubmit={handleSubmit} className="auth-form">
					<label>
					Email or Phone Number
					<input
						type="text"
						value={form.identifier}
						placeholder="you@school.com or 9876543210"
						onChange={(e) => setForm((prev) => ({ ...prev, identifier: e.target.value }))}></input>
					</label>

					<label>
						Password
						<input
							type="password"
							value={form.password}
							onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
						/>
					</label>

					<button type="submit" className="btn btn-primary" disabled={loading}>
						{loading ? "Signing in..." : "Sign In"}
					</button>
				</form>

				<Link to="/" className="text-link">
					Return to home
				</Link>
			</div>
		</div>
	);
}

export default Login;
