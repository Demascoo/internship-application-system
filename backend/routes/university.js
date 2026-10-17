const express = require("express");
const { authMiddleware, adminMiddleware } = require("../middleware/auth");
const {
  getUniversities,
  getStudentsByUniversity,
  linkStudentsToAdviser
} = require("../controllers/universityController");

const router = express.Router();

// Get all universities (for autocomplete)
router.get("/", authMiddleware, getUniversities);

// Get students by university name
router.get("/:universityName/students", authMiddleware, adminMiddleware, getStudentsByUniversity);

// Link students to adviser/faculty head (admin only)
router.post("/link-students", authMiddleware, adminMiddleware, linkStudentsToAdviser);

module.exports = router;
