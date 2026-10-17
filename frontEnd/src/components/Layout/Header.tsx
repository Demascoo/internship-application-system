import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useApp } from "../../contexts/AppContext";
import { Menu, X, Bell, User, LogOut } from "lucide-react";
import logo from "./logo.jpg";

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const { notifications } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  // Update notification count based on unread notifications
  useEffect(() => {
    if (isAuthenticated && user) {
      const unreadNotifications = notifications.filter(
        (n) => n.userId === user.id && !n.read
      );
      setNotificationCount(unreadNotifications.length);
    } else {
      setNotificationCount(0);
    }
  }, [notifications, user, isAuthenticated]);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    logout();
    navigate("/");
    setIsProfileOpen(false);
    setNotificationCount(0);
    setShowLogoutConfirm(false);
  };

  const handleNotificationClick = () => {
    if (isAuthenticated) {
      navigate("/notifications");
      // Reset notification count when user views notifications
      setNotificationCount(0);
    }
  };

  const navigation = [
    { name: "Home", href: "/" },
    { name: "Programs", href: "/programs" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
  ];

  return (
    <header className="header-sticky">
      <nav className="navbar">
        <div className="nav-container">
          <Link to="/" className="nav-brand">
            {/* LOGO SECTION WITH STYLING */}
            <div
              className="logo-wrapper"
              style={{
                display: "flex",
                alignItems: "center",
                padding: "8px 12px",
                borderRadius: "15px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                background: "linear-gradient(135deg, #ffffff, #f1f5f9)",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform =
                  "scale(1.05)";
                (e.currentTarget as HTMLElement).style.boxShadow =
                  "0 6px 16px rgba(0,0,0,0.2)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "scale(1)";
                (e.currentTarget as HTMLElement).style.boxShadow =
                  "0 4px 12px rgba(0,0,0,0.15)";
              }}
            >
              <img
                src={logo}
                alt="Logo"
                style={{
                  height: "60px",
                  width: "60px",
                  objectFit: "cover",
                  borderRadius: "50%",
                  marginRight: "15px",
                  border: "3px solid #2563eb", // nice blue border
                }}
              />
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span
                  className="brand-text"
                  style={{
                    fontSize: "20px",
                    fontWeight: "bold",
                    color: "#1e293b",
                  }}
                >
                  Sidama Innovation &
                </span>
                <span
                  className="brand-subtitle"
                  style={{
                    fontSize: "13px",
                    color: "#475569",
                    letterSpacing: "0.5px",
                  }}
                >
                  Technology Agency
                </span>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="nav-menu desktop-menu">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`nav-link ${
                  location.pathname === item.href ? "active" : ""
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Auth Section */}
          <div className="nav-auth">
            {isAuthenticated ? (
              <div className="auth-section">
                <button
                  className="notification-btn"
                  onClick={handleNotificationClick}
                >
                  <Bell className="icon" />
                  {notificationCount > 0 && (
                    <span className="notification-badge">
                      {notificationCount}
                    </span>
                  )}
                </button>

                <div className="profile-dropdown">
                  <button
                    className="profile-btn"
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                  >
                    <User className="icon" />
                    <span className="profile-name">{user?.name}</span>
                  </button>

                  {isProfileOpen && (
                    <div className="dropdown-menu">
                      <button
                        className="dropdown-item"
                        onClick={() => {
                          setIsProfileOpen(false);
                          if (user?.role === "admin") navigate("/admin");
                          else if (user?.role === "companyAdviser") navigate("/adviser/company");
                          else if (user?.role === "universityAdviser") navigate("/adviser/university");
                          else if (user?.role === "facultyHead") navigate("/faculty-head");
                          else navigate("/dashboard");
                        }}
                      >
                        <User className="icon" />
                        Dashboard
                      </button>
                      {user?.role === "admin" && (
                        <Link
                          to="/admin/login-activities"
                          className="dropdown-item"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          Login Activity
                        </Link>
                      )}
                      <button
                        className="dropdown-item logout"
                        onClick={handleLogout}
                      >
                        <LogOut className="icon" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="auth-buttons">
                <Link to="/login" className="btn btn-outline">
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary">
                  Register
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              className="mobile-menu-btn"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="icon" /> : <Menu className="icon" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="mobile-menu">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`mobile-nav-link ${
                  location.pathname === item.href ? "active" : ""
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            {isAuthenticated && user?.role === "admin" && (
              <Link
                to="/admin/login-activities"
                className={`mobile-nav-link ${
                  location.pathname === "/admin/login-activities"
                    ? "active"
                    : ""
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Login Activity
              </Link>
            )}
            {isAuthenticated && (
              <button
                className="mobile-nav-link"
                onClick={() => {
                  setIsMenuOpen(false);
                  if (user?.role === "admin") navigate("/admin");
                  else if (user?.role === "companyAdviser") navigate("/adviser/company");
                  else if (user?.role === "universityAdviser") navigate("/adviser/university");
                  else if (user?.role === "facultyHead") navigate("/faculty-head");
                  else navigate("/dashboard");
                }}
              >
                Dashboard
              </button>
            )}
            {!isAuthenticated && (
              <div className="mobile-auth">
                <Link
                  to="/login"
                  className="mobile-nav-link"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="mobile-nav-link"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-2">Confirm Logout</h3>
            <p className="text-sm text-gray-600 mb-6">Are you sure you want to log out?</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
