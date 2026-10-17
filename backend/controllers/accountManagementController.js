const User = require("../models/User");
const Adviser = require("../models/Adviser");
const FinalEvaluation = require("../models/FinalEvaluation");
const ActivityLog = require("../models/ActivityLog");
const { authMiddleware, adminMiddleware } = require("../middleware/auth");
const { validateUniversityName, normalizeUniversityName, universitiesMatch } = require("../utils/universityUtils");

// Create temporary account for advisers and faculty head (admin)
const createTemporaryAccount = async (req, res) => {
  try {
    console.log("Create temporary account called with data:", req.body);
    console.log("Request user:", req.user ? req.user.name : "No user");
    
    const { fullName, email, password, role, programId, university_name, studentId, studentIds, companyName } = req.body;
    
    // Basic validation
    if (!fullName || !email || !password || !role) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required fields: fullName, email, password, role" 
      });
    }
    
    if (!["universityAdviser", "companyAdviser", "facultyHead"].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email"
      });
    }
    
    // Role-specific validation and linking
    if (role === "universityAdviser") {
      if (!university_name || !studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: "University Adviser requires university name and at least one student ID"
        });
      }
      
      // Validate students exist and belong to the university
      const students = await User.find({
        _id: { $in: studentIds },
        role: 'student',
        university_name: { $regex: new RegExp(`^${university_name.trim()}$`, 'i') }
      });
      
      if (students.length !== studentIds.length) {
        return res.status(400).json({
          success: false,
          message: "One or more students not found or don't belong to the specified university"
        });
      }

    } else if (role === "facultyHead") {
      if (!university_name || !studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Faculty Head requires university name and at least one student ID"
        });
      }
      
      // Validate students exist and belong to the university
      const students = await User.find({
        _id: { $in: studentIds },
        role: 'student',
        university_name: { $regex: new RegExp(`^${university_name.trim()}$`, 'i') }
      });
      
      if (students.length !== studentIds.length) {
        return res.status(400).json({
          success: false,
          message: "One or more students not found or don't belong to the specified university"
        });
      }

    } else if (role === "companyAdviser") {
      if (!companyName || !programId) {
        return res.status(400).json({
          success: false,
          message: "Company Adviser requires company name and program ID"
        });
      }
      // No studentIds validation for Company Adviser
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid role specified"
      });
    }
    
    // Create user account with temporary password
    const userData = { 
      name: fullName, 
      email, 
      password, 
      temporaryPassword: password, // Store plain text for admin copy functionality
      role, 
      adminApproved: true,
      emailVerified: true 
    };

    // Add role-specific linking fields
    if (role === "universityAdviser") {
      userData.university_name = university_name;
      userData.linkedUniversityId = normalizeUniversityName(university_name);
      // Will link to students after user creation
    } else if (role === "facultyHead") {
      userData.university_name = university_name;
      userData.linkedUniversityId = normalizeUniversityName(university_name);
      // Will link to students after user creation
    } else if (role === "companyAdviser") {
      userData.linkedProgramId = programId;
      // Will auto-link to university adviser and faculty head after user creation
    }

    const user = await User.create(userData);
    
    // Create adviser profile
    const adviserData = { 
      fullName, 
      role, 
      userId: user._id 
    };
    
    // Add role-specific fields
    if (role === "companyAdviser") {
      if (companyName) {
        adviserData.companyName = companyName;
      }
      // programId is required for Company Adviser
      if (programId) {
        adviserData.programId = programId;
      } else {
        return res.status(400).json({
          success: false,
          message: "Program selection is required for Company Adviser"
        });
      }
    }
    
    const adviser = await Adviser.create(adviserData);

    // Handle role-specific bi-directional linking
    let linkedStudents = 0;
    let linkingMessage = "";
    
    if (role === "universityAdviser") {
      // Link University Adviser to selected students (bi-directional)
      try {
        await User.updateMany(
          { _id: { $in: studentIds } },
          { $set: { universityAdviserId: user._id } }
        );
        linkedStudents = studentIds.length;
        linkingMessage = `Linked to ${linkedStudents} selected students`;
      } catch (linkError) {
        console.error("Failed to link University Adviser to students:", linkError);
      }
    } else if (role === "facultyHead") {
      // Link Faculty Head to selected students (bi-directional)
      try {
        await User.updateMany(
          { _id: { $in: studentIds } },
          { $set: { facultyHeadId: user._id } }
        );
        linkedStudents = studentIds.length;
        linkingMessage = `Linked to ${linkedStudents} selected students`;
      } catch (linkError) {
        console.error("Failed to link Faculty Head to students:", linkError);
      }
    } else if (role === "companyAdviser") {
      // Company Adviser is linked to program only, no students assigned during creation
      try {
        linkedStudents = 0;
        linkingMessage = `Linked to program: ${programId}`;
      } catch (linkError) {
        console.error("Failed to link Company Adviser:", linkError);
      }
    }
    
    // Log the activity
    try {
      const ActivityLog = require("../models/ActivityLog");
      await ActivityLog.create({
        userId: req.user._id,
        action: 'create_account',
        details: `Created ${role} account for ${fullName}. ${linkingMessage}`,
        metadata: {
          adviserId: user._id,
          adviserName: fullName,
          adviserType: role,
          studentsLinked: linkedStudents,
          universityName: university_name,
          companyName: companyName,
          studentIds: studentIds || [studentId],
          studentId: studentId
        }
      });
    } catch (logError) {
      console.error("Failed to log activity:", logError);
    }
    
    res.status(201).json({ 
      success: true, 
      message: `Account created successfully. ${linkingMessage}`,
      data: { 
        adviser, 
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          temporaryPassword: password
        }
      } 
    });
  } catch (e) {
    console.error("Create temporary account error:", e);
    console.error("Error stack:", e.stack);
    const msg = e?.code === 11000 ? "Email already in use" : `Server error: ${e.message}`;
    res.status(500).json({ success: false, message: msg, error: e.message });
  }
};

// List all temporary accounts (admin)
const listTemporaryAccounts = async (req, res) => {
  try {
    const accounts = await User.find({ 
      role: { $in: ["universityAdviser", "companyAdviser", "facultyHead"] },
      adminApproved: true 
    }).select('+temporaryPassword');
    
    // For existing accounts without temporaryPassword, update them with a default password
    const accountsWithPasswords = await Promise.all(accounts.map(async (account) => {
      const accountObj = account.toObject();
      
      // If no temporaryPassword exists, set and save a default one
      if (!accountObj.temporaryPassword) {
        const defaultPassword = "temporary_password";
        await User.findByIdAndUpdate(account._id, { temporaryPassword: defaultPassword });
        accountObj.temporaryPassword = defaultPassword;
      }
      
      // Use temporaryPassword for copy functionality
      accountObj.password = accountObj.temporaryPassword;
      return accountObj;
    }));
    
    res.status(200).json({ 
      success: true, 
      data: { accounts: accountsWithPasswords } 
    });
  } catch (e) {
    console.error("List temporary accounts error:", e);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Update user profile (for advisers and faculty head)
const updateProfile = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const userId = req.user._id;
    
    console.log("Update profile request:", { userId, name, email, hasPassword: !!password });
    
    // Only allow updating own profile
    if (req.params.id !== userId.toString()) {
      return res.status(403).json({ success: false, message: "Can only update own profile" });
    }
    
    // Find the user first
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    console.log("Found user:", { id: user._id, email: user.email, role: user.role });
    
    // Update fields
    if (name) user.name = name;
    if (email) user.email = typeof email === "string" ? email.trim().toLowerCase() : email;

    // Update password only if a valid new password is provided (avoid saving masked or empty values)
    const isNonEmptyString = typeof password === "string" && password.trim().length > 0;
    const isNotMasked = isNonEmptyString && !/^\*{4,}$/.test(password.trim());
    const isMinLength = isNonEmptyString && password.trim().length >= 6;
    if (isNonEmptyString && isNotMasked && isMinLength) {
      console.log("Updating password for user:", user.email, " length:", password.trim().length);
      user.password = password.trim();
    }
    
    // Save the user (this will trigger password hashing middleware)
    await user.save();
    
    console.log("User saved successfully");
    
    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.status(200).json({ 
      success: true, 
      data: { user: userResponse } 
    });
  } catch (e) {
    console.error("Update profile error:", e);
    const msg = e?.code === 11000 ? "Email already in use" : "Server error";
    res.status(500).json({ success: false, message: msg });
  }
};

