const User = require("../models/User");
const FinalEvaluation = require("../models/FinalEvaluation");
const { notify } = require("./notificationController");

// Create final evaluation (mirrors progress pattern - simple JSON)
const createFinalEvaluationProgress = async (req, res) => {
  try {
    const { studentId } = req.params;
    const adviserId = req.user._id || req.user.id;
    const evaluationData = req.body;

    console.log('🔍 Create Final Evaluation Progress - Request details:');
    console.log('🔍 Student ID:', studentId);
    console.log('🔍 Adviser ID:', adviserId);
    console.log('🔍 User from token:', req.user);

    // Verify the requesting user is a Company Adviser
    const requester = await User.findById(adviserId);
    console.log('🔍 Requester found:', requester ? { id: requester._id, role: requester.role, email: requester.email } : 'NOT FOUND');
    
    if (!requester || requester.role !== 'companyAdviser') {
      console.log('❌ Access denied - not a Company Adviser');
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only Company Advisers can create final evaluations.'
      });
    }

    // Find the student
    const student = await User.findById(studentId)
      .populate('universityAdviserId', 'name email')
      .populate('facultyHeadId', 'name email')
      .populate('groupAssignment.programId', 'name description');
    
    console.log('🔍 Student found:', student ? { id: student._id, email: student.email, companyAdviserId: student.companyAdviserId } : 'NOT FOUND');
    
    if (!student) {
      console.log('❌ Student not found');
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check adviser linkage
    console.log('🔍 Checking adviser linkage:');
    console.log('🔍 Student companyAdviserId:', student.companyAdviserId?.toString());
    console.log('🔍 Current adviserId:', adviserId);
    console.log('🔍 Match?', student.companyAdviserId?.toString() === adviserId);
    
    if (student.companyAdviserId?.toString() !== adviserId) {
      console.log('❌ Access denied - Company Adviser not linked to student');
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not the assigned Company Adviser for this student.'
      });
    }

    // Debug: Log the incoming evaluation data
    console.log('📊 Incoming evaluation data from Company Adviser:', JSON.stringify(evaluationData, null, 2));
    
    // Transform frontend data to match FinalEvaluation model
    const transformedData = {
      studentId: studentId,
      companyAdviserId: adviserId,
      universityAdviserId: student.universityAdviserId?._id || student.universityAdviserId,
      facultyHeadId: student.facultyHeadId?._id || student.facultyHeadId,
      
      // Student Information
      studentInfo: {
        fullName: student.name || evaluationData.studentInfo?.fullName || 'Student Name',
        university: student.university_name || evaluationData.studentInfo?.university || 'University Name',
        department: student.groupAssignment?.programId?.name || evaluationData.studentInfo?.department || 'Department Name',
        companyName: evaluationData.studentInfo?.companyName || 'Company Name',
        companyAdviser: req.user.name || evaluationData.studentInfo?.companyAdviser || 'Company Adviser',
        universityAdviser: student.universityAdviserId?.name || evaluationData.studentInfo?.universityAdviser || 'University Adviser',
        internshipStartDate: evaluationData.studentInfo?.internshipStartDate ? new Date(evaluationData.studentInfo.internshipStartDate) : new Date(),
        internshipEndDate: evaluationData.studentInfo?.internshipEndDate ? new Date(evaluationData.studentInfo.internshipEndDate) : new Date(),
      },

      // Evaluation Criteria
      evaluationCriteria: {
        punctuality: Math.max(1, Math.min(5, evaluationData.evaluationCriteria?.punctuality || 3)),
        reliability: Math.max(1, Math.min(5, evaluationData.evaluationCriteria?.reliability || 3)),
        independence: Math.max(1, Math.min(5, evaluationData.evaluationCriteria?.independence || 3)),
        communication: Math.max(1, Math.min(5, evaluationData.evaluationCriteria?.communication || 3)),
        professionalism: Math.max(1, Math.min(5, evaluationData.evaluationCriteria?.professionalism || 3)),
        speedOfWork: Math.max(1, Math.min(5, evaluationData.evaluationCriteria?.speedOfWork || 3)),
        accuracy: Math.max(1, Math.min(5, evaluationData.evaluationCriteria?.accuracy || 3)),
        engagement: Math.max(1, Math.min(5, evaluationData.evaluationCriteria?.engagement || 3)),
        cooperation: Math.max(1, Math.min(5, evaluationData.evaluationCriteria?.cooperation || 3)),
        recommendation: Math.max(1, Math.min(5, evaluationData.evaluationCriteria?.recommendation || 3)),
        technicalKnowledge: Math.max(1, Math.min(5, evaluationData.evaluationCriteria?.technicalKnowledge || 3)),
        problemSolving: Math.max(1, Math.min(5, evaluationData.evaluationCriteria?.problemSolving || 3)),
        organizing: Math.max(1, Math.min(5, evaluationData.evaluationCriteria?.organizing || 3)),
        responsibility: Math.max(1, Math.min(5, evaluationData.evaluationCriteria?.responsibility || 3)),
        initiative: Math.max(1, Math.min(5, evaluationData.evaluationCriteria?.initiative || 3)),
      },

      // Supervisor Evaluation
      supervisorEvaluation: {
        dependability: Math.max(1, Math.min(5, evaluationData.evaluationCriteria?.reliability || 3)),
        technicalCompetence: Math.max(1, Math.min(5, evaluationData.evaluationCriteria?.technicalKnowledge || 3)),
        teamwork: Math.max(1, Math.min(5, evaluationData.evaluationCriteria?.cooperation || 3)),
        communication: Math.max(1, Math.min(5, evaluationData.evaluationCriteria?.communication || 3)),
        initiative: Math.max(1, Math.min(5, evaluationData.evaluationCriteria?.initiative || 3)),
        problemSolving: Math.max(1, Math.min(5, evaluationData.evaluationCriteria?.problemSolving || 3)),
        timeManagement: Math.max(1, Math.min(5, evaluationData.evaluationCriteria?.punctuality || 3)),
        adaptability: Math.max(1, Math.min(5, evaluationData.evaluationCriteria?.independence || 3)),
        leadership: Math.max(1, Math.min(5, evaluationData.evaluationCriteria?.initiative || 3)),
        workEthic: Math.max(1, Math.min(5, evaluationData.evaluationCriteria?.professionalism || 3)),
      },

      // Supervisor Feedback
      supervisorFeedback: {
        strengths: evaluationData.supervisorFeedback?.strengths || 'No specific strengths noted',
        areasForImprovement: evaluationData.supervisorFeedback?.areasForImprovement || 'No specific areas for improvement noted',
        overallRecommendation: evaluationData.supervisorFeedback?.overallRecommendation || 'Continue',
        finalRemarks: evaluationData.supervisorFeedback?.finalRemarks || 'No additional remarks'
      },

      // Comments
      comments: {
        majorStrengths: evaluationData.supervisorFeedback?.strengths || 'No specific strengths noted',
        areasOfImprovement: evaluationData.supervisorFeedback?.areasForImprovement || 'No specific areas for improvement noted',
        finalRecommendation: evaluationData.supervisorFeedback?.overallRecommendation === 'Not Recommended' ? 'Not Recommended' : 'Continue',
      },

      // Signatures
      signatures: {
        companyAdviserName: req.user.name || evaluationData.signatures?.companyAdviser?.name || 'Company Adviser Name',
        companyAdviserSignature: evaluationData.signatures?.companyAdviser?.signature || '',
        universityAdviserName: student.universityAdviserId?.name || evaluationData.signatures?.universityAdviser?.name || 'University Adviser Name',
        universityAdviserSignature: evaluationData.signatures?.universityAdviser?.signature || '',
        companyStamp: evaluationData.signatures?.companyStamp || '',
        facultyHeadSignature: evaluationData.signatures?.facultyHead?.signature || '',
        facultyHeadName: student.facultyHeadId?.name || evaluationData.signatures?.facultyHead?.name || 'Faculty Head Name',
      },

      // Attendance
      attendance: {
        weeks: evaluationData.attendance?.records?.map((record, index) => ({
          weekNumber: index + 1,
          monday: record.monday || 'present',
          tuesday: record.tuesday || 'present',
          wednesday: record.wednesday || 'present',
          thursday: record.thursday || 'present',
          friday: record.friday || 'present',
          absentDays: record.absentDays || 0,
          supervisorSignature: record.supervisorSignature || '',
        })) || [],
        totalAbsentDays: evaluationData.attendance?.absentDays || 0,
      },

      status: evaluationData.status || 'draft',
      totalScore: evaluationData.totalScore || 0,
      finalGrade: evaluationData.finalGrade || 'B',
      lastUpdated: new Date()
    };

    // Calculate final evaluation scores
    transformedData.finalEvaluation = {
      generalPerformance: Math.round(((transformedData.evaluationCriteria.punctuality + 
                                    transformedData.evaluationCriteria.reliability + 
                                    transformedData.evaluationCriteria.independence + 
                                    transformedData.evaluationCriteria.communication + 
                                    transformedData.evaluationCriteria.professionalism) / 5) * 5),
      personalSkills: Math.round(((transformedData.evaluationCriteria.speedOfWork + 
                                 transformedData.evaluationCriteria.accuracy + 
                                 transformedData.evaluationCriteria.engagement + 
                                 transformedData.evaluationCriteria.cooperation + 
                                 transformedData.evaluationCriteria.recommendation) / 5) * 5),
      professionalSkills: Math.round(((transformedData.evaluationCriteria.technicalKnowledge + 
                                     transformedData.evaluationCriteria.problemSolving + 
                                     transformedData.evaluationCriteria.organizing + 
                                     transformedData.evaluationCriteria.responsibility + 
                                     transformedData.evaluationCriteria.initiative) / 5) * 10),
      total: 0
    };

    transformedData.finalEvaluation.total = 
      transformedData.finalEvaluation.generalPerformance + 
      transformedData.finalEvaluation.personalSkills + 
      transformedData.finalEvaluation.professionalSkills;

    console.log('💾 Attempting to save to database...');
    
    // Save or update the evaluation data in the database - PERMANENT PERSISTENCE
    const savedEvaluation = await FinalEvaluation.findOneAndUpdate(
      { studentId, companyAdviserId: adviserId },
      { 
        $set: {
          ...transformedData, 
          studentId,
          companyAdviserId: adviserId,
          lastUpdated: new Date()
        }
      },
      { 
        upsert: true, 
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true
      }
    );
    
    console.log('✅ Database save successful');

    // Verify the data was actually saved
    const verifyData = await FinalEvaluation.findOne({ studentId, companyAdviserId: adviserId });
    console.log('✅ Data verification - saved to database:', {
      id: verifyData._id,
      hasEvaluationCriteria: !!verifyData.evaluationCriteria,
      hasSupervisorFeedback: !!verifyData.supervisorFeedback,
      status: verifyData.status,
      lastUpdated: verifyData.lastUpdated
    });

    // Notify relevant parties
    if (student.universityAdviserId) {
      await notify(req, student.universityAdviserId, "Final Evaluation Created", 
        `Final evaluation has been created for student ${student.name}`, savedEvaluation._id, "Evaluation");
    }
    
    if (student.facultyHeadId) {
      await notify(req, student.facultyHeadId, "Final Evaluation Created", 
        `Final evaluation has been created for student ${student.name}`, savedEvaluation._id, "Evaluation");
    }

    res.status(200).json({
      success: true,
      message: 'Final evaluation saved successfully',
      data: {
        studentId,
        evaluationId: savedEvaluation._id,
        lastUpdated: savedEvaluation.lastUpdated
      }
    });

  } catch (error) {
    console.error('❌ Error saving Company Adviser final evaluation:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error while saving final evaluation',
      error: error.message
    });
  }
};

