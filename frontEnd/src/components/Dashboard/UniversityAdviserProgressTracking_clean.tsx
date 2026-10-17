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
