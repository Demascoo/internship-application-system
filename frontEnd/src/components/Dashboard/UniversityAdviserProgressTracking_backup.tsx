import React, { useState, useEffect } from 'react';
import { 
  User, BookOpen, Building2, Calendar, CheckCircle, Target, FileText, 
  Award, BarChart3
} from 'lucide-react';
import { toast } from 'react-hot-toast';
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
  };
  groupAssignment?: {
    programName?: string;
  };
  acceptedApplication?: {
    programId?: string | { name: string };
    preferredStartDate?: string;
    preferredEndDate?: string;
  };
}

interface ProgressData {
  internshipDetails?: {
    company?: string;
    position?: string;
    supervisor?: string;
    startDate?: string;
    endDate?: string;
  };
  tasks?: Array<{
    id: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    assignedDate: string;
    dueDate: string;
    supervisorRemarks?: string;
  }>;
  reports?: Array<{
    id: string;
    title: string;
    description: string;
    status: string;
    submittedDate: string;
    grade?: string;
    supervisorFeedback?: string;
  }>;
  evaluations?: {
    midterm?: {
      evaluatedBy: string;
      evaluationDate?: string;
      scores?: {
        technicalSkills: number;
        communication: number;
        teamwork: number;
        problemSolving: number;
        initiative: number;
        overall: number;
      };
      supervisorComments?: string;
    };
    final?: {
      evaluatedBy: string;
      evaluationDate?: string;
      status: string;
    };
  };
  attendanceData?: {
    percentage: number;
  };
}

const tabs = [
  { id: 'overview', label: 'Overview', icon: User },
  { id: 'timeline', label: 'Timeline', icon: Calendar },
  { id: 'attendance', label: 'Attendance', icon: CheckCircle },
  { id: 'tasks', label: 'Tasks', icon: Target },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'evaluation', label: 'Evaluation', icon: Award },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 }
];

