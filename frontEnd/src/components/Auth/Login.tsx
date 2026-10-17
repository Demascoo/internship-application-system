import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from || "/dashboard";

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await login(formData.email, formData.password);

      if (result.success) {
        navigate(from, { replace: true });
      } else {
        if (result.redirectTo) {
          setError("Account not found. Redirecting to registration...");
          setTimeout(() => {
            navigate(result.redirectTo!, { replace: true });
          }, 2000);
        } else {
          setError("Account not found. Please register first.");
        }
      }
    } catch (err: any) {
      console.error("Login submit error:", err);
      setError("Login failed. Please check your email and password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-form-section">
          <div className="auth-form">
            <div className="auth-header">
              <h1 className="auth-title">Welcome Back</h1>
              <p className="auth-subtitle">
                Sign in to access your dashboard and applications
              </p>
            </div>

            <form onSubmit={handleSubmit} className="form">
              {error && <div className="error-message">{error}</div>}

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div className="input-group">
                  <Mail className="input-icon" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter your email"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="input-group">
                  <Lock className="input-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter your password"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="password-toggle"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="icon" />
                    ) : (
                      <Eye className="icon" />
                    )}
                  </button>
                </div>
              </div>

              <div className="form-options">
                <label className="checkbox-label">
                  <input type="checkbox" disabled={isLoading} />
                  <span className="checkmark"></span>
                  Remember me
                </label>
                <Link to="/forgot-password" className="forgot-link">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary btn-full"
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <div className="demo-accounts">
              <p className="demo-title">Demo Accounts:</p>
              <div className="demo-buttons">
                <button
                  onClick={() =>
                    setFormData({
                      email: "admin@sidama.et",
                      password: "admin123",
                    })
                  }
                  className="btn btn-outline btn-small"
                  disabled={isLoading}
                >
                  Admin Demo
                </button>
                <button
                  onClick={() =>
                    setFormData({
                      email: "student@example.com",
                      password: "password123",
                    })
                  }
                  className="btn btn-outline btn-small"
                  disabled={isLoading}
                >
                  Student Demo
                </button>
              </div>
            </div>

            <div className="auth-footer">
              <p>
                Don't have an account?{" "}
                <Link to="/register" className="auth-link">
                  Create one
                </Link>
              </p>
            </div>
          </div>
        </div>

        <div className="auth-visual-section">
          <div className="visual-content">
            <h2>Continue Your Journey</h2>
            <p>
              Access your personalized dashboard to track applications, view
              program updates, and connect with mentors.
            </p>
            <div className="visual-features">
              <div className="feature">
                <div className="feature-icon">📊</div>
                <span>Track Applications</span>
              </div>
              <div className="feature">
                <div className="feature-icon">🔔</div>
                <span>Real-time Notifications</span>
              </div>
              <div className="feature">
                <div className="feature-icon">👥</div>
                <span>Connect with Mentors</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
