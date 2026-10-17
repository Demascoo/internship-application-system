const express = require('express');
const router = express.Router();
const { getCompanyAdviserProgressData, saveCompanyAdviserProgressData } = require('../controllers/progressController');
const { authMiddleware } = require('../middleware/auth');

// Get Company Adviser's progress data for University Adviser (read-only)
router.get('/company-adviser/:studentId', authMiddleware, getCompanyAdviserProgressData);

// Save Company Adviser's progress data (Company Adviser only)
router.post('/company-adviser/:studentId', authMiddleware, saveCompanyAdviserProgressData);

// Get progress data for University Adviser (direct access to saved progress)
router.get('/:studentId', authMiddleware, getCompanyAdviserProgressData);

module.exports = router;
