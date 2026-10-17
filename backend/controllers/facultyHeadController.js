const FinalEvaluation = require("../models/FinalEvaluation");
const User = require("../models/User");
const Program = require("../models/Program");
const ActivityLog = require("../models/ActivityLog");

// Get all final evaluations for faculty head's programs
const getFinalEvaluations = async (req, res) => {
  try {
    const facultyHeadId = req.user.id;

    // Get programs assigned to this faculty head
    const programs = await Program.find({ facultyHeadId }).select('_id name');
    const programIds = programs.map(p => p._id);

    // Get students in these programs
    const students = await User.find({
      'groupAssignment.programId': { $in: programIds },
      role: 'student'
    }).select('_id name email groupAssignment');

    const studentIds = students.map(s => s._id);

    // Get final evaluations for these students
    const evaluations = await FinalEvaluation.find({
      studentId: { $in: studentIds },
      status: { $in: ['submitted', 'reviewed', 'approved', 'rejected'] }
    })
    .populate('studentId', 'name email profile.department profile.companyName')
    .populate('companyAdviserId', 'name email')
    .sort({ createdAt: -1 });

    // Add program information to each evaluation
    const evaluationsWithProgram = evaluations.map(evaluation => {
      const student = students.find(s => s._id.toString() === evaluation.studentId._id.toString());
      const program = programs.find(p => p._id.toString() === student?.groupAssignment?.programId?.toString());
      
      return {
        ...evaluation.toObject(),
        programInfo: {
          id: program?._id,
          name: program?.name
        }
      };
    });

    res.json({
      success: true,
      data: evaluationsWithProgram,
      programs: programs.map(p => ({ id: p._id, name: p.name }))
    });

  } catch (error) {
    console.error('Error fetching final evaluations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching final evaluations',
      error: error.message
    });
  }
};

// Get specific final evaluation details
const getFinalEvaluationById = async (req, res) => {
  try {
    const { evaluationId } = req.params;
    const facultyHeadId = req.user.id;

    // Get programs assigned to this faculty head
    const programs = await Program.find({ facultyHeadId }).select('_id');
    const programIds = programs.map(p => p._id);

    // Get students in these programs
    const students = await User.find({
      'groupAssignment.programId': { $in: programIds },
      role: 'student'
    }).select('_id');

    const studentIds = students.map(s => s._id);

    // Get the specific evaluation
    const evaluation = await FinalEvaluation.findOne({
      _id: evaluationId,
      studentId: { $in: studentIds }
    })
    .populate('studentId', 'name email profile')
    .populate('companyAdviserId', 'name email')
    .populate('universityAdviserId', 'name email');

    if (!evaluation) {
      return res.status(404).json({
        success: false,
        message: 'Final evaluation not found or access denied'
      });
    }

    res.json({
      success: true,
      data: evaluation
    });

  } catch (error) {
    console.error('Error fetching final evaluation:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching final evaluation',
      error: error.message
    });
  }
};

// Approve or reject final evaluation
const reviewFinalEvaluation = async (req, res) => {
  try {
    const { evaluationId } = req.params;
    const { action, reviewNotes } = req.body;
    const facultyHeadId = req.user.id;

    if (!['approved', 'rejected'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be "approved" or "rejected"'
      });
    }

    // Get programs assigned to this faculty head
    const programs = await Program.find({ facultyHeadId }).select('_id');
    const programIds = programs.map(p => p._id);

    // Get students in these programs
    const students = await User.find({
      'groupAssignment.programId': { $in: programIds },
      role: 'student'
    }).select('_id');

    const studentIds = students.map(s => s._id);

    // Find and update the evaluation
    const evaluation = await FinalEvaluation.findOneAndUpdate(
      {
        _id: evaluationId,
        studentId: { $in: studentIds },
        status: { $in: ['submitted', 'reviewed'] }
      },
      {
        status: action,
        reviewedBy: facultyHeadId,
        reviewedAt: new Date(),
        reviewNotes: reviewNotes || '',
        facultyHeadId: facultyHeadId,
        'signatures.facultyHeadName': req.user.name,
        'signatures.facultyHeadSignature': `Reviewed by ${req.user.name} on ${new Date().toLocaleDateString()}`
      },
      { new: true }
    ).populate('studentId', 'name email');

    if (!evaluation) {
      return res.status(404).json({
        success: false,
        message: 'Final evaluation not found or cannot be reviewed'
      });
    }

    // Log the activity
    await ActivityLog.create({
      userId: facultyHeadId,
      action: `${action}_final_evaluation`,
      details: `${action.charAt(0).toUpperCase() + action.slice(1)} final evaluation for student ${evaluation.studentId.name}`,
      metadata: {
        evaluationId: evaluation._id,
        studentId: evaluation.studentId._id,
        studentName: evaluation.studentId.name,
        reviewNotes
      }
    });

    res.json({
      success: true,
      message: `Final evaluation ${action} successfully`,
      data: evaluation
    });

  } catch (error) {
    console.error('Error reviewing final evaluation:', error);
    res.status(500).json({
      success: false,
      message: 'Error reviewing final evaluation',
      error: error.message
    });
  }
};

