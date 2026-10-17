const mongoose = require("mongoose");

const loginActivitySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    role: { 
      type: String, 
      enum: ["admin", "student", "companyAdviser", "universityAdviser", "companyAdmin", "facultyHead"], 
      required: true 
    },
    status: { type: String, enum: ["success", "failure"], required: true },
    message: { type: String, maxlength: 500 },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true }
);

loginActivitySchema.index({ createdAt: -1 });
loginActivitySchema.index({ userId: 1, createdAt: -1 });
loginActivitySchema.index({ role: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("LoginActivity", loginActivitySchema); 