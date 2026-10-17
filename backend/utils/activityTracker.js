const ActivityLog = require("../models/ActivityLog");
const crypto = require("crypto");

/**
 * Enhanced Activity Tracker Utility
 * Provides comprehensive user activity tracking with detailed context
 */

// Generate session ID for tracking user sessions
const generateSessionId = (userId, userAgent, ipAddress) => {
  const timestamp = Date.now();
  const hash = crypto.createHash('md5')
    .update(`${userId}-${userAgent}-${ipAddress}-${timestamp}`)
    .digest('hex');
  return hash.substring(0, 16);
};

// Extract device information from user agent
const extractDeviceInfo = (userAgent) => {
  if (!userAgent) return "Unknown Device";
  
  const deviceInfo = {
    browser: "Unknown",
    os: "Unknown",
    device: "Desktop"
  };

  // Browser detection
  if (userAgent.includes("Chrome")) deviceInfo.browser = "Chrome";
  else if (userAgent.includes("Firefox")) deviceInfo.browser = "Firefox";
  else if (userAgent.includes("Safari")) deviceInfo.browser = "Safari";
  else if (userAgent.includes("Edge")) deviceInfo.browser = "Edge";
  else if (userAgent.includes("Opera")) deviceInfo.browser = "Opera";

  // OS detection
  if (userAgent.includes("Windows")) deviceInfo.os = "Windows";
  else if (userAgent.includes("Mac")) deviceInfo.os = "macOS";
  else if (userAgent.includes("Linux")) deviceInfo.os = "Linux";
  else if (userAgent.includes("Android")) deviceInfo.os = "Android";
  else if (userAgent.includes("iOS")) deviceInfo.os = "iOS";

  // Device type detection
  if (userAgent.includes("Mobile") || userAgent.includes("Android")) deviceInfo.device = "Mobile";
  else if (userAgent.includes("Tablet") || userAgent.includes("iPad")) deviceInfo.device = "Tablet";

  return `${deviceInfo.browser} on ${deviceInfo.os} (${deviceInfo.device})`;
};

// Get approximate location from IP (basic implementation)
const getLocationFromIP = (ipAddress) => {
  // This is a basic implementation - in production, you'd use a proper IP geolocation service
  if (!ipAddress || ipAddress === "::1" || ipAddress.startsWith("127.")) {
    return "Local/Development";
  }
  
  // For now, return generic location - integrate with IP geolocation service for production
  return "Unknown Location";
};

// Log detailed user activity
const logActivity = async (req, actionType, entityType, entityId, additionalDetails = {}) => {
  try {
    const user = req.user;
    const method = req.method;
    const path = req.originalUrl.split("?")[0];
    const ipAddress = req.headers["x-forwarded-for"]?.toString().split(",")[0] || req.ip || req.socket?.remoteAddress;
    const userAgent = req.headers["user-agent"];
    
    const sessionId = generateSessionId(user?._id, userAgent, ipAddress);
    const deviceInfo = extractDeviceInfo(userAgent);
    const location = getLocationFromIP(ipAddress);

    const activityData = {
      userId: user?._id,
      role: user?.role || "guest",
      action: actionType,
      method,
      path,
      entityType,
      entityId,
      success: true, // Will be updated if there's an error
      statusCode: 200, // Will be updated based on response
      ipAddress,
      userAgent,
      sessionId,
      deviceInfo,
      location,
      actionDetails: {
        ...additionalDetails,
        timestamp: new Date(),
        userEmail: user?.email,
        userName: user?.name
      },
      message: `${actionType} - ${entityType}${entityId ? ` (ID: ${entityId})` : ""}`
    };

    await ActivityLog.create(activityData);
    
    return {
      success: true,
      sessionId,
      activityId: activityData._id
    };
  } catch (error) {
    console.error("Activity logging failed:", error);
    return { success: false, error: error.message };
  }
};

