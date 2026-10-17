const jwt = require("jsonwebtoken");
const User = require("../models/User");

const initializeSocket = (io) => {
  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth.token ||
        socket.handshake.headers.authorization?.replace("Bearer ", "");

      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);

      if (!user || !user.isActive) {
        return next(new Error("Authentication error: Invalid token"));
      }

      socket.userId = user._id.toString();
      socket.userRole = user.role;
      next();
    } catch (error) {
      next(new Error("Authentication error: " + error.message));
    }
  });

  io.on("connection", (socket) => {
    console.log(`✅ User connected: ${socket.userId}`);

    // Join user to their personal room for notifications
    socket.join(socket.userId);

    // Join admin users to admin room
    if (socket.userRole === "admin") {
      socket.join("admins");
    }

    // Handle custom events
    socket.on("joinRoom", (room) => {
      socket.join(room);
      console.log(`User ${socket.userId} joined room: ${room}`);
    });

    socket.on("leaveRoom", (room) => {
      socket.leave(room);
      console.log(`User ${socket.userId} left room: ${room}`);
    });

    // Handle notification acknowledgment
    socket.on("notificationRead", (notificationId) => {
      console.log(
        `Notification ${notificationId} read by user ${socket.userId}`
      );
    });

    socket.on("disconnect", (reason) => {
      console.log(`❌ User disconnected: ${socket.userId}, reason: ${reason}`);
    });

    socket.on("error", (error) => {
      console.error("Socket error:", error);
    });
  });

  return io;
};

module.exports = initializeSocket;
