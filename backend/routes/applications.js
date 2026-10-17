const express = require('express');
const multer = require('multer');
const path = require('path');
const { body } = require('express-validator');
const {
  submitApplication,
  getAllApplications,
  getApplication,
  getStudentApplications,
  updateApplicationStatus
} = require('../controllers/applicationController');
const { authMiddleware, adminMiddleware, studentMiddleware } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.pdf', '.doc', '.docx'];
  const fileExt = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(fileExt)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, and DOCX files are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB
  }
});

// Validation middleware
const applicationValidation = [
  body('programId')
    .isMongoId()
    .withMessage('Valid program ID is required'),
  body('motivation')
    .trim()
    .isLength({ min: 50, max: 2000 })
    .withMessage('Motivation must be between 50 and 2000 characters'),
  body('availability')
    .isIn(['full-time', 'part-time'])
    .withMessage('Availability must be full-time or part-time'),
  body('preferredStartDate')
    .isISO8601()
    .withMessage('Valid preferred start date is required'),
  body('preferredEndDate')
    .isISO8601()
    .withMessage('Valid preferred end date is required'),
  body('preferredStartMonth')
    .isIn(['January', 'February', 'March', 'April', 'May', 'June', 
           'July', 'August', 'September', 'October', 'November', 'December'])
    .withMessage('Valid preferred start month is required'),
  body('preferredEndMonth')
    .isIn(['January', 'February', 'March', 'April', 'May', 'June', 
           'July', 'August', 'September', 'October', 'November', 'December'])
    .withMessage('Valid preferred end month is required'),
  body('desiredDuration')
    .isInt({ min: 1, max: 12 })
    .withMessage('Desired duration must be between 1 and 12 months')
];

// Routes
router.post('/submit', authMiddleware, studentMiddleware, upload.single('resume'), applicationValidation, submitApplication);
router.get('/', authMiddleware, adminMiddleware, getAllApplications);
router.get('/my-applications', authMiddleware, studentMiddleware, getStudentApplications);
router.get('/:id', authMiddleware, getApplication);
router.put('/:id/status', authMiddleware, adminMiddleware, updateApplicationStatus);

module.exports = router;