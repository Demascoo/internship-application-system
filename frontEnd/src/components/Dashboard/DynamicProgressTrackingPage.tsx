import React, { useState, useEffect } from 'react';
import { 
  User, Calendar, CheckCircle, AlertCircle, 
  FileText, Star, TrendingUp, BarChart3, 
  Target, Award, BookOpen, MessageSquare, Download,
  Building2, Eye, Edit2, Save, X, Plus, Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { progressAPI } from '../../services/api';

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

interface DynamicProgressTrackingPageProps {
  student: Student;
  onBack: () => void;
}

interface InternshipDetails {
  company: string;
  startDate: string;
  endDate: string;
  supervisor: string;
  department: string;
}

interface Milestone {
  id: number;
  name: string;
  completed: boolean;
  date: string;
  description: string;
}

interface Task {
  id: number;
  title: string;
  description: string;
  status: 'completed' | 'in_progress' | 'pending';
  assignedDate: string;
  completedDate?: string;
  deadline: string;
  supervisorRemarks: string;
}

interface Report {
  id: number;
  title: string;
  type: 'weekly' | 'monthly' | 'midterm' | 'final' | 'project';
  submissionDate: string;
  status: 'pending' | 'approved' | 'rejected' | 'under_review';
  grade: string;
  feedback: string;
  fileUrl?: string;
}

interface AttendanceData {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  percentage: number;
}

interface EvaluationScores {
  status: string;
  performance: {
    punctuality: number;
    communication: number;
    teamwork: number;
    problemSolving: number;
    initiative: number;
    reliability: number;
  };
  skills: {
    technicalSkills: number;
    adaptability: number;
    timeManagement: number;
    attentionToDetail: number;
    leadership: number;
    creativity: number;
  };
  overallGrade: string;
  recommendation: string;
  strengths: string;
  improvements: string;
  comments: string;
}

const DynamicProgressTrackingPage: React.FC<DynamicProgressTrackingPageProps> = ({ student, onBack }) => {
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasProgressData, setHasProgressData] = useState(false);
  const [editMode, setEditMode] = useState<{ [key: string]: boolean }>({});
  
  // Editable state for internship details
  const [internshipDetails, setInternshipDetails] = useState<InternshipDetails>({
    company: "Sidama Innovation & Technology agency",
    startDate: student.acceptedApplication?.preferredStartDate || "2024-01-15",
    endDate: student.acceptedApplication?.preferredEndDate || "2024-05-15",
    supervisor: "John Smith",
    department: "Software Development"
  });

  // Dynamic milestones state
  const [milestones, setMilestones] = useState<Milestone[]>([
    { id: 1, name: "Orientation", completed: false, date: new Date().toISOString().split('T')[0], description: "Company introduction and setup" },
    { id: 2, name: "First Report", completed: false, date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], description: "Initial progress report" },
    { id: 3, name: "Midterm Evaluation", completed: false, date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], description: "Mid-internship assessment" },
    { id: 4, name: "Project Milestone", completed: false, date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], description: "Major project deliverable" },
    { id: 5, name: "Final Report", completed: false, date: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], description: "Final internship report" },
    { id: 6, name: "Final Evaluation", completed: false, date: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], description: "Final assessment" }
  ]);

  // Dynamic tasks state
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 1,
      title: "Database Design Documentation",
      description: "Create comprehensive database schema documentation",
      status: "pending",
      assignedDate: new Date().toISOString().split('T')[0],
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      supervisorRemarks: ""
    }
  ]);

  // Dynamic reports state
  const [reports, setReports] = useState<Report[]>([]);

  // Dynamic attendance state
  const [attendanceData, setAttendanceData] = useState<AttendanceData>({
    totalDays: 20,
    presentDays: 17,
    absentDays: 3,
    percentage: 85
  });

  // Attendance summary for analytics
  const [attendanceSummary, setAttendanceSummary] = useState({
    percentage: 85,
    weeklyData: [
      [
        { date: '2024-01-01', status: 'present' },
        { date: '2024-01-02', status: 'present' },
        { date: '2024-01-03', status: 'late' },
        { date: '2024-01-04', status: 'present' },
        { date: '2024-01-05', status: 'present' },
        { date: '', status: 'weekend' },
        { date: '', status: 'weekend' }
      ],
      [
        { date: '2024-01-08', status: 'present' },
        { date: '2024-01-09', status: 'present' },
        { date: '2024-01-10', status: 'present' },
        { date: '2024-01-11', status: 'absent' },
        { date: '2024-01-12', status: 'present' },
        { date: '', status: 'weekend' },
        { date: '', status: 'weekend' }
      ],
      [
        { date: '2024-01-15', status: 'present' },
        { date: '2024-01-16', status: 'present' },
        { date: '2024-01-17', status: 'late' },
        { date: '2024-01-18', status: 'present' },
        { date: '2024-01-19', status: 'present' },
        { date: '', status: 'weekend' },
        { date: '', status: 'weekend' }
      ],
      [
        { date: '2024-01-22', status: 'present' },
        { date: '2024-01-23', status: 'present' },
        { date: '2024-01-24', status: 'present' },
        { date: '2024-01-25', status: 'present' },
        { date: '2024-01-26', status: 'absent' },
        { date: '', status: 'weekend' },
        { date: '', status: 'weekend' }
      ]
    ]
  });

  // Dynamic evaluation state
  const [companyEvaluation, setCompanyEvaluation] = useState<EvaluationScores>({
    status: "draft",
    performance: {
      punctuality: 3,
      communication: 3,
      teamwork: 3,
      problemSolving: 3,
      initiative: 3,
      reliability: 3
    },
    skills: {
      technicalSkills: 3,
      adaptability: 3,
      timeManagement: 3,
      attentionToDetail: 3,
      leadership: 3,
      creativity: 3
    },
    overallGrade: "",
    recommendation: "",
    strengths: "",
    improvements: "",
    comments: ""
  });

  // Calculate overall progress percentage
  const calculateOverallProgress = () => {
    const completedMilestones = milestones.filter(m => m.completed).length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const totalItems = milestones.length + tasks.length;
    return totalItems > 0 ? Math.round(((completedMilestones + completedTasks) / totalItems) * 100) : 0;
  };

  // Load existing progress data on component mount
  useEffect(() => {
    const loadProgressData = async () => {
      setLoading(true);
      try {
        console.log('🔍 Loading existing progress data for student:', student._id);
        console.log('🔍 Current user token:', localStorage.getItem('token') ? 'Present' : 'Missing');
        console.log('🔍 Current user data:', localStorage.getItem('user'));
        
        const response = await progressAPI.getCompanyAdviserProgressData(student._id);
        console.log('🔍 Raw API response:', response);
        
        if (response && response.success && response.data) {
          const data = response.data;
          console.log('✅ Loaded progress data:', data);
          
          // Update internship details if available
          if (data.internshipDetails) {
            setInternshipDetails(prev => ({
              ...prev,
              ...data.internshipDetails
            }));
          }
          
          // Update milestones if available
          if (data.milestones && data.milestones.length > 0) {
            setMilestones(data.milestones.map(m => ({
              ...m,
              name: m.title || m.name,
              date: m.targetDate || m.date
            })));
          }
          
          // Update tasks if available (remove sample task)
          if (data.tasks && data.tasks.length > 0) {
            setTasks(data.tasks.map((t: any) => ({
              ...t,
              deadline: t.dueDate || t.deadline
            })));
          } else {
            // Remove sample task if no saved tasks
            setTasks([]);
          }
          
          // Update reports if available
          if (data.reports && data.reports.length > 0) {
            setReports(data.reports.map((r: any) => ({
              ...r,
              submissionDate: r.submittedDate || r.submissionDate,
              title: r.description || r.title
            })));
          }
          
          // Update attendance data if available
          if (data.attendanceData) {
            setAttendanceData(data.attendanceData);
          }
          
          // Update evaluation data if available
          if (data.evaluations && data.evaluations.midterm) {
            const midterm = data.evaluations.midterm;
            if (midterm.scores) {
              setCompanyEvaluation(prev => ({
                ...prev,
                status: midterm.status || 'draft',
                performance: {
                  punctuality: midterm.scores.punctuality || 0,
                  communication: midterm.scores.communication || 0,
                  teamwork: midterm.scores.teamwork || 0,
                  problemSolving: midterm.scores.problemSolving || 0,
                  initiative: midterm.scores.initiative || 0,
                  reliability: midterm.scores.reliability || 0,
                },
                skills: {
                  technicalSkills: midterm.scores.technicalSkills || 0,
                  adaptability: midterm.scores.adaptability || 0,
                  timeManagement: midterm.scores.timeManagement || 0,
                  attentionToDetail: midterm.scores.attentionToDetail || 0,
                  leadership: midterm.scores.leadership || 0,
                  creativity: midterm.scores.creativity || 0,
                },
                strengths: midterm.strengths ? midterm.strengths.join(', ') : '',
                improvements: midterm.improvements ? midterm.improvements.join(', ') : '',
                comments: midterm.supervisorComments || ''
              }));
            }
          }
          
          setHasProgressData(true);
          toast.success('Progress data loaded successfully!');
        } else {
          console.log('ℹ️ No existing progress data found, using defaults');
          console.log('ℹ️ Response structure:', response);
          setHasProgressData(false);
          // Remove sample task when no data exists
          setTasks([]);
        }
      } catch (error: any) {
        console.error('❌ Error loading progress data:', error);
        console.error('❌ Error details:', {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        });
        setHasProgressData(false);
        setError(error.response?.data?.message || 'Failed to load progress data');
        // Don't show error toast for missing data, just use defaults
        setTasks([]); // Remove sample task on error too
      } finally {
        setLoading(false);
      }
    };
    
    loadProgressData();
  }, [student._id]);

  // Update attendance percentage when data changes
  useEffect(() => {
    const total = attendanceData.totalDays;
    if (total > 0) {
      const percentage = Math.round((attendanceData.presentDays / total) * 100);
      setAttendanceData(prev => ({ ...prev, percentage }));
      setAttendanceSummary(prev => ({ ...prev, percentage }));
    }
  }, [attendanceData.totalDays, attendanceData.presentDays]);

  // Remove auto-save on component mount to prevent unwanted error messages

  // Remove auto-save on evaluation changes to prevent unwanted error messages
  // Only save when user explicitly clicks save button

  // Toggle edit mode for sections
  const toggleEditMode = (section: string) => {
    setEditMode(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Save internship details
  const saveInternshipDetails = async () => {
    try {
      await saveProgressData();
      toggleEditMode('internship');
    } catch (error) {
      console.error('Error saving internship details:', error);
    }
  };

  // Save progress data to backend - Only called when user explicitly saves
  const saveProgressData = async () => {
    try {
      // Remove validation that prevents saving - allow all saves when user clicks button
      console.log('💾 Starting save process for evaluation data...');

      console.log('💾 Company Adviser evaluation state before save:', companyEvaluation);
      
      const progressData = {
        studentInfo: {
          name: student.name,
          email: student.email,
          university: student.profile?.university,
          program: student.groupAssignment?.programName
        },
        internshipDetails: {
          ...internshipDetails,
          supervisor: "Company Supervisor",
          supervisorEmail: "supervisor@company.com"
        },
        milestones: milestones.map(m => ({
          ...m,
          title: m.name,
          targetDate: m.date
        })),
        tasks: tasks.map(t => ({
          ...t,
          dueDate: t.deadline
        })),
        reports: reports.map(r => ({
          ...r,
          submittedDate: r.submissionDate,
          description: r.title
        })),
        attendanceData,
        evaluations: {
          midterm: {
            id: 1,
            type: "midterm",
            evaluatedBy: "Company Supervisor",
            evaluationDate: new Date().toISOString().split('T')[0],
            status: companyEvaluation.status === 'draft' ? 'pending' : companyEvaluation.status,
            scores: {
              // Performance criteria - save ALL values
              punctuality: companyEvaluation.performance.punctuality,
              communication: companyEvaluation.performance.communication,
              teamwork: companyEvaluation.performance.teamwork,
              problemSolving: companyEvaluation.performance.problemSolving,
              initiative: companyEvaluation.performance.initiative,
              reliability: companyEvaluation.performance.reliability,
              // Skills criteria - save ALL values
              technicalSkills: companyEvaluation.skills.technicalSkills,
              adaptability: companyEvaluation.skills.adaptability,
              timeManagement: companyEvaluation.skills.timeManagement,
              attentionToDetail: companyEvaluation.skills.attentionToDetail,
              leadership: companyEvaluation.skills.leadership,
              creativity: companyEvaluation.skills.creativity,
              overall: Math.round((
                companyEvaluation.performance.punctuality +
                companyEvaluation.performance.communication +
                companyEvaluation.performance.teamwork +
                companyEvaluation.performance.problemSolving +
                companyEvaluation.performance.initiative +
                companyEvaluation.performance.reliability +
                companyEvaluation.skills.technicalSkills +
                companyEvaluation.skills.adaptability +
                companyEvaluation.skills.timeManagement +
                companyEvaluation.skills.attentionToDetail +
                companyEvaluation.skills.leadership +
                companyEvaluation.skills.creativity
              ) / 12)
            },
            strengths: companyEvaluation.strengths ? [companyEvaluation.strengths] : [],
            improvements: companyEvaluation.improvements ? [companyEvaluation.improvements] : [],
            supervisorComments: companyEvaluation.comments,
            adviserRemarks: "",
            adviserStatus: "not_started"
          },
          final: {
            id: 2,
            type: "final",
            evaluatedBy: "Company Supervisor",
            evaluationDate: null,
            status: "not_started",
            scores: null,
            strengths: [],
            improvements: [],
            supervisorComments: "",
            adviserRemarks: "",
            adviserStatus: "not_started"
          }
        }
      };

      console.log('💾 Saving progress data:', progressData);
      console.log('💾 Evaluation data being sent:', progressData.evaluations);
      
      const response = await progressAPI.saveProgressData(student._id, progressData);
      console.log('💾 Save response:', response);
      
      toast.success('Progress data saved permanently to database!');
      return response;
    } catch (error: any) {
      console.error('❌ Detailed error saving progress data:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      toast.error(`Failed to save progress data: ${error.response?.data?.message || error.message}`);
      throw error;
    }
  };

  // Toggle milestone completion
  const toggleMilestone = async (id: number) => {
    setMilestones(prev => prev.map(milestone => 
      milestone.id === id 
        ? { 
            ...milestone, 
            completed: !milestone.completed,
            date: !milestone.completed ? new Date().toISOString().split('T')[0] : ""
          }
        : milestone
    ));
    toast.success('Milestone updated!');
    
    // Auto-save milestone changes to persist state
    try {
      await saveProgressData();
      console.log('✅ Milestone state saved successfully');
    } catch (error) {
      console.error('❌ Failed to save milestone state:', error);
      toast.error('Failed to save milestone state');
    }
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
              <h1 className="text-2xl font-bold text-gray-900">Dynamic Progress Tracking</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Student Information Card - Editable */}
        <div className="bg-white rounded-lg shadow-sm border mb-8">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Student Information</h2>
              <button
                onClick={() => toggleEditMode('student')}
                className="flex items-center space-x-2 px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
              >
                {editMode.student ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                <span>{editMode.student ? 'Cancel' : 'Edit'}</span>
              </button>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-blue-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{student.name}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Name: {student.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <BookOpen className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      Program: {student.groupAssignment?.programName || 
                      (typeof student.acceptedApplication?.programId === 'object' ? 
                       student.acceptedApplication.programId.name : 
                       student.acceptedApplication?.programId) || 'Not specified'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Company: {internshipDetails.company}</span>
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

        {/* Tasks & Deliverables Section */}
        {activeSection === 'tasks' && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Tasks & Deliverables</h3>
                <button
                  onClick={() => {
                    const newTask: Task = {
                      id: Date.now(),
                      title: "New Task",
                      description: "Task description",
                      status: "pending",
                      assignedDate: new Date().toISOString().split('T')[0],
                      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                      supervisorRemarks: ""
                    };
                    setTasks(prev => [...prev, newTask]);
                    setEditMode(prev => ({ ...prev, [`task-${newTask.id}`]: true }));
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Task</span>
                </button>
              </div>
              <div className="flex items-center space-x-4 mt-4">
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-3 h-3 bg-green-100 rounded-full"></div>
                  <span className="text-gray-600">Completed: {tasks.filter(t => t.status === 'completed').length}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-3 h-3 bg-blue-100 rounded-full"></div>
                  <span className="text-gray-600">In Progress: {tasks.filter(t => t.status === 'in_progress').length}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-3 h-3 bg-yellow-100 rounded-full"></div>
                  <span className="text-gray-600">Pending: {tasks.filter(t => t.status === 'pending').length}</span>
                </div>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {tasks.map((task) => (
                <div key={task.id} className="p-6">
                  {editMode[`task-${task.id}`] ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
                        <input
                          type="text"
                          value={task.title}
                          onChange={(e) => setTasks(prev => prev.map(t => 
                            t.id === task.id ? { ...t, title: e.target.value } : t
                          ))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter task title"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                          value={task.description}
                          onChange={(e) => setTasks(prev => prev.map(t => 
                            t.id === task.id ? { ...t, description: e.target.value } : t
                          ))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows={3}
                          placeholder="Enter task description"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                          <select
                            value={task.status}
                            onChange={(e) => setTasks(prev => prev.map(t => 
                              t.id === task.id ? { 
                                ...t, 
                                status: e.target.value as 'completed' | 'in_progress' | 'pending',
                                completedDate: e.target.value === 'completed' ? new Date().toISOString().split('T')[0] : undefined
                              } : t
                            ))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="pending">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Date</label>
                          <input
                            type="date"
                            value={task.assignedDate}
                            onChange={(e) => setTasks(prev => prev.map(t => 
                              t.id === task.id ? { ...t, assignedDate: e.target.value } : t
                            ))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                          <input
                            type="date"
                            value={task.deadline}
                            onChange={(e) => setTasks(prev => prev.map(t => 
                              t.id === task.id ? { ...t, deadline: e.target.value } : t
                            ))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Supervisor Remarks</label>
                        <textarea
                          value={task.supervisorRemarks}
                          onChange={(e) => setTasks(prev => prev.map(t => 
                            t.id === task.id ? { ...t, supervisorRemarks: e.target.value } : t
                          ))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows={2}
                          placeholder="Add supervisor remarks or feedback"
                        />
                      </div>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={async () => {
                            try {
                              await saveProgressData();
                              setEditMode(prev => ({ ...prev, [`task-${task.id}`]: false }));
                            } catch (error) {
                              console.error('Error saving task:', error);
                            }
                          }}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center space-x-2"
                        >
                          <Save className="w-4 h-4" />
                          <span>Save Task</span>
                        </button>
                        <button
                          onClick={() => {
                            setTasks(prev => prev.filter(t => t.id !== task.id));
                            toast.success('Task deleted!');
                          }}
                          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center space-x-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-lg font-medium text-gray-900">{task.title || 'Untitled Task'}</h4>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            task.status === 'completed' ? 'bg-green-100 text-green-800' :
                            task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {task.status.replace('-', ' ').toUpperCase()}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-3">{task.description || 'No description provided'}</p>
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
                      <button
                        onClick={() => setEditMode(prev => ({ ...prev, [`task-${task.id}`]: true }))}
                        className="ml-4 p-2 text-gray-400 hover:text-gray-600"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reports & Submissions Section */}
        {activeSection === 'reports' && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Reports & Submissions</h3>
                <button
                  onClick={() => {
                    const newReport: Report = {
                      id: Date.now(),
                      title: "New Report",
                      type: "weekly",
                      submissionDate: new Date().toISOString().split('T')[0],
                      status: "pending",
                      grade: "",
                      feedback: "",
                      fileUrl: ""
                    };
                    setReports(prev => [...prev, newReport]);
                    setEditMode(prev => ({ ...prev, [`report-${newReport.id}`]: true }));
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Report</span>
                </button>
              </div>
              <div className="flex items-center space-x-4 mt-4">
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-3 h-3 bg-green-100 rounded-full"></div>
                  <span className="text-gray-600">Approved: {reports.filter(r => r.status === 'approved').length}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-3 h-3 bg-blue-100 rounded-full"></div>
                  <span className="text-gray-600">Submitted: {reports.filter(r => r.status === 'submitted').length}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-3 h-3 bg-yellow-100 rounded-full"></div>
                  <span className="text-gray-600">Pending: {reports.filter(r => r.status === 'pending').length}</span>
                </div>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {reports.map((report) => (
                <div key={report.id} className="p-6">
                  {editMode[`report-${report.id}`] ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Report Title</label>
                          <input
                            type="text"
                            value={report.title}
                            onChange={(e) => setReports(prev => prev.map(r => 
                              r.id === report.id ? { ...r, title: e.target.value } : r
                            ))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter report title"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
                          <select
                            value={report.type}
                            onChange={(e) => setReports(prev => prev.map(r => 
                              r.id === report.id ? { ...r, type: e.target.value as 'weekly' | 'monthly' | 'final' | 'project' } : r
                            ))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="weekly">Weekly Report</option>
                            <option value="monthly">Monthly Report</option>
                            <option value="project">Project Report</option>
                            <option value="final">Final Report</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Submission Date</label>
                          <input
                            type="date"
                            value={report.submissionDate}
                            onChange={(e) => setReports(prev => prev.map(r => 
                              r.id === report.id ? { ...r, submissionDate: e.target.value } : r
                            ))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                          <select
                            value={report.status}
                            onChange={(e) => setReports(prev => prev.map(r => 
                              r.id === report.id ? { ...r, status: e.target.value as 'pending' | 'submitted' | 'approved' | 'rejected' } : r
                            ))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="pending">Pending</option>
                            <option value="submitted">Submitted</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
                          <input
                            type="text"
                            value={report.grade}
                            onChange={(e) => setReports(prev => prev.map(r => 
                              r.id === report.id ? { ...r, grade: e.target.value } : r
                            ))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., A, B+, 85%"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">File Upload</label>
                        <div className="flex items-center space-x-3">
                          <input
                            type="file"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                // In a real app, you'd upload to a server and get a URL
                                const fakeUrl = `uploads/${file.name}`;
                                setReports(prev => prev.map(r => 
                                  r.id === report.id ? { ...r, fileUrl: fakeUrl } : r
                                ));
                                toast.success(`File "${file.name}" uploaded successfully!`);
                              }
                            }}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            accept=".pdf,.doc,.docx,.txt"
                          />
                          {report.fileUrl && (
                            <button
                              onClick={() => {
                                // In a real app, this would download the file
                                toast.success('File download started!');
                              }}
                              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center space-x-1"
                            >
                              <Download className="w-4 h-4" />
                              <span>Download</span>
                            </button>
                          )}
                        </div>
                        {report.fileUrl && (
                          <p className="text-sm text-gray-500 mt-1">Current file: {report.fileUrl.split('/').pop()}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Supervisor Feedback</label>
                        <textarea
                          value={report.feedback}
                          onChange={(e) => setReports(prev => prev.map(r => 
                            r.id === report.id ? { ...r, feedback: e.target.value } : r
                          ))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows={3}
                          placeholder="Add supervisor feedback or comments"
                        />
                      </div>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={async () => {
                            try {
                              await saveProgressData();
                              setEditMode(prev => ({ ...prev, [`report-${report.id}`]: false }));
                            } catch (error) {
                              console.error('Error saving report:', error);
                            }
                          }}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center space-x-2"
                        >
                          <Save className="w-4 h-4" />
                          <span>Save Report</span>
                        </button>
                        <button
                          onClick={() => {
                            setReports(prev => prev.filter(r => r.id !== report.id));
                            toast.success('Report deleted!');
                          }}
                          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center space-x-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-lg font-medium text-gray-900">{report.title || 'Untitled Report'}</h4>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            report.status === 'approved' ? 'bg-green-100 text-green-800' :
                            report.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                            report.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {report.status ? report.status.toUpperCase() : 'PENDING'}
                          </span>
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                            {report.type ? report.type.replace('-', ' ').toUpperCase() : 'UNKNOWN'}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-3">
                          <div>
                            <span className="text-gray-500">Submitted:</span>
                            <span className="ml-2 font-medium">{report.submissionDate ? new Date(report.submissionDate).toLocaleDateString() : 'Not set'}</span>
                          </div>
                          {report.grade && (
                            <div>
                              <span className="text-gray-500">Grade:</span>
                              <span className="ml-2 font-medium text-green-600">{report.grade}</span>
                            </div>
                          )}
                          {report.fileUrl && (
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-500">File:</span>
                              <button
                                onClick={() => toast.success('File download started!')}
                                className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                              >
                                <Eye className="w-4 h-4" />
                                <span>View</span>
                              </button>
                            </div>
                          )}
                        </div>
                        {report.feedback && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                            <div className="flex items-start space-x-2">
                              <MessageSquare className="w-4 h-4 text-blue-600 mt-0.5" />
                              <div>
                                <span className="text-sm font-medium text-blue-900">Supervisor Feedback:</span>
                                <p className="text-sm text-blue-800 mt-1">{report.feedback}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => setEditMode(prev => ({ ...prev, [`report-${report.id}`]: true }))}
                        className="ml-4 p-2 text-gray-400 hover:text-gray-600"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Evaluation Forms Section */}
        {activeSection === 'evaluation' && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Company Adviser Evaluation</h3>
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                    companyEvaluation.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                    companyEvaluation.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {companyEvaluation.status.toUpperCase()}
                  </span>
                  <button
                    onClick={() => toggleEditMode('evaluation')}
                    className="flex items-center space-x-2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>{editMode.evaluation ? 'Cancel' : 'Edit'}</span>
                  </button>
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Performance Evaluation */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Performance Evaluation</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(companyEvaluation.performance).map(([key, value]) => (
                    <div key={key} className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </label>
                      {editMode.evaluation ? (
                        <div className="flex items-center space-x-4">
                          <input
                            type="range"
                            min="1"
                            max="5"
                            value={value}
                            onChange={(e) => setCompanyEvaluation(prev => ({
                              ...prev,
                              performance: {
                                ...prev.performance,
                                [key]: parseInt(e.target.value)
                              }
                            }))}
                            className="flex-1"
                          />
                          <div className="flex space-x-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-5 h-5 ${
                                  star <= value ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-medium w-8">{value}/5</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-5 h-5 ${
                                  star <= value ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-medium">{value}/5</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Skills Assessment */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Skills Assessment</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(companyEvaluation.skills).map(([key, value]) => (
                    <div key={key} className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </label>
                      {editMode.evaluation ? (
                        <div className="flex items-center space-x-4">
                          <input
                            type="range"
                            min="1"
                            max="5"
                            value={value}
                            onChange={(e) => setCompanyEvaluation(prev => ({
                              ...prev,
                              skills: {
                                ...prev.skills,
                                [key]: parseInt(e.target.value)
                              }
                            }))}
                            className="flex-1"
                          />
                          <div className="flex space-x-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-5 h-5 ${
                                  star <= value ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-medium w-8">{value}/5</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-5 h-5 ${
                                  star <= value ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-medium">{value}/5</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Overall Assessment */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Overall Grade</label>
                  {editMode.evaluation ? (
                    <select
                      value={companyEvaluation.overallGrade}
                      onChange={(e) => setCompanyEvaluation(prev => ({
                        ...prev,
                        overallGrade: e.target.value
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Grade</option>
                      <option value="A+">A+ (Excellent)</option>
                      <option value="A">A (Very Good)</option>
                      <option value="B+">B+ (Good)</option>
                      <option value="B">B (Satisfactory)</option>
                      <option value="C+">C+ (Fair)</option>
                      <option value="C">C (Pass)</option>
                      <option value="F">F (Fail)</option>
                    </select>
                  ) : (
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                      <span className="font-medium text-lg">{companyEvaluation.overallGrade || 'Not graded'}</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Recommendation</label>
                  {editMode.evaluation ? (
                    <select
                      value={companyEvaluation.recommendation}
                      onChange={(e) => setCompanyEvaluation(prev => ({
                        ...prev,
                        recommendation: e.target.value
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Recommendation</option>
                      <option value="highly-recommend">Highly Recommend</option>
                      <option value="recommend">Recommend</option>
                      <option value="conditional">Conditional Recommendation</option>
                      <option value="not-recommend">Do Not Recommend</option>
                    </select>
                  ) : (
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                      <span className="font-medium capitalize">
                        {companyEvaluation.recommendation?.replace('-', ' ') || 'No recommendation'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Comments and Feedback */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Strengths</label>
                  {editMode.evaluation ? (
                    <textarea
                      value={companyEvaluation.strengths}
                      onChange={(e) => setCompanyEvaluation(prev => ({
                        ...prev,
                        strengths: e.target.value
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Describe the student's key strengths and achievements"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md min-h-[80px]">
                      <p className="text-gray-700">{companyEvaluation.strengths || 'No strengths noted'}</p>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Areas for Improvement</label>
                  {editMode.evaluation ? (
                    <textarea
                      value={companyEvaluation.improvements}
                      onChange={(e) => setCompanyEvaluation(prev => ({
                        ...prev,
                        improvements: e.target.value
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Suggest areas where the student can improve"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md min-h-[80px]">
                      <p className="text-gray-700">{companyEvaluation.improvements || 'No improvements suggested'}</p>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Additional Comments</label>
                  {editMode.evaluation ? (
                    <textarea
                      value={companyEvaluation.comments}
                      onChange={(e) => setCompanyEvaluation(prev => ({
                        ...prev,
                        comments: e.target.value
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={4}
                      placeholder="Any additional comments or observations"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md min-h-[100px]">
                      <p className="text-gray-700">{companyEvaluation.comments || 'No additional comments'}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {editMode.evaluation && (
                <div className="flex items-center space-x-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={async () => {
                      try {
                        setCompanyEvaluation(prev => ({ ...prev, status: 'draft' }));
                        await saveProgressData();
                        setEditMode(prev => ({ ...prev, evaluation: false }));
                        toast.success('Evaluation saved as draft!');
                      } catch (error) {
                        console.error('Failed to save draft:', error);
                      }
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Draft</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Analytics Section */}
        {activeSection === 'analytics' && (
          <div className="space-y-6">
            {/* Progress Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Overall Progress</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {Math.round((milestones.filter(m => m.completed).length / milestones.length) * 100)}%
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Tasks Completed</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {tasks.filter(t => t.status === 'completed').length}/{tasks.length}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-yellow-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Attendance Rate</p>
                    <p className="text-2xl font-semibold text-gray-900">{attendanceSummary.percentage}%</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <FileText className="w-5 h-5 text-purple-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Reports Submitted</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {reports.filter(r => r.status === 'submitted' || r.status === 'approved').length}/{reports.length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Milestone Progress Chart */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Milestone Progress</h3>
                <div className="space-y-4">
                  {milestones.map((milestone, index) => (
                    <div key={milestone.id} className="flex items-center space-x-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium">
                        {milestone.completed ? (
                          <CheckCircle className="w-6 h-6 text-green-500" />
                        ) : (
                          <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center">
                            <span className="text-xs text-gray-500">{index + 1}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">{milestone.name || milestone.title}</p>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            milestone.completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {milestone.completed ? 'Completed' : 'Pending'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Target: {new Date(milestone.date || milestone.targetDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Milestone Status Distribution */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Milestone Status Overview</h3>
                <div className="space-y-4">
                  {[
                    { status: 'completed', label: 'Completed', color: 'bg-green-500', count: milestones.filter(m => m.completed).length },
                    { status: 'pending', label: 'Pending', color: 'bg-yellow-500', count: milestones.filter(m => !m.completed).length }
                  ].map((item) => {
                    const percentage = milestones.length > 0 ? (item.count / milestones.length) * 100 : 0;
                    return (
                      <div key={item.status} className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2 w-24">
                          <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                          <span className="text-sm text-gray-600">{item.label}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${item.color}`}
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className="ml-2 text-sm font-medium text-gray-900 min-w-[3rem]">
                              {item.count}/{milestones.length}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Task Status Distribution */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Status Distribution</h3>
                <div className="space-y-4">
                  {[
                    { status: 'completed', label: 'Completed', color: 'bg-green-500', count: tasks.filter(t => t.status === 'completed').length },
                    { status: 'in_progress', label: 'In Progress', color: 'bg-blue-500', count: tasks.filter(t => t.status === 'in_progress').length },
                    { status: 'pending', label: 'Pending', color: 'bg-yellow-500', count: tasks.filter(t => t.status === 'pending').length }
                  ].map((item) => {
                    const percentage = tasks.length > 0 ? (item.count / tasks.length) * 100 : 0;
                    return (
                      <div key={item.status} className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2 w-24">
                          <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                          <span className="text-sm text-gray-600">{item.label}</span>
                        </div>
                        <div className="flex-1">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${item.color}`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-12 text-right">
                          {item.count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Object.entries(companyEvaluation.performance).map(([key, value]) => (
                  <div key={key} className="text-center">
                    <div className="relative w-20 h-20 mx-auto mb-2">
                      <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-gray-200"
                          stroke="currentColor"
                          strokeWidth="3"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-blue-500"
                          stroke="currentColor"
                          strokeWidth="3"
                          fill="none"
                          strokeDasharray={`${(value / 5) * 100}, 100`}
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-lg font-semibold text-gray-900">{value}/5</span>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-gray-900 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Weekly Attendance Chart */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Attendance Trend</h3>
              <div className="grid grid-cols-7 gap-2 mb-4">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                  <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {attendanceSummary.weeklyData.map((week, weekIndex) => (
                  week.map((day, dayIndex) => (
                    <div
                      key={`${weekIndex}-${dayIndex}`}
                      className={`h-8 rounded flex items-center justify-center text-xs font-medium ${
                        day.status === 'present' ? 'bg-green-100 text-green-800' :
                        day.status === 'absent' ? 'bg-red-100 text-red-800' :
                        day.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-50 text-gray-400'
                      }`}
                    >
                      {day.date ? new Date(day.date).getDate() : ''}
                    </div>
                  ))
                ))}
              </div>
              <div className="flex items-center justify-center space-x-6 mt-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-100 rounded"></div>
                  <span className="text-gray-600">Present</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-100 rounded"></div>
                  <span className="text-gray-600">Late</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-100 rounded"></div>
                  <span className="text-gray-600">Absent</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Progress Overview Section */}
        {activeSection === 'overview' && (
          <div className="space-y-8">
            {/* Editable Internship Details */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Internship Details</h3>
                <button
                  onClick={() => editMode.internship ? saveInternshipDetails() : toggleEditMode('internship')}
                  className="flex items-center space-x-2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {editMode.internship ? <Save className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                  <span>{editMode.internship ? 'Save' : 'Edit'}</span>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {editMode.internship ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                      <input
                        type="text"
                        value={internshipDetails.company}
                        onChange={(e) => setInternshipDetails(prev => ({ ...prev, company: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Supervisor</label>
                      <input
                        type="text"
                        value={internshipDetails.supervisor}
                        onChange={(e) => setInternshipDetails(prev => ({ ...prev, supervisor: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                      <input
                        type="date"
                        value={internshipDetails.startDate}
                        onChange={(e) => setInternshipDetails(prev => ({ ...prev, startDate: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                      <input
                        type="date"
                        value={internshipDetails.endDate}
                        onChange={(e) => setInternshipDetails(prev => ({ ...prev, endDate: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Building2 className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Company:</span>
                        <span className="text-sm font-medium">{internshipDetails.company}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Supervisor:</span>
                        <span className="text-sm font-medium">{internshipDetails.supervisor}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Start:</span>
                        <span className="text-sm font-medium">{new Date(internshipDetails.startDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">End:</span>
                        <span className="text-sm font-medium">{new Date(internshipDetails.endDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Dynamic Progress Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Overall Progress Circle */}
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
                        strokeDasharray={`${calculateOverallProgress() * 3.14} 314`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-blue-600">
                        {calculateOverallProgress()}%
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-600 mt-2">Internship Completion</p>
                </div>
              </div>

              {/* Editable Attendance Summary */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Attendance Summary</h3>
                  <button
                    onClick={() => toggleEditMode('attendance')}
                    className="flex items-center space-x-2 px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
                  >
                    {editMode.attendance ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                    <span>{editMode.attendance ? 'Cancel' : 'Edit'}</span>
                  </button>
                </div>
                
                {editMode.attendance ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Total Days</label>
                      <input
                        type="number"
                        value={attendanceData.totalDays}
                        onChange={(e) => setAttendanceData(prev => ({ 
                          ...prev, 
                          totalDays: parseInt(e.target.value) || 0,
                          absentDays: Math.max(0, (parseInt(e.target.value) || 0) - prev.presentDays)
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Present Days</label>
                      <input
                        type="number"
                        value={attendanceData.presentDays}
                        onChange={(e) => setAttendanceData(prev => ({ 
                          ...prev, 
                          presentDays: parseInt(e.target.value) || 0,
                          absentDays: Math.max(0, prev.totalDays - (parseInt(e.target.value) || 0))
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button
                      onClick={() => {
                        toast.success('Attendance data saved!');
                        toggleEditMode('attendance');
                      }}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Save Attendance
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Total Days</span>
                      <span className="font-semibold">{attendanceData.totalDays}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Present</span>
                      <span className="font-semibold text-green-600">{attendanceData.presentDays}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Absent</span>
                      <span className="font-semibold text-red-600">{attendanceData.absentDays}</span>
                    </div>
                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Attendance Rate</span>
                        <span className="font-bold text-lg text-blue-600">{attendanceData.percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${attendanceData.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Interactive Milestones */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Milestones & Achievements</h3>
              <div className="space-y-4">
                {milestones.map((milestone) => (
                  <div key={milestone.id} className="flex items-start space-x-4">
                    <div className="flex items-center mt-1">
                      <input
                        type="checkbox"
                        id={`milestone-${milestone.id}`}
                        checked={milestone.completed}
                        onChange={() => toggleMilestone(milestone.id)}
                        className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className={`font-medium ${milestone.completed ? 'text-gray-900' : 'text-gray-500'}`}>
                          {milestone.name}
                        </h4>
                        <span className="text-sm text-gray-500">
                          {milestone.completed && milestone.date ? new Date(milestone.date).toLocaleDateString() : 'Pending'}
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
      </div>
    </div>
  );
};

export default DynamicProgressTrackingPage;
