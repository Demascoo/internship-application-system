import React, { useEffect, useState } from "react";
import {
  Star,
  FileText,
  User,
  Save,
  Download,
  Upload,
  X,
  Users,
  Target,
  Calculator,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { advisersAPI, finalEvaluationAPI } from "../../services/api";

interface Student {
  _id: string;
  name: string;
  email: string;
  university_name?: string;
  profile?: {
    university?: string;
    graduationYear?: number;
    course?: string;
  };
  groupAssignment?: {
    programName?: string;
    programId?: {
      _id: string;
      name: string;
      description?: string;
    };
  };
  application?: {
    internshipDuration?: {
      startDate?: string;
      endDate?: string;
      totalWeeks?: number;
      totalMonths?: number;
    };
  };
}

interface EvaluationCriteria {
  // General Performance (25%)
  punctuality: number;
  reliability: number;
  independence: number;
  communication: number;
  professionalism: number;

  // Personal Skills (25%)
  speedOfWork: number;
  accuracy: number;
  engagement: number;
  cooperation: number;
  recommendation: number;

  // Professional Skills (50%)
  technicalKnowledge: number;
  problemSolving: number;
  organizing: number;
  responsibility: number;
  initiative: number;
}

interface FinalEvaluation {
  _id?: string;
  studentId: string;
  companyAdviserId: string;
  studentInfo: {
    fullName: string;
    university: string;
    department: string;
    companyName: string;
    companyAdviser: string;
    universityAdviser: string;
    internshipStartDate: string;
    internshipEndDate: string;
  };
  evaluationCriteria: EvaluationCriteria;
  supervisorFeedback: {
    strengths: string;
    areasForImprovement: string;
    overallRecommendation: string;
    finalRemarks: string;
  };
  totalScore: number;
  weightedScore: number;
  finalGrade: string;
  signatures: {
    companyAdviser: {
      name: string;
      date: string;
      signature: string;
    };
    universityAdviser?: {
      name: string;
      date: string;
      signature: string;
    };
    facultyHead?: {
      name: string;
      date: string;
      signature: string;
    };
  };
  status: "draft" | "submitted" | "reviewed" | "approved" | "rejected";
  createdAt?: string;
  updatedAt?: string;
}

interface FinalResultEvaluationProps {
  students: Student[];
}

const FinalResultEvaluation: React.FC<FinalResultEvaluationProps> = ({
  students,
}) => {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [evaluation, setEvaluation] = useState<FinalEvaluation | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [savingDates, setSavingDates] = useState(false);

  // Initialize evaluation state
  const initializeEvaluation = (student: Student): FinalEvaluation => {
    return {
      studentId: student._id,
      companyAdviserId: "", // Will be set from current user
      studentInfo: {
        fullName: student.name || "",
        university: student.university_name || "",
        department: student.groupAssignment?.programId?.name || "",
        companyName: "SIDAMA INNOVATION AND TECHNOLOGY AGENCY", // Default company name
        companyAdviser: "", // Will be set from current user
        universityAdviser: "", // Will be populated from student data
        internshipStartDate: "",
        internshipEndDate: "",
      },
      evaluationCriteria: {
        // General Performance (25%)
        punctuality: 0,
        reliability: 0,
        independence: 0,
        communication: 0,
        professionalism: 0,

        // Personal Skills (25%)
        speedOfWork: 0,
        accuracy: 0,
        engagement: 0,
        cooperation: 0,
        recommendation: 0,

        // Professional Skills (50%)
        technicalKnowledge: 0,
        problemSolving: 0,
        organizing: 0,
        responsibility: 0,
        initiative: 0,
      },
      supervisorFeedback: {
        strengths: "",
        areasForImprovement: "",
        overallRecommendation: "",
        finalRemarks: "",
      },
      totalScore: 0,
      weightedScore: 0,
      finalGrade: "",
      signatures: {
        companyAdviser: {
          name: "",
          date: "",
          signature: "",
        },
      },
      status: "draft",
    };
  };

  // Load evaluation for selected student
  const loadEvaluation = async (student: Student) => {
    setLoading(true);
    console.log(
      "🔍 Loading evaluation for student:",
      student.name,
      "ID:",
      student._id
    );

    try {
      // Load student with populated program and university data
      console.log("📡 Calling getStudentDetails API...");
      try {
        const studentResponse = await advisersAPI.getStudentDetails(
          student._id
        );
        console.log("✅ Student details API response:", studentResponse);
        console.log("📊 Response structure:", {
          hasData: !!studentResponse.data,
          hasSuccess: !!studentResponse.data?.success,
          hasDataField: !!studentResponse.data?.data,
          hasStudent: !!studentResponse.data?.data?.student,
          actualStructure: Object.keys(studentResponse.data || {}),
          hasDirectStudent: !!studentResponse.data?.student,
        });

        // Fix: Console shows response.data = { student: {...} } (no success/data wrapper)
        // This means the API response structure is flat, not nested
        if (studentResponse.data?.student) {
          const updatedStudent = studentResponse.data.student;
          console.log("🎯 Updated student data received:", {
            name: updatedStudent.name,
            university_name: updatedStudent.university_name,
            programId: updatedStudent.groupAssignment?.programId,
            programName: updatedStudent.groupAssignment?.programId?.name,
            fullGroupAssignment: updatedStudent.groupAssignment,
          });
          console.log("🔄 Setting selectedStudent state with updated data...");
          setSelectedStudent(updatedStudent);
          console.log("✅ selectedStudent state updated");
        } else if (
          studentResponse.data?.success &&
          studentResponse.data?.data?.student
        ) {
          // Fallback: try the nested structure
          const updatedStudent = studentResponse.data.data.student;
          console.log("🎯 Updated student data received (nested):", {
            name: updatedStudent.name,
            university_name: updatedStudent.university_name,
            programId: updatedStudent.groupAssignment?.programId,
            programName: updatedStudent.groupAssignment?.programId?.name,
            fullGroupAssignment: updatedStudent.groupAssignment,
          });
          console.log("🔄 Setting selectedStudent state with updated data...");
          setSelectedStudent(updatedStudent);
          console.log("✅ selectedStudent state updated");
        } else {
          console.log("❌ API response structure invalid or unsuccessful");
          console.log("Response data:", studentResponse.data);
        }
      } catch (studentError: any) {
        console.error("🚨 Failed to load student details:", studentError);
        console.error("Error details:", {
          message: studentError.message,
          response: studentError.response?.data,
          status: studentError.response?.status,
        });
        // Continue with original student data if API fails
      }

      const response = await advisersAPI.getFinalEvaluation(student._id);
      console.log("📋 Loading evaluation response:", response);

      // Check multiple possible response structures
      let existingEvaluation = null;
      if (response?.data?.success && response?.data?.data?.evaluation) {
        existingEvaluation = response.data.data.evaluation;
      } else if (response?.data?.evaluation) {
        existingEvaluation = response.data.evaluation;
      } else if (response?.data?.evaluation) {
        existingEvaluation = response.data.evaluation;
      }

      if (existingEvaluation) {
        console.log("✅ Found existing evaluation, loading saved data...");

        // Fix date format for HTML inputs (convert ISO to yyyy-MM-dd)
        const fixedEvaluation = {
          ...existingEvaluation,
          studentInfo: {
            ...existingEvaluation.studentInfo,
            internshipStartDate: existingEvaluation.studentInfo
              ?.internshipStartDate
              ? new Date(existingEvaluation.studentInfo.internshipStartDate)
                  .toISOString()
                  .split("T")[0]
              : "",
            internshipEndDate: existingEvaluation.studentInfo?.internshipEndDate
              ? new Date(existingEvaluation.studentInfo.internshipEndDate)
                  .toISOString()
                  .split("T")[0]
              : "",
          },
        };

        console.log("🔧 Fixed date formats:", {
          originalStart: existingEvaluation.studentInfo?.internshipStartDate,
          fixedStart: fixedEvaluation.studentInfo.internshipStartDate,
          originalEnd: existingEvaluation.studentInfo?.internshipEndDate,
          fixedEnd: fixedEvaluation.studentInfo.internshipEndDate,
        });

        setEvaluation(fixedEvaluation);
        await loadInternshipDates(student._id);
      } else {
        console.log("📝 No existing evaluation found, creating new one...");
        // Create new evaluation
        const newEvaluation = initializeEvaluation(student);
        setEvaluation(newEvaluation);
        await loadInternshipDates(student._id);
      }
    } catch (error) {
      console.error("Error loading evaluation:", error);
      // Create new evaluation on error
      const newEvaluation = initializeEvaluation(student);
      setEvaluation(newEvaluation);
      await loadInternshipDates(student._id);
    } finally {
      setLoading(false);
    }
  };

  // Load internship dates from backend
  const loadInternshipDates = async (studentId: string) => {
    try {
      const response = await advisersAPI.getInternshipDates(studentId);
      if (response.data?.startDate && response.data?.endDate) {
        setEvaluation((prev) => ({
          ...prev!,
          studentInfo: {
            ...prev!.studentInfo,
            internshipStartDate: new Date(response.data.startDate)
              .toISOString()
              .split("T")[0],
            internshipEndDate: new Date(response.data.endDate)
              .toISOString()
              .split("T")[0],
          },
        }));
      }
    } catch (error) {
      console.error("Failed to load internship dates:", error);
    }
  };

  // Save internship dates to backend
  const saveInternshipDates = async () => {
    if (
      !selectedStudent ||
      !evaluation?.studentInfo?.internshipStartDate ||
      !evaluation?.studentInfo?.internshipEndDate
    ) {
      toast.error("Please enter both start and end dates");
      return;
    }

    setSavingDates(true);
    try {
      await advisersAPI.saveInternshipDates({
        studentId: selectedStudent._id,
        startDate: evaluation.studentInfo.internshipStartDate,
        endDate: evaluation.studentInfo.internshipEndDate,
      });
      toast.success("Internship dates saved successfully");
    } catch (error) {
      console.error("Failed to save internship dates:", error);
      toast.error("Failed to save internship dates");
    } finally {
      setSavingDates(false);
    }
  };

  const handleCriteriaChange = (
    field: keyof EvaluationCriteria,
    value: number
  ) => {
    setEvaluation((prev) => ({
      ...prev!,
      evaluationCriteria: {
        ...prev!.evaluationCriteria,
        [field]: Math.max(0, Math.min(5, value)), // Ensure value is between 0-5
      },
    }));
  };

  const calculateTotalScore = () => {
    if (!evaluation) return 0;

    const criteria = evaluation.evaluationCriteria;
    if (!criteria) return 0;

    // General Performance (25%)
    const generalPerformance =
      ((criteria.punctuality +
        criteria.reliability +
        criteria.independence +
        criteria.communication +
        criteria.professionalism) /
        5) *
      0.25;

    // Personal Skills (25%)
    const personalSkills =
      ((criteria.speedOfWork +
        criteria.accuracy +
        criteria.engagement +
        criteria.cooperation +
        criteria.recommendation) /
        5) *
      0.25;

    // Professional Skills (50%)
    const professionalSkills =
      ((criteria.technicalKnowledge +
        criteria.problemSolving +
        criteria.organizing +
        criteria.responsibility +
        criteria.initiative) /
        5) *
      0.5;

    const totalScore =
      (generalPerformance + personalSkills + professionalSkills) * 20; // Convert to 0-100 scale
    const finalGrade = getGrade(totalScore);

    setEvaluation((prev) => ({
      ...prev!,
      totalScore: Math.round(totalScore * 100) / 100,
      weightedScore: Math.round(totalScore * 100) / 100,
      finalGrade,
    }));

    return totalScore;
  };

  // Helper functions for appreciation labels
  const getAppreciationColor = (score: number): string => {
    if (score >= 5) return "text-green-600";
    if (score >= 4) return "text-blue-600";
    if (score >= 3) return "text-yellow-600";
    if (score >= 2) return "text-orange-600";
    return "text-red-600";
  };

  const getAppreciationText = (score: number): string => {
    if (score >= 5) return "Excellent";
    if (score >= 4) return "Very Good";
    if (score >= 3) return "Good";
    if (score >= 2) return "Fair";
    if (score >= 1) return "Poor";
    return "Not Rated";
  };

  useEffect(() => {
    if (evaluation) {
      calculateTotalScore();
    }
  }, [evaluation?.evaluationCriteria]);

  // Save final evaluation data (mirrors progress pattern - simple JSON)
  const handleSave = async () => {
    if (!selectedStudent || !evaluation) {
      toast.error("Missing student or evaluation data");
      return;
    }

    // Show custom confirmation dialog
    setShowConfirmDialog(true);
  };

  // Handle confirmation dialog response
  const handleConfirmSend = async () => {
    setShowConfirmDialog(false);
    setSaving(true);
    try {
      // Convert uploaded files to base64 for database storage
      const supportingDocuments = await Promise.all(
        uploadedFiles.map(async (file) => {
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });

          return {
            name: file.name,
            type: file.type,
            size: file.size,
            data: base64,
            uploadDate: new Date().toISOString(),
          };
        })
      );

      const evaluationDataToSend = {
        studentInfo: evaluation.studentInfo,
        evaluationCriteria: evaluation.evaluationCriteria,
        supervisorFeedback: evaluation.supervisorFeedback,
        signatures: evaluation.signatures,
        supportingDocuments: supportingDocuments,
        status: "submitted",
        totalScore: evaluation.totalScore,
        weightedScore: evaluation.weightedScore,
        finalGrade: evaluation.finalGrade,
      };

      const response = await finalEvaluationAPI.saveFinalEvaluationData(
        selectedStudent._id,
        evaluationDataToSend
      );

      console.log("🔍 Full API Response:", response);
      console.log("🔍 Response Success Flag:", response?.success);

      // Handle successful response - check both Axios response and direct data
      if (response && (response.data?.success || response.success)) {
        toast.success("Final evaluation data saved permanently to database!");
        setEvaluation((prev) => ({
          ...prev!,
          _id:
            response.data?.data?.evaluationId ||
            response.data?.evaluationId ||
            response.evaluationId,
          status: "submitted",
        }));
      } else if (response && response.status === 200) {
        // Backend saved successfully but response structure is different
        toast.success("Final evaluation data saved successfully!");
        setEvaluation((prev) => ({
          ...prev!,
          status: "submitted",
        }));
      } else {
        console.log(
          "❌ Response failed check - Success:",
          response?.data?.success || response?.success
        );
        throw new Error(
          response?.data?.message ||
            response?.message ||
            "Failed to save evaluation"
        );
      }
    } catch (error: any) {
      console.error("❌ Error saving final evaluation data:", error);
      console.error("❌ Error details:", {
        message: error.message,
        response: error.response,
        request: error.request,
        config: error.config,
      });

      // Check if it's a network error or API endpoint issue
      if (error.code === "ERR_NETWORK" || !error.response) {
        toast.error(
          "Network error: Unable to connect to server. Please check if the backend is running."
        );
      } else {
        toast.error(
          `Failed to save final evaluation data: ${
            error.response?.data?.message || error.message
          }`
        );
      }
    } finally {
      setSaving(false);
    }
  };

  // Handle cancel confirmation dialog
  const handleCancelSend = () => {
    setShowConfirmDialog(false);
  };

  const handleExportPDF = async () => {
    if (!selectedStudent) return;

    try {
      const response = await advisersAPI.exportFinalEvaluationPDF(
        selectedStudent._id
      );

      // Create blob and download
      const blob = new Blob([response.data], { type: "text/html" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Final_Evaluation_${selectedStudent.name.replace(
        /\s+/g,
        "_"
      )}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("PDF exported successfully");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Failed to export PDF");
    }
  };

  // File upload handlers
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const validFiles: File[] = [];
    const maxSize = 10 * 1024 * 1024; // 10MB

    Array.from(files).forEach((file) => {
      if (file.size > maxSize) {
        toast.error(`File ${file.name} is too large. Maximum size is 10MB.`);
        return;
      }

      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "image/jpeg",
        "image/jpg",
        "image/png",
      ];

      if (!allowedTypes.includes(file.type)) {
        toast.error(`File ${file.name} has unsupported format.`);
        return;
      }

      validFiles.push(file);
    });

    if (validFiles.length > 0) {
      setUploadedFiles((prev) => [...prev, ...validFiles]);
      toast.success(`${validFiles.length} file(s) uploaded successfully.`);
    }

    // Reset input
    event.target.value = "";
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
    toast.success("File removed.");
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getGrade = (score: number) => {
    if (score >= 90) return "A+";
    if (score >= 85) return "A";
    if (score >= 80) return "B+";
    if (score >= 75) return "B";
    if (score >= 70) return "C+";
    if (score >= 65) return "C";
    if (score >= 60) return "D";
    return "F";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!selectedStudent) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <User className="w-5 h-5 mr-2" />
            Select Student for Final Evaluation
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {students.map((student) => (
              <div
                key={student._id}
                onClick={() => {
                  setSelectedStudent(student);
                  loadEvaluation(student);
                }}
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-colors"
              >
                <h3 className="font-medium text-gray-900">{student.name}</h3>
                <p className="text-sm text-gray-600">{student.email}</p>
                <p className="text-sm text-gray-500">
                  {student.profile?.university || "N/A"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <>
      {/* Custom Styles */}
      <style>{`
        .slider-modern::-webkit-slider-thumb {
          appearance: none;
          height: 24px;
          width: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          cursor: pointer;
          border: 3px solid #ffffff;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.1);
          transition: all 0.2s ease;
        }
        
        .slider-modern::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 20px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.2);
        }
        
        .slider-modern::-moz-range-thumb {
          height: 24px;
          width: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          cursor: pointer;
          border: 3px solid #ffffff;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          transition: all 0.2s ease;
        }
        
        .slider-modern::-webkit-slider-track {
          height: 12px;
          border-radius: 6px;
          background: linear-gradient(90deg, #ff6b6b 0%, #feca57 25%, #48dbfb 50%, #0abde3 75%, #00d2d3 100%);
          border: none;
        }
        
        .slider-modern::-moz-range-track {
          height: 12px;
          border-radius: 6px;
          background: linear-gradient(90deg, #ff6b6b 0%, #feca57 25%, #48dbfb 50%, #0abde3 75%, #00d2d3 100%);
          border: none;
        }
      `}</style>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSelectedStudent(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ← Back to Student Selection
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <FileText className="w-6 h-6 mr-2" />
                  Final Result Evaluation
                </h1>
                <p className="text-gray-600">
                  Comprehensive evaluation for {selectedStudent.name}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Student Information */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <User className="w-5 h-5 mr-2" />
            Student Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-700">Name</label>
              <p className="text-gray-900 font-medium">
                {selectedStudent.name}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Email</label>
              <p className="text-gray-900">{selectedStudent.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                University
              </label>
              <p className="text-gray-900">
                {selectedStudent.university_name ||
                  selectedStudent.profile?.university ||
                  "N/A"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                Program
              </label>
              <p className="text-gray-900">
                {(() => {
                  console.log("🔍 Debug selectedStudent program data:", {
                    groupAssignment: selectedStudent.groupAssignment,
                    programId: selectedStudent.groupAssignment?.programId,
                    programName: selectedStudent.groupAssignment?.programName,
                    fullStudent: selectedStudent,
                  });

                  return (
                    selectedStudent.groupAssignment?.programId?.name ||
                    selectedStudent.groupAssignment?.programName ||
                    selectedStudent.program?.name ||
                    selectedStudent.programName ||
                    "N/A"
                  );
                })()}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                Company Name
              </label>
              <p className="text-gray-900 font-medium">
                SIDAMA INNOVATION AND TECHNOLOGY AGENCY
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Internship Start Date
              </label>
              <input
                type="date"
                value={evaluation.studentInfo?.internshipStartDate || ""}
                onChange={(e) =>
                  setEvaluation((prev) => ({
                    ...prev!,
                    studentInfo: {
                      ...prev!.studentInfo,
                      internshipStartDate: e.target.value,
                    },
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Internship End Date
              </label>
              <input
                type="date"
                value={evaluation.studentInfo?.internshipEndDate || ""}
                onChange={(e) =>
                  setEvaluation((prev) => ({
                    ...prev!,
                    studentInfo: {
                      ...prev!.studentInfo,
                      internshipEndDate: e.target.value,
                    },
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Save Internship Dates Button */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={saveInternshipDates}
              disabled={
                !evaluation?.studentInfo?.internshipStartDate ||
                !evaluation?.studentInfo?.internshipEndDate ||
                savingDates
              }
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{savingDates ? "Saving..." : "Save Dates"}</span>
            </button>
          </div>
        </div>

        {/* Total Score Display */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white rounded-full p-3">
                <Calculator className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Final Score
                </h3>
                <p className="text-gray-600">
                  Calculated based on weighted criteria
                </p>
              </div>
            </div>
            <div className="text-right">
              <div
                className={`text-4xl font-bold ${getScoreColor(
                  evaluation?.totalScore || 0
                )}`}
              >
                {(evaluation?.totalScore || 0).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        {/* Evaluation Criteria */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* General Performance (25%) */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-lg border border-blue-100 p-8 hover:shadow-xl transition-all duration-300">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-2 rounded-lg mr-3">
                <Star className="w-6 h-6 text-white" />
              </div>
              General Performance
              <span className="ml-2 text-sm font-medium bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                25%
              </span>
            </h3>
            <div className="space-y-6">
              {[
                { key: "punctuality", label: "Punctuality", icon: "⏰" },
                { key: "reliability", label: "Reliability", icon: "🎯" },
                {
                  key: "independence",
                  label: "Independence in Work",
                  icon: "🚀",
                },
                {
                  key: "communication",
                  label: "Communication Skills",
                  icon: "💬",
                },
                {
                  key: "professionalism",
                  label: "Professionalism",
                  icon: "👔",
                },
              ].map(({ key, label, icon }) => {
                const score =
                  evaluation?.evaluationCriteria?.[
                    key as keyof EvaluationCriteria
                  ] ?? 3;
                return (
                  <div
                    key={key}
                    className="bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-white/50 shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{icon}</span>
                        <label className="text-sm font-semibold text-gray-800">
                          {label}
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl font-bold text-gray-900">
                          {score}
                        </span>
                        <span
                          className={`text-xs font-bold px-2 py-1 rounded-full ${getAppreciationColor(
                            score
                          )} bg-opacity-20`}
                        >
                          {getAppreciationText(score)}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-center space-x-2 mb-2">
                      {[0, 1, 2, 3, 4, 5].map((value) => (
                        <button
                          key={value}
                          onClick={() =>
                            handleCriteriaChange(
                              key as keyof EvaluationCriteria,
                              value
                            )
                          }
                          className={`w-12 h-12 rounded-full border-2 font-bold text-sm transition-all duration-200 hover:scale-110 ${
                            score === value
                              ? value === 0
                                ? "bg-red-500 border-red-600 text-white shadow-lg"
                                : value === 1
                                ? "bg-orange-500 border-orange-600 text-white shadow-lg"
                                : value === 2
                                ? "bg-yellow-500 border-yellow-600 text-white shadow-lg"
                                : value === 3
                                ? "bg-blue-500 border-blue-600 text-white shadow-lg"
                                : value === 4
                                ? "bg-green-500 border-green-600 text-white shadow-lg"
                                : "bg-emerald-500 border-emerald-600 text-white shadow-lg"
                              : "bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-center text-xs font-medium text-gray-500 mt-2">
                      <span>Click a number to rate (0-5)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Personal Skills (25%) */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-lg border border-green-100 p-8 hover:shadow-xl transition-all duration-300">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-2 rounded-lg mr-3">
                <Users className="w-6 h-6 text-white" />
              </div>
              Personal Skills
              <span className="ml-2 text-sm font-medium bg-green-100 text-green-700 px-2 py-1 rounded-full">
                25%
              </span>
            </h3>
            <div className="space-y-6">
              {[
                { key: "speedOfWork", label: "Speed of Work", icon: "⚡" },
                {
                  key: "accuracy",
                  label: "Accuracy in Task Completion",
                  icon: "🎯",
                },
                {
                  key: "engagement",
                  label: "Engagement & Enthusiasm",
                  icon: "🔥",
                },
                {
                  key: "cooperation",
                  label: "Cooperation with Colleagues",
                  icon: "🤝",
                },
                {
                  key: "recommendation",
                  label: "Recommendation for Future Work",
                  icon: "⭐",
                },
              ].map(({ key, label, icon }) => {
                const score =
                  evaluation?.evaluationCriteria?.[
                    key as keyof EvaluationCriteria
                  ] ?? 3;
                return (
                  <div
                    key={key}
                    className="bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-white/50 shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{icon}</span>
                        <label className="text-sm font-semibold text-gray-800">
                          {label}
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl font-bold text-gray-900">
                          {score}
                        </span>
                        <span
                          className={`text-xs font-bold px-2 py-1 rounded-full ${getAppreciationColor(
                            score
                          )} bg-opacity-20`}
                        >
                          {getAppreciationText(score)}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-center space-x-2 mb-2">
                      {[0, 1, 2, 3, 4, 5].map((value) => (
                        <button
                          key={value}
                          onClick={() =>
                            handleCriteriaChange(
                              key as keyof EvaluationCriteria,
                              value
                            )
                          }
                          className={`w-12 h-12 rounded-full border-2 font-bold text-sm transition-all duration-200 hover:scale-110 ${
                            score === value
                              ? value === 0
                                ? "bg-red-500 border-red-600 text-white shadow-lg"
                                : value === 1
                                ? "bg-orange-500 border-orange-600 text-white shadow-lg"
                                : value === 2
                                ? "bg-yellow-500 border-yellow-600 text-white shadow-lg"
                                : value === 3
                                ? "bg-blue-500 border-blue-600 text-white shadow-lg"
                                : value === 4
                                ? "bg-green-500 border-green-600 text-white shadow-lg"
                                : "bg-emerald-500 border-emerald-600 text-white shadow-lg"
                              : "bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-center text-xs font-medium text-gray-500 mt-2">
                      <span>Click a number to rate (0-5)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Professional Skills (50%) */}
          <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl shadow-lg border border-purple-100 p-8 hover:shadow-xl transition-all duration-300 lg:col-span-2">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
              <div className="bg-gradient-to-r from-purple-500 to-violet-600 p-2 rounded-lg mr-3">
                <Target className="w-6 h-6 text-white" />
              </div>
              Professional Skills
              <span className="ml-2 text-sm font-medium bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                50%
              </span>
            </h3>
            <div className="space-y-6">
              {[
                {
                  key: "technicalKnowledge",
                  label: "Technical Knowledge & Skills",
                  icon: "🔧",
                },
                {
                  key: "problemSolving",
                  label: "Problem Solving Ability",
                  icon: "🧩",
                },
                {
                  key: "organizing",
                  label: "Organizing & Planning Skills",
                  icon: "📋",
                },
                {
                  key: "responsibility",
                  label: "Responsibility in Task Fulfillment",
                  icon: "✅",
                },
                {
                  key: "initiative",
                  label: "Initiative & Creativity",
                  icon: "💡",
                },
              ].map(({ key, label, icon }) => {
                const score =
                  evaluation?.evaluationCriteria?.[
                    key as keyof EvaluationCriteria
                  ] ?? 3;
                return (
                  <div
                    key={key}
                    className="bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-white/50 shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{icon}</span>
                        <label className="text-sm font-semibold text-gray-800">
                          {label}
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl font-bold text-gray-900">
                          {score}
                        </span>
                        <span
                          className={`text-xs font-bold px-2 py-1 rounded-full ${getAppreciationColor(
                            score
                          )} bg-opacity-20`}
                        >
                          {getAppreciationText(score)}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-center space-x-2 mb-2">
                      {[0, 1, 2, 3, 4, 5].map((value) => (
                        <button
                          key={value}
                          onClick={() =>
                            handleCriteriaChange(
                              key as keyof EvaluationCriteria,
                              value
                            )
                          }
                          className={`w-12 h-12 rounded-full border-2 font-bold text-sm transition-all duration-200 hover:scale-110 ${
                            score === value
                              ? value === 0
                                ? "bg-red-500 border-red-600 text-white shadow-lg"
                                : value === 1
                                ? "bg-orange-500 border-orange-600 text-white shadow-lg"
                                : value === 2
                                ? "bg-yellow-500 border-yellow-600 text-white shadow-lg"
                                : value === 3
                                ? "bg-blue-500 border-blue-600 text-white shadow-lg"
                                : value === 4
                                ? "bg-green-500 border-green-600 text-white shadow-lg"
                                : "bg-emerald-500 border-emerald-600 text-white shadow-lg"
                              : "bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-center text-xs font-medium text-gray-500 mt-2">
                      <span>Click a number to rate (0-5)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Action Section with File Upload */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="space-y-6">
            {/* File Upload Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Upload className="w-5 h-5 mr-2" />
                Supporting Documents
              </h3>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 mb-1">
                    Click to upload supporting documents
                  </p>
                  <p className="text-sm text-gray-500">
                    PDF, DOC, DOCX, JPG, PNG files up to 10MB each
                  </p>
                </label>
              </div>

              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Uploaded Files:
                  </h4>
                  <div className="space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <div className="flex items-center">
                          <FileText className="w-4 h-4 text-gray-500 mr-2" />
                          <span className="text-sm text-gray-700">
                            {file.name}
                          </span>
                          <span className="text-xs text-gray-500 ml-2">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2 font-medium"
              >
                <Save className="w-5 h-5" />
                <span>{saving ? "Sending..." : "Send Evaluation"}</span>
              </button>

              <button
                onClick={handleExportPDF}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2 font-medium"
              >
                <Download className="w-5 h-5" />
                <span>Export PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-all">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-6 w-6 text-amber-500" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">
                    Confirm Final Evaluation Submission
                  </h3>
                </div>
              </div>

              {/* Content */}
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-3">
                  Are you sure you want to send the final evaluation for{" "}
                  <span className="font-semibold text-gray-900">
                    {selectedStudent?.name}
                  </span>
                  ?
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                  <p className="text-sm text-amber-800">
                    <strong>Important:</strong> Once submitted, this evaluation
                    will be sent to the University Adviser and Faculty Head for
                    review. You will not be able to modify it after submission.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={handleCancelSend}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmSend}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 flex items-center space-x-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Yes, Send Evaluation</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FinalResultEvaluation;
