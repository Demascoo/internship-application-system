const express = require('express');
const {
  getAcceptedStudentsByProgram,
  createStudentGroups,
  updateStudentGroups,
  deleteStudentGroup,
  getProgramGroups,
  exportStudentList
} = require('../controllers/groupController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// All routes require admin authentication
router.use(authMiddleware, adminMiddleware);

// Get accepted students grouped by program
router.get('/programs/accepted-students', getAcceptedStudentsByProgram);

// Program-specific group management
router.get('/programs/:programId/groups', getProgramGroups);
router.post('/programs/:programId/groups', createStudentGroups);
router.put('/programs/:programId/groups/:groupId', updateStudentGroups);
router.delete('/programs/:programId/groups/:groupId', deleteStudentGroup);

// Export functionality
router.get('/programs/:programId/export', exportStudentList);

module.exports = router;