// Predefined activity types for consistency
const ACTIVITY_TYPES = {
  // Authentication
  LOGIN: "User Login",
  LOGOUT: "User Logout",
  REGISTER: "User Registration",
  PASSWORD_RESET: "Password Reset",
  
  // Data Operations
  CREATE: "Created",
  READ: "Viewed",
  UPDATE: "Updated",
  DELETE: "Deleted",
  
  // Specific Actions
  UPLOAD: "Uploaded",
  DOWNLOAD: "Downloaded",
  EXPORT: "Exported",
  IMPORT: "Imported",
  APPROVE: "Approved",
  REJECT: "Rejected",
  SUBMIT: "Submitted",
  ASSIGN: "Assigned",
  UNASSIGN: "Unassigned",
  
  // Communication
  SEND_MESSAGE: "Sent Message",
  READ_MESSAGE: "Read Message",
  SEND_NOTIFICATION: "Sent Notification",
  
  // System Actions
  SEARCH: "Searched",
  FILTER: "Filtered",
  SORT: "Sorted",
  NAVIGATE: "Navigated"
};

// Entity types for consistency
const ENTITY_TYPES = {
  USER: "User",
  STUDENT: "Student",
  ADVISER: "Adviser",
  ADMIN: "Admin",
  PROGRAM: "Program",
  APPLICATION: "Application",
  EVALUATION: "Evaluation",
  NOTIFICATION: "Notification",
  MESSAGE: "Message",
  DOCUMENT: "Document",
  REPORT: "Report",
  GROUP: "Group",
  UNIVERSITY: "University",
  COMPANY: "Company"
};

// Helper functions for common activities
const trackLogin = async (req, loginResult) => {
  return await logActivity(
    req, 
    ACTIVITY_TYPES.LOGIN, 
    ENTITY_TYPES.USER, 
    req.user?._id,
    {
      loginMethod: "email",
      success: loginResult.success,
      role: req.body?.role,
      email: req.body?.email
    }
  );
};

const trackLogout = async (req) => {
  return await logActivity(
    req, 
    ACTIVITY_TYPES.LOGOUT, 
    ENTITY_TYPES.USER, 
    req.user?._id,
    {
      sessionDuration: "calculated_on_frontend" // Can be calculated if session start time is tracked
    }
  );
};

const trackDataAccess = async (req, entityType, entityId, operation = "READ") => {
  return await logActivity(
    req,
    ACTIVITY_TYPES[operation] || operation,
    entityType,
    entityId,
    {
      queryParams: req.query,
      filters: req.body?.filters
    }
  );
};

const trackFileOperation = async (req, operation, fileName, fileSize = null) => {
  return await logActivity(
    req,
    ACTIVITY_TYPES[operation] || operation,
    ENTITY_TYPES.DOCUMENT,
    fileName,
    {
      fileName,
      fileSize,
      fileType: fileName?.split('.').pop()
    }
  );
};

const trackEvaluationActivity = async (req, evaluationId, action, studentId = null) => {
  return await logActivity(
    req,
    action,
    ENTITY_TYPES.EVALUATION,
    evaluationId,
    {
      studentId,
      evaluationType: req.body?.evaluationType,
      score: req.body?.totalScore
    }
  );
};

const trackCommunication = async (req, messageType, recipientId, content = null) => {
  return await logActivity(
    req,
    ACTIVITY_TYPES.SEND_MESSAGE,
    ENTITY_TYPES.MESSAGE,
    null,
    {
      messageType,
      recipientId,
      contentLength: content?.length,
      hasAttachment: req.body?.hasAttachment || false
    }
  );
};

module.exports = {
  logActivity,
  generateSessionId,
  extractDeviceInfo,
  getLocationFromIP,
  ACTIVITY_TYPES,
  ENTITY_TYPES,
  
  // Helper functions
  trackLogin,
  trackLogout,
  trackDataAccess,
  trackFileOperation,
  trackEvaluationActivity,
  trackCommunication
};
