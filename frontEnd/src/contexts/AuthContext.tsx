import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { authAPI } from "../services/api";
import toast from "react-hot-toast";

interface User {
  id: string;
  name: string;
  email: string;
  role:
    | "student"
    | "admin"
    | "companyAdviser"
    | "universityAdviser"
    | "companyAdmin"
    | "facultyHead";
  emailVerified?: boolean;
  profile?: any;
  groupAssignment?: {
    programId: string;
    groupName: string;
    assignedAt: string;
  };
}

interface AuthContextType {
  user: User | null;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; redirectTo?: string }>;
  register: (
    name: string,
    email: string,
    password: string,
    role?: string,
    phone?: string,
    university_name?: string
  ) => Promise<{ success: boolean; redirectTo?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await authAPI.getMe();
      if (response.success) {
        const updatedUser = response.data.user;
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error("Error refreshing user:", error);
      logout();
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (token && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        // Verify token validity and refresh user data in background
        refreshUser();
      } catch (error) {
        logout();
      }
    }
    setLoading(false);
  }, []);

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; redirectTo?: string }> => {
    try {
      const response = await authAPI.login(email, password);

      if (response.success) {
        const { user, token } = response.data;
        setUser(user);
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        toast.success(`Welcome back, ${user.name}!`);
        return { success: true };
      } else {
        // Handle API response errors without throwing
        if (
          response.message?.includes("not found") ||
          response.message?.includes("Invalid credentials")
        ) {
          toast.error("Account not found. Please register before logging in.");
          return { success: false, redirectTo: "/register" };
        } else if (response.message?.includes("verify")) {
          toast.error("Please verify your email before logging in.");
          return { success: false };
        } else if (
          response.message?.includes("locked") ||
          response.message?.includes("attempts")
        ) {
          toast.error(response.message);
          return { success: false };
        } else {
          toast.error(
            response.message || "Account not found. Please register first."
          );
          return { success: false };
        }
      }
    } catch (error: any) {
      console.error("Login error:", error);

      // Handle network/server errors without page reload
      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const message = error.response.data?.message || error.message;

        if (status === 401 || status === 404) {
          toast.error("Account not found. Please register before logging in.");
          return { success: false, redirectTo: "/register" };
        } else if (status === 403) {
          if (message?.includes("verify")) {
            toast.error("Please verify your email before logging in.");
          } else {
            toast.error("Access denied. Please check your credentials.");
          }
          return { success: false };
        } else if (status === 423) {
          toast.error(
            "Account is temporarily locked due to too many failed login attempts. Please try again later or contact support."
          );
          return { success: false };
        } else {
          toast.error("Login failed. Please try again.");
          return { success: false };
        }
      } else if (error.request) {
        // Network error
        toast.error(
          "Network error. Please check your connection and try again."
        );
        return { success: false };
      } else {
        // Other errors
        toast.error("Login failed. Please check your email and password.");
        return { success: false };
      }
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    role: string = "student",
    phone?: string,
    university_name?: string
  ): Promise<{ success: boolean; redirectTo?: string }> => {
    try {
      const response = await authAPI.register(
        name,
        email,
        password,
        role,
        phone,
        university_name
      );

      if (response.success) {
        const { user, token, requiresEmailVerification } = response.data;

        if (token) {
          // Auto-login (for admins)
          setUser(user);
          localStorage.setItem("token", token);
          localStorage.setItem("user", JSON.stringify(user));
        }

        if (role === "admin") {
          toast.success(
            `Admin account created successfully! Welcome, ${user.name}!`
          );
        } else if (requiresEmailVerification) {
          toast.success(
            "Registration successful! Please check your email to verify your account."
          );
        } else {
          toast.success(`Welcome to Sidama Innovation, ${user.name}!`);
        }

        return { success: true };
      } else {
        toast.error(
          response.message || "Registration failed. Please try again."
        );
        return { success: false };
      }
    } catch (error: any) {
      console.error("Registration error:", error);

      // Handle specific error cases without page reload
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message || error.message;

        if (
          status === 400 ||
          message?.includes("already exists") ||
          message?.includes("duplicate")
        ) {
          toast.error(
            "An account with this email already exists. Please use a different email or try logging in."
          );
          return { success: false, redirectTo: "/login" };
        } else if (status === 403 && message?.includes("admin")) {
          toast.error(
            "Admin registration is not allowed. An admin already exists."
          );
          return { success: false, redirectTo: "/login" };
        } else {
          toast.error("Registration failed. Please try again.");
          return { success: false };
        }
      } else if (error.request) {
        // Network error
        toast.error(
          "Network error. Please check your connection and try again."
        );
        return { success: false };
      } else {
        // Other errors
        toast.error("Registration failed. Please try again.");
        return { success: false };
      }
    }
  };

  const logout = () => {
    const token = localStorage.getItem("token");
    if (token) {
      fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:5000/api"
        }/auth/logout`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      ).catch(() => {});
    }
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logged out successfully");
  };

  const value = {
    user,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    loading,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
