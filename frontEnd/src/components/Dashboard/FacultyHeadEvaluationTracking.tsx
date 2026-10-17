import React, { useState, useEffect } from "react";
import { finalEvaluationAPI, accountManagementAPI } from "../../services/api";
import {
  ArrowLeft,
  FileText,
  Download,
  Calendar,
  User,
  AlertCircle,
  Clock,
  Award,
  MessageSquare,
} from "lucide-react";
import toast from "react-hot-toast";

interface Props {
  student: any;
  onBack: () => void;
}

interface EvaluationData {
  _id: string;
  studentId: string;
  companyAdviserId: any;
  universityAdviserId: any;
  facultyHeadId: any;
  status: string;
  evaluationCriteria: any[];
  attendance: any[];
  supervisorFeedback: any;
  finalEvaluation: any;
  comments: string;
  signatures: any;
  attachments: any[];
  createdAt: string;
  updatedAt: string;
  student?: any;
}

const FacultyHeadEvaluationTracking: React.FC<Props> = ({
  student,
  onBack,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [evaluationData, setEvaluationData] = useState<EvaluationData | null>(
    null
  );
  const [hasEvaluationData, setHasEvaluationData] = useState(false);

  useEffect(() => {
    const fetchEvaluationData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log(
          "🔍 Fetching final evaluation data for student:",
          student._id
        );

        const response =
          await finalEvaluationAPI.getFacultyHeadFinalEvaluationData(
            student._id
          );

        console.log("📊 Full API Response:", response);
        console.log("📊 Response Type:", typeof response);
        console.log(
          "📊 Response Keys:",
          response ? Object.keys(response) : "No response"
        );

        // Check if response exists
        if (!response) {
          console.error("❌ API response is null - possible network error");
          setError("Failed to fetch evaluation data - network error");
          setHasEvaluationData(false);
          return;
        }

        // The backend returns: { success: true, data: evaluationData }
        // Based on progress pattern, the response structure should be consistent
        let responseData = null;

        // Check if we have the expected structure
        if (
          response &&
          (response as any).success === true &&
          (response as any).data
        ) {
          responseData = (response as any).data;
          console.log("✅ Found evaluation data in response.data");
        } else if (
          response &&
          (response as any).data &&
          typeof (response as any).data === "object"
        ) {
          // Direct data object (in case structure is different)
          responseData = (response as any).data;
          console.log("✅ Using response.data directly");
        } else {
          console.log("❌ Unexpected response structure");
        }

        console.log("📊 Evaluation API Response:", response);
        console.log("📊 Evaluation Data:", responseData);
        console.log("📊 Response Success:", (response as any).success);
        console.log("📊 Response Message:", (response as any).message);

        if (
          responseData &&
          responseData !== null &&
          Object.keys(responseData).length > 0
        ) {
          setHasEvaluationData(true);
          setEvaluationData(responseData);
          console.log("✅ Final evaluation data loaded successfully");
        } else {
          setHasEvaluationData(false);
          setEvaluationData(null);
          console.log("ℹ️ No final evaluation data submitted yet");
        }
      } catch (error: any) {
        console.error("❌ Error fetching evaluation data:", error);
        setError(error?.message || "Failed to fetch evaluation data");
        setHasEvaluationData(false);
        setEvaluationData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchEvaluationData();
  }, [student._id]);

  const calculateTotalScore = (criteria: any) => {
    if (!criteria || typeof criteria !== "object") return 0;

    // Handle array format
    if (Array.isArray(criteria)) {
      if (criteria.length === 0) return 0;
      const total = criteria.reduce(
        (sum, criterion) => sum + (criterion.score || 0),
        0
      );
      return Math.round((total / criteria.length) * 100) / 100;
    }

    // Handle object format (evaluationCriteria as object)
    const values = Object.values(criteria).filter(
      (val) => typeof val === "number"
    );
    if (values.length === 0) return 0;
    const total = values.reduce((sum: number, score: any) => sum + score, 0);
    return Math.round((total / values.length) * 100) / 100;
  };

  const getGradeFromScore = (score: number) => {
    if (score >= 90) return "A";
    if (score >= 80) return "B";
    if (score >= 70) return "C";
    if (score >= 60) return "D";
    return "F";
  };

  const downloadAttachment = async (
    attachmentIndex: number,
    filename: string
  ) => {
    try {
      if (!evaluationData) return;

      const response = await accountManagementAPI.downloadEvaluationAttachment(
        evaluationData._id,
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
    } catch (error: any) {
      console.error("Download error:", error);
      toast.error("Failed to download file");
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft size={20} />
            Back to Students
          </button>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading evaluation data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft size={20} />
            Back to Students
          </button>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle size={20} />
            <span className="font-medium">Error Loading Evaluation</span>
          </div>
          <p className="text-red-700 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft size={20} />
          Back to Students
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            Student Evaluation Details
          </h1>
          <p className="text-gray-600">Student: {student.name}</p>
        </div>
      </div>

      {/* Student Info Card */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <User size={20} />
          Student Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-600">Name</label>
            <p className="text-gray-900">{student.name}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Email</label>
            <p className="text-gray-900">{student.email}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">
              University
            </label>
            <p className="text-gray-900">
              {student.university_name || "Not specified"}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Program</label>
            <p className="text-gray-900">
              {student.groupAssignment?.programId?.name || "Not assigned"}
            </p>
          </div>
        </div>
      </div>

      {/* Evaluation Status */}
      {!hasEvaluationData ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <Clock size={48} className="mx-auto text-yellow-600 mb-4" />
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
            No Evaluation Submitted
          </h3>
          <p className="text-yellow-700">
            The Company Adviser has not yet submitted a final evaluation for
            this student.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Evaluation Criteria */}
          {evaluationData?.evaluationCriteria &&
            evaluationData.evaluationCriteria.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Award size={20} />
                  Evaluation Criteria
                </h2>
                <div className="space-y-3">
                  {evaluationData.evaluationCriteria.map(
                    (criterion: any, index: number) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-3 bg-gray-50 rounded"
                      >
                        <span className="font-medium">
                          {criterion.criterion}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-blue-600">
                            {criterion.score}
                          </span>
                          <span className="text-sm text-gray-500">/ 5</span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

          {/* Attendance Summary */}
          {evaluationData?.attendance &&
            evaluationData.attendance.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Calendar size={20} />
                  Attendance Summary
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-green-50 p-3 rounded-lg text-center">
                    <div className="text-xl font-bold text-green-600">
                      {
                        evaluationData.attendance.filter(
                          (a: any) => a.status === "present"
                        ).length
                      }
                    </div>
                    <div className="text-sm text-green-800">Present Days</div>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg text-center">
                    <div className="text-xl font-bold text-red-600">
                      {
                        evaluationData.attendance.filter(
                          (a: any) => a.status === "absent"
                        ).length
                      }
                    </div>
                    <div className="text-sm text-red-800">Absent Days</div>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded-lg text-center">
                    <div className="text-xl font-bold text-yellow-600">
                      {
                        evaluationData.attendance.filter(
                          (a: any) => a.status === "late"
                        ).length
                      }
                    </div>
                    <div className="text-sm text-yellow-800">Late Days</div>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg text-center">
                    <div className="text-xl font-bold text-blue-600">
                      {Math.round(
                        (evaluationData.attendance.filter(
                          (a: any) => a.status === "present"
                        ).length /
                          evaluationData.attendance.length) *
                          100
                      )}
                      %
                    </div>
                    <div className="text-sm text-blue-800">Attendance Rate</div>
                  </div>
                </div>
              </div>
            )}

          {/* Supervisor Feedback */}
          {evaluationData?.supervisorFeedback && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MessageSquare size={20} />
                Supervisor Feedback
              </h2>
              <div className="space-y-4">
                {evaluationData.supervisorFeedback.strengths && (
                  <div>
                    <h3 className="font-medium text-green-800 mb-2">
                      Strengths
                    </h3>
                    <p className="text-gray-700 bg-green-50 p-3 rounded">
                      {typeof evaluationData.supervisorFeedback.strengths ===
                      "string"
                        ? evaluationData.supervisorFeedback.strengths
                        : JSON.stringify(
                            evaluationData.supervisorFeedback.strengths
                          )}
                    </p>
                  </div>
                )}
                {evaluationData.supervisorFeedback.improvements && (
                  <div>
                    <h3 className="font-medium text-orange-800 mb-2">
                      Areas for Improvement
                    </h3>
                    <p className="text-gray-700 bg-orange-50 p-3 rounded">
                      {typeof evaluationData.supervisorFeedback.improvements ===
                      "string"
                        ? evaluationData.supervisorFeedback.improvements
                        : JSON.stringify(
                            evaluationData.supervisorFeedback.improvements
                          )}
                    </p>
                  </div>
                )}
                {evaluationData.supervisorFeedback.recommendations && (
                  <div>
                    <h3 className="font-medium text-blue-800 mb-2">
                      Recommendations
                    </h3>
                    <p className="text-gray-700 bg-blue-50 p-3 rounded">
                      {typeof evaluationData.supervisorFeedback
                        .recommendations === "string"
                        ? evaluationData.supervisorFeedback.recommendations
                        : JSON.stringify(
                            evaluationData.supervisorFeedback.recommendations
                          )}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Comments */}
          {evaluationData?.comments && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-4">
                Additional Comments
              </h2>
              <div className="space-y-4">
                {typeof evaluationData.comments === "string" ? (
                  <p className="text-gray-700 bg-gray-50 p-4 rounded">
                    {evaluationData.comments}
                  </p>
                ) : (
                  <>
                    {evaluationData.comments.majorStrengths && (
                      <div>
                        <h3 className="font-medium text-green-800 mb-2">
                          Major Strengths
                        </h3>
                        <p className="text-gray-700 bg-green-50 p-3 rounded">
                          {evaluationData.comments.majorStrengths}
                        </p>
                      </div>
                    )}
                    {evaluationData.comments.areasOfImprovement && (
                      <div>
                        <h3 className="font-medium text-orange-800 mb-2">
                          Areas of Improvement
                        </h3>
                        <p className="text-gray-700 bg-orange-50 p-3 rounded">
                          {evaluationData.comments.areasOfImprovement}
                        </p>
                      </div>
                    )}
                    {evaluationData.comments.finalRecommendation && (
                      <div>
                        <h3 className="font-medium text-blue-800 mb-2">
                          Final Recommendation
                        </h3>
                        <p className="text-gray-700 bg-blue-50 p-3 rounded">
                          {evaluationData.comments.finalRecommendation}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Attachments */}
          {evaluationData?.attachments &&
            evaluationData.attachments.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <FileText size={20} />
                  Attachments ({evaluationData.attachments.length})
                </h2>
                <div className="space-y-2">
                  {evaluationData.attachments.map(
                    (attachment: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded"
                      >
                        <div className="flex items-center gap-3">
                          <FileText size={16} className="text-gray-600" />
                          <span className="font-medium">
                            {attachment.originalName}
                          </span>
                          <span className="text-sm text-gray-500">
                            ({(attachment.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <button
                          onClick={() =>
                            downloadAttachment(index, attachment.originalName)
                          }
                          className="flex items-center gap-2 px-3 py-1 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Download size={16} />
                          Download
                        </button>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

          {/* Evaluation Metadata */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Evaluation Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Company Adviser
                </label>
                <p className="text-gray-900">
                  {evaluationData?.companyAdviserId?.name || "Not specified"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  University Adviser
                </label>
                <p className="text-gray-900">
                  {evaluationData?.universityAdviserId?.name || "Not specified"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyHeadEvaluationTracking;
