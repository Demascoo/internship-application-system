const mongoose = require("mongoose");

const adviserSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    role: { type: String, enum: ["universityAdviser", "companyAdviser", "facultyHead"], required: true },
    programId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Program", 
      required: function() {
        // programId is required for companyAdviser only
        return this.role === "companyAdviser";
      }
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

adviserSchema.index({ programId: 1, role: 1 });
adviserSchema.index({ userId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("Adviser", adviserSchema);
