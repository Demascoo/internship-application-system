const mongoose = require("mongoose");

const finalEvaluationSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    companyAdviserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    universityAdviserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    facultyHeadId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    
    // Student Information
    studentInfo: {
      fullName: { type: String, required: true },
      university: { type: String, required: true },
      department: { type: String, required: true },
      companyName: { type: String, required: true },
      companyAdviser: { type: String, required: true },
      universityAdviser: { type: String, required: true },
      internshipStartDate: { type: Date, required: true },
      internshipEndDate: { type: Date, required: true },
    },

    // 1. Attendance Tracking
    attendance: {
      weeks: [{
        weekNumber: { type: Number, required: true },
        monday: { type: String, enum: ["present", "absent", "late", "excused"], default: "present" },
        tuesday: { type: String, enum: ["present", "absent", "late", "excused"], default: "present" },
        wednesday: { type: String, enum: ["present", "absent", "late", "excused"], default: "present" },
        thursday: { type: String, enum: ["present", "absent", "late", "excused"], default: "present" },
        friday: { type: String, enum: ["present", "absent", "late", "excused"], default: "present" },
        absentDays: { type: Number, default: 0 },
        supervisorSignature: { type: String, default: "" },
      }],
      totalAbsentDays: { type: Number, default: 0 },
    },

    // 2. Detailed Evaluation Criteria (Company Adviser Input)
    evaluationCriteria: {
      // General Performance (25%)
      punctuality: { type: Number, min: 0, max: 5, required: true },
      reliability: { type: Number, min: 0, max: 5, required: true },
      independence: { type: Number, min: 0, max: 5, required: true },
      communication: { type: Number, min: 0, max: 5, required: true },
      professionalism: { type: Number, min: 0, max: 5, required: true },
      
      // Personal Skills (25%)
      speedOfWork: { type: Number, min: 0, max: 5, required: true },
      accuracy: { type: Number, min: 0, max: 5, required: true },
      engagement: { type: Number, min: 0, max: 5, required: true },
      cooperation: { type: Number, min: 0, max: 5, required: true },
      recommendation: { type: Number, min: 0, max: 5, required: true },
      
      // Professional Skills (50%)
      technicalKnowledge: { type: Number, min: 0, max: 5, required: true },
      problemSolving: { type: Number, min: 0, max: 5, required: true },
      organizing: { type: Number, min: 0, max: 5, required: true },
      responsibility: { type: Number, min: 0, max: 5, required: true },
      initiative: { type: Number, min: 0, max: 5, required: true },
    },

    // Supervisor Feedback (Company Adviser Input)
    supervisorFeedback: {
      strengths: { type: String, default: '' },
      areasForImprovement: { type: String, default: '' },
      overallRecommendation: { type: String, default: '' },
      finalRemarks: { type: String, default: '' }
    },

    // 3. Supervisor Evaluation (Soft & Work Skills - Legacy)
    supervisorEvaluation: {
      dependability: { type: Number, min: 1, max: 5, required: true },
      technicalCompetence: { type: Number, min: 1, max: 5, required: true },
      teamwork: { type: Number, min: 1, max: 5, required: true },
      communication: { type: Number, min: 1, max: 5, required: true },
      initiative: { type: Number, min: 1, max: 5, required: true },
      problemSolving: { type: Number, min: 1, max: 5, required: true },
      timeManagement: { type: Number, min: 1, max: 5, required: true },
      adaptability: { type: Number, min: 1, max: 5, required: true },
      leadership: { type: Number, min: 1, max: 5, required: true },
      workEthic: { type: Number, min: 1, max: 5, required: true },
    },

    // 3. Final Evaluation (Weighted Percentage)
    finalEvaluation: {
      generalPerformance: { type: Number, min: 0, max: 25, required: true },
      personalSkills: { type: Number, min: 0, max: 25, required: true },
      professionalSkills: { type: Number, min: 0, max: 50, required: true },
      total: { type: Number, min: 0, max: 100, required: true },
    },

    // 4. Comments
    comments: {
      majorStrengths: { type: String, required: true, maxlength: 1000 },
      areasOfImprovement: { type: String, required: true, maxlength: 1000 },
      finalRecommendation: { type: String, enum: ["Continue", "Not Recommended"], required: true },
    },

    // 5. Supporting Documents
    supportingDocuments: [{
      name: { type: String, required: true },
      type: { type: String, required: true },
      size: { type: Number, required: true },
      data: { type: String, required: true }, // Base64 encoded file data
      uploadDate: { type: Date, default: Date.now }
    }],

    // 6. Signatures
    signatures: {
      studentSignature: { type: String, default: "" },
      companyAdviserSignature: { type: String, default: "" },
      universityAdviserSignature: { type: String, default: "" },
      facultyHeadSignature: { type: String, default: "" },
      studentSignatureDate: { type: Date },
      companyAdviserSignatureDate: { type: Date },
      universityAdviserSignatureDate: { type: Date },
      facultyHeadSignatureDate: { type: Date },
    },

    // Status and metadata
    status: { 
      type: String, 
      enum: ["draft", "submitted", "reviewed", "approved", "rejected"], 
      default: "draft" 
    },
    lastUpdated: { type: Date, default: Date.now },
    submittedAt: { type: Date },
    reviewedAt: { type: Date },
    approvedAt: { type: Date },

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
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

finalEvaluationSchema.index({ studentId: 1, createdAt: -1 });
finalEvaluationSchema.index({ facultyHeadId: 1, status: 1 });

module.exports = mongoose.model("FinalEvaluation", finalEvaluationSchema);