const UniversityAdviserProgressTracking: React.FC = () => {
  const [activeSection, setActiveSection] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  
  // Mock student data - in real implementation, this would come from props or context
  const student: Student = {
    _id: 'student123',
    name: 'John Doe',
    email: 'john.doe@university.edu',
    profile: {
      university: 'University of Technology',
      course: 'Computer Science',
      phone: '+1234567890',
      address: '123 University Ave, Tech City',
    },
    groupAssignment: {
      programName: 'Software Engineering Internship'
    },
    acceptedApplication: {
      programId: 'Software Engineering Internship',
      preferredStartDate: '2024-01-15',
      preferredEndDate: '2024-06-15'
    }
  };

  useEffect(() => {
    fetchProgressData();
  }, []);

  const fetchProgressData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch progress data from the Company Adviser's submissions
      const response = await progressAPI.getCompanyAdviserProgressData(student._id);
      
      if (response.success) {
        setProgressData(response.data);
      } else {
        setError('Failed to load progress data');
        toast.error('Failed to load progress data');
      }
    } catch (err) {
      console.error('Error fetching progress data:', err);
      setError('Error loading progress data');
      toast.error('Error loading progress data');
    } finally {
      setLoading(false);
    }
  };

  const calculateOverallProgress = () => {
    if (!progressData) return 0;
    
    let totalProgress = 0;
    let sections = 0;
    
    // Calculate task completion percentage
    if (progressData.tasks && progressData.tasks.length > 0) {
      const completedTasks = progressData.tasks.filter(task => task.status === 'completed').length;
      totalProgress += (completedTasks / progressData.tasks.length) * 100;
      sections++;
    }
    
    // Add attendance percentage
    if (progressData.attendanceData) {
      totalProgress += progressData.attendanceData.percentage;
      sections++;
    }
    
    // Add report completion (assuming submitted reports are completed)
    if (progressData.reports && progressData.reports.length > 0) {
      totalProgress += 100; // If reports exist, assume they're submitted
      sections++;
    }
    
    return sections > 0 ? Math.round(totalProgress / sections) : 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading progress data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-xl">!</span>
          </div>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Progress Tracking (Read-Only)</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Student Information Card - Read-Only */}
        <div className="bg-white rounded-lg shadow-sm border mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Student Information</h2>
            
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
                    <span className="text-sm text-gray-600">Company: {progressData?.internshipDetails?.company || 'Not specified'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm border mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => (
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
          {activeSection === 'overview' && (
            <div className="space-y-6">
              {/* Progress Overview Cards */}
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
                        {progressData?.tasks?.filter((t: any) => t.status === 'completed').length || 0}/{progressData?.tasks?.length || 0}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-yellow-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Attendance Rate</p>
                      <p className="text-2xl font-semibold text-gray-900">{progressData?.attendanceData?.percentage || 0}%</p>
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
                      <p className="text-2xl font-semibold text-gray-900">{progressData?.reports?.length || 0}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Internship Details */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Internship Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Company</p>
                    <p className="font-medium">{progressData?.internshipDetails?.company || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Position</p>
                    <p className="font-medium">{progressData?.internshipDetails?.position || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Supervisor</p>
                    <p className="font-medium">{progressData?.internshipDetails?.supervisor || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Duration</p>
                    <p className="font-medium">{progressData?.internshipDetails?.startDate || 'Not specified'} - {progressData?.internshipDetails?.endDate || 'Not specified'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'tasks' && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tasks & Deliverables</h3>
              <p className="text-gray-600">Tasks content will be displayed here.</p>
            </div>
          )}

          {activeSection === 'reports' && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Reports & Submissions</h3>
              <p className="text-gray-600">Reports content will be displayed here.</p>
            </div>
          )}

          {activeSection === 'evaluation' && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Evaluations</h3>
              <p className="text-gray-600">Evaluation content will be displayed here.</p>
            </div>
          )}

          {activeSection === 'analytics' && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress Analytics</h3>
              <p className="text-gray-600">Analytics content will be displayed here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UniversityAdviserProgressTracking;
                        <td colSpan={6} className="px-6 py-4 text-center text-gray-500">No attendance data available</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {!loading && activeTab === 'tasks' && (
          <div className="space-y-6">
            {/* Task Overview - Dynamic Data */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium">Completed</p>
                    <p className="text-2xl font-bold text-green-800">
                      {dynamicData?.tasks?.filter((t: any) => t.status === 'completed').length || 0}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">In Progress</p>
                    <p className="text-2xl font-bold text-blue-800">
                      {dynamicData?.tasks?.filter((t: any) => t.status === 'in_progress').length || 0}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-yellow-600 font-medium">Pending</p>
                    <p className="text-2xl font-bold text-yellow-800">
                      {dynamicData?.tasks?.filter((t: any) => t.status === 'pending').length || 0}
                    </p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-yellow-600" />
                </div>
              </div>
            </div>

            {/* Task List - Dynamic Data */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Task List (Read-Only)</h3>
              <div className="space-y-4">
                {dynamicData?.tasks?.map((task: any) => (
                  <div key={task.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-900">{task.title}</h4>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          task.priority === 'high' ? 'bg-red-100 text-red-800' :
                          task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {task.priority}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          task.status === 'completed' ? 'bg-green-100 text-green-800' :
                          task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {task.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-4">
                        <span>Assigned: {new Date(task.assignedDate).toLocaleDateString()}</span>
                        <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                      </div>
                      {task.completedDate && (
                        <span>Completed: {new Date(task.completedDate).toLocaleDateString()}</span>
                      )}
                    </div>
                    {task.supervisorRemarks && (
                      <div className="mt-3 p-3 bg-gray-50 rounded">
                        <p className="text-xs text-gray-600"><strong>Supervisor Remarks:</strong> {task.supervisorRemarks}</p>
                      </div>
                    )}
                  </div>
                )) || (
                  <p className="text-gray-500 text-center py-8">No tasks data available</p>
                )}
              </div>
            </div>
          </div>
        )}

        {!loading && activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Reports (Read-Only)</h3>
              <div className="space-y-4">
                {dynamicData?.reports?.map((report: any) => (
                  <div key={report.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{report.title}</h4>
                        <p className="text-xs text-gray-500">Submitted: {new Date(report.submittedDate).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          report.status === 'approved' ? 'bg-green-100 text-green-800' :
                          report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          report.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {report.status.replace('_', ' ')}
                        </span>
                        {report.grade && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            Grade: {report.grade}
                          </span>
                        )}
                        <button className="p-1 text-gray-400 hover:text-gray-600" title="View Report">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-gray-600" title="Download Report">
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{report.description}</p>
                    {report.supervisorFeedback && (
                      <div className="mt-3 p-3 bg-gray-50 rounded">
                        <p className="text-xs text-gray-600"><strong>Supervisor Feedback:</strong> {report.supervisorFeedback}</p>
                      </div>
                    )}
                  </div>
                )) || (
                  <p className="text-gray-500 text-center py-8">No reports data available</p>
                )}
              </div>
            </div>
          </div>
        )}

        {!loading && activeTab === 'evaluation' && (
          <div className="space-y-6">
            {/* Midterm Evaluation - Dynamic Data */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Award className="w-5 h-5 mr-2" />
                Midterm Evaluation (Read-Only)
              </h3>
              {dynamicData?.evaluations?.midterm?.status === 'completed' ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(dynamicData.evaluations.midterm.scores || {}).map(([skill, score]) => (
                      <div key={skill} className="text-center">
                        <p className="text-sm text-gray-600 capitalize">{skill.replace(/([A-Z])/g, ' $1')}</p>
                        <p className="text-lg font-bold text-blue-600">{score}/5.0</p>
                      </div>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Strengths</h4>
                      <ul className="space-y-1">
                        {(dynamicData.evaluations.midterm.strengths || []).map((strength: string, index: number) => (
                          <li key={index} className="text-sm text-gray-600 flex items-start">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Areas for Improvement</h4>
                      <ul className="space-y-1">
                        {(dynamicData.evaluations.midterm.improvements || []).map((improvement: string, index: number) => (
                          <li key={index} className="text-sm text-gray-600 flex items-start">
                            <AlertCircle className="w-4 h-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                            {improvement}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Supervisor Comments</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{dynamicData.evaluations.midterm.supervisorComments || 'No comments available'}</p>
                  </div>
                  
                  {/* University Adviser Actions */}
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-3">University Adviser Actions</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Adviser Remarks</label>
                        {editingRemarks === 'midterm' ? (
                          <div className="space-y-2">
                            <textarea
                              value={remarksText}
                              onChange={(e) => setRemarksText(e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              rows={3}
                              placeholder="Add your remarks..."
                            />
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleSaveRemarks('midterm')}
                                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                              >
                                <Save className="w-4 h-4 inline mr-1" />
                                Save
                              </button>
                              <button
                                onClick={() => setEditingRemarks(null)}
                                className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded flex-1">
                              {dynamicData?.evaluations?.midterm?.adviserRemarks || 'No remarks added yet'}
                            </p>
                            <button
                              onClick={() => {
                                setEditingRemarks('midterm');
                                setRemarksText(dynamicData?.evaluations?.midterm?.adviserRemarks || '');
                              }}
                              className="p-2 text-gray-400 hover:text-gray-600"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleApproveEvaluation('midterm')}
                          className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center"
                        >
                          <ThumbsUp className="w-4 h-4 mr-1" />
                          Approve Evaluation
                        </button>
                        <button
                          onClick={() => handleRejectEvaluation('midterm')}
                          className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 flex items-center"
                        >
                          <ThumbsDown className="w-4 h-4 mr-1" />
                          Request Revision
                        </button>
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center">
                          <MessageSquare className="w-4 h-4 mr-1" />
                          Message Supervisor
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Midterm evaluation not yet completed by supervisor</p>
                </div>
              )}
            </div>

            {/* Final Evaluation - Dynamic Data */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Award className="w-5 h-5 mr-2" />
                Final Evaluation (Read-Only)
              </h3>
              {dynamicData?.evaluations?.final?.status === 'completed' ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(dynamicData.evaluations.final.scores || {}).map(([skill, score]) => (
                      <div key={skill} className="text-center">
                        <p className="text-sm text-gray-600 capitalize">{skill.replace(/([A-Z])/g, ' $1')}</p>
                        <p className="text-lg font-bold text-green-600">{score}/5.0</p>
                      </div>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Strengths</h4>
                      <ul className="space-y-1">
                        {(dynamicData.evaluations.final.strengths || []).map((strength: string, index: number) => (
                          <li key={index} className="text-sm text-gray-600 flex items-start">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Areas for Improvement</h4>
                      <ul className="space-y-1">
                        {(dynamicData.evaluations.final.improvements || []).map((improvement: string, index: number) => (
                          <li key={index} className="text-sm text-gray-600 flex items-start">
                            <AlertCircle className="w-4 h-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                            {improvement}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Supervisor Comments</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{dynamicData.evaluations.final.supervisorComments || 'No comments available'}</p>
                  </div>
                  
                  {/* University Adviser Actions for Final */}
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-3">University Adviser Actions</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Adviser Remarks</label>
                        {editingRemarks === 'final' ? (
                          <div className="space-y-2">
                            <textarea
                              value={remarksText}
                              onChange={(e) => setRemarksText(e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              rows={3}
                              placeholder="Add your remarks..."
                            />
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleSaveRemarks('final')}
                                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                              >
                                <Save className="w-4 h-4 inline mr-1" />
                                Save
                              </button>
                              <button
                                onClick={() => setEditingRemarks(null)}
                                className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded flex-1">
                              {dynamicData?.evaluations?.final?.adviserRemarks || 'No remarks added yet'}
                            </p>
                            <button
                              onClick={() => {
                                setEditingRemarks('final');
                                setRemarksText(dynamicData?.evaluations?.final?.adviserRemarks || '');
                              }}
                              className="p-2 text-gray-400 hover:text-gray-600"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleApproveEvaluation('final')}
                          className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center"
                        >
                          <ThumbsUp className="w-4 h-4 mr-1" />
                          Approve Final Evaluation
                        </button>
                        <button
                          onClick={() => handleRejectEvaluation('final')}
                          className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 flex items-center"
                        >
                          <ThumbsDown className="w-4 h-4 mr-1" />
                          Request Revision
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Final evaluation not yet completed by supervisor</p>
                </div>
              )}
            </div>

          </div>
        )}

        {!loading && activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Progress Overview - Dynamic Data */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Progress (Read-Only)</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Internship Progress</span>
                      <span>{calculateOverallProgress()}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${calculateOverallProgress()}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Task Completion</span>
                      <span>{dynamicData?.tasks ? Math.round(((dynamicData.tasks.filter((t: any) => t.status === 'completed').length) / dynamicData.tasks.length) * 100) : 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: `${dynamicData?.tasks ? Math.round(((dynamicData.tasks.filter((t: any) => t.status === 'completed').length) / dynamicData.tasks.length) * 100) : 0}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Attendance Rate</span>
                      <span>{dynamicData?.attendanceData?.percentage || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${dynamicData?.attendanceData?.percentage || 0}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Completion Chart (Read-Only)</h3>
                <div className="flex items-center justify-center h-48">
                  <div className="text-center">
                    <PieChart className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-sm text-gray-500">Dynamic task completion visualization</p>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                          <span>Completed</span>
                        </div>
                        <span>{dynamicData?.tasks?.filter((t: any) => t.status === 'completed').length || 0}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                          <span>In Progress</span>
                        </div>
                        <span>{dynamicData?.tasks?.filter((t: any) => t.status === 'in_progress').length || 0}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                          <span>Pending</span>
                        </div>
                        <span>{dynamicData?.tasks?.filter((t: any) => t.status === 'pending').length || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Attendance Trends - Dynamic Data */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance Trends (Read-Only)</h3>
              <div className="space-y-4">
                {dynamicData?.attendanceData?.monthlyBreakdown?.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {dynamicData.attendanceData.monthlyBreakdown.map((month: any) => (
                      <div key={month.month} className="text-center p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-900 text-sm">{month.month}</h4>
                        <div className="mt-2 space-y-1">
                          <div className="text-xs text-green-600">Present: {month.present}</div>
                          <div className="text-xs text-red-600">Absent: {month.absent}</div>
                          <div className="text-xs text-yellow-600">Late: {month.late}</div>
                          <div className="text-xs font-medium text-gray-900">
                            Rate: {Math.round((month.present / month.total) * 100)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-sm text-gray-500">No attendance trend data available</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Performance Metrics - Dynamic Data */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100">Performance Score</p>
                    <p className="text-3xl font-bold">
                      {dynamicData?.evaluations?.midterm?.scores?.overall || dynamicData?.evaluations?.final?.scores?.overall || 'N/A'}/5.0
                    </p>
                  </div>
                  <Star className="w-8 h-8 text-blue-200" />
                </div>
              </div>
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100">Days Remaining</p>
                    <p className="text-3xl font-bold">45</p>
                  </div>
                  <Calendar className="w-8 h-8 text-green-200" />
                </div>
              </div>
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100">Reports Submitted</p>
                    <p className="text-3xl font-bold">{dynamicData?.reports?.length || 0}</p>
                  </div>
                  <FileText className="w-8 h-8 text-purple-200" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UniversityAdviserProgressTracking;