// Unlock account (reset login attempts)
const unlockAccount = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }
    
    // Find the user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    // Reset login attempts and unlock account
    await user.resetLoginAttempts();
    
    res.status(200).json({ 
      success: true, 
      message: "Account unlocked successfully. You can now login with your new password." 
    });
  } catch (e) {
    console.error("Unlock account error:", e);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Admin: Reset a user's password and unlock account
const adminResetUserPassword = async (req, res) => {
  try {
    const { userId, newPassword } = req.body;
    if (!userId || typeof newPassword !== "string" || newPassword.trim().length < 6) {
      return res.status(400).json({ success: false, message: "userId and valid newPassword (min 6) are required" });
    }

    const user = await User.findById(userId).select("+password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.password = newPassword.trim();
    await user.save();
    await user.resetLoginAttempts();

    return res.status(200).json({ success: true, message: "Password reset and account unlocked" });
  } catch (e) {
    console.error("Admin reset user password error:", e);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get Faculty Heads filtered by student's program
const getFacultyHeadsByStudentProgram = async (req, res) => {
  try {
    const { studentId } = req.params;
    console.log("API called - Getting faculty heads for student:", studentId);
    console.log("Request user:", req.user?.name, "Role:", req.user?.role);
    
    // Validate studentId format
    if (!studentId || !studentId.match(/^[0-9a-fA-F]{24}$/)) {
      console.log("Invalid student ID format:", studentId);
      return res.status(400).json({ success: false, message: "Invalid student ID format" });
    }
    
    // Get student and their program
    const student = await User.findById(studentId).populate('groupAssignment.programId');
    console.log("Found student:", student?.name, "Role:", student?.role);
    
    if (!student) {
      console.log("Student not found with ID:", studentId);
      return res.status(404).json({ success: false, message: "Student not found" });
    }
    
    if (student.role !== 'student') {
      console.log("User is not a student, role:", student.role);
      return res.status(400).json({ success: false, message: "User is not a student" });
    }
    
    const programId = student.groupAssignment?.programId?._id;
    console.log("Student program ID:", programId);
    
    // Get all Faculty Heads first
    const allFacultyHeads = await User.find({ 
      role: 'facultyHead', 
      adminApproved: true,
      isActive: true 
    }).select('name email');
    
    console.log("Found all faculty heads:", allFacultyHeads.length);
    
    if (!programId) {
      // If student has no program, return all faculty heads
      console.log("Student not assigned to program, returning all faculty heads");
      return res.status(200).json({ 
        success: true, 
        data: { 
          facultyHeads: [],
          allFacultyHeads,
          studentProgram: null
        } 
      });
    }
    
    // Get Faculty Heads for this program
    const Program = require("../models/Program");
    const program = await Program.findById(programId).populate('facultyHeadId', 'name email');
    console.log("Found program:", program?.name, "Faculty Head:", program?.facultyHeadId?.name);
    
    let facultyHeads = [];
    if (program?.facultyHeadId) {
      facultyHeads = [program.facultyHeadId];
    }
    
    console.log("Returning faculty heads:", facultyHeads.length, "All faculty heads:", allFacultyHeads.length);
    
    res.status(200).json({ 
      success: true, 
      data: { 
        facultyHeads,
        allFacultyHeads,
        studentProgram: {
          id: program?._id,
          name: program?.name
        }
      } 
    });
  } catch (e) {
    console.error("Get faculty heads error:", e);
    res.status(500).json({ success: false, message: "Server error", error: e.message });
  }
};

// Submit final evaluation (company adviser) - Enhanced with Faculty Head selection
const submitFinalEvaluation = async (req, res) => {
  try {
    const finalEvalData = req.body;
    const { facultyHeadId, studentId } = finalEvalData;
    
    finalEvalData.companyAdviserId = req.user._id;
    finalEvalData.status = 'submitted';
    
    // Validate Faculty Head selection
    if (!facultyHeadId) {
      return res.status(400).json({ success: false, message: "Faculty Head selection is required" });
    }
    
    // Verify Faculty Head exists and has correct role
    const facultyHead = await User.findById(facultyHeadId);
    if (!facultyHead || facultyHead.role !== 'facultyHead') {
      return res.status(400).json({ success: false, message: "Invalid Faculty Head selected" });
    }
    
    // Verify student exists and get their program
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(400).json({ success: false, message: "Invalid student" });
    }
    
    // Handle file attachments if any
    if (req.files && req.files.length > 0) {
      finalEvalData.attachments = req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        filePath: file.path,
        mimeType: file.mimetype,
        size: file.size
      }));
    }
    
    const finalEval = await FinalEvaluation.create(finalEvalData);
    
    // Log the activity
    const ActivityLog = require("../models/ActivityLog");
    await ActivityLog.create({
      userId: req.user._id,
      action: 'submit_final_evaluation',
      details: `Submitted final evaluation for student ${student.name} to Faculty Head ${facultyHead.name}`,
      metadata: {
        evaluationId: finalEval._id,
        studentId: student._id,
        facultyHeadId: facultyHead._id,
        studentName: student.name,
        facultyHeadName: facultyHead.name
      }
    });
    
    res.status(201).json({ 
      success: true, 
      message: `Final evaluation submitted successfully to ${facultyHead.name}`,
      data: { finalEvaluation: finalEval } 
    });
  } catch (e) {
    console.error("Submit final evaluation error:", e);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get final evaluations for faculty head
const getFinalEvaluationsForFacultyHead = async (req, res) => {
  try {
    const facultyHeadId = req.user._id;
    
    console.log('🔍 FACULTY HEAD EVALUATION FETCH:', {
      facultyHeadId: facultyHeadId.toString(),
      userRole: req.user.role
    });
    
    const evaluations = await FinalEvaluation.find({ 
      facultyHeadId: facultyHeadId 
    }).populate("studentId", "name email university_name groupAssignment")
      .populate("companyAdviserId", "name")
      .populate("universityAdviserId", "name")
      .populate({
        path: "studentId",
        populate: {
          path: "groupAssignment.programId",
          select: "name"
        }
      })
      .sort({ createdAt: -1 });
    
    console.log('📊 FACULTY HEAD EVALUATIONS FOUND:', {
      count: evaluations.length,
      evaluationIds: evaluations.map(e => e._id.toString()),
      studentNames: evaluations.map(e => e.studentId?.name || 'Unknown'),
      statuses: evaluations.map(e => e.status)
    });
    
    // Also check all evaluations in the system for debugging
    const allEvaluations = await FinalEvaluation.find({}).populate("studentId", "name").populate("facultyHeadId", "name");
    console.log('🗂️ ALL EVALUATIONS IN SYSTEM:', {
      total: allEvaluations.length,
      evaluations: allEvaluations.map(e => ({
        id: e._id.toString(),
        student: e.studentId?.name || 'Unknown',
        facultyHead: e.facultyHeadId?.name || 'No Faculty Head',
        facultyHeadId: e.facultyHeadId?.toString() || 'null',
        status: e.status
      }))
    });
    
    // Transform attendance data for Faculty Head compatibility
    const transformedEvaluations = evaluations.map(evaluation => {
      const evalObj = evaluation.toObject();
      
      if (evalObj.attendance && evalObj.attendance.weeks && 
          evalObj.attendance.totalDays === undefined && 
          evalObj.attendance.presentDays === undefined && 
          evalObj.attendance.absentDays === undefined) {
        
        console.log('🔄 TRANSFORMING OLD ATTENDANCE DATA for Faculty Head compatibility');
        
        // Calculate missing fields from weeks data
        const weeks = evalObj.attendance.weeks || [];
        const totalDays = weeks.length * 5;
        
        let presentDays = 0;
        let absentDays = 0;
        let excusedDays = 0;
        let lateDays = 0;
        
        weeks.forEach(week => {
          ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].forEach(day => {
            const status = week[day];
            if (status === 'present') presentDays++;
            else if (status === 'absent') absentDays++;
            else if (status === 'excused') excusedDays++;
            else if (status === 'late') lateDays++;
          });
        });
        
        const attendancePercentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;
        
        // Create transformed attendance object
        evalObj.attendance = {
          ...evalObj.attendance,
          totalDays,
          presentDays,
          absentDays,
          excusedDays,
          lateDays,
          attendancePercentage: Math.round(attendancePercentage * 10) / 10,
          records: []
        };
        
        console.log('✅ ATTENDANCE DATA TRANSFORMED:', {
          evaluationId: evalObj._id.toString(),
          totalDays,
          presentDays,
          absentDays,
          attendancePercentage: Math.round(attendancePercentage * 10) / 10
        });
      }
      
      return evalObj;
    });
    
    res.status(200).json({ 
      success: true, 
      data: { evaluations: transformedEvaluations } 
    });
  } catch (e) {
    console.error("Get final evaluations error:", e);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Review final evaluation (faculty head)
const reviewFinalEvaluation = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reviewNotes } = req.body;
    
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }
    
    const evaluation = await FinalEvaluation.findByIdAndUpdate(
      id,
      { 
        status, 
        reviewNotes, 
        reviewedBy: req.user._id, 
        reviewedAt: new Date() 
      },
      { new: true }
    );
    
    if (!evaluation) {
      return res.status(404).json({ success: false, message: "Evaluation not found" });
    }
    
    res.status(200).json({ 
      success: true, 
      data: { evaluation } 
    });
  } catch (e) {
    console.error("Review final evaluation error:", e);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Download evaluation attachment
const downloadEvaluationAttachment = async (req, res) => {
  try {
    const { evaluationId, attachmentIndex } = req.params;
    let userId, userRole;
    
    // Handle both middleware auth and query token
    if (req.user) {
      userId = req.user._id;
      userRole = req.user.role;
    } else if (req.query.token) {
      // Verify token from query parameter
      const jwt = require('jsonwebtoken');
      try {
        const decoded = jwt.verify(req.query.token, process.env.JWT_SECRET);
        const User = require('../models/User');
        const user = await User.findById(decoded.id);
        if (!user) {
          return res.status(401).json({ success: false, message: "Invalid token" });
        }
        userId = user._id;
        userRole = user.role;
      } catch (tokenError) {
        return res.status(401).json({ success: false, message: "Invalid token" });
      }
    } else {
      return res.status(401).json({ success: false, message: "No authentication provided" });
    }
    
    // Get the evaluation
    const evaluation = await FinalEvaluation.findById(evaluationId);
    if (!evaluation) {
      return res.status(404).json({ success: false, message: "Evaluation not found" });
    }
    
    // Check permissions - only company adviser who created it or assigned faculty head can download
    const canAccess = (
      (userRole === 'companyAdviser' && evaluation.companyAdviserId.toString() === userId.toString()) ||
      (userRole === 'facultyHead' && evaluation.facultyHeadId && evaluation.facultyHeadId.toString() === userId.toString())
    );
    
    if (!canAccess) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
    
    // Get the attachment
    const attachment = evaluation.attachments[parseInt(attachmentIndex)];
    if (!attachment) {
      return res.status(404).json({ success: false, message: "Attachment not found" });
    }
    
    const path = require('path');
    const fs = require('fs');
    
    // Handle both absolute and relative paths (avoid duplication)
    let filePath;
    if (path.isAbsolute(attachment.filePath)) {
      // Already absolute path, use as-is
      filePath = attachment.filePath;
    } else {
      // Relative path, join with process.cwd()
      filePath = path.join(process.cwd(), attachment.filePath);
    }
    
    console.log('📁 Resolved file path:', filePath);
    console.log('📄 Original filename:', attachment.originalName);
    console.log('📄 Stored file path:', attachment.filePath);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error('❌ File not found at path:', filePath);
      return res.status(404).json({ success: false, message: "File not found on server" });
    }
    
    // Get file stats for debugging
    const stats = fs.statSync(filePath);
    console.log('📊 File size:', stats.size, 'bytes');
    console.log('📅 File modified:', stats.mtime);
    
    // Test if file is readable
    try {
      const testBuffer = fs.readFileSync(filePath, { encoding: null });
      console.log('✅ File is readable, first 10 bytes:', Array.from(testBuffer.slice(0, 10)));
      
      // Check if it's a valid PDF (starts with %PDF)
      const pdfHeader = testBuffer.slice(0, 4).toString();
      console.log('📋 File header:', pdfHeader);
      if (!pdfHeader.startsWith('%PDF')) {
        console.error('❌ File is not a valid PDF!');
      }
    } catch (readError) {
      console.error('❌ Cannot read file:', readError);
      return res.status(500).json({ success: false, message: "File is not readable" });
    }
    
    // Use res.download() exactly like acceptance paper controller
    console.log('📤 Sending file via res.download()');
    res.download(filePath, attachment.originalName, (err) => {
      if (err) {
        console.error('❌ Download error:', err);
      } else {
        console.log('✅ File sent successfully');
      }
    });
    
  } catch (e) {
    console.error("Download attachment error:", e);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get students for University Adviser selection (admin)
const getStudentsForSelection = async (req, res) => {
  try {
    const students = await User.find({ 
      role: 'student',
      adminApproved: true,
      isActive: true
    })
    .select('name email university_name groupAssignment')
    .populate('groupAssignment.programId', 'name')
    .sort({ name: 1 });
    
    res.status(200).json({ 
      success: true, 
      data: { students } 
    });
  } catch (e) {
    console.error("Get students for selection error:", e);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get Company Adviser's linked University Adviser and Faculty Head for a student
const getLinkedAdvisersForStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const companyAdviserId = req.user._id;
    
    console.log(`🔗 LINKED ADVISERS API: Fetching advisers for student ${studentId} by company adviser ${companyAdviserId}`);
    
    // Validate student exists - use studentId or email fallback
    let student;
    if (studentId.includes('@')) {
      // If studentId looks like email, search by email
      student = await User.findOne({ email: studentId, role: 'student' });
      console.log(`🔗 LINKED ADVISERS: Searching by email ${studentId}`);
    } else {
      // Search by _id
      student = await User.findById(studentId);
      console.log(`🔗 LINKED ADVISERS: Searching by ID ${studentId}`);
    }
    
    if (!student || student.role !== 'student') {
      console.log(`❌ LINKED ADVISERS: Student not found for ${studentId}`);
      return res.status(404).json({ success: false, message: "Student not found" });
    }
    
    console.log(`✅ LINKED ADVISERS: Found student ${student.name} (${student.email})`);
    
    // Check if this student is assigned to the requesting Company Adviser
    if (!student.companyAdviserId || student.companyAdviserId.toString() !== companyAdviserId.toString()) {
      console.log(`❌ LINKED ADVISERS: Student ${student.name} not assigned to this company adviser`);
      return res.status(403).json({ success: false, message: "Access denied: Student not assigned to you" });
    }
    
    // Find University Adviser and Faculty Head based on student's university
    const universityAdviser = await User.findOne({
      role: 'universityAdviser',
      university_name: { $regex: new RegExp(student.university_name, 'i') }
    }).select('_id name email university_name');
    
    const facultyHead = await User.findOne({
      role: 'facultyHead',
      university_name: { $regex: new RegExp(student.university_name, 'i') }
    }).select('_id name email university_name');
    
    console.log(`🔗 LINKED ADVISERS: Found University Adviser: ${universityAdviser?.name || 'None'}`);
    console.log(`🔗 LINKED ADVISERS: Found Faculty Head: ${facultyHead?.name || 'None'}`);
    
    const linkedAdvisers = {
      universityAdviser: universityAdviser ? {
        _id: universityAdviser._id,
        name: universityAdviser.name,
        email: universityAdviser.email,
        role: 'universityAdviser'
      } : null,
      facultyHead: facultyHead ? {
        _id: facultyHead._id,
        name: facultyHead.name,
        email: facultyHead.email,
        role: 'facultyHead'
      } : null,
      student: {
        _id: student._id,
        name: student.name,
        email: student.email,
        university_name: student.university_name
      }
    };
    
    console.log(`✅ LINKED ADVISERS: Returning data for ${student.name}:`, linkedAdvisers);
    
    res.status(200).json({ 
      success: true, 
      data: linkedAdvisers 
    });
  } catch (e) {
    console.error("❌ LINKED ADVISERS ERROR:", e);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get students by university for University Adviser/Faculty Head selection (admin)
const getStudentsByUniversity = async (req, res) => {
  try {
    const { universityName } = req.params;
    
    if (!universityName) {
      return res.status(400).json({ 
        success: false, 
        message: "University name is required" 
      });
    }
    
    const normalizedUniversity = normalizeUniversityName(universityName);
    
    const students = await User.find({ 
      role: 'student',
      adminApproved: true,
      isActive: true,
      university_name: { $regex: new RegExp(`^${normalizedUniversity}$`, 'i') }
    })
    .select('name email university_name groupAssignment universityAdviserId facultyHeadId')
    .populate('groupAssignment.programId', 'name')
    .populate('universityAdviserId', 'name email')
    .populate('facultyHeadId', 'name email')
    .sort({ name: 1 });
    
    res.status(200).json({ 
      success: true, 
      data: { 
        students,
        universityName: normalizedUniversity
      } 
    });
  } catch (e) {
    console.error("Get students by university error:", e);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get student's university advisers and faculty head for Company Adviser auto-linking
const getStudentUniversityAdvisers = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const student = await User.findById(studentId)
      .populate('universityAdviserId', 'name email')
      .populate('facultyHeadId', 'name email');
      
    if (!student || student.role !== 'student') {
      return res.status(404).json({ success: false, message: "Student not found" });
    }
    
    res.status(200).json({ 
      success: true, 
      data: { 
        student: {
          _id: student._id,
          name: student.name,
          email: student.email,
          university_name: student.university_name
        },
        universityAdviser: student.universityAdviserId || null,
        facultyHead: student.facultyHeadId || null
      } 
    });
  } catch (e) {
    console.error("Get student university advisers error:", e);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get students by program for Company Adviser selection
const getStudentsByProgram = async (req, res) => {
  try {
    const { programId } = req.params;

    if (!programId) {
      return res.status(400).json({
        success: false,
        message: "Program ID is required"
      });
    }

    console.log('Fetching students for program ID:', programId);

    // First, let's check if the program exists
    const Program = require('../models/Program');
    const program = await Program.findById(programId);
    console.log('Program found:', program ? program.name : 'Not found');

    // Get all students first to see what we have
    const allStudents = await User.find({ role: 'student' })
      .select('name email university_name groupAssignment')
      .limit(5);
    console.log('Sample students in database:', allStudents.map(s => ({
      name: s.name,
      hasGroupAssignment: !!s.groupAssignment,
      programId: s.groupAssignment?.programId
    })));

    // Find students who are assigned to this program
    let students = [];
    
    try {
      students = await User.find({
        role: 'student',
        'groupAssignment.programId': programId
      })
      .populate('groupAssignment.programId', 'name')
      .select('name email university_name groupAssignment')
      .sort({ name: 1 });
      
      console.log('Students found with groupAssignment.programId:', students.length);
    } catch (queryError) {
      console.error('Error in primary student query:', queryError);
      students = [];
    }

    // If no students found, try finding through applications
    if (students.length === 0) {
      try {
        const Application = require('../models/Application');
        const applications = await Application.find({ 
          programId: programId,
          status: 'accepted'
        }).populate('studentId', 'name email university_name groupAssignment');
        
        students = applications.map(app => app.studentId).filter(student => student);
        console.log('Students found through applications:', students.length);
      } catch (appError) {
        console.error('Error querying applications:', appError);
        // Don't return error here, continue with empty array
      }
    }

    console.log('Final students to return:', students.length);
    console.log('Response structure check - success: true, data.students:', students.length);

    // Always return success: true with students array (even if empty)
    return res.status(200).json({
      success: true,
      data: { students },
      debug: {
        programId,
        programExists: !!program,
        studentsFound: students.length,
        message: students.length === 0 ? 'No students found for this program' : `Found ${students.length} students`
      }
    });

  } catch (error) {
    console.error('Error fetching students by program:', error);
    console.error('Error stack:', error.stack);
    
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// Get students assigned to University Adviser (with parameter support for backward compatibility)
const getStudentsAssignedToUniversityAdviserWithParam = async (req, res) => {
  try {
    // Use ID from URL parameter if provided, otherwise use authenticated user ID
    const universityAdviserId = req.params.id || req.user._id;
    
    console.log('Fetching students for University Adviser ID:', universityAdviserId);
    
    const students = await User.find({
      role: 'student',
      universityAdviserId: universityAdviserId,
      isActive: true
    })
    .select('name email university_name profile groupAssignment')
    .populate('groupAssignment.programId', 'name')
    .sort({ name: 1 });

    console.log(`Found ${students.length} students assigned to University Adviser ${universityAdviserId}`);

    const formattedStudents = students.map(student => ({
      _id: student._id,
      name: student.name,
      email: student.email,
      profile: {
        university: student.university_name || student.profile?.university,
        course: student.profile?.course,
        graduationYear: student.profile?.graduationYear
      },
      groupAssignment: {
        programName: student.groupAssignment?.programId?.name
      }
    }));

    res.status(200).json({
      success: true,
      data: { students: formattedStudents }
    });
  } catch (error) {
    console.error('Error fetching students for University Adviser:', error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// Get students assigned to Faculty Head
const getStudentsAssignedToFacultyHead = async (req, res) => {
  try {
    // Use ID from URL parameter if provided, otherwise use authenticated user ID
    const facultyHeadId = req.params.id || req.user._id;
    
    console.log('Fetching students for Faculty Head ID:', facultyHeadId);
    
    // Find all students where this user is assigned as facultyHeadId
    const students = await User.find({
      role: 'student',
      facultyHeadId: facultyHeadId,
      isActive: true
    })
    .select('name email university_name profile groupAssignment')
    .populate('groupAssignment.programId', 'name')
    .sort({ name: 1 });
    
    console.log(`Found ${students.length} students assigned to Faculty Head ${facultyHeadId}`);
    
    // Transform students to match expected format
    const formattedStudents = students.map(student => ({
      _id: student._id,
      name: student.name,
      email: student.email,
      profile: {
        university: student.university_name || student.profile?.university,
        course: student.profile?.course,
        graduationYear: student.profile?.graduationYear
      },
      groupAssignment: {
        programName: student.groupAssignment?.programId?.name
      }
    }));
    
    res.status(200).json({
      success: true,
      data: { students: formattedStudents }
    });
  } catch (error) {
    console.error('Error fetching students for Faculty Head:', error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// Get students grouped by program for assignment UI
const getStudentsGroupedByProgram = async (req, res) => {
  try {
    console.log('Fetching students grouped by program...');
    
    // Find all students with their program information
    const students = await User.find({
      role: 'student',
      isActive: true
    })
    .select('name email university_name profile groupAssignment companyAdviserId')
    .populate('groupAssignment.programId', 'name description')
    .sort({ name: 1 });

    console.log(`Found ${students.length} total students`);

    // Group students by program
    const programGroups = {};
    
    students.forEach(student => {
      const programId = student.groupAssignment?.programId?._id?.toString();
      const programName = student.groupAssignment?.programId?.name || 'Unassigned Program';
      
      if (!programGroups[programId || 'unassigned']) {
        programGroups[programId || 'unassigned'] = {
          programId: programId || null,
          programName: programName,
          students: []
        };
      }
      
      programGroups[programId || 'unassigned'].students.push({
        _id: student._id,
        name: student.name,
        email: student.email,
        university: student.university_name || student.profile?.university,
        course: student.profile?.course,
        graduationYear: student.profile?.graduationYear,
        hasCompanyAdviser: !!student.companyAdviserId,
        programId: programId
      });
    });

    // Convert to array format
    const groupedStudents = Object.values(programGroups);
    
    console.log(`Students grouped into ${groupedStudents.length} programs`);
    groupedStudents.forEach(group => {
      console.log(`Program: ${group.programName} - ${group.students.length} students`);
    });

    res.status(200).json({
      success: true,
      data: { programGroups: groupedStudents }
    });
  } catch (error) {
    console.error('Error fetching students grouped by program:', error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// Get company advisers for a specific program
const getCompanyAdvisersByProgram = async (req, res) => {
  try {
    const { programId } = req.params;
    console.log('Fetching company advisers for program:', programId);
    
    // Find company advisers linked to this program
    const companyAdvisers = await User.find({
      role: 'companyAdviser',
      isActive: true,
      linkedProgramId: programId
    })
    .select('name email company_name linkedProgramId')
    .populate('linkedProgramId', 'name')
    .sort({ name: 1 });

    console.log(`Found ${companyAdvisers.length} company advisers for program ${programId}`);

    const formattedAdvisers = companyAdvisers.map(adviser => ({
      _id: adviser._id,
      name: adviser.name,
      email: adviser.email,
      company: adviser.company_name,
      programId: adviser.linkedProgramId?._id,
      programName: adviser.linkedProgramId?.name
    }));

    res.status(200).json({
      success: true,
      data: { companyAdvisers: formattedAdvisers }
    });
  } catch (error) {
    console.error('Error fetching company advisers by program:', error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// Assign company adviser to student
const assignCompanyAdviserToStudent = async (req, res) => {
  try {
    const { studentId, companyAdviserId } = req.body;
    
    console.log('Assigning company adviser to student:', { studentId, companyAdviserId });
    
    // Validate inputs
    if (!studentId || !companyAdviserId) {
      return res.status(400).json({
        success: false,
        message: "Student ID and Company Adviser ID are required"
      });
    }

    // Find student and company adviser
    const student = await User.findById(studentId).populate('groupAssignment.programId', 'name');
    const companyAdviser = await User.findById(companyAdviserId).populate('linkedProgramId', 'name');
    
    if (!student || student.role !== 'student') {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }
    
    if (!companyAdviser || companyAdviser.role !== 'companyAdviser') {
      return res.status(404).json({
        success: false,
        message: "Company Adviser not found"
      });
    }

    // Verify program consistency
    const studentProgramId = student.groupAssignment?.programId?._id?.toString();
    const adviserProgramId = companyAdviser.linkedProgramId?._id?.toString();
    
    if (studentProgramId !== adviserProgramId) {
      return res.status(400).json({
        success: false,
        message: `Program mismatch: Student belongs to ${student.groupAssignment?.programId?.name || 'Unknown'} but Company Adviser is linked to ${companyAdviser.linkedProgramId?.name || 'Unknown'}`
      });
    }

    // Update student's company adviser assignment
    await User.findByIdAndUpdate(studentId, {
      companyAdviserId: companyAdviserId
    });

    console.log(`Successfully assigned Company Adviser ${companyAdviser.name} to Student ${student.name}`);

    // Log the activity
    const activityLog = new ActivityLog({
      userId: req.user._id,
      action: 'assign_company_adviser',
      targetId: studentId,
      details: {
        studentName: student.name,
        companyAdviserName: companyAdviser.name,
        programName: student.groupAssignment?.programId?.name
      },
      timestamp: new Date()
    });
    await activityLog.save();

    res.status(200).json({
      success: true,
      message: `Successfully assigned ${companyAdviser.name} to ${student.name}`,
      data: {
        student: {
          _id: student._id,
          name: student.name,
          programName: student.groupAssignment?.programId?.name
        },
        companyAdviser: {
          _id: companyAdviser._id,
          name: companyAdviser.name,
          company: companyAdviser.company_name
        }
      }
    });
  } catch (error) {
    console.error('Error assigning company adviser to student:', error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// Get unassigned students grouped by program for company adviser assignment
const getUnassignedStudentsByProgram = async (req, res) => {
  try {
    console.log('=== FETCHING UNASSIGNED STUDENTS BY PROGRAM ===');
    
    // APPROACH 1: Try to get students with populated groupAssignment.programId
    console.log('APPROACH 1: Querying students with groupAssignment.programId...');
    let studentsWithGroupAssignment = await User.find({
      role: 'student',
      isActive: true,
      'groupAssignment.programId': { $exists: true, $ne: null },
      $and: [
        {
          $or: [
            { companyAdviserId: { $exists: false } },
            { companyAdviserId: null }
          ]
        }
      ]
    })
    .select('name email university_name profile groupAssignment companyAdviserId')
    .populate({
      path: 'groupAssignment.programId',
      select: 'name description'
    })
    .sort({ name: 1 });
    
    console.log(`Found ${studentsWithGroupAssignment.length} students with groupAssignment.programId`);

    // APPROACH 2: Get students through accepted applications (fallback)
    console.log('APPROACH 2: Querying students through accepted applications...');
    const Application = require('../models/Application');
    
    // First get all accepted applications with program info
    const acceptedApplications = await Application.find({ 
      status: 'accepted' 
    }).populate({
      path: 'programId',
      select: 'name description'
    });
    
    // Extract unique student IDs from applications
    const studentIdsFromApps = acceptedApplications
      .filter(app => app.studentId && app.programId)
      .map(app => app.studentId);
    
    // Now directly query User model for these students, excluding assigned ones
    const unassignedStudentsFromApps = await User.find({
      _id: { $in: studentIdsFromApps },
      role: 'student',
      isActive: true,
      $and: [
        {
          $or: [
            { companyAdviserId: { $exists: false } },
            { companyAdviserId: null }
          ]
        }
      ]
    }).select('name email university_name profile groupAssignment companyAdviserId isActive');
    
    console.log(`Found ${unassignedStudentsFromApps.length} unassigned students from applications`);
    
    // Debug: Log each unassigned student found
    unassignedStudentsFromApps.forEach((student, index) => {
      console.log(`📋 Unassigned Student ${index + 1}: ${student.name} (${student._id})`);
      console.log(`   - companyAdviserId: ${student.companyAdviserId}`);
      console.log(`   - isActive: ${student.isActive}`);
    });
    
    // Direct approach: For each unassigned student, find their application to get program info
    const validApplications = [];
    
    for (const unassignedStudent of unassignedStudentsFromApps) {
      console.log(`🔍 Processing unassigned student: ${unassignedStudent.name} (${unassignedStudent._id})`);
      
      // Find the application for this unassigned student
      // Handle both cases: studentId as ObjectId and studentId as populated student object
      const studentApplication = acceptedApplications.find(app => {
        if (!app.studentId) return false;
        
        // If studentId is a populated object, compare with _id field
        if (typeof app.studentId === 'object' && app.studentId._id) {
          return app.studentId._id.toString() === unassignedStudent._id.toString();
        }
        
        // If studentId is just an ObjectId, compare directly
        return app.studentId.toString() === unassignedStudent._id.toString();
      });
      
      if (studentApplication && studentApplication.programId) {
        console.log(`✅ Found application for ${unassignedStudent.name} → ${studentApplication.programId.name}`);
        validApplications.push({
          studentId: unassignedStudent,
          programId: studentApplication.programId
        });
      } else {
        console.log(`❌ No application found for unassigned student: ${unassignedStudent.name}`);
        console.log(`   - Available application student IDs:`, acceptedApplications.map(app => app.studentId?.toString()).filter(Boolean));
      }
    }
    
    console.log(`Found ${validApplications.length} valid unassigned applications`);
    
    // Create a comprehensive student list
    const allStudents = new Map();
    
    // Add students from groupAssignment approach
    studentsWithGroupAssignment.forEach(student => {
      allStudents.set(student._id.toString(), {
        _id: student._id,
        name: student.name,
        email: student.email,
        university_name: student.university_name,
        profile: student.profile,
        companyAdviserId: student.companyAdviserId,
        programInfo: {
          _id: student.groupAssignment.programId._id,
          name: student.groupAssignment.programId.name,
          description: student.groupAssignment.programId.description
        },
        source: 'groupAssignment'
      });
    });
    
    // Add/update students from applications approach (prioritize if not already added)
    validApplications.forEach(app => {
      const studentId = app.studentId._id.toString();
      if (!allStudents.has(studentId)) {
        allStudents.set(studentId, {
          _id: app.studentId._id,
          name: app.studentId.name,
          email: app.studentId.email,
          university_name: app.studentId.university_name,
          profile: app.studentId.profile,
          companyAdviserId: app.studentId.companyAdviserId,
          programInfo: {
            _id: app.programId._id,
            name: app.programId.name,
            description: app.programId.description
          },
          source: 'application'
        });
      }
    });
    
    const finalStudents = Array.from(allStudents.values());
    console.log(`Total unique unassigned students: ${finalStudents.length}`);
    
    // Debug: Log each student's program assignment and company adviser status
    console.log('=== DEBUGGING STUDENT COMPANY ADVISER STATUS ===');
    finalStudents.forEach((student, index) => {
      console.log(`Student ${index + 1}: ${student.name} (${student.source})`);
      console.log(`  - programId: ${student.programInfo?._id}`);
      console.log(`  - programName: ${student.programInfo?.name}`);
      console.log(`  - companyAdviserId: ${student.companyAdviserId}`);
      console.log(`  - companyAdviserId type: ${typeof student.companyAdviserId}`);
      console.log(`  - has companyAdviserId: ${!!student.companyAdviserId}`);
      console.log(`  - should be excluded: ${student.companyAdviserId && student.companyAdviserId !== null}`);
    });

    // Group students by program with case-insensitive, robust matching
    const programGroups = {};
    const normalizedProgramNames = new Map(); // Track normalized names to original names
    
    finalStudents.forEach(student => {
      const programName = student.programInfo?.name;
      
      if (programName) {
        // Normalize program name for consistent grouping (trim, case-insensitive)
        const normalizedName = programName.trim().toLowerCase();
        
        // Check if we've seen this normalized name before
        let groupKey = programName; // Default to original name
        for (const [existingNormalized, existingOriginal] of normalizedProgramNames.entries()) {
          if (existingNormalized === normalizedName) {
            groupKey = existingOriginal;
            break;
          }
        }
        
        // If this is a new program name, track it
        if (!normalizedProgramNames.has(normalizedName)) {
          normalizedProgramNames.set(normalizedName, programName);
          groupKey = programName;
        }
        
        // Create program group if it doesn't exist
        if (!programGroups[groupKey]) {
          programGroups[groupKey] = {
            programName: groupKey,
            students: []
          };
        }
        
        console.log(`Adding ${student.name} to program: ${groupKey}`);
        programGroups[groupKey].students.push({
          _id: student._id,
          name: student.name,
          email: student.email,
          university: student.university_name || student.profile?.university,
          course: student.profile?.course,
          graduationYear: student.profile?.graduationYear,
          programId: student.programInfo._id,
          programName: groupKey
        });
      } else {
        console.log(`Student ${student.name} has no program assignment - adding to Unassigned group`);
        
        // If student has no program assignment, add them to a special "Unassigned" group
        if (!programGroups['Unassigned Students']) {
          programGroups['Unassigned Students'] = {
            programName: 'Unassigned Students',
            students: []
          };
        }
        programGroups['Unassigned Students'].students.push({
          _id: student._id,
          name: student.name,
          email: student.email,
          university: student.university_name || student.profile?.university,
          course: student.profile?.course,
          graduationYear: student.profile?.graduationYear,
          programId: null,
          programName: 'Unassigned'
        });
      }
    });

    // Convert to array format and ensure consistent ordering
    const groupedStudents = Object.values(programGroups)
      .sort((a, b) => {
        // Put "Unassigned Students" at the end
        if (a.programName === 'Unassigned Students') return 1;
        if (b.programName === 'Unassigned Students') return -1;
        return a.programName.localeCompare(b.programName);
      });
    
    console.log('=== FINAL PROGRAM GROUPS ===');
    groupedStudents.forEach(group => {
      console.log(`📁 ${group.programName}: ${group.students.length} students`);
      group.students.forEach(student => {
        console.log(`   👤 ${student.name} (${student.email})`);
      });
    });

    const responseData = {
      success: true,
      data: { programGroups: groupedStudents },
      meta: {
        totalStudents: finalStudents.length,
        totalPrograms: groupedStudents.length,
        studentsFromGroupAssignment: studentsWithGroupAssignment.length,
        studentsFromApplications: validApplications.length
      }
    };
    
    console.log('=== RESPONSE STRUCTURE ===');
    console.log(JSON.stringify(responseData, null, 2));

    res.status(200).json(responseData);
  } catch (error) {
    console.error('❌ Error fetching unassigned students by program:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// Assign multiple students to one company adviser
const assignStudentsToCompanyAdviser = async (req, res) => {
  try {
    const { studentIds, adviserId } = req.body;
    
    console.log('Assigning students to company adviser:', { studentIds, adviserId });
    
    // Validate inputs
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Student IDs array is required"
      });
    }

    if (!adviserId) {
      return res.status(400).json({
        success: false,
        message: "Company Adviser ID is required"
      });
    }

    // Find students and company adviser with comprehensive program data
    const students = await User.find({
      _id: { $in: studentIds },
      role: 'student'
    }).populate('groupAssignment.programId', 'name');
    
    const companyAdviser = await User.findById(adviserId).populate('linkedProgramId', 'name');
    
    console.log('=== ASSIGNMENT VALIDATION DEBUG ===');
    console.log('Students found:', students.length);
    students.forEach((student, index) => {
      console.log(`Student ${index + 1}: ${student.name}`);
      console.log(`  - groupAssignment:`, student.groupAssignment);
      console.log(`  - programId:`, student.groupAssignment?.programId?._id);
      console.log(`  - programName:`, student.groupAssignment?.programId?.name);
    });
    
    console.log('Company Adviser:', companyAdviser?.name);
    console.log('  - linkedProgramId:', companyAdviser?.linkedProgramId?._id);
    console.log('  - linkedProgramName:', companyAdviser?.linkedProgramId?.name);
    
    if (students.length !== studentIds.length) {
      return res.status(404).json({
        success: false,
        message: "Some students not found"
      });
    }
    
    if (!companyAdviser || companyAdviser.role !== 'companyAdviser') {
      return res.status(404).json({
        success: false,
        message: "Company Adviser not found"
      });
    }

    // Get student programs using both groupAssignment and Application fallback
    const Application = require('../models/Application');
    
    // Enhanced student program detection
    const studentsWithPrograms = await Promise.all(students.map(async (student) => {
      let programInfo = null;
      
      // Try groupAssignment first
      if (student.groupAssignment?.programId) {
        programInfo = {
          _id: student.groupAssignment.programId._id,
          name: student.groupAssignment.programId.name
        };
        console.log(`Student ${student.name}: Found program via groupAssignment - ${programInfo.name}`);
      } else {
        // Fallback to accepted applications
        const acceptedApp = await Application.findOne({
          studentId: student._id,
          status: 'accepted'
        }).populate('programId', 'name');
        
        if (acceptedApp?.programId) {
          programInfo = {
            _id: acceptedApp.programId._id,
            name: acceptedApp.programId.name
          };
          console.log(`Student ${student.name}: Found program via application - ${programInfo.name}`);
        } else {
          console.log(`Student ${student.name}: No program found in groupAssignment or applications`);
        }
      }
      
      return {
        student,
        programInfo
      };
    }));
    
    // Check if all students have programs
    const studentsWithoutPrograms = studentsWithPrograms.filter(s => !s.programInfo);
    if (studentsWithoutPrograms.length > 0) {
      const studentNames = studentsWithoutPrograms.map(s => s.student.name).join(', ');
      return res.status(400).json({
        success: false,
        message: `Students without program assignments: ${studentNames}. Please assign them to programs first.`
      });
    }
    
    // Verify all students belong to the same program
    const studentPrograms = studentsWithPrograms.map(s => s.programInfo._id.toString());
    const uniquePrograms = [...new Set(studentPrograms)];
    
    console.log('Student programs:', studentPrograms);
    console.log('Unique programs:', uniquePrograms);
    
    if (uniquePrograms.length > 1) {
      const programNames = studentsWithPrograms.map(s => s.programInfo.name);
      return res.status(400).json({
        success: false,
        message: `All students must belong to the same program. Found: ${[...new Set(programNames)].join(', ')}`
      });
    }

    // Get the student program info
    const studentProgramId = uniquePrograms[0];
    const studentProgramName = studentsWithPrograms[0].programInfo.name;
    
    console.log('Student program:', { id: studentProgramId, name: studentProgramName });
    
    // Check Company Adviser program linking
    const adviserProgramId = companyAdviser.linkedProgramId?._id?.toString();
    const adviserProgramName = companyAdviser.linkedProgramId?.name;
    
    console.log('Adviser program:', { id: adviserProgramId, name: adviserProgramName });
    
    // If Company Adviser has no linked program, allow assignment but warn
    if (!adviserProgramId) {
      console.log('⚠️ Company Adviser has no linked program - allowing assignment');
    } else if (studentProgramId !== adviserProgramId) {
      return res.status(400).json({
        success: false,
        message: `Program mismatch: Students belong to "${studentProgramName}" but Company Adviser is linked to "${adviserProgramName}"`
      });
    }

    // Check if any students already have a company adviser with detailed information
    const assignedStudents = await Promise.all(
      students.filter(s => s.companyAdviserId).map(async (student) => {
        const currentAdviser = await User.findById(student.companyAdviserId).select('name');
        return {
          studentName: student.name,
          adviserName: currentAdviser?.name || 'Unknown Adviser'
        };
      })
    );
    
    if (assignedStudents.length > 0) {
      const conflictMessages = assignedStudents.map(
        ({ studentName, adviserName }) => `${studentName} is already assigned to ${adviserName}`
      );
      
      return res.status(400).json({
        success: false,
        message: conflictMessages.length === 1 
          ? conflictMessages[0]
          : `Multiple assignment conflicts: ${conflictMessages.join('; ')}`
      });
    }

    // Update students with company adviser assignment
    const updateResult = await User.updateMany(
      { _id: { $in: studentIds } },
      { 
        $set: { 
          companyAdviserId: adviserId,
          updatedAt: new Date()
        }
      }
    );

    console.log(`📝 Assignment update result:`, updateResult);

    // Auto-link University Adviser and Faculty Head based on student's university
    console.log(`🔗 AUTO-LINKING: Setting up University Adviser and Faculty Head links...`);
    
    for (const studentId of studentIds) {
      const student = await User.findById(studentId);
      if (student && student.university_name) {
        console.log(`🔗 AUTO-LINKING: Processing ${student.name} from ${student.university_name}`);
        
        // Find University Adviser for this student's university
        const universityAdviser = await User.findOne({
          role: 'universityAdviser',
          university_name: { $regex: new RegExp(student.university_name, 'i') }
        });
        
        // Find Faculty Head for this student's university
        const facultyHead = await User.findOne({
          role: 'facultyHead',
          university_name: { $regex: new RegExp(student.university_name, 'i') }
        });
        
        // Update student with adviser links
        const updateData = {};
        if (universityAdviser) {
          updateData.universityAdviserId = universityAdviser._id;
          console.log(`🔗 AUTO-LINKING: Linked ${student.name} to University Adviser ${universityAdviser.name}`);
        }
        if (facultyHead) {
          updateData.facultyHeadId = facultyHead._id;
          console.log(`🔗 AUTO-LINKING: Linked ${student.name} to Faculty Head ${facultyHead.name}`);
        }
        
        if (Object.keys(updateData).length > 0) {
          await User.findByIdAndUpdate(studentId, { $set: updateData });
          console.log(`✅ AUTO-LINKING: Updated ${student.name} with adviser links`);
        } else {
          console.log(`⚠️ AUTO-LINKING: No University Adviser or Faculty Head found for ${student.university_name}`);
        }
      }
    }

    // Verify the assignments were saved
    const verifyAssignments = await User.find({
      _id: { $in: studentIds }
    }).select('name email companyAdviserId universityAdviserId facultyHeadId university_name')
      .populate('universityAdviserId', 'name email')
      .populate('facultyHeadId', 'name email');

    console.log(`✅ Verification - Students after assignment with auto-linking:`);
    verifyAssignments.forEach(student => {
      console.log(`  - ${student.name} (${student.university_name}):`);
      console.log(`    • Company Adviser: ${student.companyAdviserId}`);
      console.log(`    • University Adviser: ${student.universityAdviserId?.name || 'None'}`);
      console.log(`    • Faculty Head: ${student.facultyHeadId?.name || 'None'}`);
    });

    // Log the activity
    const activityLog = new ActivityLog({
      userId: req.user._id,
      action: 'bulk_assign_company_adviser',
      targetId: adviserId,
      details: {
        companyAdviserName: companyAdviser.name,
        studentCount: students.length,
        studentNames: students.map(s => s.name),
        programName: students[0]?.groupAssignment?.programId?.name
      },
      timestamp: new Date()
    });
    await activityLog.save();

    res.status(200).json({
      success: true,
      message: `Successfully assigned ${companyAdviser.name} to ${students.length} student(s)`,
      data: {
        assignedCount: students.length,
        companyAdviser: {
          _id: companyAdviser._id,
          name: companyAdviser.name,
          company: companyAdviser.company_name
        },
        students: students.map(s => ({
          _id: s._id,
          name: s.name,
          programName: s.groupAssignment?.programId?.name
        }))
      }
    });
  } catch (error) {
    console.error('Error assigning students to company adviser:', error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// Debug endpoint to check all students and their assignment status
const debugStudentAssignments = async (req, res) => {
  try {
    console.log('Debug: Fetching all students with assignment details...');
    
    const allStudents = await User.find({
      role: 'student',
      isActive: true
    })
    .select('name email university_name profile groupAssignment companyAdviserId')
    .populate('groupAssignment.programId', 'name description')
    .populate('companyAdviserId', 'name company_name')
    .sort({ name: 1 });

    console.log(`Total active students: ${allStudents.length}`);

    const debugData = allStudents.map(student => ({
      _id: student._id,
      name: student.name,
      email: student.email,
      university: student.university_name,
      programId: student.groupAssignment?.programId?._id,
      programName: student.groupAssignment?.programId?.name,
      hasGroupAssignment: !!student.groupAssignment,
      companyAdviserId: student.companyAdviserId,
      companyAdviserName: student.companyAdviserId?.name,
      isUnassigned: !student.companyAdviserId
    }));

    // Group by assignment status
    const assigned = debugData.filter(s => s.companyAdviserId);
    const unassigned = debugData.filter(s => !s.companyAdviserId);
    const withProgram = debugData.filter(s => s.programName);
    const withoutProgram = debugData.filter(s => !s.programName);

    console.log(`Assigned to company adviser: ${assigned.length}`);
    console.log(`Unassigned: ${unassigned.length}`);
    console.log(`With program: ${withProgram.length}`);
    console.log(`Without program: ${withoutProgram.length}`);

    res.status(200).json({
      success: true,
      data: {
        totalStudents: allStudents.length,
        assigned: assigned.length,
        unassigned: unassigned.length,
        withProgram: withProgram.length,
        withoutProgram: withoutProgram.length,
        students: debugData
      }
    });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// Get students assigned to a University Adviser
const getStudentsAssignedToUniversityAdviser = async (req, res) => {
  try {
    const adviserId = req.user.id; // Get adviser ID from authenticated user
    
    console.log(`Fetching students assigned to University Adviser: ${adviserId}`);
    
    // Find students assigned to this university adviser
    const students = await User.find({
      role: 'student',
      isActive: true,
      universityAdviserId: adviserId
    })
    .select('name email university_name profile groupAssignment companyAdviserId universityAdviserId')
    .populate({
      path: 'groupAssignment.programId',
      select: 'name description'
    })
    .populate('companyAdviserId', 'name email profile')
    .sort({ name: 1 });

    // Get accepted applications for each student to fetch internship dates
    const Application = require('../models/Application');
    const studentsWithApplications = await Promise.all(
      students.map(async (student) => {
        const acceptedApplication = await Application.findOne({
          studentId: student._id,
          status: 'accepted'
        }).select('preferredStartDate preferredEndDate desiredDuration programId')
        .populate('programId', 'name');
        
        return {
          ...student.toObject(),
          acceptedApplication
        };
      })
    );

    console.log(`Found ${studentsWithApplications.length} students assigned to University Adviser`);

    // Format student data for dashboard
    const formattedStudents = studentsWithApplications.map(student => ({
      _id: student._id,
      name: student.name,
      email: student.email,
      university: student.university_name || student.profile?.university,
      course: student.profile?.course,
      graduationYear: student.profile?.graduationYear,
      program: {
        id: student.groupAssignment?.programId?._id,
        name: student.groupAssignment?.programId?.name
      },
      companyAdviser: student.companyAdviserId ? {
        id: student.companyAdviserId._id,
        name: student.companyAdviserId.name,
        email: student.companyAdviserId.email,
        company: student.companyAdviserId.profile?.companyName
      } : null,
      hasCompanyAdviser: !!student.companyAdviserId,
      acceptedApplication: student.acceptedApplication ? {
        _id: student.acceptedApplication._id,
        preferredStartDate: student.acceptedApplication.preferredStartDate,
        preferredEndDate: student.acceptedApplication.preferredEndDate,
        desiredDuration: student.acceptedApplication.desiredDuration,
        programId: student.acceptedApplication.programId,
        status: 'accepted'
      } : null
    }));

    res.status(200).json({
      success: true,
      data: {
        students: formattedStudents,
        totalStudents: formattedStudents.length,
        studentsWithCompanyAdviser: formattedStudents.filter(s => s.hasCompanyAdviser).length,
        studentsWithoutCompanyAdviser: formattedStudents.filter(s => !s.hasCompanyAdviser).length
      }
    });

  } catch (error) {
    console.error('Error fetching students for University Adviser:', error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// Get students assigned to a Company Adviser
const getStudentsAssignedToCompanyAdviser = async (req, res) => {
  try {
    console.log('🚨🚨🚨 COMPANY ADVISER DASHBOARD API CALLED 🚨🚨🚨');
    const adviserId = req.user.id; // Get adviser ID from authenticated user
    
    console.log(`🔍 Fetching students assigned to Company Adviser: ${adviserId}`);
    console.log(`🔍 Adviser ID type: ${typeof adviserId}`);
    
    // Debug: Check if any students have this companyAdviserId
    const allStudentsWithCompanyAdviser = await User.find({
      role: 'student',
      companyAdviserId: { $exists: true, $ne: null }
    }).select('name companyAdviserId');
    
    console.log(`🔍 Total students with any company adviser: ${allStudentsWithCompanyAdviser.length}`);
    allStudentsWithCompanyAdviser.forEach(s => {
      console.log(`  - ${s.name}: companyAdviserId = ${s.companyAdviserId} (type: ${typeof s.companyAdviserId})`);
    });
    
    // Try both string and ObjectId versions of the query
    console.log(`🔍 Trying query with adviserId as string: "${adviserId}"`);
    const studentsString = await User.find({
      role: 'student',
      isActive: true,
      companyAdviserId: adviserId
    }).select('name companyAdviserId');
    
    console.log(`🔍 Found ${studentsString.length} students with string query`);
    
    // Also try with ObjectId conversion
    const mongoose = require('mongoose');
    let studentsObjectId = [];
    try {
      const objectIdAdviserId = new mongoose.Types.ObjectId(adviserId);
      console.log(`🔍 Trying query with adviserId as ObjectId: ${objectIdAdviserId}`);
      studentsObjectId = await User.find({
        role: 'student',
        isActive: true,
        companyAdviserId: objectIdAdviserId
      }).select('name companyAdviserId');
      console.log(`🔍 Found ${studentsObjectId.length} students with ObjectId query`);
    } catch (objIdError) {
      console.log(`🔍 ObjectId conversion failed: ${objIdError.message}`);
    }
    
    // Find students assigned to this company adviser
    const students = await User.find({
      role: 'student',
      isActive: true,
      companyAdviserId: adviserId
    })
    .select('name email university_name profile groupAssignment universityAdviserId')
    .populate({
      path: 'groupAssignment.programId',
      select: 'name description'
    })
    .populate('universityAdviserId', 'name email university_name')
    .sort({ name: 1 });

    // Get accepted applications for each student to fetch internship dates
    const Application = require('../models/Application');
    const studentsWithApplications = await Promise.all(
      students.map(async (student) => {
        const acceptedApplication = await Application.findOne({
          studentId: student._id,
          status: 'accepted'
        }).select('preferredStartDate preferredEndDate desiredDuration programId')
        .populate('programId', 'name');
        
        return {
          ...student.toObject(),
          acceptedApplication
        };
      })
    );

    console.log(`Found ${studentsWithApplications.length} students assigned to Company Adviser`);

    // Format student data for dashboard
    const formattedStudents = studentsWithApplications.map(student => ({
      _id: student._id,
      name: student.name,
      email: student.email,
      university: student.university_name || student.profile?.university,
      course: student.profile?.course,
      graduationYear: student.profile?.graduationYear,
      program: {
        id: student.groupAssignment?.programId?._id,
        name: student.groupAssignment?.programId?.name
      },
      universityAdviser: student.universityAdviserId ? {
        id: student.universityAdviserId._id,
        name: student.universityAdviserId.name,
        email: student.universityAdviserId.email,
        university: student.universityAdviserId.university_name
      } : null,
      hasUniversityAdviser: !!student.universityAdviserId,
      acceptedApplication: student.acceptedApplication ? {
        _id: student.acceptedApplication._id,
        preferredStartDate: student.acceptedApplication.preferredStartDate,
        preferredEndDate: student.acceptedApplication.preferredEndDate,
        desiredDuration: student.acceptedApplication.desiredDuration,
        programId: student.acceptedApplication.programId,
        status: 'accepted'
      } : null
    }));

    res.status(200).json({
      success: true,
      data: {
        students: formattedStudents,
        totalStudents: formattedStudents.length,
        studentsWithUniversityAdviser: formattedStudents.filter(s => s.hasUniversityAdviser).length,
        studentsWithoutUniversityAdviser: formattedStudents.filter(s => !s.hasUniversityAdviser).length
      }
    });

  } catch (error) {
    console.error('Error fetching students for Company Adviser:', error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// Get adviser dashboard statistics
const getAdviserDashboardStats = async (req, res) => {
  try {
    const adviserId = req.user.id;
    const adviserRole = req.user.role;
    
    console.log(`Fetching dashboard stats for ${adviserRole}: ${adviserId}`);
    
    let students = [];
    let additionalStats = {};
    
    if (adviserRole === 'universityAdviser') {
      // Get students assigned to this university adviser
      students = await User.find({
        role: 'student',
        isActive: true,
        universityAdviserId: adviserId
      })
      .select('name email companyAdviserId groupAssignment')
      .populate('groupAssignment.programId', 'name');
      
      additionalStats = {
        studentsWithCompanyAdviser: students.filter(s => s.companyAdviserId).length,
        studentsWithoutCompanyAdviser: students.filter(s => !s.companyAdviserId).length
      };
      
    } else if (adviserRole === 'companyAdviser') {
      // Get students assigned to this company adviser
      students = await User.find({
        role: 'student',
        isActive: true,
        companyAdviserId: adviserId
      })
      .select('name email universityAdviserId groupAssignment')
      .populate('groupAssignment.programId', 'name');
      
      additionalStats = {
        studentsWithUniversityAdviser: students.filter(s => s.universityAdviserId).length,
        studentsWithoutUniversityAdviser: students.filter(s => !s.universityAdviserId).length
      };
    }
    
    // Group students by program
    const programGroups = {};
    students.forEach(student => {
      const programName = student.groupAssignment?.programId?.name || 'Unassigned';
      if (!programGroups[programName]) {
        programGroups[programName] = 0;
      }
      programGroups[programName]++;
    });

    res.status(200).json({
      success: true,
      data: {
        totalStudents: students.length,
        programDistribution: programGroups,
        ...additionalStats,
        role: adviserRole
      }
    });

  } catch (error) {
    console.error('Error fetching adviser dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// Test endpoint to check company adviser assignments
const testCompanyAdviserAssignment = async (req, res) => {
  try {
    console.log('🧪 TEST ENDPOINT: Checking company adviser assignments');
    
    // Find all students with company advisers
    const studentsWithAdvisers = await User.find({
      role: 'student',
      companyAdviserId: { $exists: true, $ne: null }
    }).select('name email companyAdviserId').populate('companyAdviserId', 'name email');
    
    console.log(`Found ${studentsWithAdvisers.length} students with company advisers:`);
    studentsWithAdvisers.forEach(student => {
      console.log(`  - ${student.name}: assigned to ${student.companyAdviserId?.name} (${student.companyAdviserId?._id})`);
    });
    
    // Find the specific company adviser
    const companyAdviser = await User.findOne({
      email: 'sidama@gmail.com',
      role: 'companyAdviser'
    });
    
    if (companyAdviser) {
      console.log(`Company Adviser found: ${companyAdviser.name} (${companyAdviser._id})`);
      
      // Find students assigned to this adviser
      const assignedStudents = await User.find({
        role: 'student',
        companyAdviserId: companyAdviser._id
      }).select('name email companyAdviserId');
      
      console.log(`Students assigned to ${companyAdviser.name}: ${assignedStudents.length}`);
      assignedStudents.forEach(student => {
        console.log(`  - ${student.name} (${student.email})`);
      });
    }
    
    res.json({
      success: true,
      data: {
        totalStudentsWithAdvisers: studentsWithAdvisers.length,
        studentsWithAdvisers: studentsWithAdvisers.map(s => ({
          name: s.name,
          email: s.email,
          adviser: s.companyAdviserId?.name,
          adviserId: s.companyAdviserId?._id
        })),
        companyAdviser: companyAdviser ? {
          name: companyAdviser.name,
          id: companyAdviser._id,
          assignedStudentsCount: studentsWithAdvisers.filter(s => 
            s.companyAdviserId?._id.toString() === companyAdviser._id.toString()
          ).length
        } : null
      }
    });
    
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get students assigned to a specific company adviser (for admin assignment interface)
const getStudentsByCompanyAdviser = async (req, res) => {
  try {
    const { adviserId } = req.params;
    
    console.log(`🔍 Getting students for company adviser: ${adviserId}`);
    
    // Find all students assigned to this company adviser
    const students = await User.find({
      role: 'student',
      companyAdviserId: adviserId,
      isActive: true
    })
    .populate('groupAssignment.programId', 'name description')
    .populate('universityAdviserId', 'name email')
    .populate('facultyHeadId', 'name email')
    .select('name email university_name groupAssignment companyAdviserId universityAdviserId facultyHeadId')
    .sort({ name: 1 });

    console.log(`📊 Found ${students.length} students assigned to adviser ${adviserId}`);

    // Also get the adviser details
    const adviser = await User.findById(adviserId).select('name email company');
    
    res.json({
      success: true,
      data: {
        adviser: adviser,
        students: students,
        totalAssigned: students.length
      }
    });
    
  } catch (error) {
    console.error('❌ Error getting students by company adviser:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch students for company adviser',
      error: error.message
    });
  }
};

module.exports = {
  createTemporaryAccount,
  listTemporaryAccounts,
  updateProfile,
  unlockAccount,
  getFacultyHeadsByStudentProgram,
  submitFinalEvaluation,
  getFinalEvaluationsForFacultyHead,
  reviewFinalEvaluation,
  downloadEvaluationAttachment,
  getStudentsAssignedToUniversityAdviser,
  getStudentsAssignedToCompanyAdviser,
  getAdviserDashboardStats,
  adminResetUserPassword,
  getStudentsForSelection,
  getLinkedAdvisersForStudent,
  getStudentsByUniversity,
  getStudentsByProgram,
  getStudentUniversityAdvisers,
  getStudentsAssignedToUniversityAdviserWithParam,
  getStudentsAssignedToFacultyHead,
  getStudentsGroupedByProgram,
  getCompanyAdvisersByProgram,
  assignCompanyAdviserToStudent,
  getUnassignedStudentsByProgram,
  assignStudentsToCompanyAdviser,
  debugStudentAssignments,
  testCompanyAdviserAssignment,
  getStudentsByCompanyAdviser
};
