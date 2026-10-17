const Program = require("../models/Program");
const Application = require("../models/Application");
const User = require("../models/User");
const { validationResult } = require("express-validator");

// Get All Programs
const getPrograms = async (req, res) => {
  try {
    const {
      category,
      availability,
      search,
      sortBy = "name",
      sortOrder = "asc",
    } = req.query;

    let query = { isActive: true };

    // Filter by category
    if (category && category !== "all") {
      query.category = category;
    }

    // Filter by availability
    if (availability) {
      switch (availability) {
        case "available":
          query.availableSpots = { $gt: 0 };
          break;
        case "limited":
          query.availableSpots = { $lte: 5, $gt: 0 };
          break;
        case "full":
          query.availableSpots = 0;
          break;
      }
    }

    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }

    // Sorting
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

    const programs = await Program.find(query)
      .populate("createdBy", "name email")
      .sort(sortOptions);

    res.status(200).json({
      success: true,
      count: programs.length,
      data: {
        programs,
      },
    });
  } catch (error) {
    console.error("Get programs error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get Single Program
const getProgram = async (req, res) => {
  try {
    const program = await Program.findById(req.params.id).populate(
      "createdBy",
      "name email"
    );

    if (!program || !program.isActive) {
      return res.status(404).json({
        success: false,
        message: "Program not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        program,
      },
    });
  } catch (error) {
    console.error("Get program error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Create Program (Admin only)
const createProgram = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const programData = {
      ...req.body,
      createdBy: req.user.id,
      availableSpots: req.body.totalSpots, // Initially all spots are available
    };

    const program = await Program.create(programData);

    await program.populate("createdBy", "name email");

    res.status(201).json({
      success: true,
      message: "Program created successfully",
      data: {
        program,
      },
    });
  } catch (error) {
    console.error("Create program error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Update Program (Admin only)
const updateProgram = async (req, res) => {
  try {
    const program = await Program.findById(req.params.id);

    if (!program) {
      return res.status(404).json({
        success: false,
        message: "Program not found",
      });
    }

    // Prevent updating if applications exist and totalSpots is being reduced
    if (req.body.totalSpots && req.body.totalSpots < program.totalSpots) {
      const applicationCount = await Application.countDocuments({
        programId: req.params.id,
        status: { $in: ["pending", "accepted"] },
      });

      if (req.body.totalSpots < applicationCount) {
        return res.status(400).json({
          success: false,
          message: `Cannot reduce total spots below ${applicationCount}. There are existing applications.`,
        });
      }
    }

    const updatedProgram = await Program.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate("createdBy", "name email");

    res.status(200).json({
      success: true,
      message: "Program updated successfully",
      data: {
        program: updatedProgram,
      },
    });
  } catch (error) {
    console.error("Update program error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Delete Program (Admin only)
const deleteProgram = async (req, res) => {
  try {
    const program = await Program.findById(req.params.id);

    if (!program) {
      return res.status(404).json({
        success: false,
        message: "Program not found",
      });
    }

    // Check if program has applications
    const applicationCount = await Application.countDocuments({
      programId: req.params.id,
    });

    if (applicationCount > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete program with existing applications. Archive it instead.",
      });
    }

    // Soft delete by setting isActive to false
    program.isActive = false;
    await program.save();

    res.status(200).json({
      success: true,
      message: "Program deleted successfully",
    });
  } catch (error) {
    console.error("Delete program error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Archive Program (Admin only)
const archiveProgram = async (req, res) => {
  try {
    const program = await Program.findById(req.params.id);

    if (!program) {
      return res.status(404).json({
        success: false,
        message: "Program not found",
      });
    }

    program.isActive = false;
    await program.save();

    res.status(200).json({
      success: true,
      message: "Program archived successfully",
    });
  } catch (error) {
    console.error("Archive program error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Reactivate Program (Admin only)
const reactivateProgram = async (req, res) => {
  try {
    const program = await Program.findById(req.params.id);

    if (!program) {
      return res.status(404).json({
        success: false,
        message: "Program not found",
      });
    }

    program.isActive = true;
    await program.save();

    res.status(200).json({
      success: true,
      message: "Program reactivated successfully",
    });
  } catch (error) {
    console.error("Reactivate program error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get Program Statistics (Admin only)
const getProgramStatistics = async (req, res) => {
  try {
    const programId = req.params.id;

    const program = await Program.findById(programId);
    if (!program) {
      return res.status(404).json({
        success: false,
        message: "Program not found",
      });
    }

    // Get application statistics
    const totalApplications = await Application.countDocuments({ programId });
    const pendingApplications = await Application.countDocuments({
      programId,
      status: "pending",
    });
    const acceptedApplications = await Application.countDocuments({
      programId,
      status: "accepted",
    });
    const rejectedApplications = await Application.countDocuments({
      programId,
      status: "rejected",
    });

    // Get accepted students grouped by assignment
    const acceptedStudents = await Application.find({
      programId,
      status: "accepted",
    }).populate("studentId", "name email groupAssignment");

    res.status(200).json({
      success: true,
      data: {
        program,
        statistics: {
          totalApplications,
          pendingApplications,
          acceptedApplications,
          rejectedApplications,
          spotsRemaining: program.availableSpots,
          spotsTaken: program.totalSpots - program.availableSpots,
        },
        acceptedStudents,
        studentGroups: program.studentGroups,
      },
    });
  } catch (error) {
    console.error("Get program statistics error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Check Program Availability
const checkAvailability = async (req, res) => {
  try {
    const program = await Program.findById(req.params.id);

    if (!program || !program.isActive) {
      return res.status(404).json({
        success: false,
        message: "Program not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        availableSpots: program.availableSpots,
        totalSpots: program.totalSpots,
        isAvailable: program.availableSpots > 0,
        isLimited: program.availableSpots <= 5 && program.availableSpots > 0,
      },
    });
  } catch (error) {
    console.error("Check availability error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get all programs for admin (including inactive)
const getAllProgramsAdmin = async (req, res) => {
  try {
    const { includeInactive = false } = req.query;

    let query = {};
    if (!includeInactive) {
      query.isActive = true;
    }

    const programs = await Program.find(query)
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: programs.length,
      data: {
        programs,
      },
    });
  } catch (error) {
    console.error("Get admin programs error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  getPrograms,
  getProgram,
  createProgram,
  updateProgram,
  deleteProgram,
  archiveProgram,
  reactivateProgram,
  checkAvailability,
  getProgramStatistics,
  getAllProgramsAdmin,
};
