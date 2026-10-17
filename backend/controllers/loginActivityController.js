const LoginActivity = require("../models/LoginActivity");
const ActivityLog = require("../models/ActivityLog");

const buildQuery = (req) => {
  const q = {};
  const { userId, role, status, start, end, search } = req.query;
  if (userId) q.userId = userId;
  if (role) q.role = role;
  if (status) q.status = status;
  if (start || end) {
    q.createdAt = {};
    if (start) q.createdAt.$gte = new Date(start);
    if (end) q.createdAt.$lte = new Date(end);
  }
  if (search) {
    q.$or = [
      { message: { $regex: search, $options: "i" } },
      { ipAddress: { $regex: search, $options: "i" } },
      { userAgent: { $regex: search, $options: "i" } },
    ];
  }
  return q;
};

const getLoginActivities = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "20", 10), 1), 100);
    const skip = (page - 1) * limit;
    const query = buildQuery(req);

    const [items, total] = await Promise.all([
      LoginActivity.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("userId", "name email role"),
      LoginActivity.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: { items, total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("Get login activities error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getMyLoginActivities = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "20", 10), 1), 100);
    const skip = (page - 1) * limit;

    const query = { userId: req.user.id };

    const [items, total] = await Promise.all([
      LoginActivity.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      LoginActivity.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: { items, total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("Get my login activities error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const deleteAllMyActivities = async (req, res) => {
  try {
    const userId = req.user.id;

    // Delete all login activities for the current user
    const loginDeleteResult = await LoginActivity.deleteMany({ userId });
    
    // Delete all activity logs for the current user
    const activityDeleteResult = await ActivityLog.deleteMany({ userId });

    const totalDeleted = loginDeleteResult.deletedCount + activityDeleteResult.deletedCount;

    res.status(200).json({
      success: true,
      message: `Successfully deleted ${totalDeleted} activities`,
      data: {
        loginActivitiesDeleted: loginDeleteResult.deletedCount,
        activityLogsDeleted: activityDeleteResult.deletedCount,
        totalDeleted
      }
    });
  } catch (err) {
    console.error("Delete all my activities error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const deleteAllActivities = async (req, res) => {
  try {
    // Delete all login activities for all users (admin only)
    const loginDeleteResult = await LoginActivity.deleteMany({});
    
    // Delete all activity logs for all users (admin only)
    const activityDeleteResult = await ActivityLog.deleteMany({});

    const totalDeleted = loginDeleteResult.deletedCount + activityDeleteResult.deletedCount;

    res.status(200).json({
      success: true,
      message: `Successfully deleted ${totalDeleted} activities from all users`,
      data: {
        loginActivitiesDeleted: loginDeleteResult.deletedCount,
        activityLogsDeleted: activityDeleteResult.deletedCount,
        totalDeleted
      }
    });
  } catch (err) {
    console.error("Delete all activities error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getActivityTimeline = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "20", 10), 1), 100);
    const skip = (page - 1) * limit;

    const filters = buildQuery(req);
    // For activity logs, reuse filters for role, date, search (message/path)
    const actQuery = {};
    if (filters.role) actQuery.role = filters.role;
    if (filters.createdAt) actQuery.createdAt = filters.createdAt;
    if (req.query.search) {
      actQuery.$or = [
        { message: { $regex: req.query.search, $options: "i" } },
        { path: { $regex: req.query.search, $options: "i" } },
        { action: { $regex: req.query.search, $options: "i" } },
      ];
    }
    if (req.query.userId) actQuery.userId = req.query.userId;

    const [loginItems, activityItems, loginTotal, activityTotal] = await Promise.all([
      LoginActivity.find(filters)
        .sort({ createdAt: -1 })
        .select("userId role status message ipAddress userAgent createdAt")
        .populate("userId", "name email role"),
      ActivityLog.find(actQuery)
        .sort({ createdAt: -1 })
        .select("userId role action method path entityType entityId success statusCode ipAddress userAgent message actionDetails requestBody queryParams responseTime createdAt")
        .populate("userId", "name email role"),
      LoginActivity.countDocuments(filters),
      ActivityLog.countDocuments(actQuery),
    ]);

    // Merge and sort by createdAt desc then paginate
    const unified = [
      ...loginItems.map((it) => ({
        _id: `login-${it._id}`,
        kind: "login",
        user: it.userId,
        role: it.role,
        status: it.status,
        message: it.message,
        ipAddress: it.ipAddress,
        userAgent: it.userAgent,
        createdAt: it.createdAt,
      })),
      ...activityItems.map((it) => ({
        _id: `act-${it._id}`,
        kind: "activity",
        user: it.userId,
        role: it.role,
        action: it.action,
        method: it.method,
        path: it.path,
        entityType: it.entityType,
        entityId: it.entityId,
        success: it.success,
        statusCode: it.statusCode,
        ipAddress: it.ipAddress,
        userAgent: it.userAgent,
        message: it.message,
        actionDetails: it.actionDetails,
        requestBody: it.requestBody,
        queryParams: it.queryParams,
        responseTime: it.responseTime,
        createdAt: it.createdAt,
      })),
    ].sort((a, b) => b.createdAt - a.createdAt);

    const total = loginTotal + activityTotal;
    const paged = unified.slice(skip, skip + limit);

    res.status(200).json({ success: true, data: { items: paged, total, page, limit, pages: Math.ceil(total / limit) } });
  } catch (err) {
    console.error("Get activity timeline error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Enhanced activity analytics
const getActivityAnalytics = async (req, res) => {
  try {
    const { userId, role, days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const matchQuery = {
      createdAt: { $gte: startDate }
    };
    if (userId) matchQuery.userId = userId;
    if (role) matchQuery.role = role;

    const [activityStats, entityStats, hourlyStats, dailyStats, topUsers] = await Promise.all([
      // Activity type distribution
      ActivityLog.aggregate([
        { $match: matchQuery },
        { $group: { _id: "$entityType", count: { $sum: 1 }, successRate: { $avg: { $cond: ["$success", 1, 0] } } } },
        { $sort: { count: -1 } }
      ]),
      
      // Entity interaction stats
      ActivityLog.aggregate([
        { $match: matchQuery },
        { $group: { _id: { entityType: "$entityType", method: "$method" }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 }
      ]),
      
      // Hourly activity distribution
      ActivityLog.aggregate([
        { $match: matchQuery },
        { $group: { _id: { $hour: "$createdAt" }, count: { $sum: 1 } } },
        { $sort: { "_id": 1 } }
      ]),
      
      // Daily activity trends
      ActivityLog.aggregate([
        { $match: matchQuery },
        { $group: { 
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, 
          count: { $sum: 1 },
          successCount: { $sum: { $cond: ["$success", 1, 0] } },
          avgResponseTime: { $avg: "$responseTime" }
        } },
        { $sort: { "_id": 1 } }
      ]),
      
      // Most active users
      ActivityLog.aggregate([
        { $match: matchQuery },
        { $group: { _id: "$userId", count: { $sum: 1 }, role: { $first: "$role" } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
        { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } }
      ])
    ]);

    res.status(200).json({
      success: true,
      data: {
        activityStats,
        entityStats,
        hourlyStats,
        dailyStats,
        topUsers,
        period: `${days} days`,
        totalActivities: await ActivityLog.countDocuments(matchQuery)
      }
    });
  } catch (err) {
    console.error("Get activity analytics error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get detailed activity logs with enhanced filtering
const getDetailedActivityLogs = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "50", 10), 1), 200);
    const skip = (page - 1) * limit;
    
    const { userId, role, entityType, success, method, start, end, search } = req.query;
    
    const query = {};
    if (userId) query.userId = userId;
    if (role) query.role = role;
    if (entityType) query.entityType = entityType;
    if (success !== undefined) query.success = success === 'true';
    if (method) query.method = method;
    
    if (start || end) {
      query.createdAt = {};
      if (start) query.createdAt.$gte = new Date(start);
      if (end) query.createdAt.$lte = new Date(end);
    }
    
    if (search) {
      query.$or = [
        { action: { $regex: search, $options: "i" } },
        { message: { $regex: search, $options: "i" } },
        { path: { $regex: search, $options: "i" } },
        { entityType: { $regex: search, $options: "i" } }
      ];
    }

    const [activities, total] = await Promise.all([
      ActivityLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("userId", "name email role")
        .lean(),
      ActivityLog.countDocuments(query)
    ]);

    // Parse JSON fields for better frontend consumption
    const processedActivities = activities.map(activity => ({
      ...activity,
      actionDetails: activity.actionDetails || {},
      requestBody: activity.requestBody ? (() => {
        try { return JSON.parse(activity.requestBody); } catch { return activity.requestBody; }
      })() : null,
      queryParams: activity.queryParams ? (() => {
        try { return JSON.parse(activity.queryParams); } catch { return activity.queryParams; }
      })() : null
    }));

    res.status(200).json({
      success: true,
      data: {
        activities: processedActivities,
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error("Get detailed activity logs error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get user activity summary
const getUserActivitySummary = async (req, res) => {
  try {
    const { userId } = req.params;
    const { days = 7 } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    const query = {
      userId,
      createdAt: { $gte: startDate }
    };

    const [summary, recentActivities, activityByType] = await Promise.all([
      ActivityLog.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalActivities: { $sum: 1 },
            successfulActivities: { $sum: { $cond: ["$success", 1, 0] } },
            avgResponseTime: { $avg: "$responseTime" },
            uniqueEntityTypes: { $addToSet: "$entityType" },
            firstActivity: { $min: "$createdAt" },
            lastActivity: { $max: "$createdAt" }
          }
        }
      ]),
      
      ActivityLog.find(query)
        .sort({ createdAt: -1 })
        .limit(10)
        .select("action entityType success createdAt responseTime")
        .lean(),
        
      ActivityLog.aggregate([
        { $match: query },
        { $group: { _id: "$entityType", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);

    const summaryData = summary[0] || {
      totalActivities: 0,
      successfulActivities: 0,
      avgResponseTime: 0,
      uniqueEntityTypes: [],
      firstActivity: null,
      lastActivity: null
    };

    res.status(200).json({
      success: true,
      data: {
        summary: {
          ...summaryData,
          successRate: summaryData.totalActivities > 0 ? 
            (summaryData.successfulActivities / summaryData.totalActivities * 100).toFixed(2) : 0,
          uniqueEntityTypesCount: summaryData.uniqueEntityTypes.length
        },
        recentActivities,
        activityByType,
        period: `${days} days`
      }
    });
  } catch (err) {
    console.error("Get user activity summary error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { 
  getLoginActivities, 
  getMyLoginActivities, 
  getActivityTimeline, 
  deleteAllMyActivities, 
  deleteAllActivities,
  getActivityAnalytics,
  getDetailedActivityLogs,
  getUserActivitySummary
}; 