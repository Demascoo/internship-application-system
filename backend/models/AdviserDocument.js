const mongoose = require("mongoose");

const adviserDocumentSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    uploadedById: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["acceptance", "progress", "attendance", "evaluation", "other"], required: true },
    title: { type: String, required: true },
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    filePath: { type: String, required: true },
    mimeType: String,
    size: Number,
    notes: String,
    visibleToStudent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

adviserDocumentSchema.index({ studentId: 1, createdAt: -1 });

module.exports = mongoose.model("AdviserDocument", adviserDocumentSchema);
