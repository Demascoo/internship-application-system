
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const LoginActivity = require("../models/LoginActivity");
const { validateUniversityName, normalizeUniversityName, universitiesMatch } = require("../utils/universityUtils");
const { trackLogin, trackLogout, trackDataAccess, ACTIVITY_TYPES, ENTITY_TYPES } = require("../utils/activityTracker");

// Email transporter configuration
const createTransporter = () => {
  if (process.env.EMAIL_SERVICE) {
    return nodemailer.createTransporter({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  // For development, use a test transporter
  return {
    sendMail: (options) => {
      console.log("📧 Email would be sent:", options);
      return Promise.resolve({ messageId: "test-" + Date.now() });
    },
  };
};

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Check if admin registration is allowed
const checkAdminRegistrationAllowed = async (req, res) => {
  try {
    const adminCount = await User.countDocuments({
      role: "admin",
      isActive: true,
    });

    res.status(200).json({
      success: true,
      data: {
        adminRegistrationAllowed: adminCount === 0,
        adminExists: adminCount > 0,
      },
    });
  } catch (error) {
    console.error("Check admin registration error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Register User (No email verification required)
const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { name, email, password, role = "student", phone, university_name } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    // Validate university name for students
    if (role === "student") {
      if (!university_name) {
        return res.status(400).json({
          success: false,
          message: "University name is required for students",
        });
      }

      const universityValidation = validateUniversityName(university_name);
      if (!universityValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: universityValidation.message,
        });
      }
    }

    // Check admin registration restrictions
    if (role === "admin") {
      const adminCount = await User.countDocuments({
        role: "admin",
        isActive: true,
      });

      if (adminCount > 0) {
        return res.status(403).json({
          success: false,
          message:
            "Admin registration is not allowed. An admin already exists.",
        });
      }
    }

    // Create user with email verification disabled
    const userData = {
      name,
      email,
      password,
      role,
      phone,
      emailVerified: true, // Set to true for all users (no verification needed)
      emailVerificationToken: undefined,
      emailVerificationExpires: undefined,
    };

    // Add university name for students
    if (role === "student" && university_name) {
      userData.university_name = university_name; // Will be normalized by pre-save hook
    }

    // If this is the first admin, mark as such and auto-approve
    if (role === "admin") {
      userData.isFirstAdmin = true;
      userData.adminApproved = true;
    }

    const user = await User.create(userData);

    // Generate token for immediate login (both students and admins)
    const token = generateToken(user._id);

    // Track user registration
    req.user = user;
    await trackDataAccess(req, ENTITY_TYPES.USER, user._id, "CREATE");

    res.status(201).json({
      success: true,
      message:
        role === "admin"
          ? "Admin account created successfully. You are now logged in."
          : "Registration successful. You can now start applying to programs.",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified,
        },
        token,
        requiresEmailVerification: false, // Always false now
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during registration",
    });
  }
};

// Email verification (kept for backward compatibility but not used)
const verifyEmail = async (req, res) => {
  try {
    const { token, email } = req.body;

    const user = await User.findOne({
      email,
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification token",
      });
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Email verified successfully. You can now log in.",
    });
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during email verification",
    });
  }
};

