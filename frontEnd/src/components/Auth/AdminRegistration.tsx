import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Phone,
  Shield,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";

const AdminRegistration: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });
  const [adminRegistrationAllowed, setAdminRegistrationAllowed] = useState<
    boolean | null
  >(null);

  const { register } = useAuth();
  const navigate = useNavigate();

  // Check if admin registration is allowed
  useEffect(() => {
    const checkAdminRegistration = async () => {
      try {
        const response = await fetch(
          `${
            import.meta.env.VITE_API_URL || "http://localhost:5000/api"
          }/auth/admin-registration-status`
        );
        const data = await response.json();

        if (data.success) {
          setAdminRegistrationAllowed(data.data.adminRegistrationAllowed);
          if (!data.data.adminRegistrationAllowed) {
            toast.error(
              "Admin registration is no longer available. An admin already exists."
            );
            setTimeout(() => navigate("/login"), 3000);
          }
        }
      } catch (error) {
        console.error("Error checking admin registration status:", error);
        toast.error("Unable to verify registration status");
      }
    };

    checkAdminRegistration();
  }, [navigate]);

  // Password strength checker
  useEffect(() => {
    const checkPasswordStrength = () => {
      setPasswordStrength({
        length: formData.password.length >= 8,
        uppercase: /[A-Z]/.test(formData.password),
        lowercase: /[a-z]/.test(formData.password),
        number: /\d/.test(formData.password),
        special: /[@$!%*?&]/.test(formData.password),
      });
    };

    if (formData.password) {
      checkPasswordStrength();
    }
  }, [formData.password]);

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

  const validateForm = () => {
    if (formData.name.trim().length < 2) {
      setError("Name must be at least 2 characters long");
      return false;
    }

    if (!/^[a-zA-Z\s]+$/.test(formData.name.trim())) {
      setError("Name can only contain letters and spaces");
      return false;
    }

    if (!formData.email.includes("@") || !formData.email.includes(".")) {
      setError("Please enter a valid email address");
      return false;
    }

    const { length, uppercase, lowercase, number, special } = passwordStrength;
    if (!length || !uppercase || !lowercase || !number || !special) {
      setError("Password does not meet security requirements");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    if (formData.phone && !/^\+?[\d\s-()]+$/.test(formData.phone)) {
      setError("Please enter a valid phone number");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await register(
        formData.name.trim(),
        formData.email.trim().toLowerCase(),
        formData.password,
        "admin",
        formData.phone.trim()
      );

      if (result.success) {
        toast.success(
          "Admin account created successfully! You are now logged in."
        );
        navigate("/admin");
      } else {
        setError(result.message || "Registration failed. Please try again.");
      }
    } catch (err: any) {
      console.error("Admin registration error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading spinner while checking registration status
  if (adminRegistrationAllowed === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show message if admin registration is not allowed
  if (adminRegistrationAllowed === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Registration Closed
          </h2>
          <p className="text-gray-600 mb-6">
            Admin registration is no longer available. An administrator account
            already exists.
          </p>
          <Link
            to="/login"
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-blue-700 transition-colors duration-200 inline-block"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  const isPasswordStrong = Object.values(passwordStrength).every(Boolean);

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-form-section">
          <div className="auth-form">
            <div className="auth-header">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
              </div>
              <h1 className="auth-title">Create Admin Account</h1>
              <p className="auth-subtitle">
                Set up the first administrator account for Sidama Innovation &
                Technology Agency
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">
                    First Admin Registration
                  </span>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  This will create the primary administrator account. Once
                  created, no additional admin registrations will be allowed.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="form">
              {error && <div className="error-message">{error}</div>}

              <div className="form-group">
                <label className="form-label">Full Name *</label>
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
                    pattern="[a-zA-Z\s]+"
                    title="Name can only contain letters and spaces"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <div className="input-group">
                  <Mail className="input-icon" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter your email address"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number (Optional)</label>
                <div className="input-group">
                  <Phone className="input-icon" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter your phone number"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Password *</label>
                <div className="input-group">
                  <Lock className="input-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Create a secure password"
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

                {formData.password && (
                  <div className="password-strength mt-3">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm">
                        <CheckCircle
                          className={`w-4 h-4 ${
                            passwordStrength.length
                              ? "text-green-500"
                              : "text-gray-300"
                          }`}
                        />
                        <span
                          className={
                            passwordStrength.length
                              ? "text-green-700"
                              : "text-gray-500"
                          }
                        >
                          At least 8 characters
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <CheckCircle
                          className={`w-4 h-4 ${
                            passwordStrength.uppercase
                              ? "text-green-500"
                              : "text-gray-300"
                          }`}
                        />
                        <span
                          className={
                            passwordStrength.uppercase
                              ? "text-green-700"
                              : "text-gray-500"
                          }
                        >
                          One uppercase letter
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <CheckCircle
                          className={`w-4 h-4 ${
                            passwordStrength.lowercase
                              ? "text-green-500"
                              : "text-gray-300"
                          }`}
                        />
                        <span
                          className={
                            passwordStrength.lowercase
                              ? "text-green-700"
                              : "text-gray-500"
                          }
                        >
                          One lowercase letter
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <CheckCircle
                          className={`w-4 h-4 ${
                            passwordStrength.number
                              ? "text-green-500"
                              : "text-gray-300"
                          }`}
                        />
                        <span
                          className={
                            passwordStrength.number
                              ? "text-green-700"
                              : "text-gray-500"
                          }
                        >
                          One number
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <CheckCircle
                          className={`w-4 h-4 ${
                            passwordStrength.special
                              ? "text-green-500"
                              : "text-gray-300"
                          }`}
                        />
                        <span
                          className={
                            passwordStrength.special
                              ? "text-green-700"
                              : "text-gray-500"
                          }
                        >
                          One special character (@$!%*?&)
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Confirm Password *</label>
                <div className="input-group">
                  <Lock className="input-icon" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="form-input"
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
              </div>

              <button
                type="submit"
                disabled={isLoading || !isPasswordStrong}
                className="btn btn-primary btn-full"
              >
                {isLoading ? "Creating Account..." : "Create Admin Account"}
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
            <h2>Administrator Setup</h2>
            <p>
              As the first administrator, you'll have complete control over the
              system including:
            </p>
            <div className="visual-features">
              <div className="feature">
                <div className="feature-icon">🏗️</div>
                <span>Create & Manage Programs</span>
              </div>
              <div className="feature">
                <div className="feature-icon">👥</div>
                <span>Review Applications</span>
              </div>
              <div className="feature">
                <div className="feature-icon">📊</div>
                <span>System Analytics</span>
              </div>
              <div className="feature">
                <div className="feature-icon">🎯</div>
                <span>Student Grouping</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminRegistration;
