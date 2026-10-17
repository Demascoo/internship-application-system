const express = require('express');
const router = express.Router();
const { getFinalEvaluationData, saveFinalEvaluationData } = require('../controllers/finalEvaluationController');
const { authMiddleware } = require('../middleware/auth');

// Get Company Adviser's final evaluation data for University Adviser (read-only)
router.get('/company-adviser/:studentId', authMiddleware, getFinalEvaluationData);

// Save Company Adviser's final evaluation data (Company Adviser only)
router.post('/company-adviser/:studentId', authMiddleware, saveFinalEvaluationData);

// Get final evaluation data for University Adviser (direct access to saved evaluation)
router.get('/:studentId', authMiddleware, getFinalEvaluationData);

module.exports = router;
