const express = require("express");
const {
  upload,
  uploadAcceptancePaper,
  getAllAcceptancePapersAdmin,
  getAcceptancePapersStudent,
  downloadAcceptancePaper,
  deleteAcceptancePaper,
} = require("../controllers/acceptancePaperController");
const { authMiddleware, adminMiddleware } = require("../middleware/auth");

const router = express.Router();

// Admin routes
router.post(
  "/upload",
  authMiddleware,
  adminMiddleware,
  upload.single("acceptancePaper"),
  uploadAcceptancePaper
);
router.get(
  "/admin/all",
  authMiddleware,
  adminMiddleware,
  getAllAcceptancePapersAdmin
);
router.delete(
  "/:paperId",
  authMiddleware,
  adminMiddleware,
  deleteAcceptancePaper
);

// Student routes
router.get("/student", authMiddleware, getAcceptancePapersStudent);

// Shared routes (both admin and student can download)
router.get("/download/:paperId", authMiddleware, downloadAcceptancePaper);

module.exports = router;
