const mongoose = require("mongoose");

const programSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Program name is required"],
      trim: true,
      maxlength: [200, "Program name cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Program description is required"],
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    totalSpots: {
      type: Number,
      required: [true, "Total spots is required"],
      min: [1, "Total spots must be at least 1"],
    },
    availableSpots: {
      type: Number,
      required: [true, "Available spots is required"],
      min: [0, "Available spots cannot be negative"],
    },
    requirements: [
      {
        type: String,
        required: true,
        trim: true,
      },
    ],
    duration: {
      type: String,
      required: [true, "Duration is required"],
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
      lowercase: true,
    },
    color: {
      type: String,
      required: [true, "Color is required"],
      trim: true,
      default: "from-blue-500 to-blue-600",
    },
    icon: {
      type: String,
      required: [true, "Icon is required"],
      trim: true,
      default: "default",
    },
    // Background image URL for the program card
    backgroundImage: {
      type: String,
      default:
        "https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=800",
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
    },
    applicationDeadline: {
      type: Date,
      required: [true, "Application deadline is required"],
    },
    startMonth: {
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
      required: [true, "Start month is required"],
    },
    endMonth: {
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
      required: [true, "End month is required"],
    },
    durationInMonths: {
      type: Number,
      required: [true, "Duration in months is required"],
      min: [1, "Duration must be at least 1 month"],
      max: [24, "Duration cannot exceed 24 months"],
    },
    skills: [String],
    benefits: [String],
    mentors: [String],
    location: {
      type: String,
      default: "Hawassa, Sidama Region, Ethiopia",
    },
    // Program creator information
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Faculty Head assignment
    facultyHeadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      validate: {
        validator: async function(v) {
          if (!v) return true; // Allow null/undefined
          const user = await mongoose.model('User').findById(v);
          return user && user.role === 'facultyHead';
        },
        message: 'Faculty Head must have role "facultyHead"'
      }
    },
    // Student grouping system
    studentGroups: [
      {
        groupName: {
          type: String,
          required: true,
          trim: true,
        },
        students: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
        ],
        createdBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Program status
    isActive: {
      type: Boolean,
      default: true,
    },
    // Default program flag (for the original three programs)
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Validate that end date is after start date
programSchema.pre("save", function (next) {
  if (this.endDate <= this.startDate) {
    return next(new Error("End date must be after start date"));
  }

  if (this.applicationDeadline >= this.startDate) {
    return next(new Error("Application deadline must be before start date"));
  }

  if (this.availableSpots > this.totalSpots) {
    return next(new Error("Available spots cannot exceed total spots"));
  }

  next();
});

// Generate background image based on category
programSchema.pre("save", function (next) {
  if (!this.backgroundImage || this.backgroundImage === "default") {
    const imageMap = {
      networking:
        "https://images.pexels.com/photos/2881224/pexels-photo-2881224.jpeg?auto=compress&cs=tinysrgb&w=800",
      software:
        "https://images.pexels.com/photos/546819/pexels-photo-546819.jpeg?auto=compress&cs=tinysrgb&w=800",
      maintenance:
        "https://images.pexels.com/photos/3862629/pexels-photo-3862629.jpeg?auto=compress&cs=tinysrgb&w=800",
      design:
        "https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=800",
      data: "https://images.pexels.com/photos/590020/pexels-photo-590020.jpeg?auto=compress&cs=tinysrgb&w=800",
      cybersecurity:
        "https://images.pexels.com/photos/60504/security-protection-anti-virus-software-60504.jpeg?auto=compress&cs=tinysrgb&w=800",
      mobile:
        "https://images.pexels.com/photos/607812/pexels-photo-607812.jpeg?auto=compress&cs=tinysrgb&w=800",
    };

    this.backgroundImage =
      imageMap[this.category.toLowerCase()] ||
      "https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=800";
  }
  next();
});

// Generate color scheme based on category
programSchema.pre("save", function (next) {
  if (!this.color || this.color === "default") {
    const colorMap = {
      networking: "from-blue-500 to-blue-600",
      software: "from-teal-500 to-teal-600",
      maintenance: "from-orange-500 to-orange-600",
      design: "from-purple-500 to-purple-600",
      data: "from-green-500 to-green-600",
      cybersecurity: "from-red-500 to-red-600",
      mobile: "from-indigo-500 to-indigo-600",
      cloud: "from-cyan-500 to-cyan-600",
      ai: "from-pink-500 to-pink-600",
    };

    this.color =
      colorMap[this.category.toLowerCase()] || "from-gray-500 to-gray-600";
  }
  next();
});

// Index for efficient queries
programSchema.index({ category: 1, isActive: 1 });
programSchema.index({ availableSpots: 1 });
programSchema.index({ startDate: 1, endDate: 1 });
programSchema.index({ createdBy: 1 });

module.exports = mongoose.model("Program", programSchema);
