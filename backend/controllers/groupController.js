// const User = require("../models/User");
// const Program = require("../models/Program");
// const Application = require("../models/Application");
// const Notification = require("../models/Notification");

// // Get accepted students grouped by program
// const getAcceptedStudentsByProgram = async (req, res) => {
//   try {
//     // Get all programs with their accepted students
//     const programs = await Program.aggregate([
//       {
//         $match: { isActive: true },
//       },
//       {
//         $lookup: {
//           from: "applications",
//           let: { programId: "$_id" },
//           pipeline: [
//             {
//               $match: {
//                 $expr: {
//                   $and: [
//                     { $eq: ["$programId", "$$programId"] },
//                     { $eq: ["$status", "accepted"] },
//                   ],
//                 },
//               },
//             },
//             {
//               $lookup: {
//                 from: "users",
//                 localField: "studentId",
//                 foreignField: "_id",
//                 as: "student",
//               },
//             },
//             {
//               $unwind: "$student",
//             },
//             {
//               $project: {
//                 _id: "$_id",
//                 studentId: "$student._id",
//                 studentName: "$student.name",
//                 studentEmail: "$student.email",
//                 studentPhone: "$student.phone",
//                 appliedAt: "$createdAt",
//                 groupAssignment: "$student.groupAssignment",
//               },
//             },
//           ],
//           as: "acceptedStudents",
//         },
//       },
//       {
//         $project: {
//           _id: 1,
//           name: 1,
//           category: 1,
//           description: 1,
//           duration: 1,
//           color: 1,
//           acceptedStudents: 1,
//           studentGroups: 1,
//           totalAccepted: { $size: "$acceptedStudents" },
//           createdAt: 1,
//         },
//       },
//     ]);

//     res.status(200).json({
//       success: true,
//       data: {
//         programs,
//       },
//     });
//   } catch (error) {
//     console.error("Get accepted students by program error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error",
//     });
//   }
// };

// // Create student groups within a program
// const createStudentGroups = async (req, res) => {
//   try {
//     const { programId } = req.params;
//     const { groups } = req.body; // Array of { groupName, studentIds[] }

//     if (!groups || !Array.isArray(groups) || groups.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Groups array is required",
//       });
//     }

//     const program = await Program.findById(programId);
//     if (!program) {
//       return res.status(404).json({
//         success: false,
//         message: "Program not found",
//       });
//     }

//     // Get accepted students for this program
//     const acceptedApplications = await Application.find({
//       programId,
//       status: "accepted",
//     });

//     const acceptedStudentIds = acceptedApplications.map((app) =>
//       app.studentId.toString()
//     );

//     // Validate all student IDs belong to accepted students
//     const allStudentIds = groups.flatMap((group) => group.studentIds);
//     const invalidStudentIds = allStudentIds.filter(
//       (id) => !acceptedStudentIds.includes(id.toString())
//     );

//     if (invalidStudentIds.length > 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Some students are not accepted for this program",
//         invalidStudentIds,
//       });
//     }

//     // Clear existing groups for this program
//     program.studentGroups = [];

//     // Create new groups
//     const newGroups = groups.map((group) => ({
//       groupName: group.groupName,
//       students: group.studentIds,
//       createdBy: req.user.id,
//       createdAt: new Date(),
//     }));

//     program.studentGroups = newGroups;
//     await program.save();

//     // Update student records with group assignments and create notifications
//     for (const group of groups) {
//       await User.updateMany(
//         { _id: { $in: group.studentIds } },
//         {
//           $set: {
//             groupAssignment: {
//               programId: programId,
//               groupName: group.groupName,
//               assignedBy: req.user.id,
//               assignedAt: new Date(),
//             },
//           },
//         }
//       );

//       // Create notifications for students
//       for (const studentId of group.studentIds) {
//         const student = await User.findById(studentId);
//         if (student) {
//           await Notification.create({
//             userId: studentId,
//             message: `You have been assigned to ${group.groupName} for the ${program.name} program.`,
//             type: "info",
//             title: "Group Assignment",
//             relatedId: programId,
//             relatedModel: "Program",
//           });

