const User = require("../models/User");
const FinalEvaluation = require("../models/FinalEvaluation");

// Get Company Adviser's final evaluation data for a specific student
const getFinalEvaluationData = async (req, res) => {
  try {
    const { studentId } = req.params;
    const adviserId = req.user.id;

    // Verify the requesting user is a University Adviser or Company Adviser
    const requester = await User.findById(adviserId);
    if (!requester || (requester.role !== 'universityAdviser' && requester.role !== 'companyAdviser')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only University Advisers and Company Advisers can access this data.'
      });
    }

    // Find the student with full population
    const student = await User.findById(studentId)
      .populate('companyAdviserId', 'name email')
      .populate('universityAdviserId', 'name email')
      .populate({
        path: 'groupAssignment.programId',
        select: 'name description'
      })
      .populate({
        path: 'applications',
        select: 'status preferredStartDate preferredEndDate desiredDuration'
      });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check access based on role
    let hasAccess = false;
    if (requester.role === 'universityAdviser') {
      hasAccess = student.universityAdviserId?.toString() === adviserId.toString();
    } else if (requester.role === 'companyAdviser') {
      hasAccess = student.companyAdviserId?.toString() === adviserId.toString();
    }
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: `Access denied. You are not the assigned ${requester.role === 'universityAdviser' ? 'University' : 'Company'} Adviser for this student.`
      });
    }

    // Find existing final evaluation data
    const existingEvaluation = await FinalEvaluation.findOne({ studentId });

    if (!existingEvaluation) {
      return res.status(404).json({
        success: false,
        message: 'No final evaluation data found for this student'
      });
    }

    res.status(200).json({
      success: true,
      data: existingEvaluation
    });

  } catch (error) {
    console.error('❌ Error fetching final evaluation data:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching final evaluation data',
      error: error.message
    });
  }
};