// Login User (No email verification check)
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;
    
    console.log("Login attempt for email:", email);

    // Check if user exists and get password
    const user = await User.findOne({ email, isActive: true }).select(
      "+password"
    );

    if (!user) {
      console.log("User not found for email:", email);
      try {
        await LoginActivity.create({
          role: "student", // unknown, defaulting to student; not required to have userId
          status: "failure",
          message: "Invalid credentials",
          ipAddress:
            req.headers["x-forwarded-for"]?.toString().split(",")[0] ||
            req.ip ||
            req.socket?.remoteAddress,
          userAgent: req.headers["user-agent"],
        });
        
        // Enhanced activity tracking for failed login
        req.user = null;
        await trackLogin(req, { success: false, reason: "User not found", email });
      } catch (e) {
        console.error("Login activity log failed:", e?.message || e);
      }
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    console.log("User found:", { id: user._id, email: user.email, role: user.role, hasPassword: !!user.password });

    // Check if account is locked
    if (user.isLocked) {
      console.log("Account locked for user:", user.email);
      try {
        await LoginActivity.create({
          userId: user._id,
          role: user.role,
          status: "failure",
          message: "Account locked",
          ipAddress:
            req.headers["x-forwarded-for"]?.toString().split(",")[0] ||
            req.ip ||
            req.socket?.remoteAddress,
          userAgent: req.headers["user-agent"],
        });
        
        // Enhanced activity tracking for locked account
        req.user = user;
        await trackLogin(req, { success: false, reason: "Account locked", email: user.email });
      } catch (e) {
        console.error("Login activity log failed:", e?.message || e);
      }
      return res.status(423).json({
        success: false,
        message:
          "Account is temporarily locked due to too many failed login attempts. Please try again later.",
      });
    }

    // Check password
    console.log("Comparing password for user:", user.email);
    const isPasswordMatch = await user.comparePassword(password);
    console.log("Password match result:", isPasswordMatch);
    
    if (!isPasswordMatch) {
      console.log("Password mismatch for user:", user.email);
      await user.incLoginAttempts();
      try {
        await LoginActivity.create({
          userId: user._id,
          role: user.role,
          status: "failure",
          message: "Invalid credentials",
          ipAddress:
            req.headers["x-forwarded-for"]?.toString().split(",")[0] ||
            req.ip ||
            req.socket?.remoteAddress,
          userAgent: req.headers["user-agent"],
        });
        
        // Enhanced activity tracking for wrong password
        req.user = user;
        await trackLogin(req, { success: false, reason: "Invalid password", email: user.email });
      } catch (e) {
        console.error("Login activity log failed:", e?.message || e);
      }
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    console.log("Password matched successfully for user:", user.email);

    // No email verification check - removed this block:
    // if (user.role === 'student' && !user.emailVerified) { ... }

    // Check admin approval
    if (!user.adminApproved) {
      try {
        await LoginActivity.create({
          userId: user._id,
          role: user.role,
          status: "failure",
          message: "Account pending approval",
          ipAddress:
            req.headers["x-forwarded-for"]?.toString().split(",")[0] ||
            req.ip ||
            req.socket?.remoteAddress,
          userAgent: req.headers["user-agent"],
        });
      } catch (e) {
        console.error("Login activity log failed:", e?.message || e);
      }
      return res.status(403).json({
        success: false,
        message: "Your account is pending approval.",
      });
    }

    // Reset login attempts and update last login
    await user.resetLoginAttempts();

    // Generate token
    const token = generateToken(user._id);

    // Record login activity (non-blocking) - Enhanced tracking
    try {
      await LoginActivity.create({
        userId: user._id,
        role: user.role,
        status: "success",
        message: "Login successful",
        ipAddress:
          req.headers["x-forwarded-for"]?.toString().split(",")[0] ||
          req.ip ||
          req.socket?.remoteAddress,
        userAgent: req.headers["user-agent"],
      });
      
      // Enhanced activity tracking
      req.user = user; // Set user for activity tracker
      await trackLogin(req, { success: true, role: user.role, email: user.email });
    } catch (e) {
      console.error("Login activity log failed:", e?.message || e);
    }

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};

// Get Current User
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate("applications")
      .populate("groupAssignment.programId", "name category");

    // Track profile access
    await trackDataAccess(req, ENTITY_TYPES.USER, req.user.id, "READ");

    res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    console.error("Get me error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Update Profile
const updateProfile = async (req, res) => {
  try {
    const { name, email, password, profile } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const updatedFields = [];
    
    // Update name if provided
    if (name && name.trim()) {
      user.name = name.trim();
      updatedFields.push('name');
    }
    
    // Update email if provided
    if (email && email.trim()) {
      const emailLower = email.trim().toLowerCase();
      
      // Check if email is already taken by another user
      const existingUser = await User.findOne({ 
        email: emailLower, 
        _id: { $ne: user._id } 
      });
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email is already taken by another user",
        });
      }
      
      user.email = emailLower;
      updatedFields.push('email');
    }
    
    // Update password if provided
    if (password && password.trim()) {
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 6 characters long",
        });
      }
      user.password = password;
      updatedFields.push('password');
    }
    
    // Update profile if provided
    if (profile) {
      user.profile = { ...user.profile, ...profile };
      updatedFields.push('profile');
    }

    await user.save();

    // Track profile update
    await trackDataAccess(req, ENTITY_TYPES.USER, req.user.id, "UPDATE");

    res.status(200).json({
      success: true,
      message: `Profile updated successfully. Updated fields: ${updatedFields.join(', ')}`,
      data: { 
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        }
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Resend verification email (kept for backward compatibility but not needed)
const resendVerificationEmail = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message:
        "Email verification is no longer required. You can log in directly.",
    });
  } catch (error) {
    console.error("Resend verification email error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Logout User with enhanced activity tracking
const logout = async (req, res) => {
  try {
    const user = req.user;
    
    // Record logout in LoginActivity
    try {
      await LoginActivity.create({
        userId: user._id,
        role: user.role,
        status: "success",
        message: "Logout successful",
        ipAddress:
          req.headers["x-forwarded-for"]?.toString().split(",")[0] ||
          req.ip ||
          req.socket?.remoteAddress,
        userAgent: req.headers["user-agent"],
      });
      
      // Enhanced activity tracking for logout
      await trackLogout(req);
    } catch (e) {
      console.error("Logout activity log failed:", e?.message || e);
    }
    
    res.status(200).json({ 
      success: true, 
      message: "Logout successful" 
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during logout",
    });
  }
};

// Forgot Password (placeholder - not implemented)
const forgotPassword = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: "Password reset functionality not implemented yet",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Reset Password (placeholder - not implemented)
const resetPassword = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: "Password reset functionality not implemented yet",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  verifyEmail,
  resendVerificationEmail,
  checkAdminRegistrationAllowed,
  forgotPassword,
  resetPassword,
};
