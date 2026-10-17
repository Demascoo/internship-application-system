const mongoose = require("mongoose");

const adviserLinkSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    universityAdviserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    companyAdviserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    companyAdminId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    programId: { type: mongoose.Schema.Types.ObjectId, ref: "Program" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

adviserLinkSchema.index({ studentId: 1 }, { unique: true });

module.exports = mongoose.model("AdviserLink", adviserLinkSchema);
