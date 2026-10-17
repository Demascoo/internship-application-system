const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const {
  getFinalEvaluations,
  getFinalEvaluationById,
  reviewFinalEvaluation,
  getDashboardStats,
  exportEvaluations
} = require("../controllers/facultyHeadController");

const router = express.Router();

// Middleware to ensure only faculty heads can access these routes
const facultyHeadMiddleware = (req, res, next) => {
  if (req.user.role !== 'facultyHead') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Faculty Head role required.'
    });
  }
  next();
};

// Faculty Head Dashboard routes
router.get("/dashboard/stats", authMiddleware, facultyHeadMiddleware, getDashboardStats);
router.get("/evaluations", authMiddleware, facultyHeadMiddleware, getFinalEvaluations);
router.get("/evaluations/:evaluationId", authMiddleware, facultyHeadMiddleware, getFinalEvaluationById);
router.put("/evaluations/:evaluationId/review", authMiddleware, facultyHeadMiddleware, reviewFinalEvaluation);
router.get("/evaluations/export", authMiddleware, facultyHeadMiddleware, exportEvaluations);

module.exports = router;
