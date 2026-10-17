const ActivityLog = require("../models/ActivityLog");

// Enhanced activity descriptions for detailed logging
const getDetailedActionDescription = (method, path, body, params, query, user, success, statusCode) => {
  const baseAction = `${method} ${path}`;
  let detailedAction = baseAction;
  let entityType = "Unknown";
  let entityId = null;
  let actionDetails = {};

  // Authentication actions
  if (path.includes("/auth/login")) {
    entityType = "Authentication";
    detailedAction = `User login attempt${success ? " successful" : " failed"}`;
    actionDetails = {
      email: body?.email,
      role: body?.role,
      loginMethod: "email"
    };
  } else if (path.includes("/auth/logout")) {
    entityType = "Authentication";
    detailedAction = "User logged out";
  } else if (path.includes("/auth/register")) {
    entityType = "Authentication";
    detailedAction = `User registration${success ? " successful" : " failed"}`;
    actionDetails = {
      email: body?.email,
      role: body?.role,
      name: body?.name
    };
  }
  
  // Program management
  else if (path.includes("/programs")) {
    entityType = "Program";
    entityId = params?.id || params?.programId;
    if (method === "GET" && !entityId) {
      detailedAction = "Viewed programs list";
    } else if (method === "GET" && entityId) {
      detailedAction = `Viewed program details (ID: ${entityId})`;
    } else if (method === "POST") {
      detailedAction = `Created new program: ${body?.name || 'Unnamed'}`;
      actionDetails = { programName: body?.name, description: body?.description };
    } else if (method === "PUT" || method === "PATCH") {
      detailedAction = `Updated program (ID: ${entityId})`;
      actionDetails = { programName: body?.name };
    } else if (method === "DELETE") {
      detailedAction = `Deleted program (ID: ${entityId})`;
    }
  }
  
  // Application management
  else if (path.includes("/applications")) {
    entityType = "Application";
    entityId = params?.id || params?.applicationId;
    if (method === "GET" && !entityId) {
      detailedAction = "Viewed applications list";
    } else if (method === "GET" && entityId) {
      detailedAction = `Viewed application details (ID: ${entityId})`;
    } else if (method === "POST") {
      detailedAction = "Submitted new application";
      actionDetails = { programId: body?.programId, companyName: body?.companyName };
    } else if (method === "PUT" || method === "PATCH") {
      if (path.includes("/approve")) {
        detailedAction = `Approved application (ID: ${entityId})`;
      } else if (path.includes("/reject")) {
        detailedAction = `Rejected application (ID: ${entityId})`;
        actionDetails = { reason: body?.reason };
      } else {
        detailedAction = `Updated application (ID: ${entityId})`;
      }
    }
  }
  
  // Student management
  else if (path.includes("/students")) {
    entityType = "Student";
    entityId = params?.id || params?.studentId;
    if (method === "GET" && path.includes("/profile")) {
      detailedAction = "Viewed student profile";
    } else if (method === "PUT" && path.includes("/profile")) {
      detailedAction = "Updated student profile";
      actionDetails = { updatedFields: Object.keys(body || {}) };
    } else if (method === "GET") {
      detailedAction = entityId ? `Viewed student details (ID: ${entityId})` : "Viewed students list";
    }
  }
  
  // Account management
  else if (path.includes("/account-management")) {
    entityType = "Account Management";
    if (path.includes("/temporary-accounts") && method === "POST") {
      detailedAction = `Created temporary account for ${body?.role || 'unknown role'}`;
      actionDetails = {
        accountRole: body?.role,
        name: body?.name,
        email: body?.email,
        university: body?.university_name,
        company: body?.companyName
      };
    } else if (method === "GET" && path.includes("/students")) {
      detailedAction = "Fetched students for account management";
    }
  }
  
  // Adviser activities
  else if (path.includes("/advisers")) {
    entityType = "Adviser";
    entityId = params?.id || params?.adviserId;
    if (path.includes("/student-details")) {
      detailedAction = `Viewed student details for advising (Student ID: ${params?.studentId})`;
    } else if (path.includes("/final-evaluation")) {
      if (method === "POST") {
        detailedAction = "Created final evaluation";
        actionDetails = { studentId: body?.studentId };
      } else if (method === "PUT") {
        detailedAction = "Updated final evaluation";
      } else if (method === "GET" && path.includes("/export-pdf")) {
        detailedAction = "Exported final evaluation PDF";
      }
    } else if (path.includes("/messages")) {
      if (method === "POST") {
        detailedAction = "Sent message to student";
        actionDetails = { recipientId: body?.recipientId, messageType: body?.type };
      } else if (method === "GET") {
        detailedAction = "Viewed messages";
      }
    }
  }
  
  // Group management
  else if (path.includes("/groups")) {
    entityType = "Group";
    entityId = params?.id || params?.groupId;
    if (method === "POST" && path.includes("/assign")) {
      detailedAction = "Assigned students to group";
      actionDetails = { studentIds: body?.studentIds, programId: body?.programId };
    } else if (method === "GET") {
      detailedAction = entityId ? `Viewed group details (ID: ${entityId})` : "Viewed groups list";
    }
  }
  
  // Notifications
  else if (path.includes("/notifications")) {
    entityType = "Notification";
    if (method === "GET") {
      detailedAction = "Viewed notifications";
    } else if (method === "PUT" && path.includes("/read")) {
      detailedAction = "Marked notification as read";
      entityId = params?.id;
    } else if (method === "POST") {
      detailedAction = "Created notification";
      actionDetails = { type: body?.type, recipientRole: body?.recipientRole };
    }
  }
  
  // Progress tracking
  else if (path.includes("/progress")) {
    entityType = "Progress";
    if (method === "POST") {
      detailedAction = "Updated student progress";
      actionDetails = { studentId: body?.studentId, progressType: body?.type };
    } else if (method === "GET") {
      detailedAction = "Viewed progress reports";
    }
  }
  
  // Final evaluations
  else if (path.includes("/final-evaluation")) {
    entityType = "Final Evaluation";
    entityId = params?.id || params?.evaluationId;
    if (method === "POST") {
      detailedAction = "Created final evaluation";
      actionDetails = { studentId: body?.studentId, totalScore: body?.totalScore };
    } else if (method === "PUT") {
      detailedAction = "Updated final evaluation";
    } else if (method === "GET" && path.includes("/export")) {
      detailedAction = "Exported final evaluation";
    }
  }
  
  // Acceptance papers
  else if (path.includes("/acceptance-papers")) {
    entityType = "Acceptance Paper";
    entityId = params?.id;
    if (method === "POST") {
      detailedAction = "Uploaded acceptance paper";
      actionDetails = { studentId: body?.studentId, companyName: body?.companyName };
    } else if (method === "GET") {
      detailedAction = entityId ? `Downloaded acceptance paper (ID: ${entityId})` : "Viewed acceptance papers";
    }
  }
  
  // University management
  else if (path.includes("/universities")) {
    entityType = "University";
    if (method === "GET") {
      detailedAction = "Viewed universities list";
    }
  }
  
  // Faculty head activities
  else if (path.includes("/faculty-heads")) {
    entityType = "Faculty Head";
    if (method === "GET" && path.includes("/students")) {
      detailedAction = "Viewed assigned students";
    } else if (method === "POST" && path.includes("/approve")) {
      detailedAction = "Approved student evaluation";
      actionDetails = { studentId: body?.studentId };
    }
  }

  return {
    action: detailedAction,
    entityType,
    entityId,
    actionDetails,
    originalPath: path,
    originalMethod: method
  };
};

