const AdviserLink = require("../models/AdviserLink");
const Message = require("../models/Message");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Attendance = require("../models/Attendance");
const ProgressReport = require("../models/ProgressReport");
const Evaluation = require("../models/Evaluation");
const AdviserDocument = require("../models/AdviserDocument");
const Notification = require("../models/Notification");
const Adviser = require("../models/Adviser");
const Application = require("../models/Application");
const User = require("../models/User");
const FinalEvaluation = require("../models/FinalEvaluation");
const { generateFinalEvaluationHTML } = require("../utils/pdfGenerator");

// Helper to send notification
async function notify(req, userId, title, message, relatedId, relatedModel, type = "info") {
  try {
    await Notification.create({ userId, title, message, relatedId, relatedModel, type });
    const io = req.app && req.app.get && req.app.get("io");
    if (io) {
      io.to(userId.toString()).emit("newNotification", { title, message, type });
    }
  } catch (e) {
    console.error("Notify error:", e?.message || e);
  }
}
// Create adviser account (admin)
const createAdviser = async (req, res) => {
  try {
    const { fullName, email, password, role, programId } = req.body;
    if (!["universityAdviser", "companyAdviser"].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid adviser role" });
    }
    // Create user account
    const user = await User.create({ name: fullName, email, password, role, adminApproved: true });
    // Create adviser profile
    const adviser = await Adviser.create({ fullName, role, programId, userId: user._id });
    res.status(201).json({ success: true, data: { adviser, user: user.toJSON() } });
  } catch (e) {
    console.error("Create adviser error:", e);
    const msg = e?.code === 11000 ? "Email already in use" : "Server error";
    res.status(500).json({ success: false, message: msg });
  }
};

