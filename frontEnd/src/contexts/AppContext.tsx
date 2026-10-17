import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import {
  programsAPI,
  applicationsAPI,
  notificationsAPI,
} from "../services/api";
import { useAuth } from "./AuthContext";
import toast from "react-hot-toast";

export interface Program {
  id: string;
  name: string;
  description: string;
  totalSpots: number;
  availableSpots: number;
  requirements: string[];
  duration: string;
  category: "networking" | "software" | "maintenance";
  color: string;
  icon: string;
  startDate: string;
  endDate: string;
  applicationDeadline: string;
  startMonth: string;
  endMonth: string;
  durationInMonths: number;
  skills?: string[];
  benefits?: string[];
  location?: string;
}

export interface Application {
  id: string;
  studentId: string;
  programId: string;
  studentName: string;
  studentEmail: string;
  status: "pending" | "accepted" | "rejected";
  motivation: string;
  experience?: string;
  // campus?: string;
  goals?: string;
  availability: "full-time" | "part-time";
  preferredStartDate: string;
  preferredEndDate: string;
  preferredStartMonth: string;
  preferredEndMonth: string;
  desiredDuration: number;
  resumeUrl?: string;
  appliedAt: Date;
  programDetails?: Program;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  type: "success" | "info" | "warning" | "error";
  title?: string;
  read: boolean;
  timestamp: Date;
}

