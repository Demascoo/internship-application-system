const User = require("../models/User");
const { normalizeUniversityName, universitiesMatch } = require("../utils/universityUtils");

/**
 * Get all unique universities from existing students
 */
const getUniversities = async (req, res) => {
  try {
    console.log("Getting universities - endpoint called");
    const { search } = req.query;
    
    // Get all students with university names
    const students = await User.find({
      role: 'student',
      university_name: { $exists: true, $ne: null, $ne: '' }
    }).select('university_name');

    console.log(`Found ${students.length} students with university names`);

    // Extract unique universities
    const universities = [...new Set(students.map(s => s.university_name))].filter(Boolean).sort();
    
    // Filter by search term if provided
    let filteredUniversities = universities;
    if (search && search.trim()) {
      const searchTerm = search.toLowerCase().trim();
      filteredUniversities = universities.filter(uni => 
        uni && uni.toLowerCase().includes(searchTerm)
      );
    }

    console.log(`Returning ${filteredUniversities.length} universities`);

    res.status(200).json({
      success: true,
      data: {
        universities: filteredUniversities,
        total: filteredUniversities.length
      }
    });
  } catch (error) {
    console.error("Get universities error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

/**
 * Get students by university name (for admin linking operations)
 */
const getStudentsByUniversity = async (req, res) => {
  try {
    const { universityName } = req.params;
    
    if (!universityName) {
      return res.status(400).json({
        success: false,
        message: "University name is required"
      });
    }

    // Normalize the search university name
    const normalizedSearch = normalizeUniversityName(universityName);
    
    // Find students with matching university (case-insensitive)
    const students = await User.find({
      role: 'student',
      university_name: { $regex: new RegExp(`^${normalizedSearch}$`, 'i') }
    }).select('name email university_name universityAdviserId facultyHeadId createdAt');

    res.status(200).json({
      success: true,
      data: {
        students,
        university: normalizedSearch,
        count: students.length
      }
    });
  } catch (error) {
    console.error("Get students by university error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/**
 * Link students to university adviser or faculty head
 */
const linkStudentsToAdviser = async (req, res) => {
  try {
    const { universityName, adviserId, adviserType } = req.body;
    
    if (!universityName || !adviserId || !adviserType) {
      return res.status(400).json({
        success: false,
        message: "University name, adviser ID, and adviser type are required"
      });
    }

    if (!['universityAdviser', 'facultyHead'].includes(adviserType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid adviser type. Must be 'universityAdviser' or 'facultyHead'"
      });
    }

    // Verify the adviser exists and has the correct role
    const adviser = await User.findById(adviserId);
    if (!adviser || adviser.role !== adviserType) {
      return res.status(404).json({
        success: false,
        message: `${adviserType} not found`
      });
    }

    // Verify adviser has the same university
    if (!universitiesMatch(adviser.university_name, universityName)) {
      return res.status(400).json({
        success: false,
        message: "Adviser university does not match the specified university"
      });
    }

    // Find all students from this university
    const normalizedUniversity = normalizeUniversityName(universityName);
    const students = await User.find({
      role: 'student',
      university_name: { $regex: new RegExp(`^${normalizedUniversity}$`, 'i') }
    });

    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No students found for this university"
      });
    }

    // Update students with the adviser link
    const updateField = adviserType === 'universityAdviser' ? 'universityAdviserId' : 'facultyHeadId';
    const updateResult = await User.updateMany(
      {
        role: 'student',
        university_name: { $regex: new RegExp(`^${normalizedUniversity}$`, 'i') }
      },
      { $set: { [updateField]: adviserId } }
    );

    // Log the activity
    const ActivityLog = require("../models/ActivityLog");
    await ActivityLog.create({
      userId: req.user._id,
      action: 'link_students_to_adviser',
      details: `Linked ${updateResult.modifiedCount} students from ${normalizedUniversity} to ${adviserType} ${adviser.name}`,
      metadata: {
        universityName: normalizedUniversity,
        adviserId: adviser._id,
        adviserName: adviser.name,
        adviserType,
        studentsLinked: updateResult.modifiedCount
      }
    });

    res.status(200).json({
      success: true,
      message: `Successfully linked ${updateResult.modifiedCount} students to ${adviser.name}`,
      data: {
        studentsLinked: updateResult.modifiedCount,
        adviser: {
          id: adviser._id,
          name: adviser.name,
          type: adviserType
        },
        university: normalizedUniversity
      }
    });
  } catch (error) {
    console.error("Link students to adviser error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

module.exports = {
  getUniversities,
  getStudentsByUniversity,
  linkStudentsToAdviser
};
