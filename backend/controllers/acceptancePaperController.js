const User = require("../models/User");
const Application = require("../models/Application");
const Program = require("../models/Program");
const Notification = require("../models/Notification");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = "uploads/acceptance-papers";
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /pdf|doc|docx/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only PDF and Word documents are allowed"));
    }
  },
});

// Upload acceptance paper
const uploadAcceptancePaper = async (req, res) => {
  try {
    const { studentId, applicationId, programId, message } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    // Get program and student details
    const program = await Program.findById(programId);
    const student = await User.findById(studentId);

    if (!program || !student) {
      return res.status(404).json({
        success: false,
        message: "Program or student not found",
      });
    }

    // Create acceptance paper data
    const acceptancePaper = {
      studentId,
      applicationId,
      programId,
      programName: program.name,
      filename: req.file.filename,
      originalName: req.file.originalname,
      filePath: req.file.path,
      message: message || "",
      uploadedBy: req.user.id,
      uploadDate: new Date(),
    };

    // Add to student's acceptancePapers array
    student.acceptancePapers.push(acceptancePaper);
    await student.save();

    // Create notification for student
    await Notification.create({
      userId: studentId,
      message: `Your acceptance paper for ${program.name} is ready for download.`,
      type: "success",
      title: "Acceptance Paper Available",
      relatedId: programId,
      relatedModel: "Program",
    });

    // Emit real-time notification
    const io = req.app.get("io");
    if (io) {
      io.to(studentId.toString()).emit("acceptancePaper", {
        programId,
        programName: program.name,
        message: "Your acceptance paper is ready for download",
      });
    }

    res.status(201).json({
      success: true,
      message: "Acceptance paper uploaded successfully",
      data: {
        paper: acceptancePaper,
      },
    });
  } catch (error) {
    console.error("Upload acceptance paper error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get all acceptance papers for admin
const getAllAcceptancePapersAdmin = async (req, res) => {
  try {
    // Get all users with acceptance papers
    const usersWithPapers = await User.find({
      "acceptancePapers.0": { $exists: true },
    }).populate("acceptancePapers.programId", "name category");

    // Flatten the acceptance papers data
    const papers = [];
    usersWithPapers.forEach((user) => {
      user.acceptancePapers.forEach((paper) => {
        papers.push({
          _id: paper._id,
          studentId: user._id,
          studentName: user.name,
          studentEmail: user.email,
          programId: paper.programId,
          programName: paper.programName,
          filename: paper.filename,
          originalName: paper.originalName,
          filePath: paper.filePath,
          message: paper.message,
          uploadDate: paper.uploadDate,
          uploadedBy: paper.uploadedBy,
        });
      });
    });

    res.status(200).json({
      success: true,
      data: {
        papers,
      },
    });
  } catch (error) {
    console.error("Get all acceptance papers error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get acceptance papers for student
const getAcceptancePapersStudent = async (req, res) => {
  try {
    const student = await User.findById(req.user.id).populate(
      "acceptancePapers.programId",
      "name category"
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        papers: student.acceptancePapers,
      },
    });
  } catch (error) {
    console.error("Get student acceptance papers error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Download acceptance paper
const downloadAcceptancePaper = async (req, res) => {
  try {
    const { paperId } = req.params;

    // Find the user with this acceptance paper
    const user = await User.findOne({
      "acceptancePapers._id": paperId,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Acceptance paper not found",
      });
    }

    const paper = user.acceptancePapers.id(paperId);
    if (!paper) {
      return res.status(404).json({
        success: false,
        message: "Acceptance paper not found",
      });
    }

    // Check if user has permission to download
    if (req.user.role !== "admin" && user._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const filePath = path.join(process.cwd(), paper.filePath);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    res.download(filePath, paper.originalName);
  } catch (error) {
    console.error("Download acceptance paper error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Delete acceptance paper (admin only)
const deleteAcceptancePaper = async (req, res) => {
  try {
    const { paperId } = req.params;

    const user = await User.findOne({
      "acceptancePapers._id": paperId,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Acceptance paper not found",
      });
    }

    const paper = user.acceptancePapers.id(paperId);
    if (!paper) {
      return res.status(404).json({
        success: false,
        message: "Acceptance paper not found",
      });
    }

    // Delete file from filesystem
    const filePath = path.join(process.cwd(), paper.filePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Remove from user's acceptancePapers array
    user.acceptancePapers.pull(paperId);
    await user.save();

    res.status(200).json({
      success: true,
      message: "Acceptance paper deleted successfully",
    });
  } catch (error) {
    console.error("Delete acceptance paper error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  upload,
  uploadAcceptancePaper,
  getAllAcceptancePapersAdmin,
  getAcceptancePapersStudent,
  downloadAcceptancePaper,
  deleteAcceptancePaper,
};
