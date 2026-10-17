import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { 
  Users, 
  Search,
  Eye,
  FileText,
  CheckCircle,
  User,
  Building2,
  GraduationCap,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Award,
  AlertCircle
} from "lucide-react";
import { accountManagementAPI } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

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
}

interface DashboardStats {
  totalStudents: number;
  studentsWithCompanyAdviser: number;
  studentsWithoutCompanyAdviser: number;
  programDistribution: Record<string, number>;
  role: string;
}

const UniversityAdviserStudentsDashboard: React.FC = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showStudentModal, setShowStudentModal] = useState(false);

  useEffect(() => {
    loadStudentsAndStats();
  }, []);

  const loadStudentsAndStats = async () => {
    setLoading(true);
    try {
      console.log("Loading students and stats for University Adviser...");
      
      // Load both students and stats in parallel
      const [studentsResponse, statsResponse] = await Promise.all([
        accountManagementAPI.getMyStudentsUniversityAdviser(),
        accountManagementAPI.getAdviserDashboardStats()
      ]);

      console.log("Students response:", studentsResponse.data);
      console.log("Stats response:", statsResponse.data);

      if (studentsResponse.data?.success) {
        setStudents(studentsResponse.data.data.students || []);
      } else {
        toast.error("Failed to load students");
      }

      if (statsResponse.data?.success) {
        setStats(statsResponse.data.data);
      } else {
        toast.error("Failed to load dashboard statistics");
      }

    } catch (error: any) {
      console.error("Error loading dashboard data:", error);
      toast.error("Failed to load dashboard data: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.program?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.university?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openStudentModal = (student: Student) => {
    setSelectedStudent(student);
    setShowStudentModal(true);
  };

  const closeStudentModal = () => {
    setSelectedStudent(null);
    setShowStudentModal(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your assigned students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Assigned Students</h1>
          <p className="text-gray-600">
            Welcome back, {user?.name}! Here are the students assigned to you as their University Adviser.
          </p>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                  <Users className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Students</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 text-green-600">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">With Company Adviser</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.studentsWithCompanyAdviser}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-orange-100 text-orange-600">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Need Company Adviser</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.studentsWithoutCompanyAdviser}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                  <Award className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Programs</p>
                  <p className="text-2xl font-bold text-gray-900">{Object.keys(stats.programDistribution).length}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search students by name, email, program, or university..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Students List */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Students ({filteredStudents.length})
            </h2>
          </div>

          {filteredStudents.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {searchTerm ? "No students found" : "No students assigned"}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm 
                  ? "Try adjusting your search criteria."
                  : "Students will appear here when they are assigned to you by the Admin."
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredStudents.map((student) => (
                <div key={student._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {student.name}
                          </p>
                          {student.hasCompanyAdviser && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Has Company Adviser
                            </span>
                          )}
                          {!student.hasCompanyAdviser && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              Needs Company Adviser
                            </span>
                          )}
                        </div>
                        
                        <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 mr-1" />
                            {student.email}
                          </div>
                          {student.program?.name && (
                            <div className="flex items-center">
                              <Award className="h-4 w-4 mr-1" />
                              {student.program.name}
                            </div>
                          )}
                          {student.university && (
                            <div className="flex items-center">
                              <Building2 className="h-4 w-4 mr-1" />
                              {student.university}
                            </div>
                          )}
                        </div>

                        {student.companyAdviser && (
                          <div className="mt-2 text-sm text-gray-600">
                            <span className="font-medium">Company Adviser:</span> {student.companyAdviser.name}
                            {student.companyAdviser.company && (
                              <span className="text-gray-500"> at {student.companyAdviser.company}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openStudentModal(student)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Student Details Modal */}
        {showStudentModal && selectedStudent && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Student Details</h3>
                <button
                  onClick={closeStudentModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900">{selectedStudent.name}</h4>
                    <p className="text-gray-600">{selectedStudent.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedStudent.university && (
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">University</p>
                        <p className="text-sm text-gray-600">{selectedStudent.university}</p>
                      </div>
                    </div>
                  )}

                  {selectedStudent.course && (
                    <div className="flex items-center space-x-2">
                      <GraduationCap className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Course</p>
                        <p className="text-sm text-gray-600">{selectedStudent.course}</p>
                      </div>
                    </div>
                  )}

                  {selectedStudent.graduationYear && (
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Graduation Year</p>
                        <p className="text-sm text-gray-600">{selectedStudent.graduationYear}</p>
                      </div>
                    </div>
                  )}

                  {selectedStudent.program?.name && (
                    <div className="flex items-center space-x-2">
                      <Award className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Program</p>
                        <p className="text-sm text-gray-600">{selectedStudent.program.name}</p>
                      </div>
                    </div>
                  )}
                </div>

                {selectedStudent.companyAdviser && (
                  <div className="border-t pt-4">
                    <h5 className="text-sm font-medium text-gray-900 mb-2">Company Adviser</h5>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="font-medium text-gray-900">{selectedStudent.companyAdviser.name}</p>
                      <p className="text-sm text-gray-600">{selectedStudent.companyAdviser.email}</p>
                      {selectedStudent.companyAdviser.company && (
                        <p className="text-sm text-gray-600">{selectedStudent.companyAdviser.company}</p>
                      )}
                    </div>
                  </div>
                )}

                {!selectedStudent.hasCompanyAdviser && (
                  <div className="border-t pt-4">
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                      <div className="flex items-center">
                        <AlertCircle className="h-5 w-5 text-orange-600 mr-2" />
                        <p className="text-sm font-medium text-orange-800">
                          This student needs a Company Adviser assignment
                        </p>
                      </div>
                      <p className="text-sm text-orange-700 mt-1">
                        Contact the Admin to assign a Company Adviser for this student.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={closeStudentModal}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UniversityAdviserStudentsDashboard;
