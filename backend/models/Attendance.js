const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    companyAdviserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    status: { type: String, enum: ["present", "absent", "late", "excused", "internship_dates"], required: true },
    notes: { type: String, maxlength: 1000 },
    internshipStartDate: { type: Date },
    internshipEndDate: { type: Date },
  },
  { timestamps: true }
);

attendanceSchema.index({ studentId: 1, date: -1 }, { unique: true });

module.exports = mongoose.model("Attendance", attendanceSchema);
