import React, { createContext, useContext, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = React.useState(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      const token = localStorage.getItem("token");

      if (token && !socketRef.current) {
        console.log("🔌 Connecting to Socket.io server...");

        const socket = io(
          import.meta.env.VITE_API_URL?.replace("/api", "") ||
            "http://localhost:5000",
          {
            auth: {
              token: token,
            },
            transports: ["websocket", "polling"],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
            timeout: 20000,
          }
        );

        socket.on("connect", () => {
          console.log("✅ Socket connected successfully");
          setIsConnected(true);

          // Clear any pending reconnection timeout
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
          }
        });

        socket.on("disconnect", (reason) => {
          console.log("❌ Socket disconnected:", reason);
          setIsConnected(false);

          // Try to reconnect after a delay if it was an unexpected disconnect
          if (reason !== "io client disconnect" && isAuthenticated) {
            reconnectTimeoutRef.current = setTimeout(() => {
              console.log("🔄 Attempting to reconnect...");
              if (socketRef.current) {
                socketRef.current.connect();
              }
            }, 3000);
          }
        });

        socket.on("connect_error", (error) => {
          console.error("Socket connection error:", error);
          setIsConnected(false);
        });

        socket.on("reconnect", () => {
          console.log("🔄 Socket reconnected");
          setIsConnected(true);
        });

        // Optional: log events for debugging new features
        socket.on("newMessage", (payload) => {
          console.log("📩 newMessage", payload);
        });
        socket.on("newNotification", (payload) => {
          console.log("🔔 newNotification", payload);
        });

        socketRef.current = socket;
      }
    } else {
      // Disconnect socket when user logs out
      if (socketRef.current) {
        console.log("🔌 Disconnecting socket...");
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);

        // Clear reconnection timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      }
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [isAuthenticated, user]);

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        isConnected,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
