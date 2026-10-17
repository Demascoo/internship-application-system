const mongoose = require("mongoose");

const progressReportSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    submittedById: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    summary: { type: String, maxlength: 5000 },
    milestones: [
      {
        title: String,
        description: String,
        completed: Boolean,
        date: Date,
      },
    ],
    attachments: [
      {
        filename: String,
        originalName: String,
        filePath: String,
        mimeType: String,
        size: Number,
      },
    ],
    flags: [String],
    softSkills: {
      teamwork: { type: Number, min: 1, max: 5 },
      punctuality: { type: Number, min: 1, max: 5 },
      communication: { type: Number, min: 1, max: 5 },
      initiative: { type: Number, min: 1, max: 5 },
    },
  },
  { timestamps: true }
);

progressReportSchema.index({ studentId: 1, periodStart: -1 });

module.exports = mongoose.model("ProgressReport", progressReportSchema);