interface AppContextType {
  programs: Program[];
  applications: Application[];
  notifications: Notification[];
  loading: boolean;
  fetchPrograms: () => Promise<void>;
  fetchApplications: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
  addApplication: (application: any) => Promise<boolean>;
  updateApplicationStatus: (
    applicationId: string,
    status: "accepted" | "rejected",
    notes?: string
  ) => Promise<boolean>;
  getApplicationsByStudent: (studentId: string) => Application[];
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  markAllUserNotificationsRead: (userId: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

// Demo data for offline functionality
const demoPrograms: Program[] = [
  {
    id: "networking",
    name: "Networking Infrastructure",
    description:
      "Master network infrastructure, security protocols, and system administration. Work with enterprise-grade equipment and real network configurations.",
    totalSpots: 15,
    availableSpots: 8,
    requirements: [
      "Basic understanding of computer networks",
      "Knowledge of TCP/IP protocols",
      "Familiarity with network hardware",
      "Problem-solving skills",
      "Team collaboration experience",
    ],
    duration: "6 months",
    category: "networking",
    color: "from-blue-500 to-blue-600",
    icon: "network",
    startDate: "2025-03-15",
    endDate: "2025-09-15",
    applicationDeadline: "2025-02-28",
    startMonth: "March",
    endMonth: "September",
    durationInMonths: 6,
    skills: ["Networking", "Security", "System Administration"],
    benefits: [
      "Industry mentorship",
      "Certificate of completion",
      "Job placement assistance",
    ],
  },
  {
    id: "software",
    name: "Software Development",
    description:
      "Build modern applications using cutting-edge technologies. Gain experience in full-stack development, API design, and software architecture.",
    totalSpots: 20,
    availableSpots: 12,
    requirements: [
      "Programming experience (Python, JavaScript, or Java)",
      "Understanding of data structures",
      "Database fundamentals",
      "Version control (Git) knowledge",
      "Agile development familiarity",
    ],
    duration: "6 months",
    category: "software",
    color: "from-teal-500 to-teal-600",
    icon: "code",
    startDate: "2025-03-15",
    endDate: "2025-09-15",
    applicationDeadline: "2025-02-28",
    startMonth: "March",
    endMonth: "September",
    durationInMonths: 6,
    skills: ["React", "Node.js", "MongoDB", "APIs"],
    benefits: [
      "Real project experience",
      "Portfolio development",
      "Tech industry connections",
    ],
  },
  {
    id: "maintenance",
    name: "IT Maintenance & Support",
    description:
      "Learn hardware troubleshooting, system maintenance, and technical support. Develop skills in computer repair and IT infrastructure management.",
    totalSpots: 10,
    availableSpots: 3,
    requirements: [
      "Basic computer hardware knowledge",
      "Windows/Linux operating systems",
      "Customer service skills",
      "Attention to detail",
      "Technical documentation skills",
    ],
    duration: "4 months",
    category: "maintenance",
    color: "from-orange-500 to-orange-600",
    icon: "tool",
    startDate: "2025-04-01",
    endDate: "2025-08-01",
    applicationDeadline: "2025-03-15",
    startMonth: "April",
    endMonth: "August",
    durationInMonths: 4,
    skills: [
      "Hardware Troubleshooting",
      "System Maintenance",
      "Technical Support",
    ],
    benefits: [
      "Hands-on experience",
      "Industry certifications",
      "Technical expertise",
    ],
  },
];

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  // Hydrate from localStorage to avoid zero-reset flicker on navigation
  const storedPrograms = (() => {
    try { return JSON.parse(localStorage.getItem("programs") || "null") } catch { return null }
  })();
  const storedApplications = (() => {
    try { return JSON.parse(localStorage.getItem("applications") || "null") } catch { return null }
  })();
  const storedNotifications = (() => {
    try { return JSON.parse(localStorage.getItem("notifications") || "null") } catch { return null }
  })();

  const [programs, setPrograms] = useState<Program[]>(storedPrograms || demoPrograms);
  const [applications, setApplications] = useState<Application[]>(storedApplications || []);
  const [notifications, setNotifications] = useState<Notification[]>(storedNotifications || []);
  const [loading, setLoading] = useState(false);
  const { user, isAuthenticated } = useAuth();

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const response = await programsAPI.getAll();
      if (response.success) {
        const list = response.data.programs.map((program: any) => ({
          ...program,
          id: program._id,
        }));
        setPrograms(list);
        try { localStorage.setItem("programs", JSON.stringify(list)); } catch {}
      }
    } catch (error: any) {
      console.log("Using demo data for programs");
      // Keep demo data on error
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      let response;
      if (user?.role === "admin") {
        response = await applicationsAPI.getAll();
      } else if (user?.role === "student") {
        response = await applicationsAPI.getMyApplications();
      } else {
        // Advisers and other roles don't need student applications here
        setApplications([]);
        return;
      }

      if (response.success) {
        const fetchedApplications = response.data.applications.map(
          (app: any) => {
            // Get program details from our programs array
            const programDetails = programs.find(
              (p) => p.id === app.programId || p.id === app.programId?._id
            );
            return {
              ...app,
              id: app._id,
              appliedAt: new Date(app.createdAt || app.appliedAt),
              // normalize rejection notes so UI can always display
              reviewNotes: app.reviewNotes,
              notes: app.reviewNotes || app.notes || app.rejectionReason || app.adminNotes,
              programDetails: programDetails || {
                name: app.programId?.name || "Unknown Program",
                description:
                  app.programId?.description ||
                  "Program description not available",
                duration: app.programId?.duration || "Duration not specified",
                startMonth: app.programId?.startMonth || "Not specified",
                endMonth: app.programId?.endMonth || "Not specified",
                durationInMonths: app.programId?.durationInMonths || 0,
                availableSpots: app.programId?.availableSpots || 0,
              },
            };
          }
        );
        setApplications(fetchedApplications);
        try { localStorage.setItem("applications", JSON.stringify(fetchedApplications)); } catch {}
      }
    } catch (error: any) {
      console.error("Fetch applications error:", error);
      // Don't show error toast for failed fetches, just log them
    }
  }, [isAuthenticated, user?.role, programs]);

  const fetchNotifications = async () => {
    if (!isAuthenticated) return;

    try {
      const response = await notificationsAPI.getAll();
      if (response.success) {
        const list = response.data.notifications.map((notif: any) => ({
          ...notif,
          id: notif._id,
          timestamp: new Date(notif.createdAt),
        }));
        setNotifications(list);
        try { localStorage.setItem("notifications", JSON.stringify(list)); } catch {}
      }
    } catch (error: any) {
      console.error("Fetch notifications error:", error);
    }
  };

  const addApplication = async (applicationData: any): Promise<boolean> => {
    try {
      // Check if user already applied to this program
      const existingApplication = applications.find(
        (app) =>
          app.studentId === user?.id &&
          app.programId === applicationData.programId
      );

      if (existingApplication) {
        toast.error("You have already applied to this program");
        return false;
      }

      // Try to submit to backend first
      try {
        const formData = new FormData();
        Object.keys(applicationData).forEach((key) => {
          if (key !== "resume" && applicationData[key] !== undefined) {
            formData.append(key, applicationData[key]);
          }
        });

        if (applicationData.resume) {
          formData.append("resume", applicationData.resume);
        }

        const response = await applicationsAPI.submit(formData);

        if (response.success) {
          // Create application with real data from server
          const newApplication: Application = {
            ...response.data.application,
            id: response.data.application._id,
            appliedAt: new Date(response.data.application.createdAt),
            programDetails: programs.find(
              (p) => p.id === applicationData.programId
            ),
          };

          // Update local state
          setApplications((prev) => {
            const next = [newApplication, ...prev];
            try { localStorage.setItem("applications", JSON.stringify(next)); } catch {}
            return next;
          });

          // Update program spots
          setPrograms((prev) => {
            const next = prev.map((program) =>
              program.id === applicationData.programId
                ? { ...program }
                : program
            );
            try { localStorage.setItem("programs", JSON.stringify(next)); } catch {}
            return next;
          });

          // Add notification
          const newNotification: Notification = {
            id: Date.now().toString(),
            userId: user?.id || "",
            message: `Your application has been submitted successfully!`,
            type: "success",
            title: "Application Submitted",
            read: false,
            timestamp: new Date(),
          };
          setNotifications((prev) => {
            const next = [newNotification, ...prev];
            try { localStorage.setItem("notifications", JSON.stringify(next)); } catch {}
            return next;
          });

          toast.success("Application submitted successfully!");
          return true;
        } else {
          if (response.message?.includes("already applied")) {
            toast.error("You have already applied to this program");
          } else {
            toast.error(response.message || "Failed to submit application");
          }
          return false;
        }
      } catch (backendError: any) {
        console.error("Backend submission failed:", backendError);
        if (backendError.message?.includes("already applied")) {
          toast.error("You have already applied to this program");
        } else {
          toast.error("Failed to submit application. Please try again.");
        }
        return false;
      }
    } catch (error: any) {
      toast.error("Failed to submit application");
      return false;
    }
  };

  const updateApplicationStatus = async (
    applicationId: string,
    status: "accepted" | "rejected",
    notes?: string
  ): Promise<boolean> => {
    try {
      // Optimistic update
      setApplications((prev) => {
        const next = prev.map((app) =>
          app.id === applicationId
            ? { ...app, status, ...(status === "rejected" ? { notes } : {}) }
            : app
        );
        try { localStorage.setItem("applications", JSON.stringify(next)); } catch {}
        return next;
      });

      // Add notification for the student
      const application = applications.find((app) => app.id === applicationId);
      if (application) {
        const newNotification: Notification = {
          id: Date.now().toString(),
          userId: application.studentId,
          message: `Your application has been ${status}!`,
          type: status === "accepted" ? "success" : "error",
          title: `Application ${
            status === "accepted" ? "Accepted" : "Rejected"
          }`,
          read: false,
          timestamp: new Date(),
        };
        setNotifications((prev) => [newNotification, ...prev]);
      }

      // Try backend update
      try {
        const response = await applicationsAPI.updateStatus(
          applicationId,
          status,
          notes
        );
        if (!response.success) {
          throw new Error("Backend update failed");
        }
      } catch (backendError) {
        console.error(
          "Backend update failed, but continuing with local state:",
          backendError
        );
      }

      toast.success(`Application ${status} successfully`);
      return true;
    } catch (error: any) {
      toast.error(`Failed to ${status} application`);
      return false;
    }
  };

  const getApplicationsByStudent = (studentId: string): Application[] => {
    return applications.filter((app) => app.studentId === studentId);
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      // Optimistic update
      setNotifications((prev) => {
        const next = prev.map((notif) => notif.id === notificationId ? { ...notif, read: true } : notif);
        try { localStorage.setItem("notifications", JSON.stringify(next)); } catch {}
        return next;
      });

      // Try backend update
      try {
        await notificationsAPI.markAsRead(notificationId);
      } catch (backendError) {
        console.error("Backend notification update failed:", backendError);
      }
    } catch (error: any) {
      console.error("Mark notification as read error:", error);
    }
  };

  const markAllUserNotificationsRead = async (userId: string) => {
    try {
      // Optimistic update: mark all user notifications as read locally
      setNotifications((prev) => {
        const next = prev.map((notif) => notif.userId === userId ? { ...notif, read: true } : notif);
        try { localStorage.setItem("notifications", JSON.stringify(next)); } catch {}
        return next;
      });
      // Optional: If backend supports bulk mark, call it here
      try {
        // await notificationsAPI.markAllAsReadForUser(userId);
      } catch (backendError) {
        // Ignore backend failure for now; local state already updated
      }
    } catch (error: any) {
      console.error("Mark all notifications read error:", error);
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchApplications();
      fetchNotifications();
    } else {
      setApplications([]);
      setNotifications([]);
    }
  }, [isAuthenticated, user, fetchApplications]);

  const value = {
    programs,
    applications,
    notifications,
    loading,
    fetchPrograms,
    fetchApplications,
    fetchNotifications,
    addApplication,
    updateApplicationStatus,
    getApplicationsByStudent,
    markNotificationAsRead,
    markAllUserNotificationsRead,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
