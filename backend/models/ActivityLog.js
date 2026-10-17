const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    role: {
      type: String,
      enum: ["admin", "student", "universityAdviser", "companyAdviser", "companyAdmin", "facultyHead", "guest"],
      default: "guest",
    },
    action: { type: String, required: true },
    method: { type: String },
    path: { type: String },
    entityType: { type: String },
    entityId: { type: String },
    success: { type: Boolean, default: true },
    statusCode: { type: Number },
    ipAddress: { type: String },
    userAgent: { type: String },
    message: { type: String, maxlength: 1000 },
    // Enhanced fields for detailed activity tracking
    actionDetails: { type: mongoose.Schema.Types.Mixed },
    requestBody: { type: String },
    queryParams: { type: String },
    responseTime: { type: Number },
    sessionId: { type: String },
    deviceInfo: { type: String },
    location: { type: String },
  },
  { timestamps: true }
);

// Enhanced indexing for better query performance
activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ userId: 1, createdAt: -1 });
activityLogSchema.index({ role: 1, action: 1, createdAt: -1 });
activityLogSchema.index({ entityType: 1, createdAt: -1 });
activityLogSchema.index({ success: 1, createdAt: -1 });
activityLogSchema.index({ ipAddress: 1, createdAt: -1 });
activityLogSchema.index({ userId: 1, entityType: 1, createdAt: -1 });

module.exports = mongoose.model("ActivityLog", activityLogSchema);
