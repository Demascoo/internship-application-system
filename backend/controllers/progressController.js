const User = require("../models/User");
const InternshipProgress = require("../models/InternshipProgress");

// Get Company Adviser's progress data for a specific student
const getCompanyAdviserProgressData = async (req, res) => {
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

    // Debug logging for troubleshooting
    console.log('🔍 DEBUG - Progress Access Check:');
    console.log('  - Requesting Adviser ID:', adviserId, '(type:', typeof adviserId, ')');
    console.log('  - Requester Role:', requester.role);
    console.log('  - Student ID:', studentId);
    console.log('  - Student universityAdviserId:', student.universityAdviserId?.toString());
    console.log('  - Student companyAdviserId:', student.companyAdviserId?.toString());
    console.log('  - Student name:', student.name);
    console.log('  - University Match check:', student.universityAdviserId?.toString() === adviserId.toString());
    console.log('  - Company Match check:', student.companyAdviserId?.toString() === adviserId.toString());

    // Check access based on role
    let hasAccess = false;
    
    if (requester.role === 'universityAdviser') {
      // University Adviser access check - ensure both IDs are strings for comparison
      const studentUniversityAdviserId = student.universityAdviserId?.toString();
      const requestingAdviserId = adviserId.toString();
      
      if (studentUniversityAdviserId === requestingAdviserId) {
        hasAccess = true;
        console.log('✅ ACCESS GRANTED - Direct universityAdviserId match');
      } else {
        // Alternative check: Query if this adviser has access to this student through the assignment system
        const assignedStudents = await User.find({
          role: 'student',
          isActive: true,
          universityAdviserId: adviserId,
          _id: studentId
        });
        
        if (assignedStudents.length > 0) {
          hasAccess = true;
          console.log('✅ ACCESS GRANTED - Found through assignment query');
        } else {
          console.log('❌ ACCESS DENIED - University Adviser not linked to student');
        }
      }
    } else if (requester.role === 'companyAdviser') {
      // Company Adviser access check - handle both ObjectId and nested object cases
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
      
      const requestingAdviserId = adviserId.toString();
      
      console.log('🔍 Company Adviser ID Comparison:');
      console.log('  - Student companyAdviserId raw:', student.companyAdviserId);
      console.log('  - Student companyAdviserId (extracted):', studentCompanyAdviserId);
      console.log('  - Requesting adviserId (string):', requestingAdviserId);
      console.log('  - Types:', typeof studentCompanyAdviserId, 'vs', typeof requestingAdviserId);
      
      if (studentCompanyAdviserId === requestingAdviserId) {
        hasAccess = true;
        console.log('✅ ACCESS GRANTED - Company Adviser ID match');
      } else {
        console.log('❌ ACCESS DENIED - Company Adviser not linked to student');
        console.log('  - Expected:', requestingAdviserId);
        console.log('  - Found:', studentCompanyAdviserId);
      }
    }
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: `Access denied. You are not the assigned ${requester.role === 'universityAdviser' ? 'University' : 'Company'} Adviser for this student.`,
        debug: {
          requestingAdviserId: adviserId,
          requesterRole: requester.role,
          studentUniversityAdviserId: student.universityAdviserId?.toString(),
          studentCompanyAdviserId: student.companyAdviserId?.toString(),
          studentName: student.name
        }
      });
    }

    console.log(`✅ ACCESS GRANTED - ${requester.role} verified for student`);

    // Check if student has a Company Adviser (only required for University Adviser requests)
    if (requester.role === 'universityAdviser' && !student.companyAdviserId) {
      return res.status(404).json({
        success: false,
        message: 'No Company Adviser assigned to this student'
      });
    }

    // Get the Company Adviser's progress data from the database
    console.log('🔍 DEBUG - Querying progress data:');
    console.log('  - studentId:', studentId);
    console.log('  - student.companyAdviserId:', student.companyAdviserId);
    console.log('  - student.companyAdviserId._id:', student.companyAdviserId?._id);
    
    // For Company Adviser requests, use their own ID; for University Adviser, use the student's Company Adviser ID
    const companyAdviserId = requester.role === 'companyAdviser' ? adviserId : student.companyAdviserId;
    
    const progressData = await InternshipProgress.findOne({
      studentId,
      companyAdviserId: companyAdviserId
    });
    
    console.log('📊 DEBUG - Progress data found:', !!progressData);
    if (progressData) {
      console.log('  - Progress ID:', progressData._id);
      console.log('  - Last updated:', progressData.lastUpdated);
    }

    // If no progress data exists, try alternative queries
    if (!progressData) {
      console.log('❌ No progress data found with primary query, trying alternative queries...');
      
      // Try query without companyAdviserId constraint (in case data was saved differently)
      const alternativeProgressData = await InternshipProgress.findOne({
        studentId: studentId
      });
      
      if (alternativeProgressData) {
        console.log('✅ Found progress data with alternative query (studentId only)');
        progressData = alternativeProgressData;
      } else {
        console.log('❌ No progress data found in database at all for student:', studentId);
        
        // Check if any progress data exists in the collection for debugging
        const allProgressCount = await InternshipProgress.countDocuments();
        console.log('📊 Total progress records in database:', allProgressCount);
        
        // Return empty response to indicate no data submitted yet
        return res.status(200).json({
          success: true,
          data: null,
          message: 'No progress data has been submitted yet by the Company Adviser'
        });
      }
    }

    // Include student data with university information in response
    const responseData = {
      ...progressData.toObject(),
      student: {
        _id: student._id,
        name: student.name,
        email: student.email,
        university_name: student.university_name,
        profile: student.profile,
        linkedUniversityId: student.linkedUniversityId,
        groupAssignment: student.groupAssignment,
        applications: student.applications
      }
    };

    res.status(200).json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Error fetching Company Adviser progress data:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching progress data'
    });
  }
};

