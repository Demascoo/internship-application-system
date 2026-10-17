const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { normalizeUniversityName } = require("../utils/universityUtils");

const acceptancePaperSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Application",
    required: true,
  },
  programId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Program",
    required: true,
  },
  programName: {
    type: String,
    required: true,
  },
  filename: {
    type: String,
    required: true,
  },
  originalName: {
    type: String,
    required: true,
  },
  filePath: {
    type: String,
    required: true,
  },
  message: String,
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  uploadDate: {
    type: Date,
    default: Date.now,
  },
});

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    temporaryPassword: {
      type: String,
      select: false, // Store plain text password for admin copy functionality
    },
    role: {
      type: String,
      enum: ["student", "admin", "companyAdviser", "universityAdviser", "companyAdmin", "facultyHead"],
      default: "student",
    },
    phone: {
      type: String,
      trim: true,
      match: [/^\+?[\d\s-()]+$/, "Please enter a valid phone number"],
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    adminApproved: {
      type: Boolean,
      default: function () {
        return this.role === "student";
      },
    },
    // New field to track if this is the first admin
    isFirstAdmin: {
      type: Boolean,
      default: false,
    },
    // Group assignment for students
    groupAssignment: {
      programId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Program",
      },
      groupName: String,
      assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      assignedAt: {
        type: Date,
        default: Date.now,
      },
    },
    // University-based linking fields
    university_name: {
      type: String,
      trim: true,
      index: true, // For efficient querying
    },
    universityAdviserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    facultyHeadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    companyAdviserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    linkedUniversityId: {
      type: String, // University name for linking
      trim: true,
      index: true,
    },
    linkedStudentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // For University Adviser -> Student linking
    },
    linkedProgramId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Program", // For Company Adviser -> Program linking
    },
    profile: {
      skills: [String],
      gpa: {
        type: Number,
        min: 0,
        max: 4,
      },
      experience: String,
      phone: String,
      university: String, // Keep for backward compatibility
      graduationYear: Number,
      bio: String,
      department: String,
      companyName: String,
      companyAdviser: String,
      universityAdviser: String,
      internshipStartDate: Date,
      internshipEndDate: Date,
    },
    applications: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Application",
      },
    ],
    acceptancePapers: [acceptancePaperSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
    // Security fields
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: Date,
    lastLogin: Date,
    registrationDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Normalize university name before saving
userSchema.pre("save", function (next) {
  if (this.university_name) {
    this.university_name = normalizeUniversityName(this.university_name);
  }
  next();
});

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  try {
    // If password already looks like a bcrypt hash, do not rehash (prevents double-hashing from clients sending hashed strings)
    const candidatePassword = this.password;
    const seemsBcryptHash = typeof candidatePassword === "string" && /^\$2[aby]\$\d{2}\$.{53}$/.test(candidatePassword);
    if (seemsBcryptHash) {
      return next();
    }

    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(candidatePassword, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.emailVerificationToken;
  delete user.emailVerificationExpires;
  return user;
};

// Check if user account is locked
userSchema.virtual("isLocked").get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Increment login attempts
userSchema.methods.incLoginAttempts = function () {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: {
        loginAttempts: 1,
        lockUntil: 1,
      },
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };

  // Lock account after 5 attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = {
      lockUntil: Date.now() + 2 * 60 * 60 * 1000, // 2 hours
    };
  }

  return this.updateOne(updates);
};

// Reset login attempts
userSchema.methods.resetLoginAttempts = function () {
  return this.updateOne({
    $unset: {
      loginAttempts: 1,
      lockUntil: 1,
    },
    $set: {
      lastLogin: Date.now(),
    },
  });
};

module.exports = mongoose.model("User", userSchema);
