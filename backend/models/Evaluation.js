const mongoose = require("mongoose");

const evaluationSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    companyAdviserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    universityReviewerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    grade: { type: String },
    performanceRating: { type: Number, min: 1, max: 5 },
    feedback: { type: String, maxlength: 5000 },
    technicalSkills: {
      problemSolving: { type: Number, min: 1, max: 5 },
      codingAbility: { type: Number, min: 1, max: 5 },
      technicalKnowledge: { type: Number, min: 1, max: 5 },
      learningAbility: { type: Number, min: 1, max: 5 },
    },
    softSkills: {
      teamwork: { type: Number, min: 1, max: 5 },
      punctuality: { type: Number, min: 1, max: 5 },
      communication: { type: Number, min: 1, max: 5 },
      initiative: { type: Number, min: 1, max: 5 },
      leadership: { type: Number, min: 1, max: 5 },
      adaptability: { type: Number, min: 1, max: 5 },
    },
    workEthic: {
      reliability: { type: Number, min: 1, max: 5 },
      responsibility: { type: Number, min: 1, max: 5 },
      timeManagement: { type: Number, min: 1, max: 5 },
      attentionToDetail: { type: Number, min: 1, max: 5 },
    },
    confirmedByUniversity: { type: Boolean, default: false },
    confirmedAt: Date,
    seenByUniversity: { type: Boolean, default: false },
    seenAt: Date,
    attachments: [
      {
        filename: String,
        originalName: String,
        filePath: String,
        mimeType: String,
        size: Number,
      },
    ],
  },
  { timestamps: true }
);

evaluationSchema.index({ studentId: 1, createdAt: -1 });

module.exports = mongoose.model("Evaluation", evaluationSchema);
