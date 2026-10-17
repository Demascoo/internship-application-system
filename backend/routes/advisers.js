const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const {
  createAdviser,
  listAdvisers,
  listStudents,
  getAssignedStudents,
  upsertAdviserLink,
  getAdviserLink,
  sendMessage,
  listMessages,
  getLinkedAdvisers,
  recordAttendance,
  listAttendance,
  saveInternshipDates,
  getInternshipDates,
  submitProgressReport,
  listProgressReports,
  submitEvaluation,
  listEvaluations,
  getFinalEvaluation,
  createFinalEvaluation,
  updateFinalEvaluation,
  exportFinalEvaluationPDF,
  exportFinalEvaluationPDFByStudent,
  getFacultyHeadFinalEvaluationData,
  getStudentDetails
} = require("../controllers/adviserController");
const { createFinalEvaluationProgress, updateFinalEvaluationProgress } = require("../controllers/finalEvaluationProgressController");
const { authMiddleware, adminMiddleware, companyAdviserMiddleware, universityAdviserMiddleware, companyAdminMiddleware } = require("../middleware/auth");

const router = express.Router();

// Ensure upload directory exists
const uploadDir = path.join(__dirname, "../uploads/adviser-docs");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || "";
    cb(null, `adviser-${unique}${ext}`);
  },
});

const upload = multer({ storage });

// Links
router.post("/links", authMiddleware, adminMiddleware, upsertAdviserLink);
router.get("/links/:studentId", authMiddleware, getAdviserLink);

// Advisers management (admin)
router.post("/advisers", authMiddleware, adminMiddleware, createAdviser);
router.get("/advisers", authMiddleware, adminMiddleware, listAdvisers);
// router.get("/adviser-users", authMiddleware, adminMiddleware, listAdviserEligibleUsers); // Function not implemented
// router.post("/adviser-sync", authMiddleware, adminMiddleware, syncExistingAdviser); // Function not implemented
// Students for admin (dropdowns)
router.get("/students", authMiddleware, adminMiddleware, listStudents);
// Students assigned to current adviser
router.get("/assigned-students", authMiddleware, getAssignedStudents);

// Messaging between advisers (universityAdviser <-> companyAdviser/companyAdmin)
router.post("/messages", authMiddleware, upload.array("attachments", 5), sendMessage);
router.get("/messages/:studentId", authMiddleware, listMessages);
router.get("/linked-advisers/:studentId", authMiddleware, getLinkedAdvisers);

// Attendance (company adviser)
router.post("/attendance", authMiddleware, companyAdviserMiddleware, recordAttendance);
router.get("/attendance/:studentId", authMiddleware, listAttendance);
router.post("/internship-dates", authMiddleware, companyAdviserMiddleware, saveInternshipDates);
router.get("/internship-dates/:studentId", authMiddleware, getInternshipDates);

// Progress reports (either adviser can submit)
router.post("/progress", authMiddleware, submitProgressReport);
router.get("/progress/:studentId", authMiddleware, listProgressReports);

// Evaluations
router.post("/evaluations", authMiddleware, companyAdviserMiddleware, submitEvaluation);
// router.put("/evaluations/:id/review", authMiddleware, universityAdviserMiddleware, reviewEvaluation); // Function not implemented
// router.put("/evaluations/:id/seen", authMiddleware, universityAdviserMiddleware, markEvaluationSeen); // Function not implemented
router.get("/evaluations/:studentId", authMiddleware, listEvaluations);

// Documents - Functions not implemented
// router.post("/documents", authMiddleware, upload.single("file"), uploadDocument);
// router.get("/documents/:studentId", authMiddleware, listDocuments);

// Adviser notifications - Function not implemented
// router.get("/notifications", authMiddleware, listMyNotifications);

// Final Result Evaluation (mirrors progress pattern)
router.get("/final-evaluation/:studentId", authMiddleware, getFinalEvaluation);
router.post("/final-evaluation/company-adviser/:studentId", authMiddleware, createFinalEvaluationProgress);
router.put("/final-evaluation/company-adviser/:studentId", authMiddleware, updateFinalEvaluationProgress);
router.get("/final-evaluation/:evaluationId/export-pdf", authMiddleware, exportFinalEvaluationPDF);
router.get("/final-evaluation/student/:studentId/export-pdf", authMiddleware, exportFinalEvaluationPDFByStudent);

// Legacy file upload routes (keep for backward compatibility)
router.post("/final-evaluation", authMiddleware, upload.array('attachments', 5), createFinalEvaluation);
router.put("/final-evaluation/:studentId", authMiddleware, upload.array('attachments', 5), updateFinalEvaluation);

// Faculty Head specific routes - mirrors progress pattern
router.get("/final-evaluation/faculty-head/:studentId", authMiddleware, getFacultyHeadFinalEvaluationData);

// Student details with populated data
router.get("/student-details/:studentId", authMiddleware, getStudentDetails);

module.exports = router;
