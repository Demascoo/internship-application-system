import React, { useEffect, useState } from "react";
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  Award,
  User,
  MessageSquare,
  FileText,
  Bell,
  Search,
  Target
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { accountManagementAPI } from "../../services/api";
import ProfileUpdate from "./ProfileUpdate";
import EnhancedAttendanceTracking from "./EnhancedAttendanceTracking";
import FinalResultEvaluation from "./FinalResultEvaluation";
import DynamicProgressTrackingPage from "./DynamicProgressTrackingPage";
import { CompanyAdviserMessagingPanel } from "../Common/CompanyAdviserMessagingPanel";
import toast from "react-hot-toast";

interface Student {
  _id: string;
  name: string;
  email: string;
  studentId?: string;
  profile?: {
    university?: string;
    graduationYear?: number;
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
    programId: string;
    status: string;
  } | null;
}

type TabType = "messages" | "attendance" | "progress" | "finalEvaluation";

const EnhancedCompanyAdviserDashboard: React.FC = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("messages");
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showProfileUpdate, setShowProfileUpdate] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Load assigned students
  const loadAssignedStudents = async () => {
    setLoading(true);
    try {
      console.log('🚨🚨🚨 ENHANCED COMPANY ADVISER DASHBOARD: Loading assigned students...');
      // Use the correct Company Adviser API endpoint
      const studentsResponse = await accountManagementAPI.getMyStudentsCompanyAdviser();
      console.log('Company Adviser assigned students response:', studentsResponse);
      setStudents(studentsResponse.data?.students || []);
      
      const studentCount = studentsResponse.data?.students?.length || 0;
      if (studentCount === 0) {
        console.log('⚠️ ENHANCED DASHBOARD: No students found for this Company Adviser');
        toast.error("No students assigned to you yet");
      } else {
        console.log(`✅ ENHANCED DASHBOARD: Found ${studentCount} assigned students`);
        toast.success(`Found ${studentCount} assigned student${studentCount > 1 ? 's' : ''}`);
      }
    } catch (e) {
      console.error('❌ ENHANCED DASHBOARD Error loading students:', e);
      toast.error("Failed to load assigned students");
    } finally {
      setLoading(false);
    }
  };

  // Load notifications
  const loadNotifications = async () => {
    try {
      const notificationsResponse = await accountManagementAPI.getNotifications();
      console.log('Company Adviser notifications response:', notificationsResponse);
      setNotifications(notificationsResponse.data?.notifications || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadAssignedStudents();
    loadNotifications();
  }, []);

  // Filter students based on search
  const filteredStudents = students.filter((student) => {
    const term = (searchTerm || "").toLowerCase();
    const name = (student?.name || "").toLowerCase();
    const email = (student?.email || "").toLowerCase();
    return name.includes(term) || email.includes(term);
  });

  // Handle student selection
  const handleStudentSelect = (student: any) => {
    console.log('🎯 Student selected:', student.name, student._id);
    setSelectedStudent(student);
  };

  // Get tab icon
  const getTabIcon = (tab: TabType) => {
    switch (tab) {
      case "messages": return <MessageSquare className="w-5 h-5" />;
      case "attendance": return <Calendar className="w-5 h-5" />;
      case "progress": return <TrendingUp className="w-5 h-5" />;
      case "finalEvaluation": return <FileText className="w-5 h-5" />;
    }
  };

  // Get tab label
  const getTabLabel = (tab: TabType) => {
    switch (tab) {
      case "messages": return "Messages";
      case "attendance": return "Attendance";
      case "progress": return "Progress";
      case "finalEvaluation": return "Final Evaluation";
    }
  };

  // Render active tab content
  const renderTabContent = () => {
    if (!selectedStudent) {
      return (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">Select a Student</h3>
            <p className="text-sm">Choose a student from the list to view their details</p>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case "messages":
        return (
          <CompanyAdviserMessagingPanel 
            students={students} 
            onStudentSelect={setSelectedStudent}
          />
        );
      case "attendance":
        return (
          <EnhancedAttendanceTracking 
            student={selectedStudent}
            onBack={() => setActiveTab("messages")}
          />
        );
      case "progress":
        return (
          <DynamicProgressTrackingPage 
            student={selectedStudent}
            onBack={() => setActiveTab("messages")}
          />
        );
      case "finalEvaluation":
        return (
          <FinalResultEvaluation 
            students={students}
          />
        );
      default:
        return null;
    }
  };

  if (showProfileUpdate) {
    return <ProfileUpdate onBack={() => setShowProfileUpdate(false)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-semibold text-gray-900">Company Adviser Dashboard</h1>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <User className="w-4 h-4" />
                <span>{user?.name}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Profile Update Button */}
              <button
                onClick={() => setShowProfileUpdate(true)}
                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <User className="w-4 h-4 inline mr-2" />
                Update Profile
              </button>
              
              {/* Notifications */}
              <div className="relative">
                <button className="p-2 text-gray-400 hover:text-gray-600 relative">
                  <Bell className="w-6 h-6" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {notifications.length}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex space-x-6">
          {/* Left Sidebar - Student List */}
          <div className="w-80 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm border">
              {/* Search */}
              <div className="p-4 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Student List */}
              <div className="max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    {searchTerm ? 'No students found' : 'No students assigned'}
                  </div>
                ) : (
                  filteredStudents.map((student) => (
                    <div
                      key={student._id}
                      onClick={() => handleStudentSelect(student)}
                      className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedStudent?._id === student._id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {student.name || "Unnamed"}
                          </h4>
                          <p className="text-xs text-gray-500 truncate">
                            {student.email}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            {student.profile?.course && (
                              <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                {student.profile.course}
                              </span>
                            )}
                            {student.groupAssignment?.programName && (
                              <span className="text-xs bg-blue-100 px-2 py-1 rounded text-blue-700">
                                {student.groupAssignment.programName}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="mt-6 bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Students</span>
                  <span className="text-sm font-medium text-gray-900">{students.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Active Students</span>
                  <span className="text-sm font-medium text-green-600">{students.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Pending Reviews</span>
                  <span className="text-sm font-medium text-orange-600">0</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            {selectedStudent ? (
              <div className="bg-white rounded-lg shadow-sm border">
                {/* Student Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                          {selectedStudent.name}
                        </h2>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>{selectedStudent.email}</span>
                          {selectedStudent.profile?.university && (
                            <span>• {selectedStudent.profile.university}</span>
                          )}
                          {selectedStudent.profile?.graduationYear && (
                            <span>• Class of {selectedStudent.profile.graduationYear}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {selectedStudent.profile?.course && (
                        <span className="bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-700">
                          {selectedStudent.profile.course}
                        </span>
                      )}
                      {selectedStudent.groupAssignment?.programName && (
                        <span className="bg-blue-100 px-3 py-1 rounded-full text-sm text-blue-700">
                          {selectedStudent.groupAssignment.programName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200">
                  <nav className="flex space-x-8 px-6">
                    {(["messages", "attendance", "progress", "finalEvaluation"] as TabType[]).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                          activeTab === tab
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {getTabIcon(tab)}
                        <span>{getTabLabel(tab)}</span>
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  {renderTabContent()}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border p-12">
                <div className="text-center">
                  <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome to Your Dashboard</h3>
                  <p className="text-gray-600 mb-6">
                    Select a student from the list to start managing their internship progress.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
                    <div className="bg-blue-50 rounded-lg p-4 text-center">
                      <MessageSquare className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <h4 className="font-medium text-blue-900">Communication</h4>
                      <p className="text-sm text-blue-700">Message with university advisers</p>
                    </div>
                    
                    <div className="bg-green-50 rounded-lg p-4 text-center">
                      <Calendar className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <h4 className="font-medium text-green-900">Attendance</h4>
                      <p className="text-sm text-green-700">Track student attendance</p>
                    </div>
                    
                    <div className="bg-purple-50 rounded-lg p-4 text-center">
                      <Target className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                      <h4 className="font-medium text-purple-900">Progress</h4>
                      <p className="text-sm text-purple-700">Monitor milestones & tasks</p>
                    </div>
                    
                    <div className="bg-orange-50 rounded-lg p-4 text-center">
                      <Award className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                      <h4 className="font-medium text-orange-900">Evaluation</h4>
                      <p className="text-sm text-orange-700">Submit final assessments</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedCompanyAdviserDashboard;
