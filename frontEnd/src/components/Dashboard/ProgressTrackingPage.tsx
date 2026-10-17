import React, { useState } from 'react';
import { 
  User, Calendar, Clock, CheckCircle, AlertCircle, 
  FileText, Star, TrendingUp, BarChart3, PieChart, 
  Target, Award, BookOpen, MessageSquare, Download,
  ArrowLeft, ChevronRight, Users, Building2, Eye
} from 'lucide-react';

interface Student {
  _id: string;
  name: string;
  email: string;
  studentId?: string;
  profile?: {
    university?: string;
    course?: string;
  };
  groupAssignment?: {
    programName?: string;
  };
  acceptedApplication?: {
    _id: string;
    preferredStartDate: string;
    preferredEndDate: string;
    desiredDuration: number;
    programId: string | { _id: string; name: string };
    status: string;
  } | null;
}

interface ProgressTrackingPageProps {
  student: Student;
  onBack: () => void;
}

// Sample data for demonstration
const sampleProgressData = {
  internshipDetails: {
    company: "Sidama Innovation & Technology agency",
    startDate: "2024-01-15",
    endDate: "2024-05-15",
    supervisor: "John Smith",
    department: "Software Development"
  },
  progressOverview: {
    completionPercentage: 75,
    milestones: [
      { id: 1, name: "Orientation", completed: true, date: "2024-01-15", description: "Company introduction and setup" },
      { id: 2, name: "First Report", completed: true, date: "2024-02-01", description: "Initial progress report" },
      { id: 3, name: "Midterm Evaluation", completed: true, date: "2024-03-01", description: "Mid-internship assessment" },
      { id: 4, name: "Project Milestone", completed: false, date: "2024-04-01", description: "Major project deliverable" },
      { id: 5, name: "Final Report", completed: false, date: "2024-05-01", description: "Final internship report" },
      { id: 6, name: "Final Evaluation", completed: false, date: "2024-05-15", description: "Final assessment" }
    ],
    attendance: {
      totalDays: 80,
      presentDays: 72,
      absentDays: 8,
      percentage: 90
    }
  },
  tasksDeliverables: [
    {
      id: 1,
      title: "Database Design Documentation",
      description: "Create comprehensive database schema documentation",
      status: "completed",
      assignedDate: "2024-01-20",
      completedDate: "2024-02-05",
      deadline: "2024-02-10",
      supervisorRemarks: "Excellent work with detailed documentation"
    },
    {
      id: 2,
      title: "User Authentication Module",
      description: "Implement secure user login and registration system",
      status: "completed",
      assignedDate: "2024-02-06",
      completedDate: "2024-02-28",
      deadline: "2024-03-05",
      supervisorRemarks: "Good implementation with proper security measures"
    },
    {
      id: 3,
      title: "API Development",
      description: "Develop RESTful APIs for the main application",
      status: "in-progress",
      assignedDate: "2024-03-01",
      deadline: "2024-04-15",
      supervisorRemarks: "Making good progress, needs to focus on error handling"
    },
    {
      id: 4,
      title: "Frontend Integration",
      description: "Integrate frontend with backend APIs",
      status: "pending",
      assignedDate: "2024-04-01",
      deadline: "2024-05-01",
      supervisorRemarks: ""
    }
  ],
  reportsSubmissions: [
    {
      id: 1,
      title: "Weekly Report - Week 1",
      type: "weekly",
      submittedDate: "2024-01-22",
      status: "approved",
      grade: "A",
      feedback: "Great start, showing good understanding of the project requirements"
    },
    {
      id: 2,
      title: "Monthly Report - January",
      type: "monthly",
      submittedDate: "2024-02-01",
      status: "approved",
      grade: "A-",
      feedback: "Good progress, needs to improve documentation quality"
    },
    {
      id: 3,
      title: "Midterm Report",
      type: "midterm",
      submittedDate: "2024-03-01",
      status: "reviewed",
      grade: "B+",
      feedback: "Solid progress, technical skills are developing well"
    },
    {
      id: 4,
      title: "Weekly Report - Week 10",
      type: "weekly",
      submittedDate: "2024-03-25",
      status: "pending",
      grade: "",
      feedback: ""
    }
  ],
  evaluationFeedback: {
    midtermEvaluation: {
      companyAdviser: {
        technicalSkills: 85,
        communication: 80,
        teamwork: 88,
        initiative: 82,
        overall: 84,
        strengths: "Strong technical foundation, quick learner, good problem-solving skills",
        improvements: "Needs to improve communication with team members, should ask more questions"
      },
      universityAdviser: {
        academicPerformance: 87,
        professionalDevelopment: 83,
        reportQuality: 80,
        overall: 83,
        feedback: "Student is performing well academically and showing good professional growth"
      }
    },
    finalEvaluation: {
      status: "pending",
      scheduledDate: "2024-05-15"
    }
  }
};

