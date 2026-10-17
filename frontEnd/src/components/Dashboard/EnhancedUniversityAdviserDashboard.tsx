import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { 
  MessageSquare, 
  Calendar, 
  Target, 
  Award, 
  Users, 
  Search,
  Bell,
  Eye,
  FileText,
  TrendingUp,
  CheckCircle,
  User,
  Download,
  Star
} from "lucide-react";
import { advisersAPI, accountManagementAPI } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import AdviserMessagingPanel from "../Common/AdviserMessagingPanel";
import ProfileUpdate from "./ProfileUpdate";
import UniversityAdviserProgressTracking from "./UniversityAdviserProgressTracking";
import { useNavigate } from "react-router-dom";

interface Student {
  _id: string;
  name: string;
  email: string;
  university?: string;
  course?: string;
  graduationYear?: number;
  program?: {
    id?: string;
    name?: string;
  };
  companyAdviser?: {
    id: string;
    name: string;
    email: string;
    company?: string;
  } | null;
  hasCompanyAdviser: boolean;
  acceptedApplication?: {
    _id: string;
    preferredStartDate: string;
    preferredEndDate: string;
    desiredDuration: number;
    programId: string;
    status: string;
  } | null;
}

interface AttendanceRecord {
  _id: string;
  date: string;
  status: "present" | "absent" | "late" | "excused";
  notes?: string;
  createdAt: string;
  internshipStartDate?: string;
  internshipEndDate?: string;
}

interface ProgressReport {
  _id: string;
  periodStart: string;
  periodEnd: string;
  summary: string;
  milestones: Array<{
    title: string;
    description: string;
    completed: boolean;
    date?: Date;
  }>;
  softSkills: {
    teamwork: number;
    punctuality: number;
    communication: number;
    initiative: number;
  };
  createdAt: string;
}


type TabType = "messages" | "attendance" | "progress";

const EnhancedUniversityAdviserDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("messages");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showProfileUpdate, setShowProfileUpdate] = useState(false);
  
  // Data for selected student
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [progressReports, setProgressReports] = useState<ProgressReport[]>([]);

  // Load assigned students
  const loadAssignedStudents = async () => {
    setLoading(true);
    try {
      console.log('Loading assigned students for University Adviser...');
      console.log('User ID:', user?.id);
      
      const res = await accountManagementAPI.getAssignedStudentsForUniversityAdviser(user?.id);
      console.log('University Adviser students API response:', res);
      
      const studentsList = res.data?.students || [];
      console.log('University Adviser assigned students:', studentsList);
      setStudents(studentsList);
      
      if (studentsList.length === 0) {
        console.log('No students assigned to this University Adviser');
      } else {
        console.log(`Successfully loaded ${studentsList.length} assigned students for University Adviser`);
      }
    } catch (e: any) {
      console.error('Error loading assigned students for University Adviser:', e);
      toast.error("Failed to load assigned students");
    } finally {
      setLoading(false);
    }
  };

  // Load notifications
  const loadNotifications = async () => {
    try {
      const res = await advisersAPI.getNotifications();
      setNotifications(res.data?.notifications || res.notifications || []);
    } catch (e) {
      console.error(e);
    }
  };

  // Load student data
  const loadStudentData = async (studentId: string) => {
    try {
      // Load attendance records
      const attendanceRes = await advisersAPI.listAttendance(studentId);
      setAttendanceRecords(attendanceRes.data?.attendance || attendanceRes.attendance || []);
      
      // Load progress reports
      const progressRes = await advisersAPI.listProgress(studentId);
      setProgressReports(progressRes.data?.reports || progressRes.reports || progressRes.data?.progress || progressRes.progress || []);
      
    } catch (e) {
      console.error(e);
      toast.error("Failed to load student data");
    }
  };

  useEffect(() => {
    loadAssignedStudents();
    loadNotifications();
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      loadStudentData(selectedStudent._id);
    }
  }, [selectedStudent]);

  // Filter students based on search
  const filteredStudents = students.filter((student) => {
    const term = (searchTerm || "").toLowerCase();
    const name = (student?.name || "").toLowerCase();
    const email = (student?.email || "").toLowerCase();
    return name.includes(term) || email.includes(term);
  });

  // Handle student selection
  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student);
    setActiveTab("messages");
  };

  // Get tab icon
  const getTabIcon = (tab: TabType) => {
    switch (tab) {
      case "messages": return <MessageSquare className="w-5 h-5" />;
      case "attendance": return <Calendar className="w-5 h-5" />;
      case "progress": return <TrendingUp className="w-5 h-5" />;
    }
  };

  // Get tab label
  const getTabLabel = (tab: TabType) => {
    switch (tab) {
      case "messages": return "Messages";
      case "attendance": return "Attendance";
      case "progress": return "Progress Tracking";
    }
  };

  // Calculate attendance stats based on Company Adviser data
  const getAttendanceStats = () => {
    // Get internship dates from the most recent attendance record
    const latestRecord = attendanceRecords.find(r => r.internshipStartDate && r.internshipEndDate);
    let totalInternshipDays = 0;
    
    if (latestRecord?.internshipStartDate && latestRecord?.internshipEndDate) {
      const start = new Date(latestRecord.internshipStartDate);
      const end = new Date(latestRecord.internshipEndDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      totalInternshipDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }
    
    const presentDays = attendanceRecords.filter(r => r.status === "present").length;
    const absentDays = attendanceRecords.filter(r => r.status === "absent").length;
    const totalRecorded = presentDays + absentDays;
    
    return {
      presentDays,
      absentDays,
      totalRecorded,
      totalInternshipDays,
      attendanceRate: totalInternshipDays > 0 ? Math.round((presentDays / totalInternshipDays) * 100) : 0
    };
  };

  // Calculate progress percentage
  const getProgressPercentage = (milestones: any[]) => {
    if (milestones.length === 0) return 0;
    const completed = milestones.filter(m => m.completed).length;
    return Math.round((completed / milestones.length) * 100);
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "present": return "bg-green-100 text-green-800";
      case "absent": return "bg-red-100 text-red-800";
      case "late": return "bg-yellow-100 text-yellow-800";
      case "excused": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Render attendance tab
  const renderAttendanceTab = () => {
    return (
      <div className="space-y-6">
        {/* Attendance Overview - Synced with Company Adviser */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Present Days</p>
                <p className="text-2xl font-bold text-green-800">{getAttendanceStats().presentDays}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 font-medium">Absent Days</p>
                <p className="text-2xl font-bold text-red-800">{getAttendanceStats().absentDays}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-red-600" />
            </div>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Days</p>
                <p className="text-2xl font-bold text-blue-800">{getAttendanceStats().totalInternshipDays}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Attendance Rate</p>
                <p className="text-2xl font-bold text-purple-800">{getAttendanceStats().attendanceRate}%</p>
              </div>
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">{getAttendanceStats().attendanceRate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Attendance Records */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Attendance Records</h3>
          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recorded
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {attendanceRecords.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                        No attendance records found
                      </td>
                    </tr>
                  ) : (
                    attendanceRecords
                      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                      .map((record) => (
                        <tr key={record._id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(record.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}>
                              {record.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {record.notes || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(record.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
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
          <AdviserMessagingPanel 
            students={[selectedStudent]} 
            onStudentSelect={handleStudentSelect}
          />
        );
      case "attendance":
        return renderAttendanceTab();
      case "progress":
        return (
          <UniversityAdviserProgressTracking 
            student={selectedStudent}
            onBack={() => setActiveTab("messages")}
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
              <h1 className="text-2xl font-semibold text-gray-900">University Adviser Dashboard</h1>
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
                    {(["messages", "attendance", "progress"] as TabType[]).map((tab) => (
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
                    Select a student from the list to view their internship progress and communicate with company advisers.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
                    <div className="bg-blue-50 rounded-lg p-4 text-center">
                      <MessageSquare className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <h4 className="font-medium text-blue-900">Communication</h4>
                      <p className="text-sm text-blue-700">Message with company advisers</p>
                    </div>
                    
                    <div className="bg-green-50 rounded-lg p-4 text-center">
                      <Eye className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <h4 className="font-medium text-green-900">Monitor Attendance</h4>
                      <p className="text-sm text-green-700">View student attendance records</p>
                    </div>
                    
                    <div className="bg-purple-50 rounded-lg p-4 text-center">
                      <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                      <h4 className="font-medium text-purple-900">Progress Tracking</h4>
                      <p className="text-sm text-purple-700">Monitor student internship progress</p>
                    </div>
                    
                    <div className="bg-orange-50 rounded-lg p-4 text-center">
                      <Award className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                      <h4 className="font-medium text-orange-900">View Evaluations</h4>
                      <p className="text-sm text-orange-700">Access student evaluations and reports</p>
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

export default EnhancedUniversityAdviserDashboard;