const activityLogger = async (req, res, next) => {
  const start = Date.now();
  const user = req.user; // set by authMiddleware when authenticated

  // Only log API routes
  if (!req.originalUrl.startsWith("/api")) return next();

  const ipAddress = req.headers["x-forwarded-for"]?.toString().split(",")[0] || req.ip || req.socket?.remoteAddress;
  const userAgent = req.headers["user-agent"];

  // Defer write until response finished to capture status
  res.on("finish", async () => {
    try {
      const statusCode = res.statusCode;
      const success = statusCode < 400;
      const method = req.method;
      const path = req.originalUrl.split("?")[0];
      
      // Get detailed action description
      const actionInfo = getDetailedActionDescription(
        method, 
        path, 
        req.body, 
        req.params, 
        req.query, 
        user, 
        success, 
        statusCode
      );

      // Create comprehensive activity log
      await ActivityLog.create({
        userId: user?._id,
        role: user?.role || (path.includes("/auth/login") ? (req.body?.role || "student") : "guest"),
        action: actionInfo.action,
        method: actionInfo.originalMethod,
        path: actionInfo.originalPath,
        entityType: actionInfo.entityType,
        entityId: actionInfo.entityId,
        success,
        statusCode,
        ipAddress,
        userAgent,
        actionDetails: actionInfo.actionDetails,
        requestBody: method !== "GET" ? JSON.stringify(req.body || {}) : undefined,
        queryParams: Object.keys(req.query || {}).length > 0 ? JSON.stringify(req.query) : undefined,
        responseTime: Date.now() - start,
        message: `${actionInfo.action} ${success ? "succeeded" : "failed"} in ${Date.now() - start}ms`,
      });
    } catch (e) {
      console.error("Activity log failed:", e?.message || e);
    }
  });

  next();
};

module.exports = { activityLogger };