// Update final evaluation (mirrors progress pattern - simple JSON)
const updateFinalEvaluationProgress = async (req, res) => {
  try {
    const { studentId } = req.params;
    const adviserId = req.user._id || req.user.id;
    const evaluationData = req.body;

    console.log('🔍 Update Final Evaluation Progress - Request details:');
    console.log('🔍 Student ID:', studentId);
    console.log('🔍 Adviser ID:', adviserId);

    // Verify the requesting user is a Company Adviser
    const requester = await User.findById(adviserId);
    
    if (!requester || requester.role !== 'companyAdviser') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only Company Advisers can update final evaluations.'
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

    // Check adviser linkage
    if (student.companyAdviserId?.toString() !== adviserId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not the assigned Company Adviser for this student.'
      });
    }

    // Transform frontend data to match FinalEvaluation model
    const transformedData = {
      studentId: studentId,
      companyAdviserId: adviserId,
      universityAdviserId: student.universityAdviserId?._id || student.universityAdviserId,
      facultyHeadId: student.facultyHeadId?._id || student.facultyHeadId,
      
      // Student Information
      studentInfo: {
        fullName: student.name || evaluationData.studentInfo?.fullName || 'Student Name',
        university: student.university_name || evaluationData.studentInfo?.university || 'University Name',
        department: student.groupAssignment?.programId?.name || evaluationData.studentInfo?.department || 'Department Name',
        companyName: evaluationData.studentInfo?.companyName || 'Company Name',
        companyAdviser: req.user.name || evaluationData.studentInfo?.companyAdviser || 'Company Adviser',
        universityAdviser: student.universityAdviserId?.name || evaluationData.studentInfo?.universityAdviser || 'University Adviser',
        internshipStartDate: evaluationData.studentInfo?.internshipStartDate ? new Date(evaluationData.studentInfo.internshipStartDate) : new Date(),
        internshipEndDate: evaluationData.studentInfo?.internshipEndDate ? new Date(evaluationData.studentInfo.internshipEndDate) : new Date(),
      },

      // Evaluation Criteria
      evaluationCriteria: {
        punctuality: Math.max(1, Math.min(5, evaluationData.evaluationCriteria?.punctuality || 3)),
        reliability: Math.max(1, Math.min(5, evaluationData.evaluationCriteria?.reliability || 3)),
        independence: Math.max(1, Math.min(5, evaluationData.evaluationCriteria?.independence || 3)),
        communication: Math.max(1, Math.min(5, evaluationData.evaluationCriteria?.communication || 3)),
        professionalism: Math.max(1, Math.min(5, evaluationData.evaluationCriteria?.professionalism || 3)),
        speedOfWork: Math.max(1, Math.min(5, evaluationData.evaluationCriteria?.speedOfWork || 3)),
        accuracy: Math.max(1, Math.min(5, evaluationData.evaluationCriteria?.accuracy || 3)),
        engagement: Math.max(1, Math.min(5, evaluationData.evaluationCriteria?.engagement || 3)),
        cooperation: Math.max(1, Math.min(5, evaluationData.evaluationCriteria?.cooperation || 3)),
        recommendation: Math.max(1, Math.min(5, evaluationData.evaluationCriteria?.recommendation || 3)),
        technicalKnowledge: Math.max(1, Math.min(5, evaluationData.evaluationCriteria?.technicalKnowledge || 3)),
        problemSolving: Math.max(1, Math.min(5, evaluationData.evaluationCriteria?.problemSolving || 3)),
        organizing: Math.max(1, Math.min(5, evaluationData.evaluationCriteria?.organizing || 3)),
        responsibility: Math.max(1, Math.min(5, evaluationData.evaluationCriteria?.responsibility || 3)),
        initiative: Math.max(1, Math.min(5, evaluationData.evaluationCriteria?.initiative || 3)),
      },

      // Supervisor Evaluation
      supervisorEvaluation: {
        dependability: Math.max(1, Math.min(5, evaluationData.evaluationCriteria?.reliability || 3)),
        technicalCompetence: Math.max(1, Math.min(5, evaluationData.evaluationCriteria?.technicalKnowledge || 3)),
        teamwork: Math.max(1, Math.min(5, evaluationData.evaluationCriteria?.cooperation || 3)),
        communication: Math.max(1, Math.min(5, evaluationData.evaluationCriteria?.communication || 3)),
        initiative: Math.max(1, Math.min(5, evaluationData.evaluationCriteria?.initiative || 3)),
        problemSolving: Math.max(1, Math.min(5, evaluationData.evaluationCriteria?.problemSolving || 3)),
        timeManagement: Math.max(1, Math.min(5, evaluationData.evaluationCriteria?.punctuality || 3)),
        adaptability: Math.max(1, Math.min(5, evaluationData.evaluationCriteria?.independence || 3)),
        leadership: Math.max(1, Math.min(5, evaluationData.evaluationCriteria?.initiative || 3)),
        workEthic: Math.max(1, Math.min(5, evaluationData.evaluationCriteria?.professionalism || 3)),
      },

      // Supervisor Feedback
      supervisorFeedback: {
        strengths: evaluationData.supervisorFeedback?.strengths || 'No specific strengths noted',
        areasForImprovement: evaluationData.supervisorFeedback?.areasForImprovement || 'No specific areas for improvement noted',
        overallRecommendation: evaluationData.supervisorFeedback?.overallRecommendation || 'Continue',
        finalRemarks: evaluationData.supervisorFeedback?.finalRemarks || 'No additional remarks'
      },

      // Comments
      comments: {
        majorStrengths: evaluationData.supervisorFeedback?.strengths || 'No specific strengths noted',
        areasOfImprovement: evaluationData.supervisorFeedback?.areasForImprovement || 'No specific areas for improvement noted',
        finalRecommendation: evaluationData.supervisorFeedback?.overallRecommendation === 'Not Recommended' ? 'Not Recommended' : 'Continue',
      },

      // Signatures
      signatures: {
        companyAdviserName: req.user.name || evaluationData.signatures?.companyAdviser?.name || 'Company Adviser Name',
        companyAdviserSignature: evaluationData.signatures?.companyAdviser?.signature || '',
        universityAdviserName: student.universityAdviserId?.name || evaluationData.signatures?.universityAdviser?.name || 'University Adviser Name',
        universityAdviserSignature: evaluationData.signatures?.universityAdviser?.signature || '',
        companyStamp: evaluationData.signatures?.companyStamp || '',
        facultyHeadSignature: evaluationData.signatures?.facultyHead?.signature || '',
        facultyHeadName: student.facultyHeadId?.name || evaluationData.signatures?.facultyHead?.name || 'Faculty Head Name',
      },

      // Attendance
      attendance: {
        weeks: evaluationData.attendance?.records?.map((record, index) => ({
          weekNumber: index + 1,
          monday: record.monday || 'present',
          tuesday: record.tuesday || 'present',
          wednesday: record.wednesday || 'present',
          thursday: record.thursday || 'present',
          friday: record.friday || 'present',
          absentDays: record.absentDays || 0,
          supervisorSignature: record.supervisorSignature || '',
        })) || [],
        totalAbsentDays: evaluationData.attendance?.absentDays || 0,
      },

      status: evaluationData.status || 'draft',
      totalScore: evaluationData.totalScore || 0,
      finalGrade: evaluationData.finalGrade || 'B',
      lastUpdated: new Date()
    };

    // Calculate final evaluation scores
    transformedData.finalEvaluation = {
      generalPerformance: Math.round(((transformedData.evaluationCriteria.punctuality + 
                                    transformedData.evaluationCriteria.reliability + 
                                    transformedData.evaluationCriteria.independence + 
                                    transformedData.evaluationCriteria.communication + 
                                    transformedData.evaluationCriteria.professionalism) / 5) * 5),
      personalSkills: Math.round(((transformedData.evaluationCriteria.speedOfWork + 
                                 transformedData.evaluationCriteria.accuracy + 
                                 transformedData.evaluationCriteria.engagement + 
                                 transformedData.evaluationCriteria.cooperation + 
                                 transformedData.evaluationCriteria.recommendation) / 5) * 5),
      professionalSkills: Math.round(((transformedData.evaluationCriteria.technicalKnowledge + 
                                     transformedData.evaluationCriteria.problemSolving + 
                                     transformedData.evaluationCriteria.organizing + 
                                     transformedData.evaluationCriteria.responsibility + 
                                     transformedData.evaluationCriteria.initiative) / 5) * 10),
      total: 0
    };

    transformedData.finalEvaluation.total = 
      transformedData.finalEvaluation.generalPerformance + 
      transformedData.finalEvaluation.personalSkills + 
      transformedData.finalEvaluation.professionalSkills;

    console.log('💾 Attempting to save to database...');
    
    // Save or update the evaluation data in the database - PERMANENT PERSISTENCE
    const savedEvaluation = await FinalEvaluation.findOneAndUpdate(
      { studentId, companyAdviserId: adviserId },
      { 
        $set: {
          ...transformedData, 
          studentId,
          companyAdviserId: adviserId,
          lastUpdated: new Date()
        }
      },
      { 
        upsert: true, 
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true
      }
    );
    
    console.log('✅ Database save successful');

    // Verify the data was actually saved
    const verifyData = await FinalEvaluation.findOne({ studentId, companyAdviserId: adviserId });
    console.log('✅ Data verification - saved to database:', {
      id: verifyData._id,
      hasEvaluationCriteria: !!verifyData.evaluationCriteria,
      hasSupervisorFeedback: !!verifyData.supervisorFeedback,
      status: verifyData.status,
      lastUpdated: verifyData.lastUpdated
    });

    // Notify relevant parties
    if (student.universityAdviserId) {
      await notify(req, student.universityAdviserId, "Final Evaluation Created", 
        `Final evaluation has been created for student ${student.name}`, savedEvaluation._id, "Evaluation");
    }
    
    if (student.facultyHeadId) {
      await notify(req, student.facultyHeadId, "Final Evaluation Created", 
        `Final evaluation has been created for student ${student.name}`, savedEvaluation._id, "Evaluation");
    }

    res.status(200).json({
      success: true,
      message: 'Final evaluation saved successfully',
      data: {
        studentId,
        evaluationId: savedEvaluation._id,
        lastUpdated: savedEvaluation.lastUpdated
      }
    });

  } catch (error) {
    console.error('❌ Error saving Company Adviser final evaluation:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error while saving final evaluation',
      error: error.message
    });
  }
};

module.exports = {
  createFinalEvaluationProgress,
  updateFinalEvaluationProgress
};