// Get faculty head dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    const facultyHeadId = req.user.id;

    // Get programs assigned to this faculty head
    const programs = await Program.find({ facultyHeadId }).select('_id name');
    const programIds = programs.map(p => p._id);

    // Get students in these programs
    const students = await User.find({
      'groupAssignment.programId': { $in: programIds },
      role: 'student'
    }).select('_id');

    const studentIds = students.map(s => s._id);

    // Get evaluation statistics
    const totalEvaluations = await FinalEvaluation.countDocuments({
      studentId: { $in: studentIds }
    });

    const pendingEvaluations = await FinalEvaluation.countDocuments({
      studentId: { $in: studentIds },
      status: 'submitted'
    });

    const approvedEvaluations = await FinalEvaluation.countDocuments({
      studentId: { $in: studentIds },
      status: 'approved'
    });

    const rejectedEvaluations = await FinalEvaluation.countDocuments({
      studentId: { $in: studentIds },
      status: 'rejected'
    });

    // Get recent evaluations
    const recentEvaluations = await FinalEvaluation.find({
      studentId: { $in: studentIds },
      status: { $in: ['submitted', 'reviewed'] }
    })
    .populate('studentId', 'name email')
    .sort({ createdAt: -1 })
    .limit(5);

    res.json({
      success: true,
      data: {
        stats: {
          totalPrograms: programs.length,
          totalStudents: students.length,
          totalEvaluations,
          pendingEvaluations,
          approvedEvaluations,
          rejectedEvaluations
        },
        programs,
        recentEvaluations
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics',
      error: error.message
    });
  }
};

// Export evaluations to CSV
const exportEvaluations = async (req, res) => {
  try {
    const facultyHeadId = req.user.id;
    const { format = 'csv', programId, status } = req.query;

    // Get programs assigned to this faculty head
    let programFilter = { facultyHeadId };
    if (programId) {
      programFilter._id = programId;
    }

    const programs = await Program.find(programFilter).select('_id name');
    const programIds = programs.map(p => p._id);

    // Get students in these programs
    const students = await User.find({
      'groupAssignment.programId': { $in: programIds },
      role: 'student'
    }).select('_id name email groupAssignment');

    const studentIds = students.map(s => s._id);

    // Build evaluation filter
    let evaluationFilter = { studentId: { $in: studentIds } };
    if (status) {
      evaluationFilter.status = status;
    }

    // Get evaluations
    const evaluations = await FinalEvaluation.find(evaluationFilter)
      .populate('studentId', 'name email profile')
      .populate('companyAdviserId', 'name email')
      .sort({ createdAt: -1 });

    if (format === 'csv') {
      // Generate CSV content
      const csvHeaders = [
        'Student Name',
        'Email',
        'Program',
        'Company',
        'Company Adviser',
        'Status',
        'General Performance',
        'Personal Skills',
        'Professional Skills',
        'Total Score',
        'Recommendation',
        'Submitted Date',
        'Reviewed Date'
      ];

      const csvRows = evaluations.map(evaluation => {
        const student = students.find(s => s._id.toString() === evaluation.studentId._id.toString());
        const program = programs.find(p => p._id.toString() === student?.groupAssignment?.programId?.toString());

        return [
          evaluation.studentId.name,
          evaluation.studentId.email,
          program?.name || 'N/A',
          evaluation.studentInfo.companyName,
          evaluation.studentInfo.companyAdviser,
          evaluation.status,
          evaluation.finalEvaluation.generalPerformance,
          evaluation.finalEvaluation.personalSkills,
          evaluation.finalEvaluation.professionalSkills,
          evaluation.finalEvaluation.total,
          evaluation.comments.finalRecommendation,
          evaluation.createdAt.toLocaleDateString(),
          evaluation.reviewedAt ? evaluation.reviewedAt.toLocaleDateString() : 'N/A'
        ];
      });

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="final_evaluations_${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvContent);

    } else {
      // Return JSON for other formats or frontend processing
      res.json({
        success: true,
        data: evaluations,
        count: evaluations.length
      });
    }

  } catch (error) {
    console.error('Error exporting evaluations:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting evaluations',
      error: error.message
    });
  }
};

module.exports = {
  getFinalEvaluations,
  getFinalEvaluationById,
  reviewFinalEvaluation,
  getDashboardStats,
  exportEvaluations
};
