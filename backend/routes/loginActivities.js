const express = require("express");
const { authMiddleware, adminMiddleware } = require("../middleware/auth");
const { getLoginActivities, getMyLoginActivities, getActivityTimeline, deleteAllMyActivities, deleteAllActivities, getActivityAnalytics, getDetailedActivityLogs, getUserActivitySummary } = require("../controllers/loginActivityController");

const router = express.Router();

// Basic login activity routes
router.get("/", authMiddleware, adminMiddleware, getLoginActivities);
router.get("/timeline", authMiddleware, adminMiddleware, getActivityTimeline);
router.delete("/my-activities", authMiddleware, deleteAllMyActivities);
router.delete("/all-activities", authMiddleware, adminMiddleware, deleteAllActivities);

// Enhanced activity tracking routes
router.get("/analytics", authMiddleware, adminMiddleware, getActivityAnalytics);
router.get("/detailed", authMiddleware, adminMiddleware, getDetailedActivityLogs);
router.get("/user/:userId/summary", authMiddleware, adminMiddleware, getUserActivitySummary);

// User-specific activity routes (for users to view their own activities)
router.get("/my-activities", authMiddleware, getMyLoginActivities);
router.get("/my-summary", authMiddleware, (req, res, next) => {
  req.params.userId = req.user._id;
  getUserActivitySummary(req, res, next);
});
router.get("/my-detailed", authMiddleware, (req, res, next) => {
  req.query.userId = req.user._id;
  getDetailedActivityLogs(req, res, next);
});

module.exports = router;