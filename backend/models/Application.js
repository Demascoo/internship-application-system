const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Student ID is required"],
    },
    programId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Program",
      required: [true, "Program ID is required"],
    },
    studentName: {
      type: String,
      required: [true, "Student name is required"],
      trim: true,
    },
    studentEmail: {
      type: String,
      required: [true, "Student email is required"],
      trim: true,
      lowercase: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
    motivation: {
      type: String,
      required: [true, "Motivation is required"],
      maxlength: [2000, "Motivation cannot exceed 2000 characters"],
    },
    experience: {
      type: String,
      maxlength: [2000, "Experience cannot exceed 2000 characters"],
    },
    goals: {
      type: String,
      maxlength: [1000, "Goals cannot exceed 1000 characters"],
    },
    availability: {
      type: String,
      enum: ["full-time", "part-time"],
      default: "full-time",
    },
    // New fields for internship duration and timing
    preferredStartDate: {
      type: Date,
      required: [true, "Preferred start date is required"],
    },
    preferredEndDate: {
      type: Date,
      required: [true, "Preferred end date is required"],
    },
    preferredStartMonth: {
      type: String,
      enum: [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ],
      required: [true, "Preferred start month is required"],
    },
    preferredEndMonth: {
      type: String,
      enum: [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ],
      required: [true, "Preferred end month is required"],
    },
    desiredDuration: {
      type: Number,
      required: [true, "Desired duration in months is required"],
      min: [1, "Duration must be at least 1 month"],
      max: [12, "Duration cannot exceed 12 months"],
    },
    resumeUrl: {
      type: String,
      trim: true,
    },
    coverLetterUrl: {
      type: String,
      trim: true,
    },
    reviewNotes: {
      type: String,
      maxlength: [1000, "Review notes cannot exceed 1000 characters"],
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: Date,
    score: {
      type: Number,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate applications
applicationSchema.index({ studentId: 1, programId: 1 }, { unique: true });

// Index for efficient queries
applicationSchema.index({ status: 1, createdAt: -1 });
applicationSchema.index({ programId: 1, status: 1 });

// Validate preferred dates
applicationSchema.pre("save", function (next) {
  if (this.preferredEndDate <= this.preferredStartDate) {
    return next(new Error("Preferred end date must be after start date"));
  }
  next();
});

// Populate related data by default
applicationSchema.pre(/^find/, function (next) {
  this.populate("studentId", "name email profile").populate(
    "programId",
    "name description category duration startDate endDate"
  );
  next();
});

module.exports = mongoose.model("Application", applicationSchema);
