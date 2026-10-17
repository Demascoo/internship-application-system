import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { SocketProvider } from "./contexts/SocketContext";
import { AppProvider } from "./contexts/AppContext";
import Header from "./components/Layout/Header";
import Footer from "./components/Layout/Footer";
import LandingPage from "./components/Pages/LandingPage";
import About from "./components/Pages/About";
import Contact from "./components/Pages/Contact";
import ProgramSelection from "./components/Pages/ProgramSelection";
import ProgramDetail from "./components/Pages/ProgramDetail";
import ApplicationForm from "./components/Pages/ApplicationForm";
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import AdminRegistration from "./components/Auth/AdminRegistration";
import StudentDashboard from "./components/Dashboard/StudentDashboard";
import AdminDashboard from "./components/Dashboard/AdminDashboard";
import LoginActivityPage from "./components/Dashboard/LoginActivityPage";
import NotificationsPage from "./components/Pages/NotificationsPage";
import MessagingPage from "./components/Dashboard/MessagingPage";

// Enhanced Dashboard Components
import EnhancedStudentDashboard from "./components/Dashboard/EnhancedStudentDashboard";
import StudentMainDashboard from "./components/Dashboard/StudentMainDashboard";
import EnhancedCompanyAdviserDashboard from "./components/Dashboard/EnhancedCompanyAdviserDashboard";
import EnhancedUniversityAdviserDashboard from "./components/Dashboard/EnhancedUniversityAdviserDashboard";
import FacultyHeadDashboard from "./components/Dashboard/FacultyHeadDashboard";

import "./styles/main.css";

// ProtectedRoute Component for role-based routing
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  adminOnly?: boolean;
  allowedRoles?: string[];
}> = ({ children, adminOnly = false, allowedRoles }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!user?.role || !allowedRoles.includes(user.role)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

// Main Routes component
const AppRoutes: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const RoleDashboard = () => {
    if (user?.role === "admin") return <AdminDashboard />;
    if (user?.role === "companyAdviser" || user?.role === "companyAdmin")
      return <EnhancedCompanyAdviserDashboard />;
    if (user?.role === "universityAdviser")
      return <EnhancedUniversityAdviserDashboard />;
    if (user?.role === "facultyHead") return <FacultyHeadDashboard />;
    return <StudentMainDashboard />;
  };

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/programs" element={<ProgramSelection />} />
      <Route path="/programs/:id" element={<ProgramDetail />} />
      <Route path="/apply/:id" element={<ApplicationForm />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/admin-registration" element={<AdminRegistration />} />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <RoleDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/overview"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <EnhancedStudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute adminOnly>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/login-activities"
        element={
          <ProtectedRoute adminOnly>
            <LoginActivityPage />
          </ProtectedRoute>
        }
      />

      {/* Enhanced Dashboard Routes */}
      <Route
        path="/enhanced/student"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <EnhancedStudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/enhanced/company-adviser"
        element={
          <ProtectedRoute allowedRoles={["companyAdviser", "companyAdmin"]}>
            <EnhancedCompanyAdviserDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/enhanced/university-adviser"
        element={
          <ProtectedRoute allowedRoles={["universityAdviser"]}>
            <EnhancedUniversityAdviserDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/faculty-head"
        element={
          <ProtectedRoute allowedRoles={["facultyHead"]}>
            <FacultyHeadDashboard />
          </ProtectedRoute>
        }
      />

      {/* Legacy Dashboard Routes (for backward compatibility) */}
      <Route
        path="/adviser/company"
        element={
          <ProtectedRoute allowedRoles={["companyAdviser", "companyAdmin"]}>
            <EnhancedCompanyAdviserDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/adviser/university"
        element={
          <ProtectedRoute allowedRoles={["universityAdviser"]}>
            <EnhancedUniversityAdviserDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/adviser/messaging/:studentId"
        element={
          <ProtectedRoute
            allowedRoles={[
              "universityAdviser",
              "companyAdviser",
              "companyAdmin",
            ]}
          >
            <MessagingPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// Main App component
function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <AppProvider>
          <Router>
            <div className="app">
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: "#363636",
                    color: "#fff",
                  },
                  success: {
                    duration: 3000,
                    style: {
                      background: "#10B981",
                    },
                  },
                  error: {
                    duration: 5000,
                    style: {
                      background: "#EF4444",
                    },
                  },
                }}
              />
              <Header />
              <main className="main-content">
                <AppRoutes />
              </main>
              <Footer />
            </div>
          </Router>
        </AppProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