// Save Company Adviser's final evaluation data (mirrors progress pattern)
const saveFinalEvaluationData = async (req, res) => {
  try {
    const { studentId } = req.params;
    const rawAdviserId = req.user._id || req.user.id;
    const adviserId = rawAdviserId.toString(); // Convert ObjectId to string immediately
    const evaluationData = req.body;

    console.log('🔍 Final Evaluation Save request details:');
    console.log('🔍 Student ID:', studentId);
    console.log('🔍 Raw Adviser ID:', rawAdviserId);
    console.log('🔍 Adviser ID (string):', adviserId);
    console.log('🔍 Adviser ID type:', typeof adviserId);
    console.log('🔍 Evaluation Data Keys:', Object.keys(evaluationData));

    // Verify the requesting user is a Company Adviser
    const requester = await User.findById(adviserId);
    
    if (!requester || requester.role !== 'companyAdviser') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only Company Advisers can save final evaluation data.'
      });
    }

    // Find the student
    const student = await User.findById(studentId)
      .populate('universityAdviserId', 'name email')
      .populate('facultyHeadId', 'name email')
      .populate('groupAssignment.programId', 'name description');
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check adviser linkage - using robust logic from progress controller
    let studentCompanyAdviserId;
    
    // Extract ID from nested object or use ObjectId directly
    if (student.companyAdviserId) {
      if (student.companyAdviserId._id) {
        // Case: nested object with _id field
        studentCompanyAdviserId = student.companyAdviserId._id.toString();
      } else {
        // Case: direct ObjectId reference
        studentCompanyAdviserId = student.companyAdviserId.toString();
      }
    }
    
    const requestingAdviserId = adviserId; // Already converted to string above
    
    console.log('🔍 Company Adviser ID Comparison (Final Evaluation):');
    console.log('  - Student companyAdviserId raw:', student.companyAdviserId);
    console.log('  - Student companyAdviserId (extracted):', studentCompanyAdviserId);
    console.log('  - Requesting adviserId (string):', requestingAdviserId);
    console.log('  - Types:', typeof studentCompanyAdviserId, 'vs', typeof requestingAdviserId);
    
    if (studentCompanyAdviserId !== requestingAdviserId) {
      console.log('❌ ACCESS DENIED - Company Adviser not linked to student');
      console.log('  - Expected:', requestingAdviserId);
      console.log('  - Found:', studentCompanyAdviserId);
      
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not the assigned Company Adviser for this student.',
        debug: {
          requestingAdviserId: requestingAdviserId,
          studentCompanyAdviserId: studentCompanyAdviserId,
          studentName: student.name
        }
      });
    }
    
    console.log('✅ ACCESS GRANTED - Company Adviser ID match for final evaluation');

    // Create new final evaluation record with proper field mapping
    const finalEvaluationRecord = new FinalEvaluation({
      studentId: studentId,
      companyAdviserId: rawAdviserId, // Use original ObjectId for database operations
      universityAdviserId: student.universityAdviserId?._id || student.universityAdviserId,
      facultyHeadId: student.facultyHeadId?._id || student.facultyHeadId,
      
      // Student Information
      studentInfo: {
        fullName: evaluationData.studentInfo?.fullName || student.name,
        university: evaluationData.studentInfo?.university || student.university_name || 'Not Specified',
        department: evaluationData.studentInfo?.department || student.groupAssignment?.programId?.name || 'Not Specified',
        companyName: evaluationData.studentInfo?.companyName || 'Not Specified',
        companyAdviser: evaluationData.studentInfo?.companyAdviser || requester.name,
        universityAdviser: evaluationData.studentInfo?.universityAdviser || student.universityAdviserId?.name || 'Not Assigned',
        internshipStartDate: evaluationData.studentInfo?.internshipStartDate || new Date(),
        internshipEndDate: evaluationData.studentInfo?.internshipEndDate || new Date()
      },
      
      // Attendance Data (save exact values + weeks format for compatibility)
      attendance: {
        // Save exact values from Company Adviser
        totalDays: evaluationData.attendance?.totalDays || 0,
        presentDays: evaluationData.attendance?.presentDays || 0,
        absentDays: evaluationData.attendance?.absentDays || 0,
        excusedDays: evaluationData.attendance?.excusedDays || 0,
        lateDays: evaluationData.attendance?.lateDays || 0,
        attendancePercentage: evaluationData.attendance?.attendancePercentage || 0,
        records: evaluationData.attendance?.records || [],
        
        // Legacy weeks format for backward compatibility
        weeks: evaluationData.attendance?.records?.map((record, index) => ({
          weekNumber: index + 1,
          monday: record.status === 'Present' ? 'present' : 'absent',
          tuesday: record.status === 'Present' ? 'present' : 'absent',
          wednesday: record.status === 'Present' ? 'present' : 'absent',
          thursday: record.status === 'Present' ? 'present' : 'absent',
          friday: record.status === 'Present' ? 'present' : 'absent',
          absentDays: record.status === 'Present' ? 0 : 1,
          supervisorSignature: ''
        })) || [],
        totalAbsentDays: evaluationData.attendance?.absentDays || 0
      },
      
      // Evaluation Criteria (direct mapping with fallbacks)
      evaluationCriteria: {
        // General Performance (25%)
        punctuality: evaluationData.evaluationCriteria?.punctuality || 3,
        reliability: evaluationData.evaluationCriteria?.reliability || 3,
        independence: evaluationData.evaluationCriteria?.independence || 3,
        communication: evaluationData.evaluationCriteria?.communication || 3,
        professionalism: evaluationData.evaluationCriteria?.professionalism || 3,
        
        // Personal Skills (25%)
        speedOfWork: evaluationData.evaluationCriteria?.speedOfWork || 3,
        accuracy: evaluationData.evaluationCriteria?.accuracy || 3,
        engagement: evaluationData.evaluationCriteria?.engagement || 3,
        cooperation: evaluationData.evaluationCriteria?.cooperation || 3,
        recommendation: evaluationData.evaluationCriteria?.recommendation || 3,
        
        // Professional Skills (50%)
        technicalKnowledge: evaluationData.evaluationCriteria?.technicalKnowledge || 3,
        problemSolving: evaluationData.evaluationCriteria?.problemSolving || 3,
        organizing: evaluationData.evaluationCriteria?.organizing || 3,
        responsibility: evaluationData.evaluationCriteria?.responsibility || 3,
        initiative: evaluationData.evaluationCriteria?.initiative || 3
      },
      
      // Supervisor Evaluation (legacy fields - map from evaluationCriteria)
      supervisorEvaluation: {
        dependability: evaluationData.evaluationCriteria?.reliability || 3,
        technicalCompetence: evaluationData.evaluationCriteria?.technicalKnowledge || 3,
        teamwork: evaluationData.evaluationCriteria?.cooperation || 3,
        communication: evaluationData.evaluationCriteria?.communication || 3,
        initiative: evaluationData.evaluationCriteria?.initiative || 3,
        problemSolving: evaluationData.evaluationCriteria?.problemSolving || 3,
        timeManagement: evaluationData.evaluationCriteria?.speedOfWork || 3,
        adaptability: evaluationData.evaluationCriteria?.engagement || 3,
        leadership: evaluationData.evaluationCriteria?.initiative || 3,
        workEthic: evaluationData.evaluationCriteria?.professionalism || 3
      },
      
      // Final Evaluation (weighted scores with proper percentage calculation)
      finalEvaluation: {
        generalPerformance: evaluationData.weightedScore?.generalPerformance || 
          Math.min(25, ((evaluationData.evaluationCriteria?.punctuality || 3) + 
           (evaluationData.evaluationCriteria?.reliability || 3) + 
           (evaluationData.evaluationCriteria?.independence || 3) + 
           (evaluationData.evaluationCriteria?.communication || 3) + 
           (evaluationData.evaluationCriteria?.professionalism || 3)) / 5 * 25), // 25% max
        personalSkills: evaluationData.weightedScore?.personalSkills || 
          Math.min(25, ((evaluationData.evaluationCriteria?.speedOfWork || 3) + 
           (evaluationData.evaluationCriteria?.accuracy || 3) + 
           (evaluationData.evaluationCriteria?.engagement || 3) + 
           (evaluationData.evaluationCriteria?.cooperation || 3) + 
           (evaluationData.evaluationCriteria?.recommendation || 3)) / 5 * 25), // 25% max
        professionalSkills: evaluationData.weightedScore?.professionalSkills || 
          Math.min(50, ((evaluationData.evaluationCriteria?.technicalKnowledge || 3) + 
           (evaluationData.evaluationCriteria?.problemSolving || 3) + 
           (evaluationData.evaluationCriteria?.organizing || 3) + 
           (evaluationData.evaluationCriteria?.responsibility || 3) + 
           (evaluationData.evaluationCriteria?.initiative || 3)) / 5 * 50), // 50% max
        total: Math.min(100, evaluationData.totalScore || evaluationData.weightedScore || 75)
      },
      
      // Supporting Documents (save uploaded files to database)
      supportingDocuments: evaluationData.supportingDocuments || [],
      
      // Signatures (keep original structure)
      signatures: evaluationData.signatures || {
        studentSignature: '',
        companyAdviserSignature: '',
        universityAdviserSignature: '',
        facultyHeadSignature: '',
        studentSignatureDate: null,
        companyAdviserSignatureDate: null,
        universityAdviserSignatureDate: null,
        facultyHeadSignatureDate: null
      },
      
      // Comments (map from supervisorFeedback)
      comments: {
        majorStrengths: evaluationData.supervisorFeedback?.strengths || 'Good performance overall',
        areasOfImprovement: evaluationData.supervisorFeedback?.areasForImprovement || 'Continue developing skills',
        finalRecommendation: evaluationData.supervisorFeedback?.overallRecommendation || 'Continue'
      },
      
      // Supervisor Feedback (keep original structure)
      supervisorFeedback: {
        strengths: evaluationData.supervisorFeedback?.strengths || '',
        areasForImprovement: evaluationData.supervisorFeedback?.areasForImprovement || '',
        overallRecommendation: evaluationData.supervisorFeedback?.overallRecommendation || '',
        finalRemarks: evaluationData.supervisorFeedback?.finalRemarks || ''
      }
    });

    console.log('💾 Saving final evaluation record...');
    const savedEvaluation = await finalEvaluationRecord.save();
    console.log('✅ Final evaluation saved successfully:', savedEvaluation._id);

    // Send notifications (using the notification controller)
    const { notify } = require("./notificationController");
    
    if (student.universityAdviserId) {
      await notify(req, student.universityAdviserId, "Final Evaluation Submitted", 
        `Final evaluation has been submitted for student ${student.name}`, savedEvaluation._id, "Evaluation");
    }
    
    if (student.facultyHeadId) {
      await notify(req, student.facultyHeadId, "Final Evaluation Submitted", 
        `Final evaluation has been submitted for student ${student.name}`, savedEvaluation._id, "Evaluation");
    }

    res.status(200).json({
      success: true,
      message: 'Final evaluation data saved successfully',
      data: {
        studentId,
        evaluationId: savedEvaluation._id,
        lastUpdated: savedEvaluation.lastUpdated
      }
    });

  } catch (error) {
    console.error('❌ Error saving Company Adviser final evaluation data:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error while saving final evaluation data',
      error: error.message
    });
  }
};

module.exports = {
  getFinalEvaluationData,
  saveFinalEvaluationData
};
