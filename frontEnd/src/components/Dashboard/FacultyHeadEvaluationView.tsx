import React, { useState } from "react";
import {
  Download,
  FileText,
  Eye,
  Star,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Award,
  User,
  Building,
  X,
  ArrowLeft,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { accountManagementAPI } from "../../services/api";
import FacultyHeadAttendanceView from "./FacultyHeadAttendanceView";

interface FacultyHeadEvaluationViewProps {
  evaluation: any;
  onClose: () => void;
}

const FacultyHeadEvaluationView: React.FC<FacultyHeadEvaluationViewProps> = ({
  evaluation,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<
    "overview" | "criteria" | "attendance" | "files"
  >("overview");
  const [currentWeek, setCurrentWeek] = useState(0);

  // Calculate category scores from evaluation criteria
  const calculateCategoryScores = () => {
    if (!evaluation?.evaluationCriteria)
      return {
        generalPerformance: 0,
        personalSkills: 0,
        professionalSkills: 0,
      };

    const criteria = evaluation.evaluationCriteria;

    // General Performance (25%) - 5 criteria
    const generalPerformanceKeys = [
      "punctuality",
      "reliability",
      "independence",
      "communication",
      "professionalism",
    ];
    const generalPerformanceTotal = generalPerformanceKeys.reduce(
      (sum, key) => sum + (criteria[key] || 0),
      0
    );
    const generalPerformance = Math.round(
      (generalPerformanceTotal / (generalPerformanceKeys.length * 5)) * 100
    );

    // Personal Skills (25%) - 5 criteria
    const personalSkillsKeys = [
      "speedOfWork",
      "accuracy",
      "engagement",
      "cooperation",
      "recommendation",
    ];
    const personalSkillsTotal = personalSkillsKeys.reduce(
      (sum, key) => sum + (criteria[key] || 0),
      0
    );
    const personalSkills = Math.round(
      (personalSkillsTotal / (personalSkillsKeys.length * 5)) * 100
    );

    // Professional Skills (50%) - 5 criteria
    const professionalSkillsKeys = [
      "technicalKnowledge",
      "problemSolving",
      "organizing",
      "responsibility",
      "initiative",
    ];
    const professionalSkillsTotal = professionalSkillsKeys.reduce(
      (sum, key) => sum + (criteria[key] || 0),
      0
    );
    const professionalSkills = Math.round(
      (professionalSkillsTotal / (professionalSkillsKeys.length * 5)) * 100
    );

    return { generalPerformance, personalSkills, professionalSkills };
  };

  const categoryScores = calculateCategoryScores();

  // Calculate dynamic attendance statistics from Company Adviser data
  const calculateAttendanceStats = () => {
    // Try to get exact values from Company Adviser saved data (FinalEvaluation format)
    if (evaluation?.attendance?.totalDays !== undefined) {
      // Use exact values from Company Adviser saved data
      const totalDays = evaluation.attendance.totalDays || 0;
      const presentDays = evaluation.attendance.presentDays || 0;
      const absentDays = evaluation.attendance.absentDays || 0;

      // Calculate attendance rate from exact saved values
      const attendanceRate =
        totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

      // Calculate weeks and remaining days from exact total days
      const totalWeeksDecimal = totalDays / 7;
      const completeWeeks = Math.floor(totalWeeksDecimal);
      const remainingDays = totalDays % 7;

      return {
        totalDays,
        presentDays,
        absentDays,
        attendanceRate: Math.round(attendanceRate * 10) / 10,
        totalWeeks: Math.ceil(totalDays / 7),
        completeWeeks,
        remainingDays,
        weeksDisplay:
          remainingDays > 0
            ? `${completeWeeks} weeks and ${remainingDays} days`
            : `${completeWeeks} weeks`,
      };
    }

    // Fallback: Try to calculate from attendance records if available
    if (
      evaluation?.attendance?.records &&
      evaluation.attendance.records.length > 0
    ) {
      const records = evaluation.attendance.records;

      // Calculate from attendance records
      const presentDays = records.filter(
        (record: any) => record.status === "Present"
      ).length;
      const absentDays = records.filter(
        (record: any) => record.status === "Absent"
      ).length;
      const totalDays = records.length; // Use actual records count as total days

      const attendanceRate =
        totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

      // Calculate weeks and remaining days
      const totalWeeksDecimal = totalDays / 7;
      const completeWeeks = Math.floor(totalWeeksDecimal);
      const remainingDays = totalDays % 7;

      return {
        totalDays,
        presentDays,
        absentDays,
        attendanceRate: Math.round(attendanceRate * 10) / 10,
        totalWeeks: Math.ceil(totalDays / 7),
        completeWeeks,
        remainingDays,
        weeksDisplay:
          remainingDays > 0
            ? `${completeWeeks} weeks and ${remainingDays} days`
            : `${completeWeeks} weeks`,
      };
    }

    // Fallback to legacy weeks format if records not available
    if (
      !evaluation?.attendance?.weeks ||
      evaluation.attendance.weeks.length === 0
    ) {
      return {
        totalDays: 0,
        presentDays: 0,
        absentDays: 0,
        attendanceRate: 0,
        totalWeeks: 0,
        completeWeeks: 0,
        remainingDays: 0,
        weeksDisplay: "0 weeks",
      };
    }

    const weeks = evaluation.attendance.weeks;
    const totalDays = weeks.length * 5; // 5 working days per week

    let presentDays = 0;
    let absentDays = 0;

    weeks.forEach((week: any) => {
      ["monday", "tuesday", "wednesday", "thursday", "friday"].forEach(
        (day) => {
          if (week[day] === "present") {
            presentDays++;
          } else if (week[day] === "absent") {
            absentDays++;
          }
        }
      );
    });

    const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

    // Calculate weeks and remaining days for legacy format too
    const totalWeeksDecimal = totalDays / 7;
    const completeWeeks = Math.floor(totalWeeksDecimal);
    const remainingDays = totalDays % 7;

    return {
      totalDays,
      presentDays,
      absentDays,
      attendanceRate: Math.round(attendanceRate * 10) / 10,
      totalWeeks: weeks.length,
      completeWeeks,
      remainingDays,
      weeksDisplay:
        remainingDays > 0
          ? `${completeWeeks} weeks and ${remainingDays} days`
          : `${completeWeeks} weeks`,
    };
  };

  const attendanceStats = calculateAttendanceStats();

  // Debug logging
  console.log("Faculty Head Evaluation Data:", evaluation);
  console.log(
    "Evaluation Criteria (15 individual):",
    evaluation?.evaluationCriteria
  );
  console.log(
    "Supervisor Evaluation (legacy):",
    evaluation?.supervisorEvaluation
  );
  console.log("Final Evaluation:", evaluation?.finalEvaluation);
  console.log("Attendance Data:", evaluation?.attendance);
  console.log(
    "Attendance Data Keys:",
    Object.keys(evaluation?.attendance || {})
  );
  console.log("Attendance Records:", evaluation?.attendance?.records);
  console.log("Attendance Weeks:", evaluation?.attendance?.weeks);
  console.log("Total Absent Days:", evaluation?.attendance?.totalAbsentDays);
  console.log(
    "Company Adviser Saved - Total Days:",
    evaluation?.attendance?.totalDays
  );
  console.log(
    "Company Adviser Saved - Present Days:",
    evaluation?.attendance?.presentDays
  );
  console.log(
    "Company Adviser Saved - Absent Days:",
    evaluation?.attendance?.absentDays
  );
  console.log("Calculated Attendance Stats:", attendanceStats);
  console.log("Attachments:", evaluation?.attachments);

  const downloadAttachment = async (
    evaluationId: string,
    attachmentIndex: number,
    filename: string
  ) => {
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:5000/api"
        }/account-management/final-evaluations/${evaluationId}/attachments/${attachmentIndex}/download`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        console.error("Download failed:", response.status, response.statusText);
        toast.error("Failed to download file");
      }
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Failed to download file");
    }
  };

  const downloadSupportingDocument = async (fileDocument: any) => {
    try {
      const base64Data = fileDocument.data.split(",")[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: fileDocument.type });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileDocument.name);
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

  const viewSupportingDocument = async (fileDocument: any) => {
    try {
      // Convert base64 to blob and create object URL for viewing
      const base64Data = fileDocument.data.split(",")[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: fileDocument.type });
      const url = window.URL.createObjectURL(blob);

      // Open in new tab
      window.open(url, "_blank");

      // Clean up the URL after a delay to allow the browser to load it
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);

      toast.success("File opened in new tab");
    } catch (error) {
      console.error("Error viewing file:", error);
      toast.error("Failed to view file");
    }
  };

  const viewAttachment = async (attachmentIndex: number) => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL
        ? import.meta.env.VITE_API_URL.replace("/api", "")
        : "http://localhost:5000";

      // Find the attachment
      const attachment = evaluation?.attachments?.[attachmentIndex];
      if (attachment) {
        const fileUrl = `${baseUrl}/${attachment.filePath}`;
        window.open(fileUrl, "_blank");
      }
    } catch (error) {
      console.error("Error viewing file:", error);
      toast.error("Failed to view file");
    }
  };

  const exportEvaluationPDF = async () => {
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
        `evaluation_${evaluation.studentInfo?.fullName || "student"}.pdf`
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

  const getScoreColor = (score: number) => {
    if (score >= 4.5) return "text-green-600";
    if (score >= 3.5) return "text-yellow-600";
    if (score >= 2.5) return "text-orange-600";
    return "text-red-600";
  };

  const renderAttendanceCalendar = () => {
    // Use attendance records from Company Adviser if available
    if (
      evaluation?.attendance?.records &&
      evaluation.attendance.records.length > 0
    ) {
      const records = evaluation.attendance.records;
      const totalWeeks = attendanceStats.totalWeeks;

      // Group records by week
      const weeklyData = [];
      for (let week = 0; week < totalWeeks; week++) {
        const weekStart = week * 7;
        const weekRecords = records.slice(weekStart, weekStart + 7);
        weeklyData.push(weekRecords);
      }

      if (weeklyData.length === 0) {
        return (
          <div className="text-center py-12 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No attendance data available</p>
          </div>
        );
      }

      return (
        <div className="space-y-6">
          {/* Weekly Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentWeek(Math.max(0, currentWeek - 1))}
              disabled={currentWeek === 0}
              className="p-2 hover:bg-gray-100 rounded-full disabled:opacity-50"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h4 className="text-lg font-medium">
              Week {currentWeek + 1} of {totalWeeks} (
              {attendanceStats.weeksDisplay})
            </h4>
            <button
              onClick={() =>
                setCurrentWeek(Math.min(totalWeeks - 1, currentWeek + 1))
              }
              disabled={currentWeek >= totalWeeks - 1}
              className="p-2 hover:bg-gray-100 rounded-full disabled:opacity-50"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Calendar Grid for Records */}
          {weeklyData[currentWeek] && (
            <div className="bg-white rounded-lg border p-6">
              <div className="grid grid-cols-7 gap-2">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                  (day, index) => (
                    <div
                      key={day}
                      className="text-center font-medium text-gray-600 py-2"
                    >
                      {day}
                    </div>
                  )
                )}
                {weeklyData[currentWeek].map((record: any, index: number) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg text-center font-medium ${
                      record?.status === "Present"
                        ? "bg-green-100 text-green-800"
                        : record?.status === "Absent"
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {record?.status || "N/A"}
                  </div>
                ))}
                {/* Fill remaining days if week is incomplete */}
                {Array.from({ length: 7 - weeklyData[currentWeek].length }).map(
                  (_, index) => (
                    <div
                      key={`empty-${index}`}
                      className="p-3 rounded-lg bg-gray-50"
                    ></div>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      );
    }

    // Fallback to legacy weeks format
    const weeks = evaluation.attendance?.weeks || [];
    const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

    // If no weeks data, show message
    if (weeks.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No attendance data available</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Weekly Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentWeek(Math.max(0, currentWeek - 1))}
            disabled={currentWeek === 0}
            className="p-2 hover:bg-gray-100 rounded-full disabled:opacity-50"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h4 className="text-lg font-medium">
            Week {currentWeek + 1} of{" "}
            {attendanceStats.totalWeeks || weeks.length} (
            {attendanceStats.weeksDisplay})
          </h4>
          <button
            onClick={() =>
              setCurrentWeek(
                Math.min(
                  (attendanceStats.totalWeeks || weeks.length) - 1,
                  currentWeek + 1
                )
              )
            }
            disabled={
              currentWeek >= (attendanceStats.totalWeeks || weeks.length) - 1
            }
            className="p-2 hover:bg-gray-100 rounded-full disabled:opacity-50"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Calendar Grid */}
        {weeks[currentWeek] && (
          <div className="bg-white rounded-lg border p-6">
            <div className="grid grid-cols-5 gap-4">
              {daysOfWeek.map((day) => {
                const dayKey = day.toLowerCase();
                const status = weeks[currentWeek][dayKey];
                const isPresent = status === "present";
                const isAbsent = status === "absent";

                return (
                  <div key={day} className="text-center">
                    <div className="font-medium text-gray-700 mb-2">{day}</div>
                    <div
                      className={`w-16 h-16 mx-auto rounded-lg flex items-center justify-center text-2xl ${
                        isPresent
                          ? "bg-green-100 text-green-600"
                          : isAbsent
                          ? "bg-red-100 text-red-600"
                          : "bg-yellow-100 text-yellow-600"
                      }`}
                    >
                      {isPresent ? "✅" : isAbsent ? "❌" : "⚠️"}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 capitalize">
                      {status}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 text-center">
              <span className="text-sm text-gray-600">
                Absent Days This Week:{" "}
                <span className="font-medium text-red-600">
                  {weeks[currentWeek].absentDays || 0}
                </span>
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Final Evaluation - {evaluation.studentInfo?.fullName}
            </h2>
            <p className="text-gray-600">
              {evaluation.studentInfo?.companyName} •{" "}
              {evaluation.studentInfo?.department}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={exportEvaluationPDF}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export PDF</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gray-50">
          <nav className="flex space-x-8 px-6">
            {[
              { id: "overview", label: "Overview", icon: Award },
              { id: "criteria", label: "Evaluation Criteria", icon: Award },
              { id: "attendance", label: "Attendance", icon: Calendar },
              { id: "files", label: "Files", icon: FileText },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">
                  Student Overview
                </h3>
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
              </div>
              {/* Student & Company Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    Student Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-blue-700">Full Name:</span>
                      <p className="font-medium text-blue-900">
                        {evaluation.studentInfo?.fullName}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-blue-700">University:</span>
                      <p className="font-medium text-blue-900">
                        {evaluation.studentInfo?.university}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-blue-700">Department:</span>
                      <p className="font-medium text-blue-900">
                        {evaluation.studentInfo?.department}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-blue-700">
                        Internship Period:
                      </span>
                      <p className="font-medium text-blue-900">
                        {new Date(
                          evaluation.studentInfo?.internshipStartDate
                        ).toLocaleDateString()}{" "}
                        -{" "}
                        {new Date(
                          evaluation.studentInfo?.internshipEndDate
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                    <Building className="w-5 h-5 mr-2" />
                    Company Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-green-700">Company:</span>
                      <p className="font-medium text-green-900">
                        SIDAMA INNOVATION AND TECHNOLOGY AGENCY
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-green-700">
                        Company Adviser:
                      </span>
                      <p className="font-medium text-green-900">
                        {evaluation.studentInfo?.companyAdviser}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-green-700">
                        University Adviser:
                      </span>
                      <p className="font-medium text-green-900">
                        {evaluation.studentInfo?.universityAdviser}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Final Score Summary */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
                  <Award className="w-5 h-5 mr-2" />
                  Final Evaluation Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-purple-700">
                      General Performance
                    </p>
                    <p className="text-2xl font-bold text-purple-900">
                      {categoryScores.generalPerformance}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-purple-700">Personal Skills</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {categoryScores.personalSkills}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-purple-700">
                      Professional Skills
                    </p>
                    <p className="text-2xl font-bold text-purple-900">
                      {categoryScores.professionalSkills}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-purple-700">Total Score</p>
                    <p className="text-3xl font-bold text-purple-900">
                      {evaluation.finalEvaluation?.total || 0}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Comments & Recommendations */}
              <div className="bg-white rounded-lg border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Comments & Recommendations
                </h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-green-700 mb-2">
                      Major Strengths:
                    </h4>
                    <p className="text-gray-700 bg-green-50 p-3 rounded-lg">
                      {evaluation.comments?.majorStrengths ||
                        "No comments provided"}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-orange-700 mb-2">
                      Areas for Improvement:
                    </h4>
                    <p className="text-gray-700 bg-orange-50 p-3 rounded-lg">
                      {evaluation.comments?.areasOfImprovement ||
                        "No comments provided"}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-700 mb-2">
                      Final Recommendation:
                    </h4>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        evaluation.comments?.finalRecommendation === "Continue"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {evaluation.comments?.finalRecommendation ||
                        "Not specified"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "criteria" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">
                  Detailed Evaluation Criteria
                </h3>
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
              </div>

              {evaluation.evaluationCriteria && (
                <div className="space-y-6">
                  {/* General Performance (25%) */}
                  <div className="bg-white rounded-lg border p-6">
                    <h4 className="text-lg font-semibold text-blue-800 mb-4">
                      General Performance (25%)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { key: "punctuality", name: "Punctuality" },
                        { key: "reliability", name: "Reliability" },
                        { key: "independence", name: "Independence" },
                        { key: "communication", name: "Communication" },
                        { key: "professionalism", name: "Professionalism" },
                      ].map(({ key, name }) => (
                        <div
                          key={key}
                          className="flex items-center justify-between p-3 bg-blue-50 rounded-lg"
                        >
                          <span className="font-medium text-gray-700">
                            {name}
                          </span>
                          <div className="flex items-center space-x-2">
                            <span
                              className={`text-xl font-bold ${getScoreColor(
                                evaluation.evaluationCriteria[key]
                              )}`}
                            >
                              {evaluation.evaluationCriteria[key]}/5
                            </span>
                            <div className="flex space-x-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-3 h-3 ${
                                    star <= evaluation.evaluationCriteria[key]
                                      ? "text-yellow-400 fill-current"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Personal Skills (25%) */}
                  <div className="bg-white rounded-lg border p-6">
                    <h4 className="text-lg font-semibold text-green-800 mb-4">
                      Personal Skills (25%)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { key: "speedOfWork", name: "Speed of Work" },
                        { key: "accuracy", name: "Accuracy" },
                        { key: "engagement", name: "Engagement" },
                        { key: "cooperation", name: "Cooperation" },
                        { key: "recommendation", name: "Recommendation" },
                      ].map(({ key, name }) => (
                        <div
                          key={key}
                          className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
                        >
                          <span className="font-medium text-gray-700">
                            {name}
                          </span>
                          <div className="flex items-center space-x-2">
                            <span
                              className={`text-xl font-bold ${getScoreColor(
                                evaluation.evaluationCriteria[key]
                              )}`}
                            >
                              {evaluation.evaluationCriteria[key]}/5
                            </span>
                            <div className="flex space-x-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-3 h-3 ${
                                    star <= evaluation.evaluationCriteria[key]
                                      ? "text-yellow-400 fill-current"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Professional Skills (50%) */}
                  <div className="bg-white rounded-lg border p-6">
                    <h4 className="text-lg font-semibold text-purple-800 mb-4">
                      Professional Skills (50%)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        {
                          key: "technicalKnowledge",
                          name: "Technical Knowledge",
                        },
                        { key: "problemSolving", name: "Problem Solving" },
                        { key: "organizing", name: "Organizing" },
                        { key: "responsibility", name: "Responsibility" },
                        { key: "initiative", name: "Initiative" },
                      ].map(({ key, name }) => (
                        <div
                          key={key}
                          className="flex items-center justify-between p-3 bg-purple-50 rounded-lg"
                        >
                          <span className="font-medium text-gray-700">
                            {name}
                          </span>
                          <div className="flex items-center space-x-2">
                            <span
                              className={`text-xl font-bold ${getScoreColor(
                                evaluation.evaluationCriteria[key]
                              )}`}
                            >
                              {evaluation.evaluationCriteria[key]}/5
                            </span>
                            <div className="flex space-x-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-3 h-3 ${
                                    star <= evaluation.evaluationCriteria[key]
                                      ? "text-yellow-400 fill-current"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Fallback to supervisorEvaluation if evaluationCriteria not available */}
              {!evaluation.evaluationCriteria &&
                evaluation.supervisorEvaluation && (
                  <div className="bg-white rounded-lg border p-6">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">
                      Supervisor Evaluation (1-5 Scale)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {Object.entries(evaluation.supervisorEvaluation).map(
                        ([key, value]) => {
                          const displayName =
                            {
                              dependability: "Dependability & Punctuality",
                              technicalCompetence: "Technical Competence",
                              teamwork: "Teamwork & Cooperation",
                              communication: "Communication Skills",
                              initiative: "Initiative & Creativity",
                              problemSolving: "Problem Solving Ability",
                              timeManagement: "Time Management",
                              adaptability: "Adaptability & Reliability",
                              leadership: "Leadership & Organizing",
                              workEthic: "Work Ethics & Professionalism",
                            }[key] || key.replace(/([A-Z])/g, " $1").trim();

                          return (
                            <div
                              key={key}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                              <span className="font-medium text-gray-700">
                                {displayName}
                              </span>
                              <div className="flex items-center space-x-2">
                                <span
                                  className={`text-2xl font-bold ${getScoreColor(
                                    Number(value)
                                  )}`}
                                >
                                  {String(value)}/5
                                </span>
                                <div className="flex space-x-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`w-4 h-4 ${
                                        star <= Number(value)
                                          ? "text-yellow-400 fill-current"
                                          : "text-gray-300"
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                )}
            </div>
          )}

          {activeTab === "attendance" && (
            <FacultyHeadAttendanceView
              students={[
                {
                  _id:
                    evaluation?.studentId?._id ||
                    evaluation?.studentInfo?.studentId,
                  name:
                    evaluation?.studentId?.name ||
                    evaluation?.studentInfo?.fullName,
                  email:
                    evaluation?.studentId?.email ||
                    evaluation?.studentInfo?.email,
                  groupAssignment: {
                    programName: evaluation?.studentInfo?.program,
                  },
                },
              ].filter((s) => s._id)}
            />
          )}

          {activeTab === "files" && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900">
                Uploaded Files
              </h3>

              {(() => {
                console.log(
                  "📎 Faculty Head - evaluation.supportingDocuments:",
                  evaluation?.supportingDocuments
                );
                console.log(
                  "📎 Faculty Head - supportingDocuments length:",
                  evaluation?.supportingDocuments?.length
                );
                return null;
              })()}

              {evaluation?.supportingDocuments &&
              evaluation.supportingDocuments.length > 0 ? (
                <div className="grid gap-4">
                  {evaluation.supportingDocuments.map(
                    (file: any, index: number) => (
                      <div
                        key={index}
                        className="bg-white rounded-lg border p-4 flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          <FileText className="w-8 h-8 text-blue-500" />
                          <div>
                            <div className="font-medium text-gray-900">
                              {file.name || file.originalName || file.filename}
                            </div>
                            <div className="text-sm text-gray-500">
                              {file.size
                                ? `${(file.size / 1024).toFixed(1)} KB`
                                : "Unknown size"}{" "}
                              •{" "}
                              {file.type ||
                                file.mimetype ||
                                file.mimeType ||
                                "Unknown type"}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => downloadSupportingDocument(file)}
                            className="px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center space-x-2"
                            title="Download File"
                          >
                            <Download className="w-4 h-4" />
                            <span>Download</span>
                          </button>
                          <button
                            onClick={() => viewSupportingDocument(file)}
                            className="px-3 py-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors flex items-center space-x-2"
                            title="View File"
                          >
                            <Eye className="w-4 h-4" />
                            <span>View</span>
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No files uploaded by Company Adviser</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FacultyHeadEvaluationView;
