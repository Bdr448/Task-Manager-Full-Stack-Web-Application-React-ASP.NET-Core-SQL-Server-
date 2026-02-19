import { useState } from "react";
import { registerUser } from "../services/api";
import { useNavigate } from "react-router-dom";
import "../App.css";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await registerUser({ username, email, password });

      // redirect to login after success
      navigate("/");
    } catch (err) {
      setError("Registration failed. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-container">

        {/* LEFT SIDE (Brand Section — SAME AS LOGIN) */}
        <div className="auth-brand">
          <h1>Task Manager</h1>
          <p>
            Create your account and start managing tasks,
            improving productivity, and tracking your work
            efficiently.
          </p>
        </div>

        {/* RIGHT SIDE (REGISTER CARD) */}
        <div className="login-card">
          <div className="login-header">
            <h2>Create Account</h2>
            <p>Sign up to get started</p>
          </div>

          {error && <div className="error-alert">{error}</div>}

          <form onSubmit={handleRegister}>

            {/* Username */}
            <div className="input-group">
              <label>Username</label>
              <input
                type="text"
                className="styled-input"
                placeholder="Choose username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            {/* Email */}
            <div className="input-group">
              <label>Email</label>
              <input
                type="email"
                className="styled-input"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Password */}
            <div className="input-group">
              <label>Password</label>
              <input
                type="password"
                className="styled-input"
                placeholder="Create password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="login-btn"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Sign Up"}
            </button>

          </form>

          <p className="footer-text">
            Already have an account? <a href="/">Sign In</a>
          </p>
        </div>

      </div>
    </div>
  );
}