//           // Emit real-time notifications
//           const io = req.app.get("io");
//           if (io) {
//             io.to(studentId.toString()).emit("groupAssignment", {
//               programId,
//               programName: program.name,
//               groupName: group.groupName,
//               message: `You have been assigned to ${group.groupName} for ${program.name}`,
//             });
//           }
//         }
//       }
//     }

//     res.status(200).json({
//       success: true,
//       message: "Student groups created successfully",
//       data: {
//         program: await program.populate("studentGroups.students", "name email"),
//         groupsCreated: newGroups.length,
//         studentsAssigned: allStudentIds.length,
//       },
//     });
//   } catch (error) {
//     console.error("Create student groups error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error",
//     });
//   }
// };

// // Update student groups
// const updateStudentGroups = async (req, res) => {
//   try {
//     const { programId, groupId } = req.params;
//     const { groupName, studentIds } = req.body;

//     const program = await Program.findById(programId);
//     if (!program) {
//       return res.status(404).json({
//         success: false,
//         message: "Program not found",
//       });
//     }

//     const groupIndex = program.studentGroups.findIndex(
//       (group) => group._id.toString() === groupId
//     );

//     if (groupIndex === -1) {
//       return res.status(404).json({
//         success: false,
//         message: "Group not found",
//       });
//     }

//     // Get old student IDs to clear their assignments
//     const oldStudentIds = program.studentGroups[groupIndex].students;

//     // Clear old group assignments
//     await User.updateMany(
//       { _id: { $in: oldStudentIds } },
//       { $unset: { groupAssignment: 1 } }
//     );

//     // Update the group
//     program.studentGroups[groupIndex] = {
//       ...program.studentGroups[groupIndex],
//       groupName: groupName || program.studentGroups[groupIndex].groupName,
//       students: studentIds || program.studentGroups[groupIndex].students,
//       createdBy: req.user.id,
//       createdAt: program.studentGroups[groupIndex].createdAt,
//     };

//     await program.save();

//     // Update new student assignments
//     const finalStudentIds =
//       studentIds || program.studentGroups[groupIndex].students;
//     const finalGroupName =
//       groupName || program.studentGroups[groupIndex].groupName;

//     await User.updateMany(
//       { _id: { $in: finalStudentIds } },
//       {
//         $set: {
//           groupAssignment: {
//             programId: programId,
//             groupName: finalGroupName,
//             assignedBy: req.user.id,
//             assignedAt: new Date(),
//           },
//         },
//       }
//     );

//     res.status(200).json({
//       success: true,
//       message: "Student group updated successfully",
//       data: {
//         group: program.studentGroups[groupIndex],
//       },
//     });
//   } catch (error) {
//     console.error("Update student group error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error",
//     });
//   }
// };

// // Delete student group
// const deleteStudentGroup = async (req, res) => {
//   try {
//     const { programId, groupId } = req.params;

//     const program = await Program.findById(programId);
//     if (!program) {
//       return res.status(404).json({
//         success: false,
//         message: "Program not found",
//       });
//     }

//     const groupIndex = program.studentGroups.findIndex(
//       (group) => group._id.toString() === groupId
//     );

//     if (groupIndex === -1) {
//       return res.status(404).json({
//         success: false,
//         message: "Group not found",
//       });
//     }

//     // Get student IDs to clear their assignments
//     const studentIds = program.studentGroups[groupIndex].students;

//     // Clear group assignments for students
//     await User.updateMany(
//       { _id: { $in: studentIds } },
//       { $unset: { groupAssignment: 1 } }
//     );

//     // Remove the group
//     program.studentGroups.splice(groupIndex, 1);
//     await program.save();

