// Fixed createFinalEvaluation function with proper data structure
const createFinalEvaluation = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const userRole = req.user.role;
    
    console.log('🚀 BACKEND CREATE FINAL EVALUATION STARTED');
    console.log('👤 User Info:', {
      userId: currentUserId.toString(),
      userRole: userRole,
      userName: req.user.name
    });
    
    // Handle FormData - parse evaluationData from form field
    console.log('🔍 RAW REQUEST ANALYSIS:', {
      hasBody: !!req.body,
      hasEvaluationData: !!req.body.evaluationData,
      bodyKeys: Object.keys(req.body || {}),
      evaluationDataType: typeof req.body.evaluationData,
      evaluationDataLength: req.body.evaluationData?.length,
      hasFiles: !!req.files,
      filesCount: req.files?.length || 0
    });
    
    if (!req.body.evaluationData) {
      console.log('❌ MISSING EVALUATION DATA in request body');
      return res.status(400).json({ success: false, message: "Evaluation data is required" });
    }
    
    let frontendData;
    try {
      frontendData = JSON.parse(req.body.evaluationData);
      console.log('✅ SUCCESSFULLY PARSED FRONTEND DATA');
    } catch (parseError) {
      console.log('❌ JSON PARSE ERROR:', parseError.message);
      return res.status(400).json({ success: false, message: "Invalid evaluation data format" });
    }
    
    console.log('🔍 PARSED FRONTEND DATA STRUCTURE:', {
      hasStudentId: !!frontendData.studentId,
      studentId: frontendData.studentId,
      hasEvaluationCriteria: !!frontendData.evaluationCriteria,
      hasSupervisorFeedback: !!frontendData.supervisorFeedback,
      hasStudentInfo: !!frontendData.studentInfo,
      hasAttendance: !!frontendData.attendance,
      hasSignatures: !!frontendData.signatures,
      status: frontendData.status,
      totalScore: frontendData.totalScore,
      finalGrade: frontendData.finalGrade,
      dataKeys: Object.keys(frontendData)
    });
    
    // Handle file uploads
    const attachments = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        const relativePath = file.path.replace(process.cwd() + '\\', '').replace(/\\/g, '/');
        attachments.push({
          filename: file.filename,
          originalName: file.originalname,
          filePath: relativePath,
          size: file.size,
          mimetype: file.mimetype,
          uploadDate: new Date(),
          uploadedBy: req.user.role
        });
      });
    }

    // Verify student exists and user has access
    const student = await User.findById(frontendData.studentId)
      .populate('universityAdviserId', 'name email')
      .populate('facultyHeadId', 'name email')
      .populate('companyAdviserId', 'name email')
      .populate('groupAssignment.programId', 'name description');

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    // Check if evaluation already exists
    const existingEvaluation = await FinalEvaluation.findOne({ studentId: frontendData.studentId });
    if (existingEvaluation) {
      console.log('⚠️ EVALUATION ALREADY EXISTS - Redirecting to update');
      return res.status(409).json({ 
        success: false, 
        message: "Evaluation already exists. Use update endpoint instead.",
        evaluationId: existingEvaluation._id 
      });
    }
    
    console.log('✨ NO EXISTING EVALUATION - Creating new one');

    // Transform frontend data structure to match backend model
    const evaluationData = {
      studentId: frontendData.studentId,
      companyAdviserId: currentUserId,
      universityAdviserId: student.universityAdviserId || currentUserId,
      facultyHeadId: student.facultyHeadId,
      
      // Student Information - convert string dates to Date objects
      studentInfo: {
        fullName: student.name || frontendData.studentInfo?.fullName || 'Student Name',
        university: student.university_name || frontendData.studentInfo?.university || 'University Name',
        department: student.groupAssignment?.programId?.name || frontendData.studentInfo?.department || 'Department Name',
        companyName: frontendData.studentInfo?.companyName || 'Company Name',
        companyAdviser: req.user.name || frontendData.studentInfo?.companyAdviser || 'Company Adviser',
        universityAdviser: student.universityAdviserId?.name || frontendData.studentInfo?.universityAdviser || 'University Adviser',
        internshipStartDate: frontendData.studentInfo?.internshipStartDate ? new Date(frontendData.studentInfo.internshipStartDate) : new Date(),
        internshipEndDate: frontendData.studentInfo?.internshipEndDate ? new Date(frontendData.studentInfo.internshipEndDate) : new Date(),
      },

      // Include evaluationCriteria for Faculty Head viewing - ensure all fields are valid numbers (1-5)
      evaluationCriteria: {
        punctuality: Math.max(1, Math.min(5, frontendData.evaluationCriteria?.punctuality || 3)),
        reliability: Math.max(1, Math.min(5, frontendData.evaluationCriteria?.reliability || 3)),
        independence: Math.max(1, Math.min(5, frontendData.evaluationCriteria?.independence || 3)),
        communication: Math.max(1, Math.min(5, frontendData.evaluationCriteria?.communication || 3)),
        professionalism: Math.max(1, Math.min(5, frontendData.evaluationCriteria?.professionalism || 3)),
        speedOfWork: Math.max(1, Math.min(5, frontendData.evaluationCriteria?.speedOfWork || 3)),
        accuracy: Math.max(1, Math.min(5, frontendData.evaluationCriteria?.accuracy || 3)),
        engagement: Math.max(1, Math.min(5, frontendData.evaluationCriteria?.engagement || 3)),
        cooperation: Math.max(1, Math.min(5, frontendData.evaluationCriteria?.cooperation || 3)),
        recommendation: Math.max(1, Math.min(5, frontendData.evaluationCriteria?.recommendation || 3)),
        technicalKnowledge: Math.max(1, Math.min(5, frontendData.evaluationCriteria?.technicalKnowledge || 3)),
        problemSolving: Math.max(1, Math.min(5, frontendData.evaluationCriteria?.problemSolving || 3)),
        organizing: Math.max(1, Math.min(5, frontendData.evaluationCriteria?.organizing || 3)),
        responsibility: Math.max(1, Math.min(5, frontendData.evaluationCriteria?.responsibility || 3)),
        initiative: Math.max(1, Math.min(5, frontendData.evaluationCriteria?.initiative || 3)),
      },

      // Transform evaluationCriteria to supervisorEvaluation - ALL required fields populated with valid range 1-5
      supervisorEvaluation: {
        dependability: Math.max(1, Math.min(5, frontendData.evaluationCriteria?.reliability || 3)),
        technicalCompetence: Math.max(1, Math.min(5, frontendData.evaluationCriteria?.technicalKnowledge || 3)),
        teamwork: Math.max(1, Math.min(5, frontendData.evaluationCriteria?.cooperation || 3)),
        communication: Math.max(1, Math.min(5, frontendData.evaluationCriteria?.communication || 3)),
        initiative: Math.max(1, Math.min(5, frontendData.evaluationCriteria?.initiative || 3)),
        problemSolving: Math.max(1, Math.min(5, frontendData.evaluationCriteria?.problemSolving || 3)),
        timeManagement: Math.max(1, Math.min(5, frontendData.evaluationCriteria?.punctuality || 3)),
        adaptability: Math.max(1, Math.min(5, frontendData.evaluationCriteria?.independence || 3)),
        leadership: Math.max(1, Math.min(5, frontendData.evaluationCriteria?.initiative || 3)),
        workEthic: Math.max(1, Math.min(5, frontendData.evaluationCriteria?.professionalism || 3)),
      },

      // Include supervisorFeedback for Faculty Head viewing
      supervisorFeedback: {
        strengths: frontendData.supervisorFeedback?.strengths || 'No specific strengths noted',
        areasForImprovement: frontendData.supervisorFeedback?.areasForImprovement || 'No specific areas for improvement noted',
        overallRecommendation: frontendData.supervisorFeedback?.overallRecommendation || 'Continue',
        finalRemarks: frontendData.supervisorFeedback?.finalRemarks || 'No additional remarks'
      },

      // Final Evaluation (Weighted Percentage)
      finalEvaluation: {
        generalPerformance: Math.round(((frontendData.evaluationCriteria?.punctuality || 3) + 
                                      (frontendData.evaluationCriteria?.reliability || 3) + 
                                      (frontendData.evaluationCriteria?.independence || 3) + 
                                      (frontendData.evaluationCriteria?.communication || 3) + 
                                      (frontendData.evaluationCriteria?.professionalism || 3)) / 5 * 5), // 0-25
        personalSkills: Math.round(((frontendData.evaluationCriteria?.speedOfWork || 3) + 
                                   (frontendData.evaluationCriteria?.accuracy || 3) + 
                                   (frontendData.evaluationCriteria?.engagement || 3) + 
                                   (frontendData.evaluationCriteria?.cooperation || 3) + 
                                   (frontendData.evaluationCriteria?.recommendation || 3)) / 5 * 5), // 0-25
        professionalSkills: Math.round(((frontendData.evaluationCriteria?.technicalKnowledge || 3) + 
                                       (frontendData.evaluationCriteria?.problemSolving || 3) + 
                                       (frontendData.evaluationCriteria?.organizing || 3) + 
                                       (frontendData.evaluationCriteria?.responsibility || 3) + 
                                       (frontendData.evaluationCriteria?.initiative || 3)) / 5 * 10), // 0-50
        total: 0 // Will be calculated below
      },

      // Transform supervisorFeedback to comments - ensure required fields are populated
      comments: {
        majorStrengths: frontendData.supervisorFeedback?.strengths || 'No specific strengths noted',
        areasOfImprovement: frontendData.supervisorFeedback?.areasForImprovement || 'No specific areas for improvement noted',
        finalRecommendation: frontendData.supervisorFeedback?.overallRecommendation === 'Not Recommended' ? 'Not Recommended' : 'Continue',
      },

      // Signatures - ensure required fields are populated
      signatures: {
        companyAdviserName: req.user.name || frontendData.signatures?.companyAdviser?.name || 'Company Adviser Name',
        companyAdviserSignature: frontendData.signatures?.companyAdviser?.signature || '',
        universityAdviserName: student.universityAdviserId?.name || frontendData.signatures?.universityAdviser?.name || 'University Adviser Name',
        universityAdviserSignature: frontendData.signatures?.universityAdviser?.signature || '',
        companyStamp: frontendData.signatures?.companyStamp || '',
        facultyHeadSignature: frontendData.signatures?.facultyHead?.signature || '',
        facultyHeadName: student.facultyHeadId?.name || frontendData.signatures?.facultyHead?.name || 'Faculty Head Name',
      },

      // Attendance (if provided)
      attendance: {
        weeks: frontendData.attendance?.records?.map((record, index) => ({
          weekNumber: index + 1,
          monday: record.monday || 'present',
          tuesday: record.tuesday || 'present',
          wednesday: record.wednesday || 'present',
          thursday: record.thursday || 'present',
          friday: record.friday || 'present',
          absentDays: Object.values(record).filter(day => day === 'absent').length,
          supervisorSignature: ''
        })) || [],
        totalAbsentDays: frontendData.attendance?.records?.reduce((total, record) => 
          total + Object.values(record).filter(day => day === 'absent').length, 0) || 0
      },

      // Status and attachments
      status: frontendData.status || 'draft',
      attachments: attachments
    };

    // Calculate total score
    evaluationData.finalEvaluation.total = 
      evaluationData.finalEvaluation.generalPerformance + 
      evaluationData.finalEvaluation.personalSkills + 
      evaluationData.finalEvaluation.professionalSkills;

    console.log('🔄 TRANSFORMED DATA:', {
      studentInfo: !!evaluationData.studentInfo,
      evaluationCriteria: !!evaluationData.evaluationCriteria,
      supervisorFeedback: !!evaluationData.supervisorFeedback,
      supervisorEvaluation: !!evaluationData.supervisorEvaluation,
      finalEvaluation: evaluationData.finalEvaluation,
      comments: !!evaluationData.comments,
      signatures: !!evaluationData.signatures,
      attachments: evaluationData.attachments?.length || 0
    });

    console.log('💾 ATTEMPTING TO SAVE TO MONGODB');
    const evaluation = await FinalEvaluation.create(evaluationData);
    console.log('✅ FinalEvaluation.create() COMPLETED SUCCESSFULLY');
    
    // Notify relevant parties
    if (student.universityAdviserId) {
      await notify(req, student.universityAdviserId, "Final Evaluation Created", 
        `Final evaluation has been created for student ${student.name}`, evaluation._id, "Evaluation");
    }
    
    if (student.facultyHeadId) {
      await notify(req, student.facultyHeadId, "Final Evaluation Created", 
        `Final evaluation has been created for student ${student.name}`, evaluation._id, "Evaluation");
    }

    console.log('📤 PREPARING BACKEND RESPONSE');
    const responseData = { success: true, data: { evaluation } };
    console.log('🔍 FULL RESPONSE DATA:', JSON.stringify(responseData, null, 2));
    
    console.log('✅ SENDING 201 RESPONSE TO FRONTEND');
    res.status(201).json(responseData);
  } catch (error) {
    console.error('🚨 BACKEND ERROR CAUGHT:', error);
    console.error('📊 Error Type:', error.constructor.name);
    console.error('📊 Error Message:', error.message);
    console.error('📊 Error Stack:', error.stack);
    
    if (error.name === 'ValidationError') {
      console.error('🚨 MONGOOSE VALIDATION ERROR:', {
        errorName: error.name,
        errorMessage: error.message,
        errorPaths: Object.keys(error.errors),
        fullErrors: error.errors
      });
      
      const validationErrors = Object.values(error.errors).map(err => {
        if (err.kind === 'enum') {
          return `${err.path}: "${err.value}" is not valid. Allowed values: ${err.properties.enumValues.join(', ')}`;
        }
        return err.message;
      });
      
      console.error('📊 Formatted Validation Errors:', validationErrors);
      
      const errorResponse = { 
        success: false, 
        message: "Validation failed",
        errors: validationErrors,
        details: error.message
      };
      
      console.log('📤 SENDING VALIDATION ERROR RESPONSE:', errorResponse);
      return res.status(400).json(errorResponse);
    }
    
    if (error.name === 'CastError') {
      console.error('🚨 MONGOOSE CAST ERROR:', {
        path: error.path,
        value: error.value,
        kind: error.kind,
        message: error.message
      });
      
      const errorResponse = {
        success: false,
        message: `Invalid ${error.path}: ${error.value}`,
        details: error.message
      };
      
      console.log('📤 SENDING CAST ERROR RESPONSE:', errorResponse);
      return res.status(400).json(errorResponse);
    }
    
    // Generic server error
    console.error('🚨 GENERIC SERVER ERROR:', {
      message: error.message,
      stack: error.stack
    });
    
    const errorResponse = {
      success: false,
      message: "Internal server error occurred while creating evaluation",
      details: error.message
    };
    
    console.log('📤 SENDING GENERIC ERROR RESPONSE:', errorResponse);
    res.status(500).json(errorResponse);
  }
};

module.exports = { createFinalEvaluation };
