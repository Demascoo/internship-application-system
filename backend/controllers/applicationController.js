const Application = require("../models/Application");
const Program = require("../models/Program");
const User = require("../models/User");
const Notification = require("../models/Notification");

// Submit Application
const submitApplication = async (req, res) => {
  try {
    const {
      programId,
      motivation,
      experience,
      goals,
      availability,
      preferredStartDate,
      preferredEndDate,
      preferredStartMonth,
      preferredEndMonth,
      desiredDuration,
    } = req.body;

    // Check if program exists and is active
    const program = await Program.findById(programId);
    if (!program || !program.isActive) {
      return res.status(404).json({
        success: false,
        message: "Program not found",
      });
    }

    // Check for available spots
    if (program.availableSpots <= 0) {
      return res.status(400).json({
        success: false,
        message: "No available spots for this program",
      });
    }

    // Check if user already applied to this program
    const existingApplication = await Application.findOne({
      studentId: req.user.id,
      programId,
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: "You have already applied to this program",
      });
    }

    // Create application
    const application = await Application.create({
      studentId: req.user.id,
      programId,
      studentName: req.user.name,
      studentEmail: req.user.email,
      motivation,
      experience,
      goals,
      availability,
      preferredStartDate: new Date(preferredStartDate),
      preferredEndDate: new Date(preferredEndDate),
      preferredStartMonth,
      preferredEndMonth,
      desiredDuration: Number(desiredDuration),
      resumeUrl: req.file ? `uploads/${req.file.filename}` : undefined,
    });

    // Update available spots
    program.availableSpots -= 1;
    await program.save();

    // Add to user's applications
    await User.findByIdAndUpdate(req.user.id, {
      $push: { applications: application._id },
    });

    // Create notification
    await Notification.create({
      userId: req.user.id,
      message: `Your application for ${program.name} has been submitted successfully!`,
      type: "success",
      title: "Application Submitted",
      relatedId: application._id,
      relatedModel: "Application",
    });

    // Emit real-time notification
    const io = req.app.get("io");
    io.to(req.user.id.toString()).emit("newNotification", {
      message: `Application submitted for ${program.name}`,
      type: "success",
    });

    // Populate the application with program details before sending response
    const populatedApplication = await Application.findById(
      application._id
    ).populate(
      "programId",
      "name description duration startMonth endMonth durationInMonths availableSpots"
    );

    res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      data: {
        application: populatedApplication,
      },
    });
  } catch (error) {
    console.error("Submit application error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get All Applications (Admin)
const getAllApplications = async (req, res) => {
  try {
    const { status, program, page = 1, limit = 10 } = req.query;

    let query = {};

    if (status && status !== "all") {
      query.status = status;
    }

    if (program && program !== "all") {
      query.programId = program;
    }

    const skip = (page - 1) * limit;

    const applications = await Application.find(query)
      .populate(
        "programId",
        "name description duration startMonth endMonth durationInMonths availableSpots"
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Application.countDocuments(query);

    res.status(200).json({
      success: true,
      count: applications.length,
      total,
      data: {
        applications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get applications error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get Application by ID
const getApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id).populate(
      "programId",
      "name description duration startMonth endMonth durationInMonths availableSpots"
    );

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // Check if user can access this application
    if (
      req.user.role === "student" &&
      application.studentId.toString() !== req.user.id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        application,
      },
    });
  } catch (error) {
    console.error("Get application error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get Student's Applications
const getStudentApplications = async (req, res) => {
  try {
    const applications = await Application.find({
      studentId: req.user.id,
    })
      .populate(
        "programId",
        "name description duration startMonth endMonth durationInMonths availableSpots"
      )
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: applications.length,
      data: {
        applications,
      },
    });
  } catch (error) {
    console.error("Get student applications error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Update Application Status (Admin)
const updateApplicationStatus = async (req, res) => {
  try {
    const { status, reviewNotes } = req.body;

    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be "accepted" or "rejected"',
      });
    }

    const application = await Application.findById(req.params.id).populate(
      "programId",
      "name description duration startMonth endMonth durationInMonths availableSpots"
    );

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // Update application
    application.status = status;
    application.reviewNotes = reviewNotes;
    application.reviewedBy = req.user.id;
    application.reviewedAt = new Date();

    await application.save();

    // Create notification for student
    await Notification.create({
      userId: application.studentId,
      message: `Your application for ${application.programId.name} has been ${status}!`,
      type: status === "accepted" ? "success" : "error",
      title: `Application ${status === "accepted" ? "Accepted" : "Rejected"}`,
      relatedId: application._id,
      relatedModel: "Application",
    });

    // Emit real-time notification
    const io = req.app.get("io");
    io.to(application.studentId.toString()).emit("applicationStatusUpdate", {
      applicationId: application._id,
      status,
      message: `Your application has been ${status}`,
    });

    res.status(200).json({
      success: true,
      message: `Application ${status} successfully`,
      data: {
        application,
      },
    });
  } catch (error) {
    console.error("Update application status error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  submitApplication,
  getAllApplications,
  getApplication,
  getStudentApplications,
  updateApplicationStatus,
};