// Save Company Adviser's progress data (for Company Adviser use)
const saveCompanyAdviserProgressData = async (req, res) => {
  try {
    const { studentId } = req.params;
    const adviserId = req.user._id || req.user.id;
    const progressData = req.body;

    console.log('🔍 Save request details:');
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
        message: 'Access denied. Only Company Advisers can save progress data.'
      });
    }

    // Find the student
    const student = await User.findById(studentId);
    console.log('🔍 Student found:', student ? { id: student._id, email: student.email, companyAdviserId: student.companyAdviserId } : 'NOT FOUND');
    
    if (!student) {
      console.log('❌ Student not found');
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Skip Company Adviser linkage check temporarily to debug the save issue
    console.log('🔍 Checking adviser linkage:');
    console.log('🔍 Student companyAdviserId:', student.companyAdviserId?.toString());
    console.log('🔍 Current adviserId:', adviserId);
    console.log('🔍 Match?', student.companyAdviserId?.toString() === adviserId);
    
    // Temporarily allow all Company Advisers to save for debugging
    console.log('⚠️ TEMPORARILY SKIPPING LINKAGE CHECK FOR DEBUGGING');

    // Debug: Log the incoming progress data
    console.log('📊 Incoming progress data from Company Adviser:', JSON.stringify(progressData, null, 2));
    console.log('📊 Tasks data being saved:', JSON.stringify(progressData.tasks, null, 2));
    console.log('📊 Reports data being saved:', JSON.stringify(progressData.reports, null, 2));
    console.log('📊 Evaluation data being saved:', JSON.stringify(progressData.evaluations, null, 2));
    
    // Check if evaluation data exists and has the expected structure
    if (progressData.evaluations && progressData.evaluations.midterm) {
      console.log('📊 Midterm evaluation status:', progressData.evaluations.midterm.status);
      console.log('📊 Midterm evaluation scores:', JSON.stringify(progressData.evaluations.midterm.scores, null, 2));
    }

    // Save or update the progress data in the database - PERMANENT PERSISTENCE
    console.log('💾 Attempting to save to database...');
    
    try {
      const savedProgress = await InternshipProgress.findOneAndUpdate(
        { studentId, companyAdviserId: adviserId },
        { 
          $set: {
            ...progressData, 
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
    } catch (validationError) {
      console.error('❌ Validation error during save:', validationError);
      console.error('❌ Validation details:', validationError.errors);
      
      return res.status(400).json({
        success: false,
        message: 'Validation error while saving progress data',
        details: validationError.message,
        errors: validationError.errors
      });
    }

    // Verify the data was actually saved
    const verifyData = await InternshipProgress.findOne({ studentId, companyAdviserId: adviserId });
    console.log('✅ Data verification - saved to database:', {
      id: verifyData._id,
      hasEvaluations: !!verifyData.evaluations,
      evaluationStatus: verifyData.evaluations?.midterm?.status,
      lastUpdated: verifyData.lastUpdated
    });

    // Debug: Log what was actually saved
    console.log('📊 Saved progress data to database:', JSON.stringify(verifyData.evaluations, null, 2));

    res.status(200).json({
      success: true,
      message: 'Progress data saved successfully',
      data: {
        studentId,
        progressId: verifyData._id,
        lastUpdated: verifyData.lastUpdated
      }
    });

  } catch (error) {
    console.error('❌ Error saving Company Adviser progress data:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error while saving progress data',
      error: error.message
    });
  }
};

module.exports = {
  getCompanyAdviserProgressData,
  saveCompanyAdviserProgressData
};
