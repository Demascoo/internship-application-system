import React, { useState, useEffect, useRef, useCallback } from "react";
import toast from "react-hot-toast";
import { 
  Users, 
  UserPlus, 
  Copy, 
  CheckCircle, 
  Shield,
  GraduationCap,
  Building2,
  RefreshCw,
  X,
  AlertTriangle,
  AlertCircle
} from "lucide-react";
import api, { accountManagementAPI, programsAPI } from "../../services/api";

interface Props {
  onBack: () => void;
}

interface TemporaryAccount {
  _id: string;
  name: string;
  email: string;
  role: string;
  adminApproved: boolean;
  createdAt: string;
}

interface Student {
  _id: string;
  name: string;
  email: string;
  university_name: string;
  universityAdviserId?: {
    _id: string;
    name: string;
    email: string;
  };
  facultyHeadId?: {
    _id: string;
    name: string;
    email: string;
  };
  groupAssignment?: {
    programId?: {
      _id: string;
      name: string;
    };
  };
}

interface AutoLinkedAdvisers {
  universityAdviser: {
    _id: string;
    name: string;
    email: string;
  } | null;
  facultyHead: {
    _id: string;
    name: string;
    email: string;
  } | null;
  student: {
    _id: string;
    name: string;
    email: string;
    university_name: string;
  };
}

