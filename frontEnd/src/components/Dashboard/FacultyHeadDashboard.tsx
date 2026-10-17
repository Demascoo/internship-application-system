import React, { useState, useEffect } from "react";
import { accountManagementAPI } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";
import FacultyHeadEvaluationTracking from "./FacultyHeadEvaluationTracking";
import ProfileUpdate from "./ProfileUpdate";
import AdviserMessagingPanel from "../Common/AdviserMessagingPanel";
import FacultyHeadEvaluationView from "./FacultyHeadEvaluationView";
import {
  Download,
  FileText,
  Eye,
  CheckCircle,
  XCircle,
  Award,
  Users,
  Calendar,
  TrendingUp,
  User,
  MessageSquare,
  Search,
  Filter,
  Building,
} from "lucide-react";

const FacultyHeadDashboard: React.FC = () => {
  const { user } = useAuth();
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showProfileUpdate, setShowProfileUpdate] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [reviewNotes, setReviewNotes] = useState<string>("");
  const [activeTab, setActiveTab] = useState<
    "evaluations" | "students" | "messages"
  >("evaluations");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [viewingEvaluation, setViewingEvaluation] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res =
        await accountManagementAPI.getFinalEvaluationsForFacultyHead();
      setEvaluations(res.data?.evaluations || res.data || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load evaluations");
    } finally {
      setLoading(false);
    }
  };

  const loadAssignedStudents = async () => {
    setStudentsLoading(true);
    try {
      console.log("Loading assigned students for Faculty Head...");
      console.log("User ID:", user?.id);

      const res = await accountManagementAPI.getAssignedStudentsForFacultyHead(
        user?.id
      );
      console.log("Faculty Head students API response:", res);

      const studentsList = res.data?.students || [];
      console.log("Faculty Head assigned students:", studentsList);
      setStudents(studentsList);

      if (studentsList.length === 0) {
        console.log("No students assigned to this Faculty Head");
      } else {
        console.log(
          `Successfully loaded ${studentsList.length} assigned students for Faculty Head`
        );
      }
    } catch (e: any) {
      console.error("Error loading assigned students for Faculty Head:", e);
      toast.error("Failed to load assigned students");
    } finally {
      setStudentsLoading(false);
    }
  };

  useEffect(() => {
    load();
    loadAssignedStudents();
  }, []);

  const review = async (
    id: string,
    status: "approved" | "rejected",
    reviewNotes?: string
  ) => {
    try {
      await accountManagementAPI.reviewFinalEvaluation(id, {
        status,
        reviewNotes,
      });
      toast.success(`Evaluation ${status} successfully`);
      await load();
    } catch (e: any) {
      toast.error(e?.message || `Failed to ${status} evaluation`);
    }
  };

  const downloadAttachment = async (
    evaluationId: string,
    attachmentIndex: number,
    filename: string
  ) => {
    try {
      const response = await accountManagementAPI.downloadEvaluationAttachment(
        evaluationId,
        attachmentIndex
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("File downloaded successfully");
    } catch (e: any) {
      toast.error("Failed to download file");
    }
  };

  const downloadSupportingDocument = async (document: any) => {
    try {
      // Convert base64 data back to blob for download
      const base64Data = document.data.split(",")[1]; // Remove data:type;base64, prefix
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: document.type });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", document.name);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Supporting document downloaded successfully");
    } catch (e: any) {
      console.error("Error downloading supporting document:", e);
      toast.error("Failed to download supporting document");
    }
  };

  const exportEvaluationPDF = async (evaluation: any) => {
    try {
      const response = await accountManagementAPI.exportFinalEvaluationPDF(
        evaluation._id
      );
      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: "application/pdf" })
      );
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `evaluation_${evaluation.studentId?.name || "student"}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("PDF exported successfully");
    } catch (e: any) {
      toast.error("Failed to export PDF");
    }
  };

  const filteredEvaluations = evaluations.filter((ev) => {
    const matchesStatus = filterStatus === "all" || ev.status === filterStatus;
    const matchesSearch =
      !searchTerm ||
      ev.studentId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.studentInfo?.fullName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      ev.companyAdviserId?.name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (showProfileUpdate) {
    return <ProfileUpdate onBack={() => setShowProfileUpdate(false)} />;
  }

  if (viewingEvaluation) {
    return (
      <FacultyHeadEvaluationTracking
        student={viewingEvaluation}
        onBack={() => setViewingEvaluation(null)}
      />
    );
  }

  if (selectedEvaluation) {
    return (
      <FacultyHeadEvaluationView
        evaluation={selectedEvaluation}
        onClose={() => setSelectedEvaluation(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              Faculty Head Dashboard
            </h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowProfileUpdate(true)}
                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <User className="w-4 h-4 inline mr-2" />
                Update Profile
              </button>
              <button
                onClick={() => {
                  load();
                  loadAssignedStudents();
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Refresh
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab("evaluations")}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "evaluations"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Award className="w-5 h-5" />
                <span>Final Evaluations</span>
              </button>
              <button
                onClick={() => setActiveTab("students")}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "students"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Users className="w-5 h-5" />
                <span>Assigned Students ({students.length})</span>
              </button>
              <button
                onClick={() => setActiveTab("messages")}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "messages"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <MessageSquare className="w-5 h-5" />
                <span>Messages</span>
              </button>
            </nav>
          </div>

          {/* Stats Cards */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center">
                <FileText className="w-8 h-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-900">
                    Total Evaluations
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {evaluations.length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center">
                <Calendar className="w-8 h-8 text-yellow-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-yellow-900">
                    Pending Review
                  </p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {
                      evaluations.filter((ev) => ev.status === "submitted")
                        .length
                    }
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-900">Approved</p>
                  <p className="text-2xl font-bold text-green-600">
                    {
                      evaluations.filter((ev) => ev.status === "approved")
                        .length
                    }
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-purple-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-purple-900">
                    Assigned Students
                  </p>
                  <p className="text-2xl font-bold text-purple-600">
                    {students.length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "evaluations" && (
          <>
            {/* Filters and Search */}
            <div className="bg-white rounded-lg shadow-sm border mb-6">
              <div className="p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search by student name or company adviser..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="sm:w-48">
                    <div className="relative">
                      <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                      >
                        <option value="all">All Status</option>
                        <option value="submitted">Pending Review</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Evaluations List */}
            <div className="bg-white rounded-lg shadow-sm border">
              {loading ? (
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                </div>
              ) : error ? (
                <div className="p-6 text-center text-red-600">{error}</div>
              ) : filteredEvaluations.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <Award className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>
                    {searchTerm || filterStatus !== "all"
                      ? "No evaluations match your criteria"
                      : "No final evaluations yet"}
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredEvaluations.map((ev: any) => (
                    <div key={ev._id} className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4 mb-3">
                            <div>
                              <h3 className="text-lg font-medium text-gray-900">
                                {ev.studentId?.name || ev.studentInfo?.fullName}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {ev.studentInfo?.companyName} • Company Adviser:{" "}
                                {ev.companyAdviserId?.name ||
                                  ev.studentInfo?.companyAdviser}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  ev.status === "approved"
                                    ? "bg-green-100 text-green-800"
                                    : ev.status === "rejected"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {ev.status === "submitted"
                                  ? "Pending Review"
                                  : ev.status}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="flex items-center">
                              <Award className="w-4 h-4 text-purple-600 mr-2" />
                              <span className="text-sm text-gray-600">
                                Total Score:{" "}
                              </span>
                              <span className="font-medium text-purple-600 ml-1">
                                {ev.finalEvaluation?.total ?? 0}%
                              </span>
                            </div>
                            <div className="flex items-center">
                              <TrendingUp className="w-4 h-4 text-green-600 mr-2" />
                              <span className="text-sm text-gray-600">
                                Recommendation:{" "}
                              </span>
                              <span
                                className={`font-medium ml-1 ${
                                  ev.comments?.finalRecommendation ===
                                  "Continue"
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {ev.comments?.finalRecommendation || "N/A"}
                              </span>
                            </div>
                          </div>

                          {/* Supporting Documents */}
                          {ev.supportingDocuments &&
                            ev.supportingDocuments.length > 0 && (
                              <div className="mb-4">
                                <h4 className="text-sm font-medium text-gray-700 mb-2">
                                  Supporting Documents:
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                  {ev.supportingDocuments.map(
                                    (document: any, index: number) => (
                                      <button
                                        key={index}
                                        onClick={() =>
                                          downloadSupportingDocument(document)
                                        }
                                        className="inline-flex items-center px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                                      >
                                        <Download className="w-3 h-3 mr-1" />
                                        {document.name}
                                      </button>
                                    )
                                  )}
                                </div>
                              </div>
                            )}

                          {/* Action Buttons */}
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => setSelectedEvaluation(ev)}
                              className="inline-flex items-center px-3 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
                            >
                              <Eye className="w-4 h-4 mr-1" /> View Details
                            </button>
                            {ev.status === "submitted" && (
                              <>
                                <button
                                  onClick={() => review(ev._id, "approved")}
                                  className="inline-flex items-center px-3 py-2 text-sm rounded bg-green-600 text-white hover:bg-green-700"
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />{" "}
                                  Approve
                                </button>
                                <button
                                  onClick={() => review(ev._id, "rejected")}
                                  className="inline-flex items-center px-3 py-2 text-sm rounded bg-red-600 text-white hover:bg-red-700"
                                >
                                  <XCircle className="w-4 h-4 mr-1" /> Reject
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Students Tab */}
        {activeTab === "students" && (
          <div className="flex h-[calc(100vh-300px)]">
            {/* Students List */}
            <div className="w-80 bg-white rounded-l-lg shadow-sm border-r border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Assigned Students
                </h3>
                <p className="text-sm text-gray-600">
                  {students.length} students
                </p>
              </div>

              <div className="overflow-y-auto h-full">
                {studentsLoading ? (
                  <div className="p-6 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading...</p>
                  </div>
                ) : students.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No students assigned</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {students.map((student: any) => (
                      <button
                        key={student._id}
                        onClick={() => setViewingEvaluation(student)}
                        className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                          viewingEvaluation?._id === student._id
                            ? "bg-blue-50 border-r-2 border-blue-500"
                            : ""
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {student.name}
                            </p>
                            <p className="text-sm text-gray-600 truncate">
                              {student.email}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {student.groupAssignment?.programName ||
                                "No program"}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Student Details */}
            <div className="flex-1 bg-white rounded-r-lg shadow-sm">
              {!selectedStudent ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium mb-2">
                      Select a Student
                    </h3>
                    <p className="text-sm">
                      Choose a student to view their details
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-6 h-full overflow-y-auto">
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                      {selectedStudent.name}
                    </h2>
                    <p className="text-gray-600">{selectedStudent.email}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-3">
                        Academic Information
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <Building className="w-4 h-4 text-blue-600 mr-2" />
                          <span className="text-sm text-gray-600">
                            University:
                          </span>
                          <span className="font-medium text-gray-900 ml-2">
                            {selectedStudent.profile?.university || "N/A"}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 text-purple-600 mr-2" />
                          <span className="text-sm text-gray-600">
                            Program:
                          </span>
                          <span className="font-medium text-gray-900 ml-2">
                            {selectedStudent.groupAssignment?.programName ||
                              "Not assigned"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-3">
                        Contact Information
                      </h3>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm text-gray-600">Email:</span>
                          <p className="font-medium text-gray-900">
                            {selectedStudent.email}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Company Assignment Info */}
                  {selectedStudent.companyAdviserId && (
                    <div className="bg-blue-50 rounded-lg p-4 mb-6">
                      <h3 className="font-medium text-blue-900 mb-3">
                        Company Assignment
                      </h3>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm text-blue-700">
                            Company Adviser:
                          </span>
                          <p className="font-medium text-blue-900">
                            {selectedStudent.companyAdviserId?.name ||
                              "Not assigned"}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm text-blue-700">
                            Company:
                          </span>
                          <p className="font-medium text-blue-900">
                            {selectedStudent.companyAdviserId?.companyName ||
                              "Not specified"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === "messages" && (
          <div className="bg-white rounded-lg shadow-sm border">
            <AdviserMessagingPanel
              students={students}
              onStudentSelect={setSelectedStudent}
            />
          </div>
        )}

        {/* Evaluation Detail Modal */}
        {selectedEvaluation && (
          <FacultyHeadEvaluationView
            evaluation={selectedEvaluation}
            onClose={() => setSelectedEvaluation(null)}
          />
        )}

        {/* Old Evaluation Detail Modal - Keeping as backup */}
        {false && selectedEvaluation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  Final Evaluation Details -{" "}
                  {selectedEvaluation.studentId?.name ||
                    selectedEvaluation.studentInfo?.fullName}
                </h2>
                <button
                  onClick={() => setSelectedEvaluation(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Student & Company Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">
                      Student Information
                    </h3>
                    <div className="space-y-2">
                      <p>
                        <span className="font-medium">Name:</span>{" "}
                        {selectedEvaluation.studentId?.name ||
                          selectedEvaluation.studentInfo?.fullName}
                      </p>
                      <p>
                        <span className="font-medium">Email:</span>{" "}
                        {selectedEvaluation.studentId?.email ||
                          selectedEvaluation.studentInfo?.email}
                      </p>
                      <p>
                        <span className="font-medium">University:</span>{" "}
                        {selectedEvaluation.studentInfo?.university || "N/A"}
                      </p>
                      <p>
                        <span className="font-medium">Program:</span>{" "}
                        {selectedEvaluation.studentInfo?.program || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">
                      Company Information
                    </h3>
                    <div className="space-y-2">
                      <p>
                        <span className="font-medium">Company:</span>{" "}
                        {selectedEvaluation.studentInfo?.companyName}
                      </p>
                      <p>
                        <span className="font-medium">Adviser:</span>{" "}
                        {selectedEvaluation.companyAdviserId?.name ||
                          selectedEvaluation.studentInfo?.companyAdviser}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Evaluation Scores */}
                {selectedEvaluation.finalEvaluation && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">
                      Evaluation Scores
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-600">
                            Technical Skills
                          </p>
                          <p className="text-2xl font-bold text-blue-600">
                            {selectedEvaluation.finalEvaluation
                              .technicalSkills || 0}
                            %
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Communication</p>
                          <p className="text-2xl font-bold text-green-600">
                            {selectedEvaluation.finalEvaluation.communication ||
                              0}
                            %
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Total Score</p>
                          <p className="text-3xl font-bold text-purple-600">
                            {selectedEvaluation.finalEvaluation.total || 0}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Evaluation Details */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Evaluation Details
                    </h3>
                    <button
                      onClick={() => exportEvaluationPDF(selectedEvaluation)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>Export PDF</span>
                    </button>
                  </div>

                  {/* Student Information */}
                  <div className="mb-6">
                    <h4 className="text-md font-medium text-gray-800 mb-3">
                      Student Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm text-gray-600">Name</p>
                        <p className="font-medium">
                          {selectedEvaluation.studentId?.name || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium">
                          {selectedEvaluation.studentId?.email || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">University</p>
                        <p className="font-medium">
                          {selectedEvaluation.studentInfo?.university || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Program</p>
                        <p className="font-medium">
                          {selectedEvaluation.studentInfo?.program || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Attendance Section with Calendar View */}
                  {selectedEvaluation.attendance && (
                    <div className="mb-6">
                      <h4 className="text-md font-medium text-gray-800 mb-3">
                        Attendance Summary
                      </h4>

                      {/* Stats Cards */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-blue-50 p-4 rounded-lg text-center">
                          <p className="text-sm text-gray-600">Total Days</p>
                          <p className="text-xl font-bold text-blue-600">
                            {selectedEvaluation.attendance.totalDays || 0}
                          </p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg text-center">
                          <p className="text-sm text-gray-600">Present</p>
                          <p className="text-xl font-bold text-green-600">
                            {selectedEvaluation.attendance.presentDays || 0}
                          </p>
                        </div>
                        <div className="bg-red-50 p-4 rounded-lg text-center">
                          <p className="text-sm text-gray-600">Absent</p>
                          <p className="text-xl font-bold text-red-600">
                            {selectedEvaluation.attendance.absentDays || 0}
                          </p>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg text-center">
                          <p className="text-sm text-gray-600">
                            Attendance Rate
                          </p>
                          <p className="text-xl font-bold text-purple-600">
                            {selectedEvaluation.attendance
                              .attendancePercentage || 0}
                            %
                          </p>
                        </div>
                      </div>

                      {/* Calendar View */}
                      {selectedEvaluation.attendance.records &&
                        selectedEvaluation.attendance.records.length > 0 && (
                          <div className="bg-white border rounded-lg p-4">
                            <h5 className="text-sm font-medium text-gray-700 mb-3">
                              Attendance Calendar
                            </h5>
                            <div className="overflow-x-auto">
                              <table className="w-full border-collapse">
                                <thead>
                                  <tr className="bg-gray-50">
                                    <th className="border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700">
                                      Week
                                    </th>
                                    <th className="border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700">
                                      Mon
                                    </th>
                                    <th className="border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700">
                                      Tue
                                    </th>
                                    <th className="border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700">
                                      Wed
                                    </th>
                                    <th className="border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700">
                                      Thu
                                    </th>
                                    <th className="border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700">
                                      Fri
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(() => {
                                    const records =
                                      selectedEvaluation.attendance.records ||
                                      [];
                                    const weeks: { [key: string]: any[] } = {};

                                    // Group records by week
                                    records.forEach((record: any) => {
                                      const date = new Date(record.date);
                                      const weekStart = new Date(date);
                                      weekStart.setDate(
                                        date.getDate() - date.getDay() + 1
                                      ); // Monday
                                      const weekKey = weekStart
                                        .toISOString()
                                        .split("T")[0];

                                      if (!weeks[weekKey]) weeks[weekKey] = [];
                                      weeks[weekKey].push(record);
                                    });

                                    return Object.entries(weeks)
                                      .sort(([a], [b]) => a.localeCompare(b))
                                      .map(([weekStart, weekRecords]) => {
                                        const startDate = new Date(weekStart);
                                        const weekDays = Array.from(
                                          { length: 5 },
                                          (_, i) => {
                                            const day = new Date(startDate);
                                            day.setDate(
                                              startDate.getDate() + i
                                            );
                                            return day;
                                          }
                                        );

                                        return (
                                          <tr key={weekStart}>
                                            <td className="border border-gray-200 px-3 py-2 text-xs text-gray-600 bg-gray-50">
                                              {startDate.toLocaleDateString(
                                                "en-US",
                                                {
                                                  month: "short",
                                                  day: "numeric",
                                                }
                                              )}
                                            </td>
                                            {weekDays.map((day, dayIndex) => {
                                              const dayStr = day
                                                .toISOString()
                                                .split("T")[0];
                                              const dayRecord =
                                                weekRecords.find(
                                                  (r: any) =>
                                                    new Date(r.date)
                                                      .toISOString()
                                                      .split("T")[0] === dayStr
                                                );

                                              return (
                                                <td
                                                  key={dayIndex}
                                                  className="border border-gray-200 px-3 py-2 text-center"
                                                >
                                                  <div className="flex flex-col items-center">
                                                    <span className="text-xs text-gray-500 mb-1">
                                                      {day.getDate()}
                                                    </span>
                                                    {dayRecord ? (
                                                      <div
                                                        className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                                                          dayRecord.status ===
                                                          "present"
                                                            ? "bg-green-500"
                                                            : dayRecord.status ===
                                                              "absent"
                                                            ? "bg-red-500"
                                                            : dayRecord.status ===
                                                              "late"
                                                            ? "bg-yellow-500"
                                                            : dayRecord.status ===
                                                              "excused"
                                                            ? "bg-blue-500"
                                                            : "bg-gray-400"
                                                        }`}
                                                      >
                                                        {dayRecord.status ===
                                                        "present"
                                                          ? "✓"
                                                          : dayRecord.status ===
                                                            "absent"
                                                          ? "✗"
                                                          : dayRecord.status ===
                                                            "late"
                                                          ? "L"
                                                          : dayRecord.status ===
                                                            "excused"
                                                          ? "E"
                                                          : "?"}
                                                      </div>
                                                    ) : (
                                                      <div className="w-6 h-6 rounded-full bg-gray-100 border border-gray-300"></div>
                                                    )}
                                                  </div>
                                                </td>
                                              );
                                            })}
                                          </tr>
                                        );
                                      });
                                  })()}
                                </tbody>
                              </table>
                            </div>

                            {/* Legend */}
                            <div className="mt-4 flex flex-wrap gap-4 text-xs">
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                                  ✓
                                </div>
                                <span>Present</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white font-bold">
                                  ✗
                                </div>
                                <span>Absent</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold">
                                  L
                                </div>
                                <span>Late</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                                  E
                                </div>
                                <span>Excused</span>
                              </div>
                            </div>
                          </div>
                        )}
                    </div>
                  )}

                  {/* Supporting Documents Section */}
                  {selectedEvaluation.supportingDocuments &&
                    selectedEvaluation.supportingDocuments.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-md font-medium text-gray-800 mb-3">
                          Supporting Documents
                        </h4>
                        <div className="space-y-2">
                          {selectedEvaluation.supportingDocuments.map(
                            (document: any, index: number) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                              >
                                <div className="flex items-center space-x-3">
                                  <FileText className="w-5 h-5 text-blue-600" />
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium">
                                      {document.name || `File ${index + 1}`}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {document.type} •{" "}
                                      {(document.size / 1024).toFixed(1)} KB
                                    </span>
                                  </div>
                                </div>
                                <button
                                  onClick={() =>
                                    downloadSupportingDocument(document)
                                  }
                                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center space-x-1"
                                >
                                  <Download className="w-4 h-4" />
                                  <span>Download</span>
                                </button>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                </div>

                {/* Comments */}
                {selectedEvaluation.comments && (
                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">
                      Comments & Recommendations
                    </h3>
                    <div className="space-y-3">
                      {selectedEvaluation.comments.strengths && (
                        <div>
                          <p className="font-medium text-green-700">
                            Strengths:
                          </p>
                          <p className="text-gray-700">
                            {selectedEvaluation.comments.strengths}
                          </p>
                        </div>
                      )}
                      {selectedEvaluation.comments.improvements && (
                        <div>
                          <p className="font-medium text-orange-700">
                            Areas for Improvement:
                          </p>
                          <p className="text-gray-700">
                            {selectedEvaluation.comments.improvements}
                          </p>
                        </div>
                      )}
                      {selectedEvaluation.comments.finalRecommendation && (
                        <div>
                          <p className="font-medium text-blue-700">
                            Final Recommendation:
                          </p>
                          <p className="text-gray-700">
                            {selectedEvaluation.comments.finalRecommendation}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Supporting Documents */}
                {selectedEvaluation.supportingDocuments &&
                  selectedEvaluation.supportingDocuments.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-3">
                        Supporting Documents
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {selectedEvaluation.supportingDocuments.map(
                          (document: any, index: number) => (
                            <button
                              key={index}
                              onClick={() =>
                                downloadSupportingDocument(document)
                              }
                              className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                            >
                              <FileText className="w-5 h-5 text-blue-600 mr-3" />
                              <div className="text-left">
                                <p className="font-medium text-gray-900">
                                  {document.name}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {(document.size / 1024).toFixed(1)} KB
                                </p>
                              </div>
                              <Download className="w-4 h-4 text-gray-400 ml-auto" />
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {/* Review Notes */}
                {selectedEvaluation.status === "submitted" && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">
                      Review Notes (Optional)
                    </h3>
                    <textarea
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="Add any notes or feedback for this evaluation..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={4}
                    />
                  </div>
                )}

                {/* Action Buttons */}
                {selectedEvaluation.status === "submitted" && (
                  <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => setSelectedEvaluation(null)}
                      className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        review(selectedEvaluation._id, "rejected", reviewNotes);
                        setSelectedEvaluation(null);
                        setReviewNotes("");
                      }}
                      className="inline-flex items-center px-4 py-2 text-sm rounded bg-red-600 text-white hover:bg-red-700"
                    >
                      <XCircle className="w-4 h-4 mr-1" /> Reject
                    </button>
                    <button
                      onClick={() => {
                        review(selectedEvaluation._id, "approved", reviewNotes);
                        setSelectedEvaluation(null);
                        setReviewNotes("");
                      }}
                      className="inline-flex items-center px-4 py-2 text-sm rounded bg-green-600 text-white hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" /> Approve
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FacultyHeadDashboard;
