import React, { useEffect, useState } from "react";
import { accountManagementAPI } from "../../services/api";
import { 
  ChevronDown, 
  ChevronRight, 
  Users, 
  Building, 
  GraduationCap, 
  CheckCircle,
  AlertCircle,
  User,
  Briefcase
} from "lucide-react";
import toast from "react-hot-toast";

type Props = { onBack: () => void };

interface Student {
  _id: string;
  name: string;
  email: string;
  university: string;
  course: string;
  graduationYear: number;
  hasCompanyAdviser: boolean;
  programId: string;
}

interface ProgramGroup {
  programId: string | null;
  programName: string;
  students: Student[];
}

interface CompanyAdviser {
  _id: string;
  name: string;
  email: string;
  company: string;
  programId: string;
  programName: string;
}

const AdviserAssignment: React.FC<Props> = ({ onBack }) => {
  const [programGroups, setProgramGroups] = useState<ProgramGroup[]>([]);
  const [expandedPrograms, setExpandedPrograms] = useState<Set<string>>(new Set());
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [companyAdvisers, setCompanyAdvisers] = useState<CompanyAdviser[]>([]);
  const [selectedCompanyAdviserId, setSelectedCompanyAdviserId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [assignmentLoading, setAssignmentLoading] = useState(false);

  // Load students grouped by program
  const loadStudentsGroupedByProgram = async () => {
    setLoading(true);
    try {
      console.log('Loading students grouped by program...');
      const res = await accountManagementAPI.getStudentsGroupedByProgram();
      console.log('Students grouped by program response:', res);
      
      const groups = res.data?.programGroups || [];
      setProgramGroups(groups);
      
      // Auto-expand programs that have students
      const programsWithStudents = new Set(
        groups.filter(group => group.students.length > 0).map(group => group.programId || 'unassigned')
      );
      setExpandedPrograms(programsWithStudents);
      
      console.log(`Loaded ${groups.length} program groups`);
    } catch (error: any) {
      console.error('Error loading students grouped by program:', error);
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  // Load company advisers for selected student's program
  const loadCompanyAdvisersForProgram = async (programId: string) => {
    try {
      console.log('Loading company advisers for program:', programId);
      const res = await accountManagementAPI.getCompanyAdvisersByProgram(programId);
      console.log('Company advisers response:', res);
      
      const advisers = res.data?.companyAdvisers || [];
      setCompanyAdvisers(advisers);
      console.log(`Loaded ${advisers.length} company advisers for program`);
    } catch (error: any) {
      console.error('Error loading company advisers:', error);
      toast.error("Failed to load company advisers");
      setCompanyAdvisers([]);
    }
  };

  // Handle student selection
  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student);
    setSelectedCompanyAdviserId("");
    setCompanyAdvisers([]);
    
    if (student.programId) {
      loadCompanyAdvisersForProgram(student.programId);
    }
  };

  // Handle assignment save
  const handleSaveAssignment = async () => {
    if (!selectedStudent || !selectedCompanyAdviserId) {
      toast.error("Please select both a student and company adviser");
      return;
    }

    setAssignmentLoading(true);
    try {
      console.log('Assigning company adviser to student:', {
        studentId: selectedStudent._id,
        companyAdviserId: selectedCompanyAdviserId
      });

      const res = await accountManagementAPI.assignCompanyAdviserToStudent({
        studentId: selectedStudent._id,
        companyAdviserId: selectedCompanyAdviserId
      });

      console.log('Assignment response:', res);
      toast.success(res.data?.message || "Assignment saved successfully!");
      
      // Refresh the students data to reflect the assignment
      await loadStudentsGroupedByProgram();
      
      // Clear selection
      setSelectedStudent(null);
      setSelectedCompanyAdviserId("");
      setCompanyAdvisers([]);
      
    } catch (error: any) {
      console.error('Error saving assignment:', error);
      toast.error(error.response?.data?.message || "Failed to save assignment");
    } finally {
      setAssignmentLoading(false);
    }
  };

  // Toggle program expansion
  const toggleProgram = (programId: string) => {
    const newExpanded = new Set(expandedPrograms);
    if (newExpanded.has(programId)) {
      newExpanded.delete(programId);
    } else {
      newExpanded.add(programId);
    }
    setExpandedPrograms(newExpanded);
  };

  useEffect(() => {
    loadStudentsGroupedByProgram();
  }, []);

  return (
    <div className="admin-dashboard">
      <div className="container">
        <div className="dashboard-header">
          <div className="header-content">
            <h1 className="dashboard-title">Assign Company Advisers to Students</h1>
            <p className="dashboard-subtitle">
              University Advisers are automatically assigned. Select students by program to assign Company Advisers.
            </p>
          </div>
          <button onClick={onBack} className="btn btn-outline">Back</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Students by Program - Accordion */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Students by Program
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Click on a program to expand and select students
                </p>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="p-6 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading students...</p>
                  </div>
                ) : programGroups.length === 0 ? (
                  <div className="p-6 text-center">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">No students found</p>
                  </div>
                ) : (
                  programGroups.map((group) => {
                    const programKey = group.programId || 'unassigned';
                    const isExpanded = expandedPrograms.has(programKey);
                    
                    return (
                      <div key={programKey} className="border-b border-gray-100 last:border-b-0">
                        {/* Program Header */}
                        <button
                          onClick={() => toggleProgram(programKey)}
                          className="w-full p-4 text-left hover:bg-gray-50 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-gray-500" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-500" />
                            )}
                            <GraduationCap className="w-5 h-5 text-purple-600" />
                            <div>
                              <h4 className="font-medium text-gray-900">{group.programName}</h4>
                              <p className="text-sm text-gray-500">{group.students.length} students</p>
                            </div>
                          </div>
                        </button>

                        {/* Students List */}
                        {isExpanded && (
                          <div className="bg-gray-50 border-t border-gray-100">
                            {group.students.length === 0 ? (
                              <div className="p-4 text-center text-gray-500">
                                No students in this program
                              </div>
                            ) : (
                              group.students.map((student) => (
                                <button
                                  key={student._id}
                                  onClick={() => handleStudentSelect(student)}
                                  className={`w-full p-3 text-left hover:bg-white border-b border-gray-200 last:border-b-0 transition-colors ${
                                    selectedStudent?._id === student._id ? 'bg-blue-50 border-blue-200' : ''
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <User className="w-4 h-4 text-gray-400" />
                                      <div>
                                        <p className="font-medium text-gray-900">{student.name}</p>
                                        <p className="text-sm text-gray-500">{student.email}</p>
                                        <p className="text-xs text-gray-400">
                                          {student.university} • {student.course} • {student.graduationYear}
                                        </p>
                                      </div>
                                    </div>
                                    {student.hasCompanyAdviser ? (
                                      <CheckCircle className="w-4 h-4 text-green-500" title="Has Company Adviser" />
                                    ) : (
                                      <AlertCircle className="w-4 h-4 text-orange-500" title="No Company Adviser" />
                                    )}
                                  </div>
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Assignment Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-green-600" />
                  Company Adviser Assignment
                </h3>
              </div>

              <div className="p-4">
                {!selectedStudent ? (
                  <div className="text-center py-8">
                    <User className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">Select a student to assign a Company Adviser</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Selected Student Info */}
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                      <h4 className="font-medium text-blue-900 mb-1">Selected Student</h4>
                      <p className="text-sm text-blue-800">{selectedStudent.name}</p>
                      <p className="text-xs text-blue-600">{selectedStudent.email}</p>
                      <p className="text-xs text-blue-600">{selectedStudent.university}</p>
                    </div>

                    {/* Company Adviser Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company Adviser
                      </label>
                      {companyAdvisers.length === 0 ? (
                        <div className="text-center py-4 text-gray-500">
                          <Building className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                          <p className="text-sm">No Company Advisers available for this program</p>
                        </div>
                      ) : (
                        <select
                          value={selectedCompanyAdviserId}
                          onChange={(e) => setSelectedCompanyAdviserId(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select Company Adviser</option>
                          {companyAdvisers.map((adviser) => (
                            <option key={adviser._id} value={adviser._id}>
                              {adviser.name} - {adviser.company}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    {/* Assignment Status */}
                    {selectedStudent.hasCompanyAdviser && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-yellow-600" />
                          <p className="text-sm text-yellow-800">
                            This student already has a Company Adviser assigned
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Save Button */}
                    <button
                      onClick={handleSaveAssignment}
                      disabled={!selectedCompanyAdviserId || assignmentLoading}
                      className="w-full btn btn-success disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {assignmentLoading ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Saving...
                        </div>
                      ) : (
                        "Save Assignment"
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Info Panel */}
            <div className="mt-4 bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">Assignment Rules</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• University Advisers are automatically assigned by university</li>
                <li>• Company Advisers must belong to the same program as the student</li>
                <li>• Students can only have one Company Adviser at a time</li>
                <li>• Program consistency is enforced for all assignments</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdviserAssignment;


