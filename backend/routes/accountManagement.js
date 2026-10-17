const express = require("express");
const multer = require("multer");
const path = require("path");
const { authMiddleware, adminMiddleware } = require("../middleware/auth");
const {
  createTemporaryAccount,
  listTemporaryAccounts,
  getStudentsForSelection,
  getStudentsByUniversity,
  getStudentsByProgram,
  getStudentUniversityAdvisers,
  getLinkedAdvisersForStudent,
  updateProfile,
  unlockAccount,
  getFacultyHeadsByStudent,
  getFacultyHeadsByStudentProgram,
  submitFinalEvaluation,
  getFinalEvaluationsForFacultyHead,
  reviewFinalEvaluation,
  downloadEvaluationAttachment,
  getStudentsAssignedToUniversityAdviser,
  getStudentsAssignedToCompanyAdviser,
  getAdviserDashboardStats,
  adminResetUserPassword,
  getStudentsAssignedToUniversityAdviserWithParam,
  getStudentsAssignedToFacultyHead,
  getStudentsGroupedByProgram,
  getCompanyAdvisersByProgram,
  assignCompanyAdviserToStudent,
  getUnassignedStudentsByProgram,
  assignStudentsToCompanyAdviser,
  debugStudentAssignments,
  testCompanyAdviserAssignment,
  getStudentsByCompanyAdviser
} = require("../controllers/accountManagementController");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/final-evaluations/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Allow common document and image formats
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|csv|txt/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only document and image files are allowed!'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: fileFilter
});

const router = express.Router();

// Admin routes for creating temporary accounts
router.post("/temporary-accounts", authMiddleware, adminMiddleware, createTemporaryAccount);
router.get("/temporary-accounts", authMiddleware, adminMiddleware, listTemporaryAccounts);

// Admin: Get students for University Adviser selection
router.get("/students", authMiddleware, adminMiddleware, getStudentsForSelection);

// Admin: Get students by university for University Adviser/Faculty Head selection
router.get("/students/university/:universityName", authMiddleware, adminMiddleware, getStudentsByUniversity);

// Admin: Get students by program for Company Adviser selection
router.get("/students/program/:programId", authMiddleware, adminMiddleware, getStudentsByProgram);

// Debug: Check all students and their program assignments
router.get("/debug/students", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const User = require("../models/User");
    const students = await User.find({ role: 'student' })
      .populate('groupAssignment.programId', 'name')
      .select('name email university_name groupAssignment')
      .limit(10);
    
    res.json({
      success: true,
      data: {
        totalStudents: students.length,
        students: students.map(s => ({
          name: s.name,
          email: s.email,
          university: s.university_name,
          programId: s.groupAssignment?.programId?._id,
          programName: s.groupAssignment?.programId?.name,
          hasGroupAssignment: !!s.groupAssignment
        }))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Admin: Get student's university advisers for Company Adviser auto-linking
router.get("/students/:studentId/university-advisers", authMiddleware, adminMiddleware, getStudentUniversityAdvisers);

// User profile update (for advisers and faculty head)
router.put("/profile/:id", authMiddleware, updateProfile);

// Unlock account (no auth required - for locked accounts)
router.post("/unlock-account", unlockAccount);

// Admin: Reset user password and unlock
router.post("/admin/reset-password", authMiddleware, adminMiddleware, adminResetUserPassword);

// Faculty Head selection route
router.get("/faculty-heads/student/:studentId", authMiddleware, getFacultyHeadsByStudentProgram);

// Company Adviser: Get linked University Adviser and Faculty Head for a student
router.get("/linked-advisers/:studentId", authMiddleware, getLinkedAdvisersForStudent);

// Admin: Get students assigned to a specific company adviser (for assignment interface)
router.get("/students/company-adviser/:adviserId", authMiddleware, getStudentsByCompanyAdviser);

// University Adviser: Get students assigned to them (with ID parameter)
router.get("/assigned-students/university-adviser/:id", authMiddleware, getStudentsAssignedToUniversityAdviserWithParam);

// Faculty Head: Get students assigned to them (with ID parameter)
router.get("/assigned-students/faculty-head/:id", authMiddleware, getStudentsAssignedToFacultyHead);

// Adviser Dashboard Routes
router.get("/my-students/university-adviser", authMiddleware, getStudentsAssignedToUniversityAdviser);
router.get("/my-students/company-adviser", authMiddleware, getStudentsAssignedToCompanyAdviser);
router.get("/dashboard/stats", authMiddleware, getAdviserDashboardStats);

// Legacy routes for backward compatibility (using authenticated user)
router.get("/assigned-students/university-adviser", authMiddleware, getStudentsAssignedToUniversityAdviser);
router.get("/assigned-students/faculty-head", authMiddleware, getStudentsAssignedToFacultyHead);

// Enhanced assignment routes
router.get("/students-by-program", authMiddleware, getStudentsGroupedByProgram);
router.get("/students-grouped-by-program", authMiddleware, getStudentsGroupedByProgram);
router.get("/unassigned-students-by-program", authMiddleware, getUnassignedStudentsByProgram);
router.get("/company-advisers/program/:programId", authMiddleware, getCompanyAdvisersByProgram);
router.post("/assign-company-adviser", authMiddleware, assignCompanyAdviserToStudent);
router.post('/assign-adviser', authMiddleware, adminMiddleware, assignStudentsToCompanyAdviser);

// Debug route to check student assignments
router.get('/debug/students', authMiddleware, debugStudentAssignments);

// Test endpoint for company adviser assignments
router.get("/test/company-adviser-assignments", authMiddleware, testCompanyAdviserAssignment);

// Final evaluation routes with file upload support
router.post("/final-evaluations", authMiddleware, upload.array('attachments', 5), submitFinalEvaluation);
router.get("/final-evaluations/faculty-head", authMiddleware, getFinalEvaluationsForFacultyHead);
router.put("/final-evaluations/:id/review", authMiddleware, reviewFinalEvaluation);

// File download route
router.get("/final-evaluations/:evaluationId/attachments/:attachmentIndex/download", authMiddleware, downloadEvaluationAttachment);

// Simple test endpoint to verify API is working
router.get("/test", authMiddleware, adminMiddleware, (req, res) => {
  res.json({
    success: true,
    message: "Account Management API is working",
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