const EnhancedAccountManagement: React.FC<Props> = ({ onBack }) => {
  const [accounts, setAccounts] = useState<TemporaryAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "",
    programId: "",
    university_name: "",
    studentId: "",
    studentIds: [] as string[],
    companyName: ""
  });
  const [programs, setPrograms] = useState<any[]>([]);
  const [copiedCredentials, setCopiedCredentials] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<any>(null);
  const [universities, setUniversities] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [universityStudents, setUniversityStudents] = useState<any[]>([]);
  const [programStudents, setProgramStudents] = useState<any[]>([]);
  const [autoLinkedAdvisers, setAutoLinkedAdvisers] = useState<any>(null);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingAdvisers, setLoadingAdvisers] = useState(false);

  const universityChangeTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadAccounts();
    loadUniversities();
    loadPrograms();
    loadStudents();
    return () => {
      if (universityChangeTimeout.current) {
        clearTimeout(universityChangeTimeout.current);
      }
    };
  }, []);

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const res = await accountManagementAPI.listTemporaryAccounts();
      setAccounts(res.data?.accounts || []);
    } catch (e: any) {
      toast.error(e?.message || "Failed to load accounts");
    } finally {
      setLoading(false);
    }
  };

  const loadPrograms = async () => {
    try {
      const response = await programsAPI.getAll();
      if (response.success) {
        setPrograms(response.data.programs || []);
      }
    } catch (error) {
      console.error('Error loading programs:', error);
      toast.error('Failed to load programs');
      setPrograms([]); // Ensure programs is always an array
    }
  };

  const loadUniversities = async () => {
    try {
      const response = await api.get('/universities');
      console.log("Universities response:", response);
      
      if (response.data && response.data.success) {
        setUniversities(response.data.data.universities || []);
      }
    } catch (e: any) {
      console.error("Failed to load universities:", e);
    }
  };

  const loadStudents = async () => {
    try {
      const response = await accountManagementAPI.getStudentsForSelection();
      if (response.success) {
        setStudents(response.data.students || []);
      }
    } catch (e: any) {
      console.error("Failed to load students:", e);
    }
  };

  const loadStudentsByUniversity = useCallback(async (universityName: string) => {
    if (!universityName.trim()) {
      setUniversityStudents([]);
      return;
    }
    
    console.log('Loading students for university:', universityName);
    setLoadingStudents(true);
    try {
      const response = await accountManagementAPI.getStudentsByUniversity(universityName);
      console.log('University students API response (raw):', response);
      
      // Backend returns: { success: true, data: { students: [...], universityName: "..." } }
      const students = response?.data?.students || [];
      
      console.log('Students found:', students.length, students);
      console.log('Response structure:', {
        hasData: !!response?.data,
        hasStudents: !!response?.data?.students,
        studentsLength: response?.data?.students?.length || 0,
        universityName: response?.data?.universityName
      });
      
      if (Array.isArray(students)) {
        setUniversityStudents(students);
        
        if (students.length === 0) {
          toast('No students found for this university', {
            icon: 'ℹ️',
            style: {
              borderRadius: '10px',
              background: '#3b82f6',
              color: '#fff',
            },
          });
        }
      } else {
        console.error('Students is not an array:', students);
        setUniversityStudents([]);
        toast.error('Invalid student data received from server');
      }
    } catch (e: any) {
      console.error("Failed to load students by university:", e);
      toast.error("Failed to load students for this university");
    } finally {
      setLoadingStudents(false);
    }
  }, []);

  const loadStudentsByProgram = async (programId: string) => {
    if (!programId) {
      setProgramStudents([]);
      return;
    }

    setLoadingStudents(true);
    try {
      console.log('Loading students for program ID:', programId);
      const response = await accountManagementAPI.getStudentsByProgram(programId);
      console.log('API response:', response);
      
      if (response && response.students) {
        const students = response.students || [];
        console.log('Students loaded:', students.length, students);
        setProgramStudents(students);
        
        if (students.length === 0) {
          toast.success('No students found for this program');
        }
      } else {
        console.error('Invalid response structure:', response);
        setProgramStudents([]);
        toast.error('Invalid response from server');
      }
    } catch (error: any) {
      console.error('Error loading students by program:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      setProgramStudents([]);
      
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load students for this program';
      toast.error(errorMessage);
    } finally {
      setLoadingStudents(false);
    }
  };

  const loadAutoLinkedAdvisers = async (studentId: string) => {
    if (!studentId) {
      setAutoLinkedAdvisers(null);
      return;
    }
    
    setLoadingAdvisers(true);
    try {
      const response = await accountManagementAPI.getStudentUniversityAdvisers(studentId);
      if (response.success) {
        setAutoLinkedAdvisers(response.data);
      }
    } catch (e: any) {
      console.error("Failed to load auto-linked advisers:", e);
      toast.error("Failed to load linked advisers for this student");
    } finally {
      setLoadingAdvisers(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.password) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Role-specific validation
    if (formData.role === "universityAdviser" || formData.role === "facultyHead") {
      if (!formData.university_name) {
        toast.error("University name is required");
        return;
      }
      if (formData.studentIds.length === 0) {
        toast.error("At least one student must be selected");
        return;
      }
    } else if (formData.role === "companyAdviser") {
      if (!formData.companyName) {
        toast.error("Company name is required for Company Advisers");
        return;
      }
    }

    // Show confirmation modal
    setPendingFormData(formData);
    setShowConfirmModal(true);
  };

  const handleConfirmCreate = async () => {
    setShowConfirmModal(false);
    setLoading(true);
    try {
      console.log('Submitting form data:', pendingFormData);
      
      // Create clean payload with only required fields for each role
      const payload: any = {
        fullName: pendingFormData.fullName,
        email: pendingFormData.email,
        password: pendingFormData.password,
        role: pendingFormData.role
      };

      // Add role-specific fields
      if (pendingFormData.role === "universityAdviser" || pendingFormData.role === "facultyHead") {
        payload.university_name = pendingFormData.university_name;
        payload.studentIds = pendingFormData.studentIds;
      } else if (pendingFormData.role === "companyAdviser") {
        payload.companyName = pendingFormData.companyName;
        // programId is required for Company Adviser
        payload.programId = pendingFormData.programId;
      }

      console.log('Clean payload for', formData.role, ':', payload);
      
      const response = await accountManagementAPI.createTemporaryAccount(payload);
      console.log('Account creation response:', response);
      toast.success(response.data?.message || "Account created successfully!");
      setFormData({
        fullName: "",
        email: "",
        password: "",
        role: "",
        programId: "",
        university_name: "",
        studentId: "",
        studentIds: [] as string[],
        companyName: ""
      });
      setShowCreateForm(false);
      setUniversityStudents([]);
      setProgramStudents([]);
      setAutoLinkedAdvisers(null);
      await loadAccounts();
    } catch (e: any) {
      toast.error(e?.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  const copyCredentials = (email: string, password: string) => {
    const credentials = `Email: ${email}\nPassword: ${password}`;
    navigator.clipboard.writeText(credentials);
    setCopiedCredentials(email);
    toast.success("Credentials copied to clipboard!");
    setTimeout(() => setCopiedCredentials(null), 2000);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "universityAdviser":
        return <GraduationCap className="w-5 h-5 text-blue-600" />;
      case "companyAdviser":
        return <Building2 className="w-5 h-5 text-green-600" />;
      case "facultyHead":
        return <Shield className="w-5 h-5 text-purple-600" />;
      default:
        return <Users className="w-5 h-5 text-gray-600" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "universityAdviser":
        return "University Adviser";
      case "companyAdviser":
        return "Company Adviser";
      case "facultyHead":
        return "Faculty Head";
      default:
        return role;
    }
  };

  const handleUniversityChange = useCallback((universityName: string) => {
    // Clear existing timeout
    if (universityChangeTimeout.current) {
      clearTimeout(universityChangeTimeout.current);
    }

    // Update form data immediately for UI responsiveness
    setFormData(prev => ({ 
      ...prev, 
      university_name: universityName,
      studentIds: [] // Reset selected students when university changes
    }));

    // Clear students immediately if input is empty
    if (!universityName.trim()) {
      setUniversityStudents([]);
      return;
    }

    // Debounce API call - only call after 600ms of no typing
    universityChangeTimeout.current = setTimeout(() => {
      console.log('Debounced API call triggered for university:', universityName);
      loadStudentsByUniversity(universityName);
    }, 600);
  }, [loadStudentsByUniversity]);

  const handleStudentChange = (studentId: string) => {
    setFormData(prev => ({ ...prev, studentId }));
    loadAutoLinkedAdvisers(studentId);
  };

  const handleStudentSelection = (studentId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      studentIds: checked 
        ? [...prev.studentIds, studentId]
        : prev.studentIds.filter(id => id !== studentId)
    }));
  };

  const handleSelectAllStudents = () => {
    const allStudentIds = universityStudents.map(student => student._id);
    setFormData(prev => ({ ...prev, studentIds: allStudentIds }));
  };

  const handleClearAllStudents = () => {
    setFormData(prev => ({ ...prev, studentIds: [] }));
  };

  const handleProgramChange = (programId: string) => {
    setFormData(prev => ({ 
      ...prev, 
      programId,
      studentIds: [] // Clear student selections when program changes
    }));
    setAutoLinkedAdvisers(null);
    // No need to load students for Company Adviser since student selection is removed
  };

  const handleProgramStudentSelection = (studentId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      studentIds: checked 
        ? [...prev.studentIds, studentId]
        : prev.studentIds.filter(id => id !== studentId)
    }));
  };

  const handleSelectAllProgramStudents = () => {
    setFormData(prev => ({
      ...prev,
      studentIds: programStudents.map(student => student._id)
    }));
  };

  const handleClearAllProgramStudents = () => {
    setFormData(prev => ({
      ...prev,
      studentIds: []
    }));
  };

  return (
    <div className="admin-dashboard">
      <div className="container">
        <div className="dashboard-header">
          <div className="header-content">
            <h1 className="dashboard-title">Enhanced Account Management</h1>
            <p className="dashboard-subtitle">Create temporary accounts for advisers and faculty head</p>
          </div>
          <button onClick={onBack} className="btn btn-outline">Back</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Account Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center space-x-2 mb-4">
                <UserPlus className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Create Temporary Account</h2>
              </div>

              {!showCreateForm ? (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <UserPlus className="w-5 h-5 inline mr-2" />
                  Create New Account
                </button>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Temporary Password *
                    </label>
                    <input
                      type="text"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role *
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Role</option>
                      <option value="universityAdviser">University Adviser</option>
                      <option value="companyAdviser">Company Adviser</option>
                      <option value="facultyHead">Faculty Head</option>
                    </select>
                  </div>

                  {(formData.role === "universityAdviser" || formData.role === "facultyHead") && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        University Name *
                      </label>
                      <input
                        type="text"
                        value={formData.university_name}
                        onChange={(e) => handleUniversityChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter university name"
                        list="universities-list"
                        required
                      />
                      <datalist id="universities-list">
                        {universities.map((uni, index) => (
                          <option key={index} value={uni} />
                        ))}
                      </datalist>
                      <p className="text-xs text-gray-500 mt-1">
                        Students from this university will be automatically linked
                      </p>
                    </div>
                  )}

                  {(formData.role === "universityAdviser" || formData.role === "facultyHead") && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Students *
                      </label>
                      
                      {loadingStudents ? (
                        <div className="flex items-center justify-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                          <span className="ml-2 text-sm text-gray-600">Loading students...</span>
                        </div>
                      ) : universityStudents.length > 0 ? (
                        <div>
                          <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-md p-3 space-y-2">
                            {universityStudents.map(student => (
                              <div key={student._id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                                <input
                                  type="checkbox"
                                  id={`student-${student._id}`}
                                  checked={formData.studentIds.includes(student._id)}
                                  onChange={(e) => handleStudentSelection(student._id, e.target.checked)}
                                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <label htmlFor={`student-${student._id}`} className="flex-1 cursor-pointer">
                                  <div className="text-sm font-medium text-gray-900">{student.name}</div>
                                  <div className="text-xs text-gray-500">{student.email}</div>
                                  {student.groupAssignment?.programId && (
                                    <div className="text-xs text-blue-600">
                                      Program: {student.groupAssignment.programId.name}
                                    </div>
                                  )}
                                </label>
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-between items-center mt-3">
                            <div className="flex space-x-3">
                              <button
                                type="button"
                                onClick={handleSelectAllStudents}
                                disabled={formData.studentIds.length === universityStudents.length}
                                className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                              >
                                Select All ({universityStudents.length})
                              </button>
                              <button
                                type="button"
                                onClick={handleClearAllStudents}
                                disabled={formData.studentIds.length === 0}
                                className="text-sm text-red-600 hover:text-red-800 disabled:text-gray-400"
                              >
                                Clear All
                              </button>
                            </div>
                            <span className="text-sm text-gray-600">
                              {formData.studentIds.length} selected
                            </span>
                          </div>
                        </div>
                      ) : formData.university_name ? (
                        <div className="text-sm text-gray-500 py-4 text-center border border-gray-300 rounded-md">
                          No students found for "{formData.university_name}"
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 py-4 text-center border border-gray-300 rounded-md">
                          Select a university to view students
                        </div>
                      )}
                    </div>
                  )}

                  {formData.role === "companyAdviser" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Program *
                      </label>
                      <select
                        value={formData.programId}
                        onChange={(e) => handleProgramChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Program</option>
                        {Array.isArray(programs) && programs.map(program => (
                          <option key={program._id} value={program._id}>
                            {program.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {formData.role === "companyAdviser" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Company Name *
                      </label>
                      <input
                        type="text"
                        value={formData.companyName}
                        onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter company name"
                        required
                      />
                    </div>
                  )}

                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loading ? "Creating..." : "Create Account"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Accounts List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Temporary Accounts</h2>
                  <button
                    onClick={loadAccounts}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Refresh
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                {loading ? (
                  <div className="p-6 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  </div>
                ) : accounts.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No temporary accounts found</p>
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Account
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {accounts.map((account) => (
                        <tr key={account._id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {account.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {account.email}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              {getRoleIcon(account.role)}
                              <span className="text-sm text-gray-900">
                                {getRoleLabel(account.role)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Active
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(account.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => copyCredentials(account.email, account.password || "temporary_password")}
                              className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                            >
                              {copiedCredentials === account.email ? (
                                <>
                                  <CheckCircle className="w-4 h-4" />
                                  <span>Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-4 h-4" />
                                  <span>Copy Credentials</span>
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-3">Instructions</h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p>• Create temporary accounts for advisers and faculty head</p>
            <p>• Copy the credentials and send them via SMS, Telegram, or other channels</p>
            <p>• Users can log in with temporary credentials and update their profile</p>
            <p>• Faculty Head accounts don't require program assignment</p>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-orange-500 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Confirm Account Creation</h3>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-4">Are you sure you want to create this account?</p>
              
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Name:</span>
                  <span className="text-gray-900">{pendingFormData?.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Email:</span>
                  <span className="text-gray-900">{pendingFormData?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Role:</span>
                  <span className="text-gray-900">{getRoleLabel(pendingFormData?.role || '')}</span>
                </div>
                {pendingFormData?.university_name && (
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">University:</span>
                    <span className="text-gray-900">{pendingFormData.university_name}</span>
                  </div>
                )}
                {pendingFormData?.companyName && (
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Company:</span>
                    <span className="text-gray-900">{pendingFormData.companyName}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCreate}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Create Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedAccountManagement;
