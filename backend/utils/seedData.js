const User = require("../models/User");
const Program = require("../models/Program");

const seedData = async () => {
  try {
    // Check if any admin user exists (don't auto-create admin anymore)
    const adminExists = await User.findOne({ role: "admin" });

    if (adminExists) {
      console.log("✅ Admin user already exists");
    } else {
      console.log("ℹ️  No admin user found. Admin registration is available.");
    }

    // Check if default programs exist
    const programsExist = await Program.countDocuments({ isDefault: true });

    if (programsExist === 0) {
      // Create a temporary admin ID for seeding (will be updated when real admin registers)
      const tempAdminId = "000000000000000000000000"; // Placeholder ObjectId

      const programs = [
        {
          name: "Networking Infrastructure",
          description:
            "Master network infrastructure, security protocols, and system administration. Work with enterprise-grade equipment and real network configurations.",
          totalSpots: 15,
          availableSpots: 15,
          requirements: [
            "Basic understanding of computer networks",
            "Knowledge of TCP/IP protocols",
            "Familiarity with network hardware",
            "Problem-solving skills",
            "Team collaboration experience",
          ],
          duration: "6 months",
          category: "networking",
          color: "from-blue-500 to-blue-600",
          icon: "network",
          startDate: new Date("2025-03-15"),
          endDate: new Date("2025-09-15"),
          applicationDeadline: new Date("2025-02-28"),
          startMonth: "March",
          endMonth: "September",
          durationInMonths: 6,
          skills: ["Networking", "Security", "System Administration"],
          benefits: [
            "Industry mentorship",
            "Certificate of completion",
            "Job placement assistance",
          ],
          createdBy: tempAdminId,
          isDefault: true,
        },
        {
          name: "Software Development",
          description:
            "Build modern applications using cutting-edge technologies. Gain experience in full-stack development, API design, and software architecture.",
          totalSpots: 20,
          availableSpots: 20,
          requirements: [
            "Programming experience (Python, JavaScript, or Java)",
            "Understanding of data structures",
            "Database fundamentals",
            "Version control (Git) knowledge",
            "Agile development familiarity",
          ],
          duration: "6 months",
          category: "software",
          color: "from-teal-500 to-teal-600",
          icon: "code",
          startDate: new Date("2025-03-15"),
          endDate: new Date("2025-09-15"),
          applicationDeadline: new Date("2025-02-28"),
          startMonth: "March",
          endMonth: "September",
          durationInMonths: 6,
          skills: ["React", "Node.js", "MongoDB", "APIs"],
          benefits: [
            "Real project experience",
            "Portfolio development",
            "Tech industry connections",
          ],
          createdBy: tempAdminId,
          isDefault: true,
        },
        {
          name: "IT Maintenance & Support",
          description:
            "Learn hardware troubleshooting, system maintenance, and technical support. Develop skills in computer repair and IT infrastructure management.",
          totalSpots: 10,
          availableSpots: 10,
          requirements: [
            "Basic computer hardware knowledge",
            "Windows/Linux operating systems",
            "Customer service skills",
            "Attention to detail",
            "Technical documentation skills",
          ],
          duration: "4 months",
          category: "maintenance",
          color: "from-orange-500 to-orange-600",
          icon: "tool",
          startDate: new Date("2025-04-01"),
          endDate: new Date("2025-08-01"),
          applicationDeadline: new Date("2025-03-15"),
          startMonth: "April",
          endMonth: "August",
          durationInMonths: 4,
          skills: [
            "Hardware Troubleshooting",
            "System Maintenance",
            "Technical Support",
          ],
          benefits: [
            "Hands-on experience",
            "Industry certifications",
            "Technical expertise",
          ],
          createdBy: tempAdminId,
          isDefault: true,
        },
      ];

      await Program.insertMany(programs);
      console.log("✅ Default programs created");
    }

    console.log("✅ Database seeded successfully");
  } catch (error) {
    console.error("❌ Seeding error:", error);
  }
};

module.exports = seedData;
