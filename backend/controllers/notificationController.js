const ActivityLog = require("../models/ActivityLog");

// Simple notification function that logs activities
const notify = async (req, userId, title, message, relatedId = null, type = "General") => {
  try {
    // Create activity log entry as notification
    const activityLog = new ActivityLog({
      userId: req.user?._id || req.user?.id,
      targetUserId: userId,
      action: "notification",
      details: {
        title,
        message,
        type,
        relatedId
      },
      timestamp: new Date()
    });

    await activityLog.save();
    console.log(`📢 Notification sent to user ${userId}: ${title}`);
    return { success: true, message: "Notification sent successfully" };
  } catch (error) {
    console.error("❌ Error sending notification:", error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  notify
};