// List advisers (admin) with optional filters: role, programId
const listAdvisers = async (req, res) => {
  try {
    const { role, programId } = req.query;
    const query = {};
    if (role) query.role = role;
    if (programId) query.programId = programId;
    const advisers = await Adviser.find(query).populate("programId", "name category").populate("userId", "name email role");
    res.status(200).json({ success: true, data: { advisers } });
  } catch (e) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// List adviser-eligible users (by role), optionally only those missing Adviser profile
const listAdviserEligibleUsers = async (req, res) => {
  try {
    const { role, missingOnly = "true" } = req.query;
    const roleFilter = {};
    if (role) roleFilter.role = role;
    else roleFilter.role = { $in: ["universityAdviser", "companyAdviser"] };

    const users = await User.find(roleFilter).select("name email role");
    const userIds = users.map((u) => u._id);
    const advisers = await Adviser.find({ userId: { $in: userIds } }).select("userId programId");
    const userIdToAdviser = new Map(advisers.map((a) => [a.userId.toString(), a]));
    const result = users
      .filter((u) => (missingOnly === "true" ? !userIdToAdviser.has(u._id.toString()) : true))
      .map((u) => ({ id: u._id, fullName: u.name, email: u.email, role: u.role, linked: !!userIdToAdviser.get(u._id.toString()), adviser: userIdToAdviser.get(u._id.toString()) || null }));
    res.status(200).json({ success: true, data: { users: result } });
  } catch (e) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Create or update Adviser entry from existing adviser User
const syncExistingAdviser = async (req, res) => {
  try {
    const { userId, programId } = req.body;
    if (!userId || !programId) return res.status(400).json({ success: false, message: "userId and programId are required" });
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    if (!["universityAdviser", "companyAdviser"].includes(user.role)) return res.status(400).json({ success: false, message: "User is not an adviser role" });
    const adviser = await Adviser.findOneAndUpdate(
      { userId: user._id },
      { fullName: user.name, role: user.role, programId, userId: user._id },
      { upsert: true, new: true }
    );
    res.status(200).json({ success: true, data: { adviser } });
  } catch (e) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// List students for admin, optionally by program
const listStudents = async (req, res) => {
  try {
    const { programId } = req.query;
    const appQuery = { status: "accepted" };
    if (programId) appQuery.programId = programId;
    const accepted = await Application.find(appQuery).select("studentId programId studentName").populate("programId", "name");
    // Map to unique students (in case of duplicates)
    const map = new Map();
    accepted.forEach((a) => {
      map.set(a.studentId.toString(), { id: a.studentId.toString(), fullName: a.studentName, programId: a.programId._id, programName: a.programId.name });
    });
    res.status(200).json({ success: true, data: { students: Array.from(map.values()) } });
  } catch (e) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get students assigned to current adviser (by programme)
const getAssignedStudents = async (req, res) => {
  try {
    const adviser = await Adviser.findOne({ userId: req.user._id });
    if (!adviser) return res.status(400).json({ success: false, message: "Adviser profile not found" });
    const query = {};
    if (adviser.role === "universityAdviser") query.universityAdviserId = req.user._id;
    if (adviser.role === "companyAdviser") query.companyAdviserId = req.user._id;
    query.programId = adviser.programId;
    const links = await AdviserLink.find(query)
      .populate({
        path: "studentId", 
        select: "name email university_name groupAssignment applications acceptancePapers",
        populate: [
          {
            path: "groupAssignment.programId",
            select: "name description"
          },
          {
            path: "applications",
            select: "status preferredStartDate preferredEndDate desiredDuration"
          }
        ]
      })
      .populate("programId", "name");
    
    const students = links.map((l) => ({
      _id: l.studentId._id.toString(),
      id: l.studentId._id.toString(), 
      name: l.studentId.name,
      fullName: l.studentId.name,
      email: l.studentId.email,
      university_name: l.studentId.university_name,
      groupAssignment: l.studentId.groupAssignment,
      applications: l.studentId.applications,
      acceptancePapers: l.studentId.acceptancePapers,
      programId: l.programId?._id || adviser.programId, 
      programName: l.programId?.name
    }));
    res.status(200).json({ success: true, data: { students } });
  } catch (e) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Create or update adviser link for a student (admin only) with program validation
const upsertAdviserLink = async (req, res) => {
  try {
    const { studentId, universityAdviserId, companyAdviserId, companyAdminId } = req.body;

    const normalizeId = (val) => {
      if (!val) return undefined;
      if (typeof val === "string") {
        const trimmed = val.trim();
        // If it's a clean 24-hex ObjectId, return as-is
        if (/^[a-fA-F0-9]{24}$/.test(trimmed)) return trimmed;
        // Try to parse JSON-stringified objects and extract id/_id
        if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("\"") && trimmed.endsWith("\""))) {
          try {
            const parsed = JSON.parse(trimmed.startsWith('"') ? JSON.parse(trimmed) : trimmed);
            const candidate = parsed?._id || parsed?.id || parsed?.studentId?._id || parsed?.userId?._id;
            if (typeof candidate === "string" && /^[a-fA-F0-9]{24}$/.test(candidate)) return candidate;
          } catch (_) {
            // fall through to regex scan
          }
        }
        // As a last resort, scan the string for a 24-hex substring (handles e.g. "_id: new ObjectId(\"...\")")
        const match = trimmed.match(/[a-fA-F0-9]{24}/);
        if (match) return match[0];
        return undefined;
      }
      if (typeof val === "object") {
        // Common shapes: {_id}, {id}, {studentId: {_id}}, {userId: {_id}}
        const direct = val._id?.toString?.() || val.id?.toString?.();
        if (direct) return direct;
        const nestedStudent = val.studentId && (val.studentId._id?.toString?.() || val.studentId.id?.toString?.());
        if (nestedStudent) return nestedStudent;
        const nestedUser = val.userId && (val.userId._id?.toString?.() || val.userId.id?.toString?.());
        if (nestedUser) return nestedUser;
      }
      return undefined;
    };

    const normalizedStudentId = normalizeId(studentId);
    const normalizedUniId = normalizeId(universityAdviserId);
    const normalizedCompId = normalizeId(companyAdviserId);
    const normalizedCompanyAdminId = normalizeId(companyAdminId);

    if (!normalizedStudentId) {
      return res.status(400).json({ success: false, message: "Invalid studentId" });
    }

    // Determine student's program from accepted application
    let acceptedApp;
    try {
      acceptedApp = await Application.findOne({ studentId: normalizedStudentId, status: "accepted" });
    } catch (castErr) {
      return res.status(400).json({ success: false, message: "Invalid studentId format" });
    }
    if (!acceptedApp) {
      return res.status(400).json({ success: false, message: "Student does not have an accepted application" });
    }
    const programId = acceptedApp.programId?._id || acceptedApp.programId;

    // Validate advisers' programs and roles
    const ensureAdviserProgram = async (adviserUserId, expectedRole) => {
      const adv = await Adviser.findOne({ userId: adviserUserId });
      if (!adv) throw new Error("Selected adviser is not registered in Adviser table");
      if (adv.role !== expectedRole) throw new Error("Selected adviser has incorrect role");
      if (adv.programId.toString() !== programId.toString()) throw new Error("Adviser program does not match student's program");
    };

    try {
      if (normalizedUniId) await ensureAdviserProgram(normalizedUniId, "universityAdviser");
      if (normalizedCompId) await ensureAdviserProgram(normalizedCompId, "companyAdviser");
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message || "Adviser validation failed" });
    }
    const update = { programId, createdBy: req.user._id };
    if (typeof universityAdviserId !== "undefined") update.universityAdviserId = normalizedUniId || undefined;
    if (typeof companyAdviserId !== "undefined") update.companyAdviserId = normalizedCompId || undefined;
    if (typeof companyAdminId !== "undefined") update.companyAdminId = normalizedCompanyAdminId || undefined;

    const link = await AdviserLink.findOneAndUpdate(
      { studentId: normalizedStudentId },
      update,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.status(200).json({ success: true, data: { link } });
  } catch (e) {
    console.error("Upsert adviser link error:", e);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get adviser link by student (adviser/admin)
const getAdviserLink = async (req, res) => {
  try {
    const { studentId } = req.params;
    const link = await AdviserLink.findOne({ studentId }).populate("universityAdviserId companyAdviserId", "name email role");
    res.status(200).json({ success: true, data: { link } });
  } catch (e) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Messaging
const sendMessage = async (req, res) => {
  try {
    const { studentId, receiverId, content, visibleToStudent } = req.body;
    console.log('🔗 MESSAGING API: Received request:', { studentId, receiverId, content: content?.substring(0, 50) + '...', senderRole: req.user.role });

    // Find the student and their linked advisers using User model
    const student = await User.findById(studentId);
    if (!student) {
      console.log('❌ MESSAGING API: Student not found:', studentId);
      return res.status(400).json({ success: false, message: "Student not found" });
    }

    console.log('👤 MESSAGING API: Student found:', {
      name: student.name,
      universityAdviserId: student.universityAdviserId,
      facultyHeadId: student.facultyHeadId,
      companyAdviserId: student.companyAdviserId
    });

    const senderRole = req.user.role;
    const allowedReceiverIds = [];
    
    // Build allowed receiver list based on student's linked advisers
    if (senderRole === "universityAdviser") {
      if (student.companyAdviserId) allowedReceiverIds.push(student.companyAdviserId.toString());
      if (student.facultyHeadId) allowedReceiverIds.push(student.facultyHeadId.toString());
    } else if (senderRole === "companyAdviser") {
      if (student.universityAdviserId) allowedReceiverIds.push(student.universityAdviserId.toString());
      if (student.facultyHeadId) allowedReceiverIds.push(student.facultyHeadId.toString());
    } else if (senderRole === "facultyHead") {
      if (student.universityAdviserId) allowedReceiverIds.push(student.universityAdviserId.toString());
      if (student.companyAdviserId) allowedReceiverIds.push(student.companyAdviserId.toString());
    } else {
      console.log('❌ MESSAGING API: Invalid sender role:', senderRole);
      return res.status(403).json({ success: false, message: "Only advisers can send these messages" });
    }

    console.log('✅ MESSAGING API: Allowed receivers:', allowedReceiverIds);

    // Validate receiverId is provided and allowed
    if (!receiverId) {
      console.log('❌ MESSAGING API: No receiverId provided');
      return res.status(400).json({ success: false, message: "Recipient must be specified" });
    }

    console.log('🎯 MESSAGING API: Receiver ID:', receiverId);

    if (!allowedReceiverIds.includes(receiverId)) {
      console.log('❌ MESSAGING API: Not allowed to message this user. Receiver:', receiverId, 'Allowed:', allowedReceiverIds);
      return res.status(403).json({ success: false, message: "Not allowed to message this user for the given student" });
    }
    const attachments = Array.isArray(req.files)
      ? req.files.map((f) => ({
          filename: f.filename,
          originalName: f.originalname,
          filePath: `uploads/adviser-docs/${f.filename}`,
          mimeType: f.mimetype,
          size: f.size,
        }))
      : [];
    const message = await Message.create({ studentId, senderId: req.user._id, receiverId, content, attachments, visibleToStudent: !!visibleToStudent });
    
    console.log('✅ MESSAGING API: Message created successfully:', {
      messageId: message._id,
      from: req.user.name,
      to: receiverId,
      student: student.name
    });
    
    // Real-time notify via sockets - emit to specific recipient and sender only
    const io = req.app && req.app.get && req.app.get("io");
    if (io) {
      // Emit to recipient
      io.to(`user:${receiverId}`).emit("newMessage", { message });
      // Emit to sender so they see their own message
      io.to(`user:${req.user._id}`).emit("newMessage", { message });
      console.log('📡 MESSAGING API: Socket emissions sent to recipient and sender');
    }
    await notify(req, receiverId, "New Message", content.slice(0, 120), message._id, "Message", "info");
    res.status(201).json({ success: true, data: { message } });
  } catch (e) {
    console.error("Send message error:", e);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const listMessages = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { peerId } = req.query; // Optional: filter by conversation with specific peer
    
    let query = { studentId };
    
    // If peerId is provided, filter messages to show only conversation between current user and peer
    if (peerId) {
      const currentUserId = req.user._id.toString();
      query.$or = [
        { senderId: currentUserId, receiverId: peerId },
        { senderId: peerId, receiverId: currentUserId }
      ];
      console.log('🔍 MESSAGING API: Filtering messages between', currentUserId, 'and', peerId, 'for student', studentId);
    } else {
      console.log('🔍 MESSAGING API: Fetching all messages for student', studentId);
    }
    
    const msgs = await Message.find(query).sort({ createdAt: -1 }).populate("senderId receiverId", "name email role");
    console.log('📨 MESSAGING API: Found', msgs.length, 'messages');
    res.status(200).json({ success: true, data: { messages: msgs } });
  } catch (e) {
    console.error("List messages error:", e);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get linked advisers for a student
const getLinkedAdvisers = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const student = await User.findById(studentId)
      .populate('universityAdviserId', 'name email role')
      .populate('facultyHeadId', 'name email role')
      .populate('companyAdviserId', 'name email role');
    
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }
    
    res.status(200).json({
      success: true,
      data: {
        universityAdviser: student.universityAdviserId || null,
        facultyHead: student.facultyHeadId || null,
        companyAdviser: student.companyAdviserId || null
      }
    });
  } catch (error) {
    console.error("Get linked advisers error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get final evaluation for a student
const getFinalEvaluation = async (req, res) => {
  try {
    const { studentId } = req.params;
    const currentUserId = req.user?._id;
    const userRole = req.user?.role;

    // Validate required parameters
    if (!studentId || studentId === 'undefined') {
      return res.status(400).json({ success: false, message: "Valid student ID is required" });
    }

    if (!currentUserId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    // Verify access rights
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    // Check if user has access to this student's evaluation
    let hasAccess = false;
    if (userRole === "companyAdviser" && student.companyAdviserId?.toString() === currentUserId.toString()) {
      hasAccess = true;
    } else if (userRole === "universityAdviser" && student.universityAdviserId?.toString() === currentUserId.toString()) {
      hasAccess = true;
    } else if (userRole === "facultyHead" && student.facultyHeadId?.toString() === currentUserId.toString()) {
      hasAccess = true;
    }

    if (!hasAccess) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const evaluation = await FinalEvaluation.findOne({ studentId })
      .populate('studentId', 'name email')
      .populate('companyAdviserId', 'name email')
      .populate('universityAdviserId', 'name email')
      .populate('facultyHeadId', 'name email');

    // Transform attendance data for Faculty Head compatibility
    if (evaluation && evaluation.attendance) {
      console.log('🔍 ATTENDANCE DATA ANALYSIS:', {
        hasAttendance: !!evaluation.attendance,
        hasWeeks: !!evaluation.attendance.weeks,
        weeksLength: evaluation.attendance.weeks?.length || 0,
        hasTotalDays: evaluation.attendance.totalDays !== undefined,
        hasPresentDays: evaluation.attendance.presentDays !== undefined,
        hasAbsentDays: evaluation.attendance.absentDays !== undefined,
        totalDaysValue: evaluation.attendance.totalDays,
        presentDaysValue: evaluation.attendance.presentDays,
        absentDaysValue: evaluation.attendance.absentDays,
        attendanceKeys: Object.keys(evaluation.attendance)
      });
      
      // Check if evaluation has old format (only weeks + totalAbsentDays) and needs transformation
      if (evaluation.attendance.weeks && 
          evaluation.attendance.totalDays === undefined && 
          evaluation.attendance.presentDays === undefined && 
          evaluation.attendance.absentDays === undefined) {
        
        console.log('🔄 TRANSFORMING OLD ATTENDANCE DATA for Faculty Head compatibility');
        
        // Calculate missing fields from weeks data
        const weeks = evaluation.attendance.weeks || [];
        const totalDays = weeks.length * 5; // 5 working days per week
        
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
        
        // Add the missing fields to the attendance object
        evaluation.attendance = {
          ...evaluation.attendance.toObject(),
          totalDays,
          presentDays,
          absentDays,
          excusedDays,
          lateDays,
          attendancePercentage: Math.round(attendancePercentage * 10) / 10,
          records: [] // Empty records array for compatibility
        };
        
        console.log('✅ ATTENDANCE DATA TRANSFORMED:', {
          totalDays,
          presentDays,
          absentDays,
          attendancePercentage: Math.round(attendancePercentage * 10) / 10
        });
      } else {
        console.log('ℹ️ ATTENDANCE DATA ALREADY HAS REQUIRED FIELDS or NO TRANSFORMATION NEEDED');
      }
    }

    res.status(200).json({ success: true, data: { evaluation } });
  } catch (error) {
    console.error("Get final evaluation error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Create final evaluation
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
    
    console.log('📊 DETAILED FRONTEND DATA:', {
      evaluationCriteria: frontendData.evaluationCriteria,
      supervisorFeedback: frontendData.supervisorFeedback,
      studentInfo: frontendData.studentInfo,
      attendanceRecordsCount: frontendData.attendance?.records?.length || 0
    });
    
    // Handle file uploads
    const attachments = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        // Store relative path only (like acceptance papers)
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

    console.log('🔍 CREATE FINAL EVALUATION: Received data structure:', {
      hasStudentId: !!frontendData.studentId,
      hasEvaluationCriteria: !!frontendData.evaluationCriteria,
      hasSupervisorFeedback: !!frontendData.supervisorFeedback,
      hasAttendance: !!frontendData.attendance,
      keys: Object.keys(frontendData)
    });

    // Verify student exists and user has access
    const student = await User.findById(frontendData.studentId)
      .populate('universityAdviserId', 'name email')
      .populate('facultyHeadId', 'name email')
      .populate('companyAdviserId', 'name email')
      .populate('groupAssignment.programId', 'name description');

    console.log('🔍 RAW STUDENT QUERY RESULT:', {
      found: !!student,
      studentId: student?._id,
      companyAdviserIdRaw: student?.companyAdviserId,
      companyAdviserIdType: typeof student?.companyAdviserId,
      isPopulated: student?.companyAdviserId?.name ? 'YES' : 'NO'
    });
    
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    console.log('📊 STUDENT DATA:', {
      name: student.name,
      university: student.university_name,
      hasUniversityAdviser: !!student.universityAdviserId,
      universityAdviserName: student.universityAdviserId?.name,
      hasProgram: !!student.groupAssignment?.programId,
      programName: student.groupAssignment?.programId?.name,
      companyAdviserName: req.user.name
    });

    // Extract the actual ObjectId from companyAdviserId (handle both populated and non-populated cases)
    let studentCompanyAdviserId;
    if (student.companyAdviserId) {
      if (student.companyAdviserId._id) {
        // Case: populated object with _id field
        studentCompanyAdviserId = student.companyAdviserId._id.toString();
      } else {
        // Case: direct ObjectId reference
        studentCompanyAdviserId = student.companyAdviserId.toString();
      }
    }

    // Debug authorization check
    console.log('🔐 AUTHORIZATION DEBUG:', {
      userRole: userRole,
      currentUserId: currentUserId.toString(),
      studentCompanyAdviserIdRaw: student.companyAdviserId,
      studentCompanyAdviserIdExtracted: studentCompanyAdviserId,
      studentCompanyAdviserIdType: typeof student.companyAdviserId,
      isObjectId: student.companyAdviserId?.constructor?.name,
      hasCompanyAdviser: !!student.companyAdviserId,
      idsMatch: studentCompanyAdviserId === currentUserId.toString()
    });

    // Only company adviser can create final evaluation
    if (userRole !== "companyAdviser") {
      console.log('❌ AUTHORIZATION FAILED: User is not a company adviser');
      return res.status(403).json({ success: false, message: "Only company adviser can create final evaluation" });
    }

    if (!student.companyAdviserId) {
      console.log('❌ AUTHORIZATION FAILED: Student has no assigned company adviser');
      return res.status(403).json({ success: false, message: "Student has no assigned company adviser" });
    }

    if (studentCompanyAdviserId !== currentUserId.toString()) {
      console.log('❌ AUTHORIZATION FAILED: Company adviser ID mismatch');
      console.log('   Expected:', currentUserId.toString());
      console.log('   Found:', studentCompanyAdviserId);
      return res.status(403).json({ success: false, message: "Only assigned company adviser can create final evaluation" });
    }

    console.log('✅ AUTHORIZATION PASSED: Company adviser can create evaluation');

    // Check if evaluation already exists - if so, update it instead of creating new
    const existingEvaluation = await FinalEvaluation.findOne({ studentId: frontendData.studentId });
    
    console.log('🔍 EXISTING EVALUATION CHECK:', {
      studentId: frontendData.studentId,
      existingEvaluationFound: !!existingEvaluation,
      existingEvaluationId: existingEvaluation?._id?.toString(),
      existingStatus: existingEvaluation?.status
    });
    
    if (existingEvaluation) {
      console.log('📝 EXISTING EVALUATION FOUND - Updating instead of creating new');
      return updateExistingFinalEvaluation(req, res, existingEvaluation, frontendData, student, currentUserId);
    }
    
    console.log('✨ NO EXISTING EVALUATION - Creating new one');

    // Transform frontend data structure to match backend model
    const evaluationData = {
      studentId: frontendData.studentId,
      companyAdviserId: currentUserId,
      universityAdviserId: student.universityAdviserId || currentUserId, // Fallback to current user if no university adviser
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

      // Include evaluationCriteria for Faculty Head viewing - ensure all fields are valid numbers (1-5 to avoid 0 validation errors)
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

      // Transform evaluationCriteria to supervisorEvaluation - ensure ALL required fields are populated with valid range 1-5
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

      // Include supervisorFeedback for Faculty Head viewing - ensure proper defaults
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
        total: 0 // Will be calculated
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

      // Attendance - preserve exact Company Adviser structure for Faculty Head compatibility
      attendance: {
        // Store exact values from Company Adviser
        totalDays: frontendData.attendance?.totalDays || 0,
        presentDays: frontendData.attendance?.presentDays || 0,
        absentDays: frontendData.attendance?.absentDays || 0,
        excusedDays: frontendData.attendance?.excusedDays || 0,
        lateDays: frontendData.attendance?.lateDays || 0,
        attendancePercentage: frontendData.attendance?.attendancePercentage || 0,
        records: frontendData.attendance?.records || [],
        
        // Legacy weeks format for backward compatibility (if needed)
        weeks: frontendData.attendance?.records?.map((record, index) => ({
          weekNumber: index + 1,
          monday: record.monday || 'present',
          tuesday: record.tuesday || 'present',
          wednesday: record.wednesday || 'present',
          thursday: record.thursday || 'present',
          friday: record.friday || 'present',
          absentDays: record.absentDays || 0,
          supervisorSignature: record.supervisorSignature || '',
        })) || [],
        totalAbsentDays: frontendData.attendance?.absentDays || 0,
      },

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

    console.log('💾 ATTEMPTING TO SAVE TO MONGODB:', {
      studentId: evaluationData.studentId,
      companyAdviserId: evaluationData.companyAdviserId,
      facultyHeadId: evaluationData.facultyHeadId,
      evaluationCriteriaKeys: Object.keys(evaluationData.evaluationCriteria || {}),
      supervisorFeedbackKeys: Object.keys(evaluationData.supervisorFeedback || {})
    });

    console.log('🔍 FULL EVALUATION DATA TO SAVE:', JSON.stringify(evaluationData, null, 2));

    // Add explicit database verification
    console.log('🔗 MONGODB CONNECTION STATUS:', {
      readyState: require('mongoose').connection.readyState,
      host: require('mongoose').connection.host,
      name: require('mongoose').connection.name
    });

    console.log('🎯 CALLING FinalEvaluation.create() with data...');
    const evaluation = await FinalEvaluation.create(evaluationData);
    console.log('✅ FinalEvaluation.create() COMPLETED SUCCESSFULLY');
    
    console.log('🔍 MONGODB SAVE RESULT:', {
      savedId: evaluation._id,
      isNewRecord: evaluation.isNew,
      modifiedPaths: evaluation.modifiedPaths(),
      wasNew: evaluation.wasNew
    });

    // Verify the data was actually saved by querying it back
    const verifyQuery = await FinalEvaluation.findById(evaluation._id);
    console.log('🔍 VERIFICATION QUERY RESULT:', {
      found: !!verifyQuery,
      savedEvaluationId: verifyQuery?._id?.toString(),
      savedStudentId: verifyQuery?.studentId?.toString(),
      savedStatus: verifyQuery?.status,
      savedEvaluationCriteriaExists: !!verifyQuery?.evaluationCriteria,
      savedSupervisorFeedbackExists: !!verifyQuery?.supervisorFeedback
    });
    
    console.log('✅ SUCCESSFULLY SAVED TO MONGODB:', {
      evaluationId: evaluation._id.toString(),
      studentId: evaluation.studentId.toString(),
      facultyHeadId: evaluation.facultyHeadId?.toString() || 'null',
      status: evaluation.status,
      hasEvaluationCriteria: !!evaluation.evaluationCriteria,
      hasSupervisorFeedback: !!evaluation.supervisorFeedback,
      attachmentCount: evaluation.attachments?.length || 0
    });
    
    // Notify relevant parties
    if (student.universityAdviserId) {
      await notify(req, student.universityAdviserId, "Final Evaluation Created", 
        `Final evaluation has been created for student ${student.name}`, evaluation._id, "Evaluation");
    }
    
    if (student.facultyHeadId) {
      await notify(req, student.facultyHeadId, "Final Evaluation Created", 
        `Final evaluation has been created for student ${student.name}`, evaluation._id, "Evaluation");
    }

    console.log('📤 PREPARING BACKEND RESPONSE:', {
      evaluationId: evaluation._id.toString(),
      studentId: evaluation.studentId.toString(),
      status: evaluation.status,
      hasEvaluationCriteria: !!evaluation.evaluationCriteria,
      hasSupervisorFeedback: !!evaluation.supervisorFeedback,
      responseStructure: 'success: true, data: { evaluation }'
    });
    
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
        // Check if it's an enum validation error
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
    const errorResponse = { 
      success: false, 
      message: "Server error",
      details: error.message
    };
    
    console.log('📤 SENDING GENERIC ERROR RESPONSE:', errorResponse);
    res.status(500).json(errorResponse);
  }
};
const updateFinalEvaluation = async (req, res) => {
  try {
    const { studentId } = req.params;
    // Handle FormData - parse evaluationData from form field
    const frontendData = req.body.evaluationData ? JSON.parse(req.body.evaluationData) : req.body;
    const currentUserId = req.user._id;
    const userRole = req.user.role;
    const updateData = req.body;

    // Find existing evaluation
    const evaluation = await FinalEvaluation.findOne({ studentId });
    if (!evaluation) {
      return res.status(404).json({ success: false, message: "Final evaluation not found" });
    }

    // Check access rights
    let canUpdate = false;
    if (userRole === "companyAdviser" && evaluation.companyAdviserId?.toString() === currentUserId.toString()) {
      canUpdate = true;
    } else if (userRole === "universityAdviser" && evaluation.universityAdviserId?.toString() === currentUserId.toString()) {
      // University adviser can only update review notes and status
      canUpdate = true;
    } else if (userRole === "facultyHead" && evaluation.facultyHeadId?.toString() === currentUserId.toString()) {
      // Faculty head can only update review notes and status
      canUpdate = true;
    }

    if (!canUpdate) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    // Update evaluation
    const updatedEvaluation = await FinalEvaluation.findOneAndUpdate(
      { studentId },
      updateData,
      { new: true, runValidators: true }
    ).populate('studentId', 'name email')
     .populate('companyAdviserId', 'name email')
     .populate('universityAdviserId', 'name email')
     .populate('facultyHeadId', 'name email');

    // Notify relevant parties about update
    const student = await User.findById(studentId);
    if (userRole === "companyAdviser") {
      await notify(req, student.universityAdviserId, "Final Evaluation Updated", 
        `Final evaluation has been updated for student ${student.name}`, evaluation._id, "Evaluation");
      
      if (student.facultyHeadId) {
        await notify(req, student.facultyHeadId, "Final Evaluation Updated", 
          `Final evaluation has been updated for student ${student.name}`, evaluation._id, "Evaluation");
      }
    }

    res.status(200).json({ success: true, data: { evaluation: updatedEvaluation } });
  } catch (error) {
    console.error("Update final evaluation error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Helper function to update existing final evaluation
const updateExistingFinalEvaluation = async (req, res, existingEvaluation, frontendData, student, currentUserId) => {
  try {
    // Handle file uploads
    const attachments = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        // Store relative path only (like acceptance papers)
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

    // DEBUG: Log received frontend data structure
    console.log('🔍 DEBUGGING EVALUATION CRITERIA DATA FLOW:');
    console.log('📥 Frontend Data Keys:', Object.keys(frontendData || {}));
    console.log('📊 evaluationCriteria exists:', !!frontendData.evaluationCriteria);
    console.log('📊 evaluationScores exists:', !!frontendData.evaluationScores);
    console.log('📊 evaluationCriteria data:', frontendData.evaluationCriteria);
    console.log('📊 evaluationScores data:', frontendData.evaluationScores);
    console.log('📎 Files uploaded:', req.files?.length || 0);
    console.log('📎 Processed attachments:', attachments);
    // Merge existing studentInfo with new data to preserve required fields
    const mergedStudentInfo = {
      fullName: frontendData.studentInfo?.fullName || existingEvaluation.studentInfo?.fullName || student.name,
      university: frontendData.studentInfo?.university || existingEvaluation.studentInfo?.university || student.university_name,
      department: frontendData.studentInfo?.department || existingEvaluation.studentInfo?.department || student.groupAssignment?.programId?.name || 'Not Specified',
      companyName: frontendData.studentInfo?.companyName || existingEvaluation.studentInfo?.companyName || req.user.company_name || 'Not Specified',
      companyAdviser: frontendData.studentInfo?.companyAdviser || existingEvaluation.studentInfo?.companyAdviser || req.user.name,
      universityAdviser: frontendData.studentInfo?.universityAdviser || existingEvaluation.studentInfo?.universityAdviser || student.universityAdviserId?.name || 'Not Assigned',
      internshipStartDate: frontendData.studentInfo?.internshipStartDate || existingEvaluation.studentInfo?.internshipStartDate,
      internshipEndDate: frontendData.studentInfo?.internshipEndDate || existingEvaluation.studentInfo?.internshipEndDate
    };

    // Validate required studentInfo fields before update
    const requiredFields = ['fullName', 'department', 'companyName', 'companyAdviser', 'universityAdviser', 'internshipStartDate', 'internshipEndDate'];
    const missingFields = requiredFields.filter(field => !mergedStudentInfo[field]);
    
    if (missingFields.length > 0) {
      console.log('❌ VALIDATION ERROR: Missing required studentInfo fields:', missingFields);
      return res.status(400).json({
        success: false,
        message: `Missing required studentInfo fields: ${missingFields.join(', ')}`,
        missingFields
      });
    }

    // Update the evaluation with new data - FIXED TO MATCH CREATE PATH
    const evaluationData = {
      // Student Information (using schema field names)
      studentInfo: mergedStudentInfo,
      
      // Include evaluationCriteria for Faculty Head viewing - SAME AS CREATE PATH
      evaluationCriteria: {
        punctuality: frontendData.evaluationCriteria?.punctuality || 0,
        reliability: frontendData.evaluationCriteria?.reliability || 0,
        independence: frontendData.evaluationCriteria?.independence || 0,
        communication: frontendData.evaluationCriteria?.communication || 0,
        professionalism: frontendData.evaluationCriteria?.professionalism || 0,
        speedOfWork: frontendData.evaluationCriteria?.speedOfWork || 0,
        accuracy: frontendData.evaluationCriteria?.accuracy || 0,
        engagement: frontendData.evaluationCriteria?.engagement || 0,
        cooperation: frontendData.evaluationCriteria?.cooperation || 0,
        recommendation: frontendData.evaluationCriteria?.recommendation || 0,
        technicalKnowledge: frontendData.evaluationCriteria?.technicalKnowledge || 0,
        problemSolving: frontendData.evaluationCriteria?.problemSolving || 0,
        organizing: frontendData.evaluationCriteria?.organizing || 0,
        responsibility: frontendData.evaluationCriteria?.responsibility || 0,
        initiative: frontendData.evaluationCriteria?.initiative || 0,
      },

      // Transform evaluationCriteria to supervisorEvaluation - SAME AS CREATE PATH
      supervisorEvaluation: {
        dependability: frontendData.evaluationCriteria?.reliability || 3,
        technicalCompetence: frontendData.evaluationCriteria?.technicalKnowledge || 3,
        teamwork: frontendData.evaluationCriteria?.cooperation || 3,
        communication: frontendData.evaluationCriteria?.communication || 3,
        initiative: frontendData.evaluationCriteria?.initiative || 3,
        problemSolving: frontendData.evaluationCriteria?.problemSolving || 3,
        timeManagement: frontendData.evaluationCriteria?.punctuality || 3,
        adaptability: frontendData.evaluationCriteria?.engagement || 3,
        leadership: frontendData.evaluationCriteria?.responsibility || 3,
        workEthic: frontendData.evaluationCriteria?.professionalism || 3,
      },

      // Include supervisor feedback for Faculty Head viewing - SAME AS CREATE PATH
      supervisorFeedback: {
        strengths: frontendData.supervisorFeedback?.strengths || '',
        areasForImprovement: frontendData.supervisorFeedback?.areasForImprovement || '',
        overallRecommendation: frontendData.supervisorFeedback?.overallRecommendation || '',
        finalRemarks: frontendData.supervisorFeedback?.finalRemarks || ''
      },

      // Transform to weighted scores for finalEvaluation - SAME AS CREATE PATH
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
        total: 0 // Will be calculated
      },

      // Transform supervisorFeedback to comments - SAME AS CREATE PATH
      comments: {
        majorStrengths: frontendData.supervisorFeedback?.strengths || '',
        areasOfImprovement: frontendData.supervisorFeedback?.areasForImprovement || '',
        finalRecommendation: frontendData.supervisorFeedback?.overallRecommendation === 'Recommended' ? 'Continue' : 'Not Recommended',
      },

      // Signatures - SAME AS CREATE PATH
      signatures: {
        companyAdviserName: req.user.name || frontendData.signatures?.companyAdviser?.name || 'Company Adviser Name',
        companyAdviserSignature: frontendData.signatures?.companyAdviser?.signature || '',
        universityAdviserName: student.universityAdviserId?.name || frontendData.signatures?.universityAdviser?.name || 'University Adviser Name',
        universityAdviserSignature: frontendData.signatures?.universityAdviser?.signature || '',
        companyStamp: frontendData.signatures?.companyStamp || '',
        facultyHeadSignature: frontendData.signatures?.facultyHead?.signature || '',
        facultyHeadName: student.facultyHeadId?.name || frontendData.signatures?.facultyHead?.name || '',
      },

      // Attendance (if provided) - SAME AS CREATE PATH
      attendance: {
        weeks: frontendData.attendance?.records?.map((record, index) => ({
          weekNumber: index + 1,
          monday: record.monday || 'present',
          tuesday: record.tuesday || 'present',
          wednesday: record.wednesday || 'present',
          thursday: record.thursday || 'present',
          friday: record.friday || 'present',
          absentDays: record.absentDays || 0,
          supervisorSignature: record.supervisorSignature || '',
        })) || [],
        totalAbsentDays: frontendData.attendance?.absentDays || 0,
      },

      status: frontendData.status || 'submitted',
      attachments: attachments
    };

    // Calculate total score - SAME AS CREATE PATH
    evaluationData.finalEvaluation.total = 
      evaluationData.finalEvaluation.generalPerformance + 
      evaluationData.finalEvaluation.personalSkills + 
      evaluationData.finalEvaluation.professionalSkills;

    console.log('🔄 TRANSFORMED UPDATE DATA:', {
      studentInfo: !!evaluationData.studentInfo,
      evaluationCriteria: !!evaluationData.evaluationCriteria,
      supervisorFeedback: !!evaluationData.supervisorFeedback,
      supervisorEvaluation: !!evaluationData.supervisorEvaluation,
      finalEvaluation: evaluationData.finalEvaluation,
      comments: !!evaluationData.comments,
      signatures: !!evaluationData.signatures,
      attachments: evaluationData.attachments?.length || 0
    });

    console.log('💾 ATTEMPTING TO UPDATE IN MONGODB:', {
      studentId: evaluationData.studentId,
      companyAdviserId: evaluationData.companyAdviserId,
      facultyHeadId: evaluationData.facultyHeadId,
      evaluationCriteriaKeys: Object.keys(evaluationData.evaluationCriteria || {}),
      supervisorFeedbackKeys: Object.keys(evaluationData.supervisorFeedback || {})
    });

    console.log('🔍 FULL UPDATE DATA TO SAVE:', JSON.stringify(evaluationData, null, 2));

    // Add explicit database verification for update
    console.log('🔗 MONGODB CONNECTION STATUS (UPDATE):', {
      readyState: require('mongoose').connection.readyState,
      host: require('mongoose').connection.host,
      name: require('mongoose').connection.name
    });

    // Update the existing evaluation
    Object.assign(existingEvaluation, evaluationData);
    const updatedEvaluation = await existingEvaluation.save();
    
    console.log('🔍 MONGODB UPDATE RESULT:', {
      savedId: updatedEvaluation._id,
      modifiedPaths: updatedEvaluation.modifiedPaths(),
      wasModified: updatedEvaluation.isModified()
    });

    // Verify the data was actually updated by querying it back
    const verifyUpdateQuery = await FinalEvaluation.findById(updatedEvaluation._id);
    console.log('🔍 UPDATE VERIFICATION QUERY RESULT:', {
      found: !!verifyUpdateQuery,
      savedEvaluationId: verifyUpdateQuery?._id?.toString(),
      savedStudentId: verifyUpdateQuery?.studentId?.toString(),
      savedStatus: verifyUpdateQuery?.status,
      savedEvaluationCriteriaExists: !!verifyUpdateQuery?.evaluationCriteria,
      savedSupervisorFeedbackExists: !!verifyUpdateQuery?.supervisorFeedback
    });
    
    console.log('✅ SUCCESSFULLY UPDATED TO MONGODB:', {
      evaluationId: updatedEvaluation._id.toString(),
      studentId: updatedEvaluation.studentId.toString(),
      facultyHeadId: updatedEvaluation.facultyHeadId?.toString() || 'null',
      status: updatedEvaluation.status,
      hasEvaluationCriteria: !!updatedEvaluation.evaluationCriteria,
      hasSupervisorFeedback: !!updatedEvaluation.supervisorFeedback,
      attachmentCount: updatedEvaluation.attachments?.length || 0
    });
    
    // DEBUG: Log what was actually saved
    console.log('✅ SAVED TO DATABASE:');
    console.log('📊 Saved evaluationCriteria:', updatedEvaluation.evaluationCriteria);

    // Send notifications to University Adviser and Faculty Head
    try {
      if (student.universityAdviserId) {
        await Notification.create({
          userId: student.universityAdviserId,
          title: "Final Evaluation Updated",
          message: `Final evaluation for ${student.name} has been updated by Company Adviser`,
          type: "info",
          relatedModel: "Evaluation",
          relatedId: updatedEvaluation._id
        });
      }

      if (student.facultyHeadId) {
        await Notification.create({
          userId: student.facultyHeadId,
          title: "Final Evaluation Updated",
          message: `Final evaluation for ${student.name} has been updated by Company Adviser`,
          type: "info",
          relatedModel: "Evaluation",
          relatedId: updatedEvaluation._id
        });
      }
    } catch (notificationError) {
      console.error('⚠️ Notification error (non-blocking):', notificationError.message);
    }

    console.log('✅ EVALUATION UPDATED SUCCESSFULLY:', updatedEvaluation._id);
    
    res.status(200).json({
      success: true,
      message: "Final evaluation updated successfully",
      evaluationId: updatedEvaluation._id,
      data: { evaluation: updatedEvaluation }
    });

  } catch (error) {
    console.error('❌ UPDATE EVALUATION ERROR:', error);
    
    // Handle validation errors with 400 Bad Request
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => {
        // Check if it's an enum validation error
        if (err.kind === 'enum') {
          return `${err.path}: "${err.value}" is not valid. Allowed values: ${err.properties.enumValues.join(', ')}`;
        }
        return err.message;
      });
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationErrors,
        details: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Failed to update final evaluation",
      error: error.message
    });
  }
};

// Get Student Details with populated data
const getStudentDetails = async (req, res) => {
  try {
    const { studentId } = req.params;
    const currentUserId = req.user.id;
    const userRole = req.user.role;

    console.log('🔍 FETCHING STUDENT DETAILS:', {
      studentId,
      requestedBy: currentUserId,
      userRole
    });

    // Find student with populated references
    const student = await User.findById(studentId)
      .populate('universityAdviserId', 'name email')
      .populate('facultyHeadId', 'name email')
      .populate('companyAdviserId', 'name email company_name')
      .populate('groupAssignment.programId', 'name description')
      .lean();

    if (!student) {
      return res.status(404).json({ 
        success: false, 
        message: "Student not found" 
      });
    }

    // Authorization check - only linked advisers can access student details
    let hasAccess = false;
    
    if (userRole === "companyAdviser") {
      const studentCompanyAdviserId = student.companyAdviserId?._id ? 
        student.companyAdviserId._id.toString() : 
        student.companyAdviserId?.toString();
      hasAccess = studentCompanyAdviserId === currentUserId.toString();
    } else if (userRole === "universityAdviser") {
      const studentUniversityAdviserId = student.universityAdviserId?._id ? 
        student.universityAdviserId._id.toString() : 
        student.universityAdviserId?.toString();
      hasAccess = studentUniversityAdviserId === currentUserId.toString();
    } else if (userRole === "facultyHead") {
      const studentFacultyHeadId = student.facultyHeadId?._id ? 
        student.facultyHeadId._id.toString() : 
        student.facultyHeadId?.toString();
      hasAccess = studentFacultyHeadId === currentUserId.toString();
    } else if (userRole === "admin") {
      hasAccess = true; // Admin can access all student details
    }

    if (!hasAccess) {
      console.log('❌ ACCESS DENIED: User not authorized to view this student');
      return res.status(403).json({ 
        success: false, 
        message: "Not authorized to view this student's details" 
      });
    }

    // Structure the response data
    const studentDetails = {
      _id: student._id,
      name: student.name,
      email: student.email,
      studentId: student.studentId,
      university_name: student.university_name,
      role: student.role,
      
      // Program information
      program: student.groupAssignment?.programId ? {
        _id: student.groupAssignment.programId._id,
        name: student.groupAssignment.programId.name,
        description: student.groupAssignment.programId.description
      } : null,
      
      // Adviser information
      universityAdviser: student.universityAdviserId ? {
        _id: student.universityAdviserId._id,
        name: student.universityAdviserId.name,
        email: student.universityAdviserId.email
      } : null,
      
      facultyHead: student.facultyHeadId ? {
        _id: student.facultyHeadId._id,
        name: student.facultyHeadId.name,
        email: student.facultyHeadId.email
      } : null,
      
      companyAdviser: student.companyAdviserId ? {
        _id: student.companyAdviserId._id,
        name: student.companyAdviserId.name,
        email: student.companyAdviserId.email,
        company_name: student.companyAdviserId.company_name
      } : null,
      
      // Additional fields
      createdAt: student.createdAt,
      updatedAt: student.updatedAt
    };

    console.log('✅ STUDENT DETAILS FETCHED SUCCESSFULLY:', {
      studentName: student.name,
      hasProgram: !!studentDetails.program,
      hasUniversityAdviser: !!studentDetails.universityAdviser,
      hasCompanyAdviser: !!studentDetails.companyAdviser,
      hasFacultyHead: !!studentDetails.facultyHead
    });

    res.status(200).json({
      success: true,
      data: { student: studentDetails }
    });

  } catch (error) {
    console.error('❌ GET STUDENT DETAILS ERROR:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch student details",
      error: error.message
    });
  }
};

// Final Result Evaluation - Export PDF by ID
const exportFinalEvaluationPDF = async (req, res) => {
  try {
    const { evaluationId } = req.params;
    const currentUserId = req.user.id;
    const userRole = req.user.role;

    console.log('📄 EXPORT PDF: Looking for evaluation ID:', evaluationId);

    // Find evaluation by ID
    const evaluation = await FinalEvaluation.findById(evaluationId)
      .populate('studentId', 'name email')
      .populate('companyAdviserId', 'name email')
      .populate('universityAdviserId', 'name email')
      .populate('facultyHeadId', 'name email');

    if (!evaluation) {
      console.log('❌ EXPORT PDF: Evaluation not found for ID:', evaluationId);
      return res.status(404).json({ success: false, message: "Final evaluation not found" });
    }

    // Check access rights - handle both populated and non-populated ObjectId cases
    let hasAccess = false;
    
    // Extract actual ObjectIds for comparison
    const evalCompanyAdviserId = evaluation.companyAdviserId?._id ? 
      evaluation.companyAdviserId._id.toString() : 
      evaluation.companyAdviserId?.toString();
    
    const evalUniversityAdviserId = evaluation.universityAdviserId?._id ? 
      evaluation.universityAdviserId._id.toString() : 
      evaluation.universityAdviserId?.toString();
    
    const evalFacultyHeadId = evaluation.facultyHeadId?._id ? 
      evaluation.facultyHeadId._id.toString() : 
      evaluation.facultyHeadId?.toString();

    console.log('🔐 PDF EXPORT ACCESS CHECK:', {
      userRole,
      currentUserId: currentUserId.toString(),
      evalCompanyAdviserId,
      evalUniversityAdviserId,
      evalFacultyHeadId
    });

    if (userRole === "companyAdviser" && evalCompanyAdviserId === currentUserId.toString()) {
      hasAccess = true;
    } else if (userRole === "universityAdviser" && evalUniversityAdviserId === currentUserId.toString()) {
      hasAccess = true;
    } else if (userRole === "facultyHead" && evalFacultyHeadId === currentUserId.toString()) {
      hasAccess = true;
    }

    if (!hasAccess) {
      console.log('❌ PDF EXPORT ACCESS DENIED');
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    console.log('✅ PDF EXPORT ACCESS GRANTED');

    // Generate HTML content for PDF
    const htmlContent = generateFinalEvaluationHTML(evaluation);
    const studentName = evaluation.studentId?.name || 'Student';
    const fileName = `Final_Evaluation_${studentName.replace(/\s+/g, '_')}_${Date.now()}.html`;

    // Set response headers for HTML download (can be converted to PDF by browser)
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Cache-Control', 'no-cache');
    
    console.log('✅ EXPORT PDF: Sending HTML content for student:', studentName);
    // Send HTML content that can be printed as PDF
    res.send(htmlContent);
  } catch (error) {
    console.error("Export final evaluation PDF error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Final Result Evaluation - Export PDF by Student ID
const exportFinalEvaluationPDFByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const currentUserId = req.user.id;
    const userRole = req.user.role;

    console.log('📄 EXPORT PDF BY STUDENT: Looking for student ID:', studentId);

    // Find evaluation by student ID
    const evaluation = await FinalEvaluation.findOne({ studentId })
      .populate('studentId', 'name email')
      .populate('companyAdviserId', 'name email')
      .populate('universityAdviserId', 'name email')
      .populate('facultyHeadId', 'name email');

    if (!evaluation) {
      console.log('❌ EXPORT PDF: Evaluation not found for student ID:', studentId);
      return res.status(404).json({ success: false, message: "Final evaluation not found" });
    }

    // Check access rights - handle both populated and non-populated ObjectId cases
    let hasAccess = false;
    
    // Extract actual ObjectIds for comparison
    const evalCompanyAdviserId = evaluation.companyAdviserId?._id ? 
      evaluation.companyAdviserId._id.toString() : 
      evaluation.companyAdviserId?.toString();
    
    const evalUniversityAdviserId = evaluation.universityAdviserId?._id ? 
      evaluation.universityAdviserId._id.toString() : 
      evaluation.universityAdviserId?.toString();
    
    const evalFacultyHeadId = evaluation.facultyHeadId?._id ? 
      evaluation.facultyHeadId._id.toString() : 
      evaluation.facultyHeadId?.toString();

    console.log('🔐 PDF EXPORT ACCESS CHECK:', {
      userRole,
      currentUserId: currentUserId.toString(),
      evalCompanyAdviserId,
      evalUniversityAdviserId,
      evalFacultyHeadId
    });

    if (userRole === "companyAdviser" && evalCompanyAdviserId === currentUserId.toString()) {
      hasAccess = true;
    } else if (userRole === "universityAdviser" && evalUniversityAdviserId === currentUserId.toString()) {
      hasAccess = true;
    } else if (userRole === "facultyHead" && evalFacultyHeadId === currentUserId.toString()) {
      hasAccess = true;
    }

    if (!hasAccess) {
      console.log('❌ PDF EXPORT ACCESS DENIED');
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    console.log('✅ PDF EXPORT ACCESS GRANTED');

    // Generate HTML content for PDF
    const htmlContent = generateFinalEvaluationHTML(evaluation);
    const studentName = evaluation.studentId?.name || 'Student';
    const fileName = `Final_Evaluation_${studentName.replace(/\s+/g, '_')}_${Date.now()}.html`;

    // Set response headers for HTML download (can be converted to PDF by browser)
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Cache-Control', 'no-cache');
    
    console.log('✅ EXPORT PDF: Sending HTML content for student:', studentName);
    // Send HTML content that can be printed as PDF
    res.send(htmlContent);
  } catch (error) {
    console.error("Export final evaluation PDF error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


// Attendance (company adviser)
const recordAttendance = async (req, res) => {
  try {
    const { studentId, date, status, notes, internshipStartDate, internshipEndDate } = req.body;
    
    // Update or create attendance record
    const rec = await Attendance.findOneAndUpdate(
      { studentId, date: new Date(date) },
      { 
        studentId, 
        companyAdviserId: req.user._id, 
        date: new Date(date), 
        status, 
        notes,
        internshipStartDate: internshipStartDate ? new Date(internshipStartDate) : undefined,
        internshipEndDate: internshipEndDate ? new Date(internshipEndDate) : undefined
      },
      { upsert: true, new: true }
    );
    
    await notify(req, studentId, "Attendance Updated", `Status: ${status}`, rec._id, "Attendance", "info");
    res.status(200).json({ success: true, data: { attendance: rec } });
  } catch (e) {
    console.error("Record attendance error:", e);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const listAttendance = async (req, res) => {
  try {
    const { studentId } = req.params;
    const items = await Attendance.find({ studentId }).sort({ date: 1 });
    res.status(200).json({ success: true, data: { attendance: items } });
  } catch (e) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Save internship dates for a student
const saveInternshipDates = async (req, res) => {
  try {
    const { studentId, startDate, endDate } = req.body;
    
    if (!studentId || !startDate || !endDate) {
      return res.status(400).json({ success: false, message: "Student ID, start date, and end date are required" });
    }

    // Create or update a special attendance record to store internship dates
    // Use a fixed date (epoch) to avoid conflicts with actual attendance dates
    const specialDate = new Date('1970-01-01');
    
    const dateRecord = await Attendance.findOneAndUpdate(
      { studentId, companyAdviserId: req.user._id, status: "internship_dates" },
      { 
        studentId, 
        companyAdviserId: req.user._id, 
        date: specialDate, // Use fixed date to avoid conflicts
        status: "internship_dates", // Special status to identify date records
        internshipStartDate: new Date(startDate),
        internshipEndDate: new Date(endDate),
        notes: "Internship duration settings"
      },
      { upsert: true, new: true }
    );
    
    res.status(200).json({ success: true, data: { internshipDates: dateRecord } });
  } catch (e) {
    console.error("Save internship dates error:", e);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get internship dates for a student
const getInternshipDates = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const dateRecord = await Attendance.findOne({ 
      studentId, 
      companyAdviserId: req.user._id, 
      status: "internship_dates" 
    });
    
    if (dateRecord) {
      res.status(200).json({ 
        success: true, 
        data: { 
          startDate: dateRecord.internshipStartDate,
          endDate: dateRecord.internshipEndDate
        } 
      });
    } else {
      res.status(200).json({ success: true, data: { startDate: null, endDate: null } });
    }
  } catch (e) {
    console.error("Get internship dates error:", e);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Progress Reports
const submitProgressReport = async (req, res) => {
  try {
    const { studentId, periodStart, periodEnd, summary, milestones, flags, softSkills } = req.body;
    const pr = await ProgressReport.create({
      studentId,
      submittedById: req.user._id,
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
      summary,
      milestones,
      flags,
      softSkills,
    });
    await notify(req, studentId, "Progress Updated", summary?.slice(0, 120) || "Progress report submitted", pr._id, "ProgressReport", "info");
    // Also notify linked university adviser if exists
    try {
      const link = await AdviserLink.findOne({ studentId });
      if (link?.universityAdviserId) {
        await notify(req, link.universityAdviserId, "Progress Updated", `New report for student`, pr._id, "ProgressReport", "info");
      }
    } catch (_) {}
    res.status(201).json({ success: true, data: { report: pr } });
  } catch (e) {
    console.error("Submit progress error:", e);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const listProgressReports = async (req, res) => {
  try {
    const { studentId } = req.params;
    const items = await ProgressReport.find({ studentId }).sort({ createdAt: -1 }).populate("submittedById", "name email role");
    res.status(200).json({ success: true, data: { reports: items } });
  } catch (e) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Evaluations (company adviser -> reviewed by university adviser)
const submitEvaluation = async (req, res) => {
  try {
    const { studentId, grade, performanceRating, feedback, technicalSkills, softSkills, workEthic } = req.body;
    const ev = await Evaluation.create({ 
      studentId, 
      companyAdviserId: req.user._id, 
      grade, 
      performanceRating, 
      feedback, 
      technicalSkills, 
      softSkills, 
      workEthic 
    });
    await notify(req, studentId, "Evaluation Submitted", `Grade: ${grade}`, ev._id, "Evaluation", "info");
    // Notify university adviser
    try {
      const link = await AdviserLink.findOne({ studentId });
      if (link?.universityAdviserId) {
        await notify(req, link.universityAdviserId, "Evaluation Submitted", `New evaluation for student`, ev._id, "Evaluation", "info");
      }
    } catch (_) {}
    res.status(201).json({ success: true, data: { evaluation: ev } });
  } catch (e) {
    console.error("Submit evaluation error:", e);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const listEvaluations = async (req, res) => {
  try {
    const { studentId } = req.params;
    const items = await Evaluation.find({ studentId }).sort({ createdAt: -1 }).populate("companyAdviserId", "name email");
    res.status(200).json({ success: true, data: { evaluations: items } });
  } catch (e) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get Faculty Head's final evaluation data for a specific student (mirrors progress pattern)
const getFacultyHeadFinalEvaluationData = async (req, res) => {
  try {
    const { studentId } = req.params;
    const userId = req.user._id;

    console.log('🔍 Faculty Head Final Evaluation Fetch:', {
      studentId,
      userId: userId.toString(),
      userRole: req.user.role
    });

    // Verify the requesting user is a Faculty Head
    if (req.user.role !== 'facultyHead') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only Faculty Heads can access this data.'
      });
    }

    // Find the student with full population
    const student = await User.findById(studentId)
      .populate('companyAdviserId', 'name email')
      .populate('universityAdviserId', 'name email')
      .populate('facultyHeadId', 'name email')
      .populate({
        path: 'groupAssignment.programId',
        select: 'name description'
      });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check if this Faculty Head is assigned to this student
    const studentFacultyHeadId = student.facultyHeadId?._id?.toString() || student.facultyHeadId?.toString();
    const requestingFacultyHeadId = userId.toString();
    
    console.log('🔍 Faculty Head Access Check:', {
      studentFacultyHeadId,
      requestingFacultyHeadId,
      match: studentFacultyHeadId === requestingFacultyHeadId
    });

    if (studentFacultyHeadId !== requestingFacultyHeadId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not the assigned Faculty Head for this student.'
      });
    }

    // Get the Final Evaluation data from the database
    const evaluationData = await FinalEvaluation.findOne({
      studentId: studentId
    }).populate('companyAdviserId', 'name email')
      .populate('universityAdviserId', 'name email')
      .populate('facultyHeadId', 'name email')
      .populate('studentId', 'name email university_name groupAssignment')
      .populate({
        path: 'studentId',
        populate: {
          path: 'groupAssignment.programId',
          select: 'name'
        }
      });

    console.log('📊 Final Evaluation Data Found:', !!evaluationData);
    
    if (!evaluationData) {
      console.log('❌ No final evaluation data found for student:', studentId);
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No final evaluation has been submitted yet by the Company Adviser'
      });
    }

    // Include student data in response (mirrors progress pattern)
    const responseData = {
      ...evaluationData.toObject(),
      student: {
        _id: student._id,
        name: student.name,
        email: student.email,
        university_name: student.university_name,
        profile: student.profile,
        linkedUniversityId: student.linkedUniversityId,
        groupAssignment: student.groupAssignment
      }
    };

    console.log('✅ Returning final evaluation data to Faculty Head');

    res.status(200).json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Error fetching Faculty Head final evaluation data:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching final evaluation data'
    });
  }
};

// Module exports
module.exports = {
  // Adviser management
  createAdviser,
  listAdvisers,
  
  // Student management
  listStudents,
  getAssignedStudents,
  getLinkedAdvisers,
  
  // Adviser links
  upsertAdviserLink,
  getAdviserLink,
  
  // Messaging
  sendMessage,
  listMessages,
  
  // Final Result Evaluation
  getFinalEvaluation,
  createFinalEvaluation,
  updateFinalEvaluation,
  exportFinalEvaluationPDF,
  exportFinalEvaluationPDFByStudent,
  getFacultyHeadFinalEvaluationData,
  
  // Attendance
  recordAttendance,
  listAttendance,
  saveInternshipDates,
  getInternshipDates,
  
  // Progress Reports
  submitProgressReport,
  listProgressReports,
  
  // Evaluations
  submitEvaluation,
  listEvaluations,
  
  // Student Details
  getStudentDetails
};
