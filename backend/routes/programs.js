const express = require("express");
const { body } = require("express-validator");
const {
  getPrograms,
  getProgram,
  createProgram,
  updateProgram,
  deleteProgram,
  archiveProgram,
  reactivateProgram,
  checkAvailability,
  getProgramStatistics,
  getAllProgramsAdmin,
} = require("../controllers/programController");
const { authMiddleware, adminMiddleware } = require("../middleware/auth");

const router = express.Router();

// Enhanced validation middleware
const programValidation = [
  body("name")
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage("Program name must be between 3 and 200 characters"),
  body("description")
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage("Description must be between 10 and 1000 characters"),
  body("totalSpots")
    .isInt({ min: 1, max: 1000 })
    .withMessage("Total spots must be between 1 and 1000"),
  body("duration").trim().notEmpty().withMessage("Duration is required"),
  body("category")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Category is required and must be less than 50 characters"),
  body("startDate").isISO8601().withMessage("Valid start date is required"),
  body("endDate").isISO8601().withMessage("Valid end date is required"),
  body("applicationDeadline")
    .isISO8601()
    .withMessage("Valid application deadline is required"),
  body("startMonth")
    .isIn([
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ])
    .withMessage("Valid start month is required"),
  body("endMonth")
    .isIn([
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ])
    .withMessage("Valid end month is required"),
  body("durationInMonths")
    .isInt({ min: 1, max: 24 })
    .withMessage("Duration in months must be between 1 and 24"),
  body("requirements")
    .isArray({ min: 1 })
    .withMessage("At least one requirement is needed"),
  body("requirements.*")
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage("Each requirement must be between 5 and 200 characters"),
];

// Public routes
router.get("/", getPrograms);
router.get("/:id", getProgram);
router.get("/:id/availability", checkAvailability);

// Admin only routes
router.get("/admin/all", authMiddleware, adminMiddleware, getAllProgramsAdmin);
router.get(
  "/:id/statistics",
  authMiddleware,
  adminMiddleware,
  getProgramStatistics
);
router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  programValidation,
  createProgram
);
router.put("/:id", authMiddleware, adminMiddleware, updateProgram);
router.put("/:id/archive", authMiddleware, adminMiddleware, archiveProgram);
router.put("/:id/reactivate", authMiddleware, adminMiddleware, reactivateProgram);
router.delete("/:id", authMiddleware, adminMiddleware, deleteProgram);

module.exports = router;
