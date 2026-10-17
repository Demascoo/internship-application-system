import React, { useState, useEffect } from 'react';
import { 
  Calendar, CheckCircle, 
  FileText, BarChart3, 
  Target, ArrowLeft, Clock, Briefcase, Award
} from 'lucide-react';
import { progressAPI } from '../../services/api';

interface Student {
  _id: string;
  name: string;
  email: string;
  studentId?: string;
  profile?: {
    university?: string;
    course?: string;
    phone?: string;
    address?: string;
    profilePicture?: string;
    location?: string;
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

interface InternshipDetails {
  company: string;
  startDate: string;
  endDate: string;
  duration: string;
  position: string;
  location: string;
}

interface Task {
  id: string | number;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  assignedDate: string;
  completedDate: string;
  deadline: string;
  supervisorRemarks: string;
}

interface Report {
  id: string | number;
  title: string;
  type: 'weekly' | 'monthly' | 'final';
  submittedDate: string;
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
  grade: string;
  feedback: string;
}

interface EvaluationScores {
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
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
  overallScore: number;
  grade: string;
  recommendation: string;
  strengths: string;
  improvements: string;
  comments: string;
}

interface Props {
  student: any;
  onBack: () => void;
}

const navigationItems = [
  { id: 'internship', label: 'Internship Details', icon: Briefcase },
  { id: 'tasks', label: 'Tasks', icon: Target },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
];

const UniversityAdviserProgressTracking: React.FC<Props> = ({ student, onBack }) => {
  const [activeSection, setActiveSection] = useState<string>('internship');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasProgressData, setHasProgressData] = useState(false);
  const [responseData, setResponseData] = useState<any>(null);
  
  // Dynamic state for internship details (from Company Adviser)
  const [internshipDetails, setInternshipDetails] = useState<InternshipDetails>({
    company: "Loading...",
    startDate: "",
    endDate: "",
    duration: "Loading...",
    position: "",
    location: ""
  });


  // Dynamic tasks state (from Company Adviser)
  const [tasks, setTasks] = useState<Task[]>([]);

  // Dynamic reports state (from Company Adviser)
  const [reports, setReports] = useState<Report[]>([]);


  // Attendance data state
  const [attendanceData] = useState({
    totalDays: 0,
    presentDays: 0,
    absentDays: 0,
    attendanceRate: 0
  });
  
  const [attendanceSummary] = useState({
    weeklyData: [],
    monthlyAverage: 0,
    trends: []
  });

  // Helper function to calculate duration from dates
  const calculateDynamicDuration = (startDate: string, endDate: string): string => {
    if (!startDate || !endDate) return "Not specified";
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const months = Math.floor(diffDays / 30);
    const remainingDays = diffDays % 30;
    
    if (months > 0) {
      return remainingDays > 0 ? `${months} month${months > 1 ? 's' : ''} ${remainingDays} day${remainingDays > 1 ? 's' : ''}` : `${months} month${months > 1 ? 's' : ''}`;
    }
    return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
  };


  // Helper function to calculate task completion percentage
  const calculateTaskCompletionPercentage = (tasks: Task[]): number => {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(task => task.status === 'completed').length;
    return Math.round((completed / tasks.length) * 100);
  };


  useEffect(() => {
    const fetchProgressData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔍 Fetching progress data for student:', student._id);
        
        const response = await progressAPI.getCompanyAdviserProgressData(student._id);
        
        console.log('📊 Full API Response:', response);
        console.log('📊 Response Type:', typeof response);
        console.log('📊 Response Keys:', response ? Object.keys(response) : 'No response');
        
        // Check if response exists
        if (!response) {
          console.error('❌ API response is null - possible network error');
          setError('Failed to fetch progress data - network error');
          setHasProgressData(false);
          return;
        }
        
        // The backend returns: { success: true, data: progressData }
        // Based on the logs, the response structure is exactly what backend sends
        let responseData = null;
        
        // Check if we have the expected structure
        if (response && (response as any).success === true && (response as any).data) {
          responseData = (response as any).data;
          setResponseData(responseData);
          console.log('✅ Found progress data in response.data');
        } else if (response && (response as any).data && typeof (response as any).data === 'object') {
          // Direct data object (in case structure is different)
          responseData = (response as any).data;
          setResponseData(responseData);
          console.log('✅ Using response.data directly');
        } else {
          console.log('❌ Unexpected response structure');
        }
        
        console.log('📊 Progress API Response:', response);
        console.log('📊 Progress Data:', responseData);
        console.log('📊 Response Success:', (response as any).success);
        console.log('📊 Response Message:', (response as any).message);
        console.log('📊 Evaluations in response:', responseData?.evaluations);
        console.log('📊 Full response data keys:', responseData ? Object.keys(responseData) : 'No data');
        
        if (responseData && responseData !== null && Object.keys(responseData).length > 0) {
          setHasProgressData(true);
          
          // Update internship details with dynamic data
          if (responseData.internshipDetails) {
            const details = responseData.internshipDetails;
            setInternshipDetails({
              company: "Sidama Innovation and Technology Agency",
              startDate: details.startDate || "",
              endDate: details.endDate || "",
              duration: details.startDate && details.endDate ? 
                calculateDynamicDuration(details.startDate, details.endDate) : "Not specified",
              position: details.position || "",
              location: details.location || ""
            });
          }
          
          // Update tasks with dynamic data
          if (responseData.tasks && Array.isArray(responseData.tasks)) {
            setTasks(responseData.tasks.map((task: any) => ({
              id: task.id || Math.random(),
              title: task.title || "Untitled Task",
              description: task.description || "",
              status: task.status || 'pending',
              assignedDate: task.assignedDate || "",
              completedDate: task.completedDate || "",
              deadline: task.deadline || task.dueDate || "",
              supervisorRemarks: task.supervisorRemarks || ""
            })));
          }
          
          // Update reports with dynamic data
          if (responseData.reports && Array.isArray(responseData.reports)) {
            setReports(responseData.reports.map((report: any) => ({
              id: report.id || Math.random(),
              title: report.title || "Untitled Report",
              type: report.type || 'weekly',
              submittedDate: report.submittedDate || report.submissionDate || "",
              status: report.status || 'pending',
              grade: report.grade || "Not graded",
              feedback: report.feedback || report.supervisorFeedback || ""
            })));
          }
          
          
          // Milestones removed from University Adviser view
          
          // Update evaluation data with dynamic data - matching Company Adviser save structure
          if (responseData.evaluations) {
            console.log('🔍 Raw evaluations object:', responseData.evaluations);
            const evaluations = responseData.evaluations;
            
            // Check midterm first (Company Adviser saves to midterm), then final
            const completedEvaluation = evaluations.midterm || evaluations.final;
            console.log('🔍 Selected evaluation:', completedEvaluation);
            
            if (completedEvaluation && completedEvaluation.status && (completedEvaluation.status === "draft" || completedEvaluation.status === "completed" || completedEvaluation.status === "submitted")) {
              console.log('✅ Found completed evaluation with status:', completedEvaluation.status);
              
              // Extract scores exactly as Company Adviser saves them
              const scores = completedEvaluation.scores || {};
              console.log('🔍 Evaluation scores:', scores);
              
              const overallScore = scores.overall || 0;
              
              // Company Adviser saves evaluation data with full performance and skills criteria
              // We need to fetch the original companyEvaluation data that was used to calculate scores
              // The scores object only contains selected fields, but we need all the original data
              
              // Get the actual evaluation data from the backend response
              console.log('🔍 Full evaluation object:', completedEvaluation);
              
              const newEvaluationData = {
                status: completedEvaluation.status,
                performance: {
                  punctuality: scores.punctuality || 0,
                  communication: scores.communication || 0,
                  teamwork: scores.teamwork || 0,
                  problemSolving: scores.problemSolving || 0,
                  initiative: scores.initiative || 0,
                  reliability: scores.reliability || 0
                },
                skills: {
                  technicalSkills: scores.technicalSkills || 0,
                  adaptability: scores.adaptability || 0,
                  timeManagement: scores.timeManagement || 0,
                  attentionToDetail: scores.attentionToDetail || 0,
                  leadership: scores.leadership || 0,
                  creativity: scores.creativity || 0
                },
                overallScore: overallScore,
                grade: getGradeFromScore(overallScore),
                recommendation: completedEvaluation.recommendation || "Evaluation completed by Company Supervisor",
                strengths: Array.isArray(completedEvaluation.strengths) ? completedEvaluation.strengths.join(', ') : (completedEvaluation.strengths || "No specific strengths noted"),
                improvements: Array.isArray(completedEvaluation.improvements) ? completedEvaluation.improvements.join(', ') : (completedEvaluation.improvements || "No specific improvements noted"),
                comments: completedEvaluation.supervisorComments || "No additional comments"
              };
              
              console.log('🔄 Evaluation data found but removed from University Adviser view');
              
              console.log('✅ Evaluation data updated successfully');
            } else {
              console.log('⚠️ No completed evaluation found or status is not_started');
            }
          } else {
            console.log('⚠️ No evaluations object in response data');
          }
        } else {
          console.log('📊 No progress data found, showing default state');
          console.log('📊 Response structure debug:', {
            hasResponse: !!response,
            responseSuccess: (response as any)?.success,
            responseData: response?.data,
            responseDataType: typeof response?.data,
            responseDataKeys: response?.data ? Object.keys(response.data) : 'No data'
          });
          setHasProgressData(false);
        }
        
      } catch (error) {
        console.error('❌ Error fetching progress data:', error);
        
        // Handle different types of errors
        if (error && typeof error === 'object' && 'response' in error) {
          // Server responded with error status
          const axiosError = error as any;
          console.error('❌ Server Error:', axiosError.response?.status, axiosError.response?.data);
          setError(`Server error: ${axiosError.response?.data?.message || 'Failed to fetch data'}`);
        } else if (error && typeof error === 'object' && 'request' in error) {
          // Request made but no response received
          const axiosError = error as any;
          console.error('❌ Network Error - No response received:', axiosError.request);
          setError('Network error: Unable to reach server. Please check your connection.');
        } else {
          // Something else happened
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          console.error('❌ Request Error:', errorMessage);
          setError(`Request failed: ${errorMessage}`);
        }
        
        setHasProgressData(false);
      } finally {
        setLoading(false);
      }
    };

    if (student?._id) {
      fetchProgressData();
    }
  }, [student]);

  // Helper function to calculate task completion percentage
  const calculateProgress = (): number => {
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    const totalTasks = tasks.length;
    
    if (totalTasks === 0) return 0;
    return Math.round((completedTasks / totalTasks) * 100);
  };

  // Helper function to get grade from score
  const getGradeFromScore = (score: number): string => {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };

  // Get completion status
  const getCompletionStatus = () => {
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    const completedReports = reports.filter(report => report.status === 'approved').length;
    
    return {
      completed: completedTasks + completedReports,
      total: tasks.length + reports.length
    };
  };

  // Calculate overall progress
  const calculateOverallProgress = () => {
    let totalProgress = 0;
    let sections = 0;

    // Tasks progress
    if (tasks.length > 0) {
      const completedTasks = tasks.filter(task => task.status === 'completed').length;
      totalProgress += (completedTasks / tasks.length) * 100;
      sections++;
    }

    // Reports progress
    if (reports.length > 0) {
      const completedReports = reports.filter(report => report.status === 'approved').length;
      totalProgress += (completedReports / reports.length) * 100;
      sections++;
    }


    return sections > 0 ? Math.round(totalProgress / sections) : 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading progress data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Progress Data</h3>
            <p className="text-red-600">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!hasProgressData) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Progress Tracking</h1>
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Students
              </button>
            </div>
            
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Progress Submitted Yet</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                No progress has been submitted by the Company Adviser yet. Once they submit progress data, 
                it will appear here with detailed tracking information.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main component return for when progress data exists
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Progress Tracking</h1>
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Students
            </button>
          </div>
          
          {/* Student Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Student Name</p>
              <p className="font-medium">{student?.name || "Not specified"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">University</p>
              <p className="font-medium">{responseData?.student?.university_name || 
                responseData?.student?.profile?.university || 
                responseData?.student?.linkedUniversityId || 
                (student as any)?.university_name || 
                (student as any)?.profile?.university || 
                (student as any)?.linkedUniversityId || 
                "Not specified"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Program</p>
              <p className="font-medium">
                {(typeof (student as any)?.acceptedApplication?.programId === 'object' ? 
                 (student as any).acceptedApplication.programId.name : 
                 (student as any)?.acceptedApplication?.programId) || 'Not specified'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm border mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8" aria-label="Tabs">
              {navigationItems.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSection(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
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
        <div className="space-y-8">
          {activeSection === 'internship' && (
            <div className="space-y-6">
              {/* Progress Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Overall Progress</p>
                      <p className="text-2xl font-semibold text-gray-900">{calculateOverallProgress()}%</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Target className="w-5 h-5 text-green-600" />
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
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <FileText className="w-5 h-5 text-purple-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Reports Submitted</p>
                      <p className="text-2xl font-semibold text-gray-900">{reports.filter(r => r.status === 'approved' || r.status === 'submitted').length}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Internship Details */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Information & Internship Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium">{student?.name || "Not specified"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">University</p>
                    <p className="font-medium">{responseData?.student?.university_name || 
                      responseData?.student?.profile?.university || 
                      responseData?.student?.linkedUniversityId || 
                      (student as any)?.university_name || 
                      (student as any)?.profile?.university || 
                      (student as any)?.linkedUniversityId || 
                      "Not specified"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Program</p>
                    <p className="font-medium">{(student as any)?.groupAssignment?.programId?.name || 
                      (student as any)?.acceptedApplication?.programId?.name || 
                      (typeof (student as any)?.acceptedApplication?.programId === 'string' ? 
                        (student as any)?.acceptedApplication?.programId : 
                        (student as any)?.acceptedApplication?.programId) || 
                      "Not specified"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Company</p>
                    <p className="font-medium">Sidama Innovation and Technology Agency</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Duration</p>
                    <p className="font-medium">{internshipDetails.duration}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'internship' && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Internship Details (Read-Only)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500">Company</p>
                  <p className="font-medium">{internshipDetails.company}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-medium">Hawassa</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Duration</p>
                  <p className="font-medium">{internshipDetails.duration}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Start Date</p>
                  <p className="font-medium">{internshipDetails.startDate ? new Date(internshipDetails.startDate).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  }) : "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">End Date</p>
                  <p className="font-medium">{internshipDetails.endDate ? new Date(internshipDetails.endDate).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  }) : "Not specified"}</p>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'tasks' && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tasks & Deliverables (Read-Only)</h3>
              <div className="space-y-4">
                {tasks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No tasks assigned yet</p>
                  </div>
                ) : (
                  tasks.map((task) => (
                    <div key={task.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{task.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>Assigned: {task.assignedDate}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>Due: {task.deadline}</span>
                          </div>
                          {task.completedDate && (
                            <div className="flex items-center space-x-1">
                              <CheckCircle className="w-4 h-4" />
                              <span>Completed: {task.completedDate}</span>
                            </div>
                          )}
                        </div>
                        {task.supervisorRemarks && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-md">
                            <p className="text-sm text-blue-800">
                              <strong>Supervisor Remarks:</strong> {task.supervisorRemarks}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          task.status === 'completed' ? 'bg-green-100 text-green-800' :
                          task.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {task.status.replace('-', ' ')}
                        </span>
                      </div>
                    </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeSection === 'reports' && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Reports & Submissions (Read-Only)</h3>
              <div className="space-y-4">
                {reports.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No reports submitted yet</p>
                  </div>
                ) : (
                  reports.map((report) => (
                    <div key={report.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{report.title}</h4>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <FileText className="w-4 h-4" />
                            <span>Type: {report.type}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>Submitted: {report.submittedDate}</span>
                          </div>
                          {report.grade && (
                            <div className="flex items-center space-x-1">
                              <Award className="w-4 h-4" />
                              <span>Grade: {report.grade}</span>
                            </div>
                          )}
                        </div>
                        {report.feedback && (
                          <div className="mt-3 p-3 bg-green-50 rounded-md">
                            <p className="text-sm text-green-800">
                              <strong>Feedback:</strong> {report.feedback}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          report.status === 'approved' ? 'bg-green-100 text-green-800' :
                          report.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                          report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {report.status}
                        </span>
                      </div>
                    </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeSection === 'attendance' && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance Summary (Read-Only)</h3>
              
              {/* Attendance Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-green-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">{attendanceData.presentDays}</div>
                  <div className="text-sm text-green-700">Present Days</div>
                </div>
                <div className="p-4 bg-red-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-red-600">{attendanceData.absentDays}</div>
                  <div className="text-sm text-red-700">Absent Days</div>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">{attendanceData.totalDays}</div>
                  <div className="text-sm text-blue-700">Total Days</div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600">{attendanceData.attendanceRate}%</div>
                  <div className="text-sm text-purple-700">Attendance Rate</div>
                </div>
              </div>

              {/* Weekly Attendance Grid */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Weekly Attendance</h4>
                {attendanceSummary.weeklyData.length > 0 ? attendanceSummary.weeklyData.map((week: any, index: number) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <span className="text-sm text-gray-600">Week {index + 1}</span>
                    <span className="text-sm font-medium text-gray-600">
                      No data available
                    </span>
                  </div>
                )) : (
                  <div className="text-center py-4 text-gray-500">
                    No attendance data available
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSection === 'analytics' && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Progress Analytics (Read-Only)</h3>
              
              {/* Progress Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-4 relative">
                    <div className="w-full h-full rounded-full border-8 border-blue-200">
                      <div 
                        className="absolute inset-0 rounded-full border-8 border-blue-600"
                        style={{
                          clipPath: `polygon(50% 50%, 50% 0%, ${50 + (calculateOverallProgress() / 100) * 50}% 0%, ${50 + (calculateOverallProgress() / 100) * 50}% 100%, 50% 100%)`
                        }}
                      ></div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold text-blue-600">{calculateOverallProgress()}%</span>
                    </div>
                  </div>
                  <h4 className="font-medium text-gray-900">Overall Progress</h4>
                </div>
                
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-4 relative">
                    <div className="w-full h-full rounded-full border-8 border-green-200">
                      <div 
                        className="absolute inset-0 rounded-full border-8 border-green-600"
                        style={{
                          clipPath: `polygon(50% 50%, 50% 0%, ${50 + (calculateProgress() / 100) * 50}% 0%, ${50 + (calculateProgress() / 100) * 50}% 100%, 50% 100%)`
                        }}
                      ></div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold text-green-600">{calculateProgress()}%</span>
                    </div>
                  </div>
                  <h4 className="font-medium text-gray-900">Task Completion</h4>
                </div>
              </div>

              {/* Performance Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Task Status Distribution</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Completed</span>
                      <span className="text-sm font-medium text-green-600">
                        {tasks.filter(t => t.status === 'completed').length} tasks
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">In Progress</span>
                      <span className="text-sm font-medium text-yellow-600">
                        {tasks.filter(t => t.status === 'in_progress').length} tasks
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Pending</span>
                      <span className="text-sm font-medium text-gray-600">
                        {tasks.filter(t => t.status === 'pending').length} tasks
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Report Status Distribution</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Approved</span>
                      <span className="text-sm font-medium text-green-600">
                        {reports.filter(r => r.status === 'approved').length} reports
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Submitted</span>
                      <span className="text-sm font-medium text-blue-600">
                        {reports.filter(r => r.status === 'submitted').length} reports
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Pending</span>
                      <span className="text-sm font-medium text-yellow-600">
                        {reports.filter(r => r.status === 'pending').length} reports
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UniversityAdviserProgressTracking;
