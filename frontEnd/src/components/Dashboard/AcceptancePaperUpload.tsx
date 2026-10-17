
import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Upload,
  FileText,
  Users,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  Download,
  Eye,
  X,
  Plus,
  List,
  Grid3X3,
  User,
  Send,
  Calendar,
  ChevronDown,
  ChevronRight,
  Mail,
  GraduationCap,
} from "lucide-react";
import { useApp } from "../../contexts/AppContext";
import toast from "react-hot-toast";

interface StudentApplication {
  _id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentPhone?: string;
  programId: string;
  programName?: string;
  programDuration?: string;
  status: string;
  appliedAt?: string;
  groupAssignment?: {
    groupName: string;
    assignedAt: string;
  };
}

interface Program {
  _id: string;
  name: string;
  category: string;
  color: string;
  duration?: string;
  acceptedStudents: StudentApplication[];
  totalAccepted: number;
}

interface AcceptancePaper {
  _id: string;
  studentId: string;
  studentName: string;
  programId: string;
  programName: string;
  filename: string;
  originalName: string;
  message: string;
  uploadDate: string;
}

const AcceptancePaperUpload: React.FC<{ onBack: () => void }> = ({
  onBack,
}) => {
  const { applications, programs } = useApp();
  const [acceptancePapers, setAcceptancePapers] = useState<AcceptancePaper[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "excel">("excel");
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );

  // Fetch accepted students grouped by program from backend
  const fetchAcceptedStudentsByProgram = async () => {
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:5000/api"
        }/groups/programs/accepted-students`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data.data.programs;
      }
      return [];
    } catch (error) {
      console.error("Error fetching accepted students:", error);
      return [];
    }
  };

  // Transform programs data to include accepted students
  const [programsWithAcceptedStudents, setProgramsWithAcceptedStudents] =
    useState<Program[]>([]);

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch accepted students by program
        const acceptedStudentsData = await fetchAcceptedStudentsByProgram();

        // Transform data to match our interface
        const transformedPrograms = acceptedStudentsData.map(
          (program: any) => ({
            _id: program._id,
            name: program.name,
            category: program.category,
            color: program.color || "from-blue-500 to-purple-600",
            duration: program.duration,
            acceptedStudents: program.acceptedStudents.map((student: any) => ({
              _id: student._id || student.studentId,
              studentId: student.studentId,
              studentName: student.studentName || "Unknown",
              studentEmail: student.studentEmail || "No email",
              studentPhone: student.studentPhone,
              programId: program._id,
              programName: program.name,
              programDuration: program.duration,
              status: "accepted",
              appliedAt: student.appliedAt,
              groupAssignment: student.groupAssignment,
            })),
            totalAccepted: program.totalAccepted,
          })
        );

        setProgramsWithAcceptedStudents(transformedPrograms);

        // Fetch existing acceptance papers
        await fetchAcceptancePapers();
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch existing acceptance papers
  const fetchAcceptancePapers = async () => {
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:5000/api"
        }/acceptance-papers/admin/all`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAcceptancePapers(data.data?.papers || []);
      }
    } catch (error) {
      console.error("Error fetching acceptance papers:", error);
    }
  };

  // Handle file upload
  const handleFileUpload = async () => {
    if (!uploadFile || selectedStudents.length === 0) {
      toast.error("Please select a file and at least one student");
      return;
    }

    setUploading(true);

    try {
      const selectedProg = programsWithAcceptedStudents.find(
        (p) => p._id === selectedProgram
      );
      if (!selectedProg) {
        toast.error("Program not found");
        return;
      }

      // Process each selected student
      for (const studentAppId of selectedStudents) {
        const studentApp = selectedProg.acceptedStudents.find(
          (s) => s._id === studentAppId
        );
        if (!studentApp) continue;

        const formData = new FormData();

        // Use the correct studentId
        const studentId = studentApp.studentId;

        formData.append("studentId", studentId);
        formData.append("applicationId", studentApp._id);
        formData.append("programId", studentApp.programId);
        formData.append("acceptancePaper", uploadFile);
        formData.append("message", message);

        const response = await fetch(
          `${
            import.meta.env.VITE_API_URL || "http://localhost:5000/api"
          }/acceptance-papers/upload`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: formData,
          }
        );

        if (!response.ok) {
          const data = await response.json();
          console.error(
            `Failed to upload for ${studentApp.studentName}:`,
            data.message
          );
        }
      }

      toast.success(
        `Acceptance papers uploaded successfully to ${selectedStudents.length} students!`
      );

      // Reset form
      setUploadFile(null);
      setSelectedStudents([]);
      setMessage("");
      setShowUploadForm(false);
      setSelectedProgram(null);

      // Refresh data
      fetchAcceptancePapers();
    } catch (error) {
      console.error("Error uploading acceptance papers:", error);
      toast.error("Error uploading acceptance papers");
    } finally {
      setUploading(false);
    }
  };

  // Get unique categories
  const categories = [
    "all",
    ...Array.from(new Set(programsWithAcceptedStudents.map((p) => p.category))),
  ];

  // Filter programs
  const filteredPrograms = programsWithAcceptedStudents.filter((program) => {
    const matchesSearch =
      program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      program.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      filterCategory === "all" || program.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Toggle student selection
  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  // Select all students in program
  const selectAllStudents = () => {
    const selectedProg = programsWithAcceptedStudents.find(
      (p) => p._id === selectedProgram
    );
    if (selectedProg) {
      setSelectedStudents(selectedProg.acceptedStudents.map((s) => s._id));
    }
  };

  // Clear student selection
  const clearSelection = () => {
    setSelectedStudents([]);
  };

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  // Safe display functions
  const getStudentDisplayName = (student: StudentApplication) => {
    return student.studentName || "Unknown Student";
  };

  const getStudentDisplayEmail = (student: StudentApplication) => {
    return student.studentEmail || "No email provided";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
              <div className="absolute inset-0 rounded-full border-t-4 border-blue-200"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Upload Form View
  if (showUploadForm && selectedProgram) {
    const selectedProg = programsWithAcceptedStudents.find(
      (p) => p._id === selectedProgram
    );
    if (!selectedProg) return null;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="container mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => {
                    setShowUploadForm(false);
                    setSelectedProgram(null);
                    setSelectedStudents([]);
                    setUploadFile(null);
                    setMessage("");
                  }}
                  className="flex items-center px-4 py-2 text-gray-600 bg-white rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-sm border border-gray-200"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back to Programs
                </button>

                <div className="h-8 w-px bg-gray-300"></div>

                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Upload Acceptance Papers
                  </h1>
                  <p className="text-gray-600 mt-1">
                    {selectedProg.name} • {selectedProg.acceptedStudents.length}{" "}
                    students • {selectedStudents.length} selected
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-6 px-4 py-2 bg-white rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-blue-500 mr-2" />
                    <span className="text-sm font-medium text-gray-700">
                      {selectedStudents.length} Selected
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Users className="w-5 h-5 text-gray-500 mr-2" />
                    <span className="text-sm font-medium text-gray-700">
                      {selectedProg.acceptedStudents.length} Total
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* File Upload Section */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Upload Acceptance Document
              </h2>

              <div className="space-y-6">
                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Acceptance Paper (PDF, DOC, DOCX)
                  </label>
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {uploadFile ? (
                          <>
                            <FileText className="w-8 h-8 text-green-500 mb-2" />
                            <p className="text-sm text-green-600 font-medium">
                              {uploadFile.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </>
                        ) : (
                          <>
                            <Upload className="w-8 h-8 text-gray-400 mb-2" />
                            <p className="text-sm text-gray-500">
                              Click to upload or drag and drop
                            </p>
                            <p className="text-xs text-gray-500">
                              PDF, DOC, DOCX (MAX. 10MB)
                            </p>
                          </>
                        )}
                      </div>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            // Validate file type
                            const allowedTypes = [
                              "application/pdf",
                              "application/msword",
                              "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                            ];
                            if (!allowedTypes.includes(file.type)) {
                              toast.error(
                                "Please upload only PDF or Word documents"
                              );
                              return;
                            }

                            // Validate file size (10MB)
                            if (file.size > 10 * 1024 * 1024) {
                              toast.error("File size must be less than 10MB");
                              return;
                            }

                            setUploadFile(file);
                          }
                        }}
                        className="hidden"
                        disabled={uploading}
                      />
                    </label>
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message (Optional)
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Add a congratulations message for the accepted students..."
                    disabled={uploading}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleFileUpload}
                    disabled={
                      !uploadFile || selectedStudents.length === 0 || uploading
                    }
                    className="flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 mr-2" />
                        Upload to {selectedStudents.length} Students
                      </>
                    )}
                  </button>

                  {uploadFile && (
                    <button
                      onClick={() => setUploadFile(null)}
                      className="flex items-center px-4 py-3 text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors duration-200"
                      disabled={uploading}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Remove File
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Student Selection */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Select Students
                </h2>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={selectAllStudents}
                    className="px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-200 text-sm font-medium"
                  >
                    Select All
                  </button>
                  <button
                    onClick={clearSelection}
                    className="px-4 py-2 text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 text-sm font-medium"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </div>

            {/* Excel-like Student List */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left">
                      <input
                        type="checkbox"
                        checked={
                          selectedStudents.length ===
                          selectedProg.acceptedStudents.length
                        }
                        onChange={
                          selectedStudents.length ===
                          selectedProg.acceptedStudents.length
                            ? clearSelection
                            : selectAllStudents
                        }
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      No.
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Student Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Applied Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {selectedProg.acceptedStudents.map((student, index) => {
                    const hasAcceptancePaper = acceptancePapers.some(
                      (paper) =>
                        paper.studentId === student.studentId &&
                        paper.programId === selectedProgram
                    );
                    const isSelected = selectedStudents.includes(student._id);

                    return (
                      <tr
                        key={student._id}
                        className={`hover:bg-blue-50 transition-colors duration-150 ${
                          isSelected
                            ? "bg-blue-25 border-l-4 border-blue-500"
                            : index % 2 === 0
                            ? "bg-white"
                            : "bg-gray-25"
                        }`}
                      >
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleStudentSelection(student._id)}
                            disabled={hasAcceptancePaper}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                          />
                        </td>
                        <td className="px-6 py-4 text-sm font-mono text-gray-900">
                          {(index + 1).toString().padStart(2, "0")}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                              {getStudentDisplayName(student)
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                            <div className="font-semibold text-gray-900">
                              {getStudentDisplayName(student)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {getStudentDisplayEmail(student)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {student.appliedAt
                            ? new Date(student.appliedAt).toLocaleDateString()
                            : "Unknown"}
                        </td>
                        <td className="px-6 py-4">
                          {hasAcceptancePaper ? (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Sent
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">
                              Pending
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center px-4 py-2 text-gray-600 bg-white rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-sm border border-gray-200"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Dashboard
              </button>

              <div className="h-8 w-px bg-gray-300"></div>

              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Acceptance Paper Upload
                </h1>
                <p className="text-gray-600 mt-1">
                  Upload and manage acceptance documents for students
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex items-center bg-white rounded-xl border border-gray-200 shadow-sm">
                <button
                  onClick={() => setViewMode("excel")}
                  className={`px-4 py-2 rounded-l-xl transition-all duration-200 flex items-center ${
                    viewMode === "excel"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <List className="w-4 h-4 mr-2" />
                  Excel View
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-4 py-2 rounded-r-xl transition-all duration-200 flex items-center ${
                    viewMode === "grid"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Grid3X3 className="w-4 h-4 mr-2" />
                  Grid View
                </button>
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search programs by name or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm"
                />
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="pl-10 pr-8 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm appearance-none cursor-pointer capitalize"
                >
                  {categories.map((category) => (
                    <option
                      key={category}
                      value={category}
                      className="capitalize"
                    >
                      {category === "all" ? "All Categories" : category}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Programs List with Accordion Style */}
        {viewMode === "excel" ? (
          <div className="space-y-4">
            {filteredPrograms.length > 0 ? (
              filteredPrograms.map((program) => {
                const studentsWithPapers = acceptancePapers.filter(
                  (paper) => paper.programId === program._id
                ).length;
                const uploadProgress =
                  program.totalAccepted > 0
                    ? (studentsWithPapers / program.totalAccepted) * 100
                    : 0;
                const isExpanded = expandedCategories.has(program.category);

                return (
                  <div
                    key={program._id}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                  >
                    {/* Category Header - Accordion Style */}
                    <div
                      className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 cursor-pointer hover:from-gray-100 hover:to-gray-200 transition-all duration-200"
                      onClick={() => toggleCategory(program.category)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-3">
                            {isExpanded ? (
                              <ChevronDown className="w-5 h-5 text-gray-600" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-gray-600" />
                            )}
                            <div
                              className={`w-12 h-12 rounded-lg bg-gradient-to-r ${program.color} flex-shrink-0 flex items-center justify-center`}
                            >
                              <GraduationCap className="w-6 h-6 text-white" />
                            </div>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 capitalize">
                              {program.category}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {program.name}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {program.totalAccepted}
                            </div>
                            <div className="text-xs text-gray-500">
                              Accepted Students
                            </div>
                          </div>

                          <div className="text-center min-w-[120px]">
                            <div className="flex items-center space-x-2 mb-1">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${uploadProgress}%` }}
                                ></div>
                              </div>
                              <span className="text-xs font-medium text-gray-700">
                                {studentsWithPapers}/{program.totalAccepted}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">
                              Upload Progress
                            </div>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProgram(program._id);
                              setShowUploadForm(true);
                            }}
                            className="flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-all duration-200 text-sm font-medium"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Papers
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Student List - Expandable */}
                    {isExpanded && (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                No.
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                Student Name
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                Email
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                Applied Date
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                Group
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                Paper Status
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-100">
                            {program.acceptedStudents.map((student, index) => {
                              const hasAcceptancePaper = acceptancePapers.some(
                                (paper) => paper.studentId === student.studentId
                              );
                              const displayName =
                                getStudentDisplayName(student);
                              const displayEmail =
                                getStudentDisplayEmail(student);

                              return (
                                <tr
                                  key={student._id}
                                  className={`hover:bg-blue-25 transition-colors duration-150 ${
                                    index % 2 === 0 ? "bg-white" : "bg-gray-25"
                                  }`}
                                >
                                  <td className="px-6 py-4 text-sm font-mono text-gray-900">
                                    {(index + 1).toString().padStart(2, "0")}
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center">
                                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold mr-3">
                                        {displayName.charAt(0).toUpperCase()}
                                      </div>
                                      <div>
                                        <div className="font-medium text-gray-900">
                                          {displayName}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center text-sm text-gray-600">
                                      <Mail className="w-4 h-4 mr-2" />
                                      {displayEmail}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-600">
                                    <div className="flex items-center">
                                      <Calendar className="w-4 h-4 mr-2" />
                                      {student.appliedAt
                                        ? new Date(
                                            student.appliedAt
                                          ).toLocaleDateString()
                                        : "Unknown"}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    {student.groupAssignment ? (
                                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                        {student.groupAssignment.groupName}
                                      </span>
                                    ) : (
                                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">
                                        Unassigned
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-6 py-4">
                                    {hasAcceptancePaper ? (
                                      <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                        Sent
                                      </span>
                                    ) : (
                                      <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                                        <AlertCircle className="w-3 h-3 mr-1" />
                                        Pending
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No Programs Found
                </h3>
                <p className="text-gray-600">
                  {searchTerm || filterCategory !== "all"
                    ? "No programs match your search criteria."
                    : "No programs with accepted students found."}
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Grid View */
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredPrograms.length > 0 ? (
              filteredPrograms.map((program) => {
                const studentsWithPapers = acceptancePapers.filter(
                  (paper) => paper.programId === program._id
                ).length;
                const uploadProgress =
                  program.totalAccepted > 0
                    ? (studentsWithPapers / program.totalAccepted) * 100
                    : 0;

                return (
                  <div
                    key={program._id}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 overflow-hidden"
                  >
                    {/* Program Header */}
                    <div
                      className={`h-24 bg-gradient-to-r ${program.color} relative`}
                    >
                      <div className="absolute inset-0 bg-black bg-opacity-10"></div>
                      <div className="absolute bottom-4 left-6">
                        <h3 className="text-lg font-bold text-white">
                          {program.name}
                        </h3>
                        <p className="text-white text-opacity-90 text-sm capitalize">
                          {program.category}
                        </p>
                      </div>
                    </div>

                    {/* Program Content */}
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <Users className="w-5 h-5 text-green-600 mr-2" />
                          <span className="text-xl font-bold text-green-600">
                            {program.totalAccepted}
                          </span>
                          <span className="text-gray-500 ml-1">students</span>
                        </div>
                      </div>

                      {/* Upload Progress */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">
                            Upload Progress
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {studentsWithPapers}/{program.totalAccepted}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Students Preview */}
                      <div className="space-y-2 mb-6">
                        <h4 className="text-sm font-semibold text-gray-700">
                          Students:
                        </h4>
                        <div className="max-h-32 overflow-y-auto space-y-1">
                          {program.acceptedStudents
                            .slice(0, 4)
                            .map((student, index) => {
                              const studentId = student.studentId;
                              const hasAcceptancePaper = acceptancePapers.some(
                                (paper) => paper.studentId === studentId
                              );
                              const displayName =
                                getStudentDisplayName(student);

                              return (
                                <div
                                  key={student._id}
                                  className="flex items-center justify-between text-sm py-1"
                                >
                                  <div className="flex items-center">
                                    <span className="font-mono text-xs text-gray-400 mr-3 w-6">
                                      #{(index + 1).toString().padStart(2, "0")}
                                    </span>
                                    <span className="font-medium text-gray-900">
                                      {displayName}
                                    </span>
                                  </div>
                                  {hasAcceptancePaper ? (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <AlertCircle className="w-4 h-4 text-orange-500" />
                                  )}
                                </div>
                              );
                            })}
                          {program.acceptedStudents.length > 4 && (
                            <p className="text-xs text-gray-500 italic">
                              +{program.acceptedStudents.length - 4} more
                              students
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={() => {
                          setSelectedProgram(program._id);
                          setShowUploadForm(true);
                        }}
                        className="w-full flex items-center justify-center px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-all duration-200 font-medium"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Acceptance Papers
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full">
                <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No Programs Found
                  </h3>
                  <p className="text-gray-600">
                    {searchTerm || filterCategory !== "all"
                      ? "No programs match your search criteria."
                      : "No programs with accepted students found."}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AcceptancePaperUpload;