//     res.status(200).json({
//       success: true,
//       message: "Student group deleted successfully",
//     });
//   } catch (error) {
//     console.error("Delete student group error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error",
//     });
//   }
// };

// // Get detailed group information for a program
// const getProgramGroups = async (req, res) => {
//   try {
//     const { programId } = req.params;

//     const program = await Program.findById(programId)
//       .populate("studentGroups.students", "name email profile")
//       .populate("studentGroups.createdBy", "name email");

//     if (!program) {
//       return res.status(404).json({
//         success: false,
//         message: "Program not found",
//       });
//     }

//     // Get accepted students not assigned to any group
//     const allGroupedStudentIds = program.studentGroups.flatMap((group) =>
//       group.students.map((student) => student._id.toString())
//     );

//     const unassignedStudents = await Application.find({
//       programId,
//       status: "accepted",
//     })
//       .populate("studentId", "name email")
//       .then((applications) =>
//         applications
//           .filter(
//             (app) =>
//               !allGroupedStudentIds.includes(app.studentId._id.toString())
//           )
//           .map((app) => ({
//             _id: app.studentId._id,
//             name: app.studentId.name,
//             email: app.studentId.email,
//             appliedAt: app.createdAt,
//           }))
//       );

//     res.status(200).json({
//       success: true,
//       data: {
//         program: {
//           _id: program._id,
//           name: program.name,
//           category: program.category,
//           studentGroups: program.studentGroups,
//         },
//         unassignedStudents,
//         totalAcceptedStudents:
//           allGroupedStudentIds.length + unassignedStudents.length,
//       },
//     });
//   } catch (error) {
//     console.error("Get program groups error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error",
//     });
//   }
// };

// // Export student list as CSV data with comprehensive information
// const exportStudentList = async (req, res) => {
//   try {
//     const { programId } = req.params;
//     const { groupId } = req.query;

//     const program = await Program.findById(programId);
//     if (!program) {
//       return res.status(404).json({
//         success: false,
//         message: "Program not found",
//       });
//     }

//     let studentsData = [];

//     // Get all accepted applications for this program
//     const acceptedApplications = await Application.find({
//       programId,
//       status: "accepted",
//     }).populate({
//       path: "studentId",
//       select: "name email phone profile groupAssignment",
//     });

//     if (groupId) {
//       // Export specific group
//       const group = program.studentGroups.find(
//         (g) => g._id.toString() === groupId
//       );
//       if (!group) {
//         return res.status(404).json({
//           success: false,
//           message: "Group not found",
//         });
//       }

//       // Filter applications for this specific group
//       const groupStudentIds = group.students.map((id) => id.toString());
//       const groupApplications = acceptedApplications.filter((app) =>
//         groupStudentIds.includes(app.studentId._id.toString())
//       );

//       studentsData = groupApplications.map((app, index) => {
//         const student = app.studentId;
//         return {
//           number: index + 1,
//           name: student.name || "Unknown",
//           email: student.email || "Not provided",
//           phone: student.phone || student.profile?.phone || "Not provided",
//           program: program.name,
//           category: program.category,
//           group: group.groupName,
//           appliedAt: app.createdAt,
//           assignedAt: student.groupAssignment?.assignedAt || null,
//         };
//       });
//     } else {
//       // Export all accepted students for the program
//       studentsData = acceptedApplications.map((app, index) => {
//         const student = app.studentId;
//         const groupInfo = student.groupAssignment || {};

//         return {
//           number: index + 1,
//           name: student.name || "Unknown",
//           email: student.email || "Not provided",
//           phone: student.phone || student.profile?.phone || "Not provided",
//           program: program.name,
//           category: program.category,
//           group: groupInfo.groupName || "Unassigned",
//           appliedAt: app.createdAt,
//           assignedAt: groupInfo.assignedAt || null,
//         };
//       });
//     }

