import { useState } from "react";
import { loginUser } from "../services/api";
import { useNavigate } from "react-router-dom";
import "../App.css";


export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await loginUser({ username, password });
      localStorage.setItem("token", result.token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Invalid username or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
  <div className="auth-wrapper">
    <div className="auth-container">

      {/* LEFT SIDE (Brand Section) */}
      <div className="auth-brand">
        <h1>Task Manager</h1>
        <p>
          Securely manage your work, track productivity,
          and access your dashboard from anywhere.
        </p>
      </div>

      {/* RIGHT SIDE (Login Card) */}
      <div className="login-card">
        <div className="login-header">
          <h2>Welcome back</h2>
          <p>Sign in to continue</p>
        </div>

        {error && <div className="error-alert">{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label>Username</label>
            <input
              type="text"
              className="styled-input"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <div className="input-row">
              <label>Password</label>
              <a href="#" className="forgot-link">Forgot Password?</a>
            </div>

            <input
              type="password"
              className="styled-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Verifying..." : "Sign In"}
          </button>
        </form>

        <p className="footer-text">
          Don't have an account? <a href="/register">Sign up</a>
        </p>
      </div>

    </div>
  </div>
);

}