const ProgressTrackingPage: React.FC<ProgressTrackingPageProps> = ({ student, onBack }) => {
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [progressData] = useState(sampleProgressData);

  const calculateDaysRemaining = () => {
    const endDate = new Date(progressData.internshipDetails.endDate);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in-progress': return 'text-blue-600 bg-blue-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'approved': return 'text-green-600 bg-green-100';
      case 'reviewed': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-green-600';
    if (grade.startsWith('B')) return 'text-blue-600';
    if (grade.startsWith('C')) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="text-gray-600 hover:text-gray-900 flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Back to Dashboard</span>
              </button>
              <div className="h-6 border-l border-gray-300"></div>
              <h1 className="text-2xl font-bold text-gray-900">Progress Tracking</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Student Information Card */}
        <div className="bg-white rounded-lg shadow-sm border mb-8">
          <div className="p-6">
            <div className="flex items-center space-x-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-blue-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">{student.name}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Name: {student.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <BookOpen className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Program: {student.groupAssignment?.programName || (typeof student.acceptedApplication?.programId === 'object' ? student.acceptedApplication.programId.name : student.acceptedApplication?.programId) || 'Not specified'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Company: {progressData.internshipDetails.company}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Start: {student.acceptedApplication?.preferredStartDate ? new Date(student.acceptedApplication.preferredStartDate).toLocaleDateString() : new Date(progressData.internshipDetails.startDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">End: {student.acceptedApplication?.preferredEndDate ? new Date(student.acceptedApplication.preferredEndDate).toLocaleDateString() : new Date(progressData.internshipDetails.endDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm border mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Progress Overview', icon: TrendingUp },
                { id: 'tasks', label: 'Tasks & Deliverables', icon: Target },
                { id: 'reports', label: 'Reports & Submissions', icon: FileText },
                { id: 'evaluation', label: 'Evaluation & Feedback', icon: Award },
                { id: 'analytics', label: 'Visual Analytics', icon: BarChart3 }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSection(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeSection === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content Sections */}
        {activeSection === 'overview' && (
          <div className="space-y-8">
            {/* Progress Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Overall Progress */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Progress</h3>
                <div className="text-center mb-6">
                  <div className="relative w-32 h-32 mx-auto">
                    <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                      <circle
                        cx="60"
                        cy="60"
                        r="50"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="8"
                      />
                      <circle
                        cx="60"
                        cy="60"
                        r="50"
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="8"
                        strokeDasharray={`${progressData.progressOverview.completionPercentage * 3.14} 314`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-blue-600">
                        {progressData.progressOverview.completionPercentage}%
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-600 mt-2">Internship Completion</p>
                </div>
              </div>

              {/* Attendance Summary */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance Summary</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total Days</span>
                    <span className="font-semibold">{progressData.progressOverview.attendance.totalDays}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Present</span>
                    <span className="font-semibold text-green-600">{progressData.progressOverview.attendance.presentDays}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Absent</span>
                    <span className="font-semibold text-red-600">{progressData.progressOverview.attendance.absentDays}</span>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Attendance Rate</span>
                      <span className="font-bold text-lg text-blue-600">{progressData.progressOverview.attendance.percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${progressData.progressOverview.attendance.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Milestones */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Milestones & Achievements</h3>
              <div className="space-y-4">
                {progressData.progressOverview.milestones.map((milestone) => (
                  <div key={milestone.id} className="flex items-start space-x-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      milestone.completed ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      {milestone.completed ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className={`font-medium ${milestone.completed ? 'text-gray-900' : 'text-gray-500'}`}>
                          {milestone.name}
                        </h4>
                        <span className="text-sm text-gray-500">
                          {milestone.completed ? new Date(milestone.date).toLocaleDateString() : 'Pending'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'tasks' && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Tasks & Deliverables</h3>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-3 h-3 bg-green-100 rounded-full"></div>
                    <span className="text-gray-600">Completed: {progressData.tasksDeliverables.filter(t => t.status === 'completed').length}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-3 h-3 bg-blue-100 rounded-full"></div>
                    <span className="text-gray-600">In Progress: {progressData.tasksDeliverables.filter(t => t.status === 'in-progress').length}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-3 h-3 bg-yellow-100 rounded-full"></div>
                    <span className="text-gray-600">Pending: {progressData.tasksDeliverables.filter(t => t.status === 'pending').length}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {progressData.tasksDeliverables.map((task) => (
                <div key={task.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-lg font-medium text-gray-900">{task.title}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                          {task.status.replace('-', ' ').toUpperCase()}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3">{task.description}</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Assigned:</span>
                          <span className="ml-2 font-medium">{new Date(task.assignedDate).toLocaleDateString()}</span>
                        </div>
                        {task.completedDate && (
                          <div>
                            <span className="text-gray-500">Completed:</span>
                            <span className="ml-2 font-medium text-green-600">{new Date(task.completedDate).toLocaleDateString()}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-500">Deadline:</span>
                          <span className="ml-2 font-medium">{new Date(task.deadline).toLocaleDateString()}</span>
                        </div>
                      </div>
                      {task.supervisorRemarks && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-start space-x-2">
                            <MessageSquare className="w-4 h-4 text-blue-600 mt-0.5" />
                            <div>
                              <span className="text-sm font-medium text-blue-900">Supervisor Remarks:</span>
                              <p className="text-sm text-blue-800 mt-1">{task.supervisorRemarks}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'reports' && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Reports & Submissions</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {progressData.reportsSubmissions.map((report) => (
                <div key={report.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-lg font-medium text-gray-900">{report.title}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(report.status)}`}>
                          {report.status.toUpperCase()}
                        </span>
                        {report.grade && (
                          <span className={`px-2 py-1 text-xs font-bold rounded ${getGradeColor(report.grade)} bg-gray-100`}>
                            Grade: {report.grade}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-6 text-sm text-gray-600 mb-3">
                        <span>Type: {report.type.charAt(0).toUpperCase() + report.type.slice(1)}</span>
                        <span>Submitted: {new Date(report.submittedDate).toLocaleDateString()}</span>
                      </div>
                      {report.feedback && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-start space-x-2">
                            <Star className="w-4 h-4 text-yellow-500 mt-0.5" />
                            <div>
                              <span className="text-sm font-medium text-gray-900">Adviser Feedback:</span>
                              <p className="text-sm text-gray-700 mt-1">{report.feedback}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button className="p-2 text-gray-400 hover:text-gray-600">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'evaluation' && (
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Midterm Evaluation Results</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-blue-50 rounded-lg p-6">
                  <h4 className="font-semibold text-blue-900 mb-4">Company Adviser Assessment</h4>
                  <div className="space-y-3">
                    {Object.entries(progressData.evaluationFeedback.midtermEvaluation.companyAdviser).map(([key, value]) => {
                      if (typeof value === 'number') {
                        return (
                          <div key={key} className="flex items-center justify-between">
                            <span className="text-sm text-blue-800 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-16 bg-blue-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full" 
                                  style={{ width: `${value}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-semibold text-blue-900">{value}%</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-6">
                  <h4 className="font-semibold text-green-900 mb-4">University Adviser Assessment</h4>
                  <div className="space-y-3">
                    {Object.entries(progressData.evaluationFeedback.midtermEvaluation.universityAdviser).map(([key, value]) => {
                      if (typeof value === 'number') {
                        return (
                          <div key={key} className="flex items-center justify-between">
                            <span className="text-sm text-green-800 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-16 bg-green-200 rounded-full h-2">
                                <div 
                                  className="bg-green-600 h-2 rounded-full" 
                                  style={{ width: `${value}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-semibold text-green-900">{value}%</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Final Evaluation</h3>
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">Final Evaluation Pending</h4>
                <p className="text-gray-600 mb-4">
                  Scheduled for: {new Date(progressData.evaluationFeedback.finalEvaluation.scheduledDate).toLocaleDateString()}
                </p>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
                  Status: {progressData.evaluationFeedback.finalEvaluation.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'analytics' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Completion Overview</h3>
                <div className="flex items-center justify-center">
                  <div className="relative w-40 h-40">
                    <svg className="w-40 h-40" viewBox="0 0 160 160">
                      <circle cx="80" cy="80" r="70" fill="none" stroke="#e5e7eb" strokeWidth="12" />
                      <circle cx="80" cy="80" r="70" fill="none" stroke="#10b981" strokeWidth="12" 
                        strokeDasharray={`${(progressData.tasksDeliverables.filter(t => t.status === 'completed').length / progressData.tasksDeliverables.length) * 440} 440`}
                        strokeLinecap="round" transform="rotate(-90 80 80)" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <span className="text-2xl font-bold text-green-600">
                          {Math.round((progressData.tasksDeliverables.filter(t => t.status === 'completed').length / progressData.tasksDeliverables.length) * 100)}%
                        </span>
                        <p className="text-xs text-gray-600">Completed</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance Trend</h3>
                <div className="h-48 flex items-end justify-between space-x-2">
                  {[95, 88, 92, 100, 85, 90, 95, 88].map((attendance, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div 
                        className="w-full bg-blue-500 rounded-t"
                        style={{ height: `${(attendance / 100) * 120}px` }}
                      ></div>
                      <span className="text-xs text-gray-600 mt-2">W{index + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
                <div className="flex items-center">
                  <TrendingUp className="w-8 h-8 text-blue-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-blue-900">Overall Performance</p>
                    <p className="text-2xl font-bold text-blue-600">84%</p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
                <div className="flex items-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-900">Tasks Completed</p>
                    <p className="text-2xl font-bold text-green-600">{progressData.tasksDeliverables.filter(t => t.status === 'completed').length}/{progressData.tasksDeliverables.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6">
                <div className="flex items-center">
                  <Award className="w-8 h-8 text-purple-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-purple-900">Milestones Achieved</p>
                    <p className="text-2xl font-bold text-purple-600">{progressData.progressOverview.milestones.filter(m => m.completed).length}/{progressData.progressOverview.milestones.length}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressTrackingPage;
