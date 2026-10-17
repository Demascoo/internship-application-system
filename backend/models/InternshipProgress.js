const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  targetDate: { type: String, required: true },
  completed: { type: Boolean, default: false },
  completedDate: { type: String }
});

const taskSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  assignedDate: { type: String, required: true },
  dueDate: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'in_progress', 'completed', 'overdue'], 
    default: 'pending' 
  },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high'], 
    default: 'medium' 
  },
  completedDate: { type: String },
  supervisorRemarks: { type: String }
});

const reportSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  submittedDate: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'submitted', 'approved', 'rejected', 'under_review'], 
    default: 'pending' 
  },
  grade: { type: String },
  supervisorFeedback: { type: String }
});

const attendanceDataSchema = new mongoose.Schema({
  percentage: { type: Number, default: 0 },
  presentDays: { type: Number, default: 0 },
  absentDays: { type: Number, default: 0 },
  lateDays: { type: Number, default: 0 },
  monthlyBreakdown: [{
    month: { type: String, required: true },
    present: { type: Number, default: 0 },
    absent: { type: Number, default: 0 },
    late: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  }]
});

const evaluationScoresSchema = new mongoose.Schema({
  // Performance criteria
  punctuality: { type: Number, min: 1, max: 5 },
  communication: { type: Number, min: 1, max: 5 },
  teamwork: { type: Number, min: 1, max: 5 },
  problemSolving: { type: Number, min: 1, max: 5 },
  initiative: { type: Number, min: 1, max: 5 },
  reliability: { type: Number, min: 1, max: 5 },
  // Skills criteria
  technicalSkills: { type: Number, min: 1, max: 5 },
  adaptability: { type: Number, min: 1, max: 5 },
  timeManagement: { type: Number, min: 1, max: 5 },
  attentionToDetail: { type: Number, min: 1, max: 5 },
  leadership: { type: Number, min: 1, max: 5 },
  creativity: { type: Number, min: 1, max: 5 },
  overall: { type: Number, min: 1, max: 5 }
});

const evaluationSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  type: { 
    type: String, 
    enum: ['midterm', 'final'], 
    required: true 
  },
  evaluatedBy: { type: String, required: true },
  evaluationDate: { type: String },
  status: { 
    type: String, 
    enum: ['not_started', 'pending', 'completed'], 
    default: 'not_started' 
  },
  scores: evaluationScoresSchema,
  strengths: [{ type: String }],
  improvements: [{ type: String }],
  supervisorComments: { type: String },
  adviserRemarks: { type: String },
  adviserStatus: { 
    type: String, 
    enum: ['not_started', 'pending_review', 'reviewed', 'approved'], 
    default: 'not_started' 
  }
});

const internshipProgressSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  companyAdviserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentInfo: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    university: { type: String },
    program: { type: String }
  },
  internshipDetails: {
    company: { type: String, required: true },
    position: { type: String, required: false },
    supervisor: { type: String, required: false },
    supervisorEmail: { type: String, required: false },
    startDate: { type: String, required: false },
    endDate: { type: String, required: false },
    duration: { type: String, required: false },
    location: { type: String, required: false }
  },
  milestones: [milestoneSchema],
  tasks: [taskSchema],
  reports: [reportSchema],
  attendanceData: attendanceDataSchema,
  evaluations: {
    midterm: evaluationSchema,
    final: evaluationSchema
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Ensure one progress record per student-company adviser pair
internshipProgressSchema.index({ studentId: 1, companyAdviserId: 1 }, { unique: true });

// Update lastUpdated on save
internshipProgressSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

const InternshipProgress = mongoose.model('InternshipProgress', internshipProgressSchema);

module.exports = InternshipProgress;
