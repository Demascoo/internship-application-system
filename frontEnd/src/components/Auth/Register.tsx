import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { User, Mail, Lock, Eye, EyeOff, GraduationCap } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    university_name: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from || "/dashboard";

  // Password validation function
  const validatePassword = (password: string) => {
    const errors = [];

    if (password.length < 8) {
      errors.push("Password must be at least 8 characters long");
    }

    if (!/(?=.*[a-z])/.test(password)) {
      errors.push("Password must contain at least one lowercase letter");
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
    }

    if (!/(?=.*\d)/.test(password)) {
      errors.push("Password must contain at least one number");
    }

    if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?])/.test(password)) {
      errors.push(
        "Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;':\",./<>?)"
      );
    }

    return errors;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear general error when user starts typing
    if (error) {
      setError("");
    }

    // Real-time password validation
    if (name === "password") {
      const passwordErrors = validatePassword(value);
      if (passwordErrors.length > 0) {
        setPasswordError(passwordErrors.join(". "));
      } else {
        setPasswordError("");
      }

      // Check confirm password match if it exists
      if (formData.confirmPassword && value !== formData.confirmPassword) {
        setConfirmPasswordError("Passwords do not match");
      } else if (
        formData.confirmPassword &&
        value === formData.confirmPassword
      ) {
        setConfirmPasswordError("");
      }
    }

    // Real-time confirm password validation
    if (name === "confirmPassword") {
      if (value !== formData.password) {
        setConfirmPasswordError("Passwords do not match");
      } else {
        setConfirmPasswordError("");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Enhanced password validation
    const passwordErrors = validatePassword(formData.password);
    if (passwordErrors.length > 0) {
      setPasswordError(passwordErrors.join(". "));
      return;
    }

    // Password confirmation validation
    if (formData.password !== formData.confirmPassword) {
      setConfirmPasswordError(
        "Passwords do not match. Please ensure both password fields are identical."
      );
      return;
    }

    if (formData.name.trim().length < 2) {
      setError("Name must be at least 2 characters long");
      return;
    }

    if (formData.university_name.trim().length < 3) {
      setError("University name must be at least 3 characters long");
      return;
    }

    setShowConfirmDialog(true);
  };

  const confirmRegistration = async () => {
    setIsLoading(true);
    setError("");
    setShowConfirmDialog(false);

    try {
      const result = await register(
        formData.name.trim(),
        formData.email.trim().toLowerCase(),
        formData.password,
        "student", // Default role for registration
        undefined, // phone
        formData.university_name.trim()
      );

      if (result.success) {
        navigate(from, { replace: true });
      } else {
        if (result.redirectTo) {
          setError("Account already exists. Redirecting to login...");
          setTimeout(() => {
            navigate(result.redirectTo!, { replace: true });
          }, 2000);
        } else {
          setError("Registration failed. Please try again.");
        }
      }
    } catch (err: any) {
      console.error("Register submit error:", err);
      setError("You have already registered. Please login instead.");
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
              <h1 className="auth-title">Create Account</h1>
              <p className="auth-subtitle">
                Join Sidama Innovation and start your tech journey
              </p>
            </div>

            <form onSubmit={handleSubmit} className="form">
              {error && <div className="error-message">{error}</div>}

              <div className="form-group">
                <label className="form-label">Full Name</label>
                <div className="input-group">
                  <User className="input-icon" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter your full name"
                    required
                    disabled={isLoading}
                    minLength={2}
                    maxLength={100}
                  />
                </div>
              </div>

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
                <label className="form-label">University Name</label>
                <div className="input-group">
                  <GraduationCap className="input-icon" />
                  <input
                    type="text"
                    name="university_name"
                    value={formData.university_name}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter your university (case-insensitive, e.g., Bahir Dar University)"
                    required
                    disabled={isLoading}
                    minLength={3}
                    maxLength={100}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Enter your university name (case-insensitive). Example: "bahir
                  dar university" or "BAHIR DAR UNIVERSITY"
                </p>
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
                    className={`form-input ${
                      passwordError ? "border-red-500" : ""
                    }`}
                    placeholder="Create a password"
                    required
                    disabled={isLoading}
                    minLength={8}
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
                {passwordError && (
                  <div className="text-red-600 text-sm mt-1 p-2 bg-red-50 border border-red-200 rounded">
                    {passwordError}
                  </div>
                )}
                <div className="text-xs text-gray-500 mt-1">
                  Password must contain: 8+ characters, uppercase, lowercase,
                  number, and special character
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <div className="input-group">
                  <Lock className="input-icon" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`form-input ${
                      confirmPasswordError ? "border-red-500" : ""
                    }`}
                    placeholder="Confirm your password"
                    required
                    disabled={isLoading}
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="password-toggle"
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="icon" />
                    ) : (
                      <Eye className="icon" />
                    )}
                  </button>
                </div>
                {confirmPasswordError && (
                  <div className="text-red-600 text-sm mt-1 p-2 bg-red-50 border border-red-200 rounded">
                    {confirmPasswordError}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary btn-full"
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </button>
            </form>

            <div className="auth-footer">
              <p>
                Already have an account?{" "}
                <Link to="/login" className="auth-link">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>

        <div className="auth-visual-section">
          <div className="visual-content">
            <h2>Start Your Tech Journey</h2>
            <p>
              Join thousands of students who have launched their careers through
              our comprehensive internship programs.
            </p>
            <div className="visual-stats">
              <div className="stat">
                <strong>500+</strong>
                <span>Graduates</span>
              </div>
              <div className="stat">
                <strong>95%</strong>
                <span>Job Placement</span>
              </div>
              <div className="stat">
                <strong>3</strong>
                <span>Programs</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Registration Confirmation Modal */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-2">Confirm Registration</h3>
            <p className="text-sm text-gray-600 mb-4">
              Make sure your account information is correct:
            </p>
            <div className="mb-4 p-3 bg-gray-50 rounded">
              <p>
                <strong>Name:</strong> {formData.name}
              </p>
              <p>
                <strong>Email:</strong> {formData.email}
              </p>
              <p>
                <strong>University:</strong> {formData.university_name}
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmRegistration}
                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
              >
                Sure
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;
