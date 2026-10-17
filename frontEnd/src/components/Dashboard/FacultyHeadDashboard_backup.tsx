
import React, { useEffect, useState } from "react";
import { accountManagementAPI } from "../../services/api";
import { 
  CheckCircle, 
  XCircle, 
  Download, 
  Search, 
  Filter, 
  RefreshCw, 
  Building, 
  BookOpen,
  Award,
  Users,
  Calendar,
  TrendingUp,
  Eye,
  User,
  FileText
} from "lucide-react";
import ProfileUpdate from "./ProfileUpdate";
import toast from "react-hot-toast";

const FacultyHeadDashboard: React.FC = () => {
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showProfileUpdate, setShowProfileUpdate] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'evaluations' | 'students'>('evaluations');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await accountManagementAPI.getFinalEvaluationsForFacultyHead();
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
      console.log('Loading assigned students for Faculty Head...');
      const res = await accountManagementAPI.getAssignedStudentsForFacultyHead();
      console.log('Faculty Head students API response:', res);
      
      const studentsList = res.data?.students || [];
      console.log('Faculty Head assigned students:', studentsList);
      setStudents(studentsList);
      
      if (studentsList.length === 0) {
        console.log('No students assigned to this Faculty Head');
      } else {
        console.log(`Successfully loaded ${studentsList.length} assigned students for Faculty Head`);
      }
    } catch (e: any) {
      console.error('Error loading assigned students for Faculty Head:', e);
      toast.error("Failed to load assigned students");
    } finally {
      setStudentsLoading(false);
    }
  };

  useEffect(() => {
    load();
    loadAssignedStudents();
  }, []);

  const review = async (id: string, status: "approved" | "rejected", reviewNotes?: string) => {
    try {
      await accountManagementAPI.reviewFinalEvaluation(id, { status, reviewNotes });
      toast.success(`Evaluation ${status} successfully`);
      await load();
    } catch (e: any) {
      toast.error(e?.message || `Failed to ${status} evaluation`);
    }
  };

  const downloadAttachment = async (evaluationId: string, attachmentIndex: number, filename: string) => {
    try {
      const response = await accountManagementAPI.downloadEvaluationAttachment(evaluationId, attachmentIndex);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('File downloaded successfully');
    } catch (e: any) {
      toast.error('Failed to download file');
    }
  };

  const filteredEvaluations = evaluations.filter(ev => {
    const matchesStatus = filterStatus === 'all' || ev.status === filterStatus;
    const matchesSearch = !searchTerm || 
      ev.studentId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.studentInfo?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.companyAdviserId?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (showProfileUpdate) {
    return <ProfileUpdate onBack={() => setShowProfileUpdate(false)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Faculty Head Dashboard</h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowProfileUpdate(true)}
                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <User className="w-4 h-4 inline mr-2" />
                Update Profile
              </button>
              <button onClick={() => { load(); loadAssignedStudents(); }} className="text-sm text-blue-600 hover:text-blue-800">Refresh</button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('evaluations')}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'evaluations'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Award className="w-5 h-5" />
                <span>Final Evaluations</span>
              </button>
              <button
                onClick={() => setActiveTab('students')}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'students'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Users className="w-5 h-5" />
                <span>Assigned Students ({students.length})</span>
              </button>
            </nav>
          </div>

          {/* Stats Cards */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center">
                <FileText className="w-8 h-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-900">Total Evaluations</p>
                  <p className="text-2xl font-bold text-blue-600">{evaluations.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center">
                <Calendar className="w-8 h-8 text-yellow-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-yellow-900">Pending Review</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {evaluations.filter(ev => ev.status === 'submitted').length}
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
                    {evaluations.filter(ev => ev.status === 'approved').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-purple-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-purple-900">Assigned Students</p>
                  <p className="text-2xl font-bold text-purple-600">{students.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'evaluations' && (
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
                  <p>{searchTerm || filterStatus !== 'all' ? 'No evaluations match your criteria' : 'No final evaluations yet'}</p>
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
                            {ev.studentInfo?.companyName} • Company Adviser: {ev.companyAdviserId?.name || ev.studentInfo?.companyAdviser}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            ev.status === 'approved' ? 'bg-green-100 text-green-800' :
                            ev.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {ev.status === 'submitted' ? 'Pending Review' : ev.status}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center">
                          <Award className="w-4 h-4 text-purple-600 mr-2" />
                          <span className="text-sm text-gray-600">Total Score: </span>
                          <span className="font-medium text-purple-600 ml-1">{ev.finalEvaluation?.total ?? 0}%</span>
                        </div>
                        <div className="flex items-center">
                          <TrendingUp className="w-4 h-4 text-green-600 mr-2" />
                          <span className="text-sm text-gray-600">Recommendation: </span>
                          <span className={`font-medium ml-1 ${
                            ev.comments?.finalRecommendation === 'Continue' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {ev.comments?.finalRecommendation || 'N/A'}
                          </span>
                        </div>
                      </div>

                      {/* Attachments */}
                      {ev.attachments && ev.attachments.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Attachments:</h4>
                          <div className="flex flex-wrap gap-2">
                            {ev.attachments.map((attachment: any, index: number) => (
                              <button
                                key={index}
                                onClick={() => downloadAttachment(ev._id, index, attachment.originalName)}
                                className="inline-flex items-center px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                              >
                                <Download className="w-3 h-3 mr-1" />
                                {attachment.originalName}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      {ev.status === 'submitted' && (
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => setSelectedEvaluation(ev)}
                            className="inline-flex items-center px-3 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
                          >
                            <Eye className="w-4 h-4 mr-1" /> View Details
                          </button>
                          <button 
                            onClick={() => review(ev._id, "approved")} 
                            className="inline-flex items-center px-3 py-2 text-sm rounded bg-green-600 text-white hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" /> Approve
                          </button>
                          <button 
                            onClick={() => review(ev._id, "rejected")} 
                            className="inline-flex items-center px-3 py-2 text-sm rounded bg-red-600 text-white hover:bg-red-700"
                          >
                            <XCircle className="w-4 h-4 mr-1" /> Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          </>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div className="bg-white rounded-lg shadow-sm border">
            {studentsLoading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading assigned students...</p>
              </div>
            ) : students.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No students assigned to you yet</p>
              </div>
            ) : (
              <div className="divide-y">
                {students.map((student: any) => (
                  <div key={student._id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-3">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">{student.name}</h3>
                            <p className="text-sm text-gray-600">{student.email}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center">
                            <Building className="w-4 h-4 text-blue-600 mr-2" />
                            <span className="text-sm text-gray-600">University: </span>
                            <span className="font-medium text-blue-600 ml-1">
                              {student.profile?.university || 'N/A'}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <BookOpen className="w-4 h-4 text-green-600 mr-2" />
                            <span className="text-sm text-gray-600">Course: </span>
                            <span className="font-medium text-green-600 ml-1">
                              {student.profile?.course || 'N/A'}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 text-purple-600 mr-2" />
                            <span className="text-sm text-gray-600">Program: </span>
                            <span className="font-medium text-purple-600 ml-1">
                              {student.groupAssignment?.programName || 'Not assigned'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Evaluation Detail Modal */}
        {selectedEvaluation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  Final Evaluation Details - {selectedEvaluation.studentId?.name || selectedEvaluation.studentInfo?.fullName}
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
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Student Information</h3>
                    <div className="space-y-2">
                      <p><span className="font-medium">Name:</span> {selectedEvaluation.studentId?.name || selectedEvaluation.studentInfo?.fullName}</p>
                      <p><span className="font-medium">Email:</span> {selectedEvaluation.studentId?.email || selectedEvaluation.studentInfo?.email}</p>
                      <p><span className="font-medium">Program:</span> {selectedEvaluation.studentInfo?.program || 'N/A'}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Company Information</h3>
                    <div className="space-y-2">
                      <p><span className="font-medium">Company:</span> {selectedEvaluation.studentInfo?.companyName}</p>
                      <p><span className="font-medium">Adviser:</span> {selectedEvaluation.companyAdviserId?.name || selectedEvaluation.studentInfo?.companyAdviser}</p>
                    </div>
                  </div>
                </div>

                {/* Evaluation Scores */}
                {selectedEvaluation.finalEvaluation && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Evaluation Scores</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Technical Skills</p>
                          <p className="text-2xl font-bold text-blue-600">{selectedEvaluation.finalEvaluation.technicalSkills || 0}%</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Communication</p>
                          <p className="text-2xl font-bold text-green-600">{selectedEvaluation.finalEvaluation.communication || 0}%</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Total Score</p>
                          <p className="text-3xl font-bold text-purple-600">{selectedEvaluation.finalEvaluation.total || 0}%</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Comments */}
                {selectedEvaluation.comments && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Comments & Recommendations</h3>
                    <div className="space-y-3">
                      {selectedEvaluation.comments.strengths && (
                        <div>
                          <p className="font-medium text-green-700">Strengths:</p>
                          <p className="text-gray-700">{selectedEvaluation.comments.strengths}</p>
                        </div>
                      )}
                      {selectedEvaluation.comments.improvements && (
                        <div>
                          <p className="font-medium text-orange-700">Areas for Improvement:</p>
                          <p className="text-gray-700">{selectedEvaluation.comments.improvements}</p>
                        </div>
                      )}
                      {selectedEvaluation.comments.finalRecommendation && (
                        <div>
                          <p className="font-medium text-blue-700">Final Recommendation:</p>
                          <p className="text-gray-700">{selectedEvaluation.comments.finalRecommendation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Attachments */}
                {selectedEvaluation.attachments && selectedEvaluation.attachments.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Attachments</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedEvaluation.attachments.map((attachment: any, index: number) => (
                        <button
                          key={index}
                          onClick={() => downloadAttachment(selectedEvaluation._id, index, attachment.originalName)}
                          className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                          <FileText className="w-5 h-5 text-blue-600 mr-3" />
                          <div className="text-left">
                            <p className="font-medium text-gray-900">{attachment.originalName}</p>
                            <p className="text-sm text-gray-500">{(attachment.size / 1024).toFixed(1)} KB</p>
                          </div>
                          <Download className="w-4 h-4 text-gray-400 ml-auto" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Review Notes */}
                {selectedEvaluation.status === 'submitted' && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Review Notes (Optional)</h3>
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
                {selectedEvaluation.status === 'submitted' && (
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
                        setReviewNotes('');
                      }}
                      className="inline-flex items-center px-4 py-2 text-sm rounded bg-red-600 text-white hover:bg-red-700"
                    >
                      <XCircle className="w-4 h-4 mr-1" /> Reject
                    </button>
                    <button
                      onClick={() => {
                        review(selectedEvaluation._id, "approved", reviewNotes);
                        setSelectedEvaluation(null);
                        setReviewNotes('');
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