//     res.status(200).json({
//       success: true,
//       data: {
//         students: studentsData,
//         program: {
//           name: program.name,
//           category: program.category,
//         },
//         exportDate: new Date().toISOString(),
//         totalStudents: studentsData.length,
//       },
//     });
//   } catch (error) {
//     console.error("Export student list error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error",
//     });
//   }
// };

// module.exports = {
//   getAcceptedStudentsByProgram,
//   createStudentGroups,
//   updateStudentGroups,
//   deleteStudentGroup,
//   getProgramGroups,
//   exportStudentList,
// };

const User = require("../models/User");
const Program = require("../models/Program");
const Application = require("../models/Application");
const Notification = require("../models/Notification");

// Get accepted students grouped by program
const getAcceptedStudentsByProgram = async (req, res) => {
  try {
    // Get all programs with their accepted students
    const programs = await Program.aggregate([
      {
        $match: { isActive: true },
      },
      {
        $lookup: {
          from: "applications",
          let: { programId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$programId", "$$programId"] },
                    { $eq: ["$status", "accepted"] },
                  ],
                },
              },
            },
            {
              $lookup: {
                from: "users",
                localField: "studentId",
                foreignField: "_id",
                as: "student",
              },
            },
            {
              $unwind: "$student",
            },
            {
              $project: {
                _id: "$_id",
                studentId: "$student._id",
                studentName: "$student.name",
                studentEmail: "$student.email",
                studentPhone: "$student.phone",
                appliedAt: "$createdAt",
                groupAssignment: "$student.groupAssignment",
              },
            },
          ],
          as: "acceptedStudents",
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          category: 1,
          description: 1,
          duration: 1,
          color: 1,
          acceptedStudents: 1,
          studentGroups: 1,
          totalAccepted: { $size: "$acceptedStudents" },
          createdAt: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        programs,
      },
    });
  } catch (error) {
    console.error("Get accepted students by program error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Create student groups within a program
const createStudentGroups = async (req, res) => {
  try {
    const { programId } = req.params;
    const { groups } = req.body; // Array of { groupName, studentIds[] }

    if (!groups || !Array.isArray(groups) || groups.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Groups array is required",
      });
    }

    const program = await Program.findById(programId);
    if (!program) {
      return res.status(404).json({
        success: false,
        message: "Program not found",
      });
    }

    // Get accepted students for this program
    const acceptedApplications = await Application.find({
      programId,
      status: "accepted",
    });

    const acceptedStudentIds = acceptedApplications.map((app) =>
      app.studentId.toString()
    );

    // Validate all student IDs belong to accepted students
    const allStudentIds = groups.flatMap((group) => group.studentIds);
    const invalidStudentIds = allStudentIds.filter(
      (id) => !acceptedStudentIds.includes(id.toString())
    );

    if (invalidStudentIds.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Some students are not accepted for this program",
        invalidStudentIds,
      });
    }

    // Clear existing groups for this program
    program.studentGroups = [];

    // Create new groups
    const newGroups = groups.map((group) => ({
      groupName: group.groupName,
      students: group.studentIds,
      createdBy: req.user.id,
      createdAt: new Date(),
    }));

    program.studentGroups = newGroups;
    await program.save();

    // Update student records with group assignments and create notifications
    for (const group of groups) {
      await User.updateMany(
        { _id: { $in: group.studentIds } },
        {
          $set: {
            groupAssignment: {
              programId: programId,
              groupName: group.groupName,
              assignedBy: req.user.id,
              assignedAt: new Date(),
            },
          },
        }
      );

      // Create notifications for students
      for (const studentId of group.studentIds) {
        const student = await User.findById(studentId);
        if (student) {
          await Notification.create({
            userId: studentId,
            message: `You have been assigned to ${group.groupName} for the ${program.name} program.`,
            type: "info",
            title: "Group Assignment",
            relatedId: programId,
            relatedModel: "Program",
          });

          // **FIX 2: Enhanced real-time notifications with better data**
          const io = req.app.get("io");
          if (io) {
            io.to(studentId.toString()).emit("groupAssignment", {
              programId,
              programName: program.name,
              groupName: group.groupName,
              message: `You have been assigned to ${group.groupName} for ${program.name}`,
              // **FIX 2: Add user data refresh trigger**
              refreshUser: true,
            });

            // Also emit a general notification event
            io.to(studentId.toString()).emit("newNotification", {
              message: `You have been assigned to ${group.groupName} for ${program.name}`,
              type: "info",
              title: "Group Assignment",
            });
          }
        }
      }
    }

    res.status(200).json({
      success: true,
      message: "Student groups created successfully",
      data: {
        program: await program.populate("studentGroups.students", "name email"),
        groupsCreated: newGroups.length,
        studentsAssigned: allStudentIds.length,
      },
    });
  } catch (error) {
    console.error("Create student groups error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Update student groups
const updateStudentGroups = async (req, res) => {
  try {
    const { programId, groupId } = req.params;
    const { groupName, studentIds } = req.body;

    const program = await Program.findById(programId);
    if (!program) {
      return res.status(404).json({
        success: false,
        message: "Program not found",
      });
    }

    const groupIndex = program.studentGroups.findIndex(
      (group) => group._id.toString() === groupId
    );

    if (groupIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    // Get old student IDs to clear their assignments
    const oldStudentIds = program.studentGroups[groupIndex].students;

    // Clear old group assignments
    await User.updateMany(
      { _id: { $in: oldStudentIds } },
      { $unset: { groupAssignment: 1 } }
    );

    // Update the group
    program.studentGroups[groupIndex] = {
      ...program.studentGroups[groupIndex],
      groupName: groupName || program.studentGroups[groupIndex].groupName,
      students: studentIds || program.studentGroups[groupIndex].students,
      createdBy: req.user.id,
      createdAt: program.studentGroups[groupIndex].createdAt,
    };

    await program.save();

    // Update new student assignments
    const finalStudentIds =
      studentIds || program.studentGroups[groupIndex].students;
    const finalGroupName =
      groupName || program.studentGroups[groupIndex].groupName;

    await User.updateMany(
      { _id: { $in: finalStudentIds } },
      {
        $set: {
          groupAssignment: {
            programId: programId,
            groupName: finalGroupName,
            assignedBy: req.user.id,
            assignedAt: new Date(),
          },
        },
      }
    );

    // **FIX 2: Emit real-time notifications for updated group assignments**
    for (const studentId of finalStudentIds) {
      const io = req.app.get("io");
      if (io) {
        io.to(studentId.toString()).emit("groupAssignment", {
          programId,
          programName: program.name,
          groupName: finalGroupName,
          message: `Your group assignment has been updated to ${finalGroupName}`,
          refreshUser: true,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: "Student group updated successfully",
      data: {
        group: program.studentGroups[groupIndex],
      },
    });
  } catch (error) {
    console.error("Update student group error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Delete student group
const deleteStudentGroup = async (req, res) => {
  try {
    const { programId, groupId } = req.params;

    const program = await Program.findById(programId);
    if (!program) {
      return res.status(404).json({
        success: false,
        message: "Program not found",
      });
    }

    const groupIndex = program.studentGroups.findIndex(
      (group) => group._id.toString() === groupId
    );

    if (groupIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    // Get student IDs to clear their assignments
    const studentIds = program.studentGroups[groupIndex].students;

    // Clear group assignments for students
    await User.updateMany(
      { _id: { $in: studentIds } },
      { $unset: { groupAssignment: 1 } }
    );

    // Remove the group
    program.studentGroups.splice(groupIndex, 1);
    await program.save();

    // **FIX 2: Emit real-time notifications for removed group assignments**
    for (const studentId of studentIds) {
      const io = req.app.get("io");
      if (io) {
        io.to(studentId.toString()).emit("groupAssignment", {
          programId,
          programName: program.name,
          groupName: null,
          message: `Your group assignment has been removed`,
          refreshUser: true,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: "Student group deleted successfully",
    });
  } catch (error) {
    console.error("Delete student group error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get detailed group information for a program
const getProgramGroups = async (req, res) => {
  try {
    const { programId } = req.params;

    const program = await Program.findById(programId)
      .populate("studentGroups.students", "name email profile")
      .populate("studentGroups.createdBy", "name email");

    if (!program) {
      return res.status(404).json({
        success: false,
        message: "Program not found",
      });
    }

    // Get accepted students not assigned to any group
    const allGroupedStudentIds = program.studentGroups.flatMap((group) =>
      group.students.map((student) => student._id.toString())
    );

    const unassignedStudents = await Application.find({
      programId,
      status: "accepted",
    })
      .populate("studentId", "name email")
      .then((applications) =>
        applications
          .filter(
            (app) =>
              !allGroupedStudentIds.includes(app.studentId._id.toString())
          )
          .map((app) => ({
            _id: app.studentId._id,
            name: app.studentId.name,
            email: app.studentId.email,
            appliedAt: app.createdAt,
          }))
      );

    res.status(200).json({
      success: true,
      data: {
        program: {
          _id: program._id,
          name: program.name,
          category: program.category,
          studentGroups: program.studentGroups,
        },
        unassignedStudents,
        totalAcceptedStudents:
          allGroupedStudentIds.length + unassignedStudents.length,
      },
    });
  } catch (error) {
    console.error("Get program groups error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Export student list as CSV data with comprehensive information
const exportStudentList = async (req, res) => {
  try {
    const { programId } = req.params;
    const { groupId } = req.query;

    const program = await Program.findById(programId);
    if (!program) {
      return res.status(404).json({
        success: false,
        message: "Program not found",
      });
    }

    let studentsData = [];

    // Get all accepted applications for this program
    const acceptedApplications = await Application.find({
      programId,
      status: "accepted",
    }).populate({
      path: "studentId",
      select: "name email phone profile groupAssignment",
    });

    if (groupId) {
      // Export specific group
      const group = program.studentGroups.find(
        (g) => g._id.toString() === groupId
      );
      if (!group) {
        return res.status(404).json({
          success: false,
          message: "Group not found",
        });
      }

      // Filter applications for this specific group
      const groupStudentIds = group.students.map((id) => id.toString());
      const groupApplications = acceptedApplications.filter((app) =>
        groupStudentIds.includes(app.studentId._id.toString())
      );

      studentsData = groupApplications.map((app, index) => {
        const student = app.studentId;
        return {
          number: index + 1,
          name: student.name || "Unknown",
          email: student.email || "Not provided",
          phone: student.phone || student.profile?.phone || "Not provided",
          program: program.name,
          category: program.category,
          group: group.groupName,
          appliedAt: app.createdAt,
          assignedAt: student.groupAssignment?.assignedAt || null,
        };
      });
    } else {
      // Export all accepted students for the program
      studentsData = acceptedApplications.map((app, index) => {
        const student = app.studentId;
        const groupInfo = student.groupAssignment || {};

        return {
          number: index + 1,
          name: student.name || "Unknown",
          email: student.email || "Not provided",
          phone: student.phone || student.profile?.phone || "Not provided",
          program: program.name,
          category: program.category,
          group: groupInfo.groupName || "Unassigned",
          appliedAt: app.createdAt,
          assignedAt: groupInfo.assignedAt || null,
        };
      });
    }

    res.status(200).json({
      success: true,
      data: {
        students: studentsData,
        program: {
          name: program.name,
          category: program.category,
        },
        exportDate: new Date().toISOString(),
        totalStudents: studentsData.length,
      },
    });
  } catch (error) {
    console.error("Export student list error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  getAcceptedStudentsByProgram,
  createStudentGroups,
  updateStudentGroups,
  deleteStudentGroup,
  getProgramGroups,
  exportStudentList,
};
