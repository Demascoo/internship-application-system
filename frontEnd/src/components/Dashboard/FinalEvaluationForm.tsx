import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { 
  Save, 
  Send, 
  Calendar, 
  User, 
  Building2, 
  GraduationCap,
  CheckCircle,
  XCircle,
  Award,
  FileText,
  Eye,
  EyeOff,
  Upload,
  X,
  Download,
  ChevronDown
} from "lucide-react";
import { finalEvaluationAPI, accountManagementAPI } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

interface FinalEvaluationFormProps {
  studentId: string;
  onBack: () => void;
}

const FinalEvaluationForm: React.FC<FinalEvaluationFormProps> = ({ studentId, onBack }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [facultyHeads, setFacultyHeads] = useState<any[]>([]);
  const [selectedFacultyHead, setSelectedFacultyHead] = useState<string>("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [studentProgram, setStudentProgram] = useState<any>(null);
  const [formData, setFormData] = useState({
    studentInfo: {
      fullName: "",
      university: "",
      department: "",
      companyName: "",
      companyAdviser: "",
      universityAdviser: "",
      internshipStartDate: "",
      internshipEndDate: ""
    },
    attendance: {
      weeks: [],
      totalAbsentDays: 0
    },
    supervisorEvaluation: {
      dependability: 3,
      technicalCompetence: 3,
      teamwork: 3,
      communication: 3,
      initiative: 3,
      problemSolving: 3,
      timeManagement: 3,
      adaptability: 3,
      leadership: 3,
      workEthic: 3
    },
    finalEvaluation: {
      generalPerformance: 0,
      personalSkills: 0,
      professionalSkills: 0,
      total: 0
    },
    comments: {
      majorStrengths: "",
      areasOfImprovement: "",
      finalRecommendation: "Continue"
    },
    signatures: {
      companyAdviserName: user?.name || "",
      companyAdviserSignature: "",
      universityAdviserName: "",
      universityAdviserSignature: "",
      companyStamp: ""
    }
  });

  useEffect(() => {
    // Initialize with 12 weeks of attendance tracking
    const weeks = Array.from({ length: 12 }, (_, i) => ({
      weekNumber: i + 1,
      monday: "present",
      tuesday: "present",
      wednesday: "present",
      thursday: "present",
      friday: "present",
      absentDays: 0,
      supervisorSignature: ""
    }));
    
    setFormData(prev => ({
      ...prev,
      attendance: { ...prev.attendance, weeks }
    }));

    // Load faculty heads for this student
    loadFacultyHeads();
  }, [user?.name, studentId]);

  const loadFacultyHeads = async () => {
    try {
      const response = await accountManagementAPI.getFacultyHeadsByStudent(studentId);
      setFacultyHeads(response.data.facultyHeads || response.data.allFacultyHeads || []);
      setStudentProgram(response.data.studentProgram);
      
      // Auto-select if there's a program-specific faculty head
      if (response.data.facultyHeads && response.data.facultyHeads.length > 0) {
        setSelectedFacultyHead(response.data.facultyHeads[0]._id);
      }
    } catch (error) {
      console.error('Error loading faculty heads:', error);
      toast.error('Failed to load faculty heads');
    }
  };

  const handleAttendanceChange = (weekIndex: number, day: string, value: string) => {
    const newWeeks = [...formData.attendance.weeks];
    newWeeks[weekIndex] = { ...newWeeks[weekIndex], [day]: value };
    
    // Calculate absent days for this week
    const absentDays = Object.values(newWeeks[weekIndex])
      .filter(val => val === "absent").length;
    newWeeks[weekIndex].absentDays = absentDays;
    
    // Calculate total absent days
    const totalAbsentDays = newWeeks.reduce((sum, week) => sum + week.absentDays, 0);
    
    setFormData(prev => ({
      ...prev,
      attendance: {
        weeks: newWeeks,
        totalAbsentDays
      }
    }));
  };

  const calculateFinalEvaluation = () => {
    const supervisorAvg = Object.values(formData.supervisorEvaluation).reduce((sum, val) => sum + val, 0) / 10;
    
    const generalPerformance = Math.round((supervisorAvg / 5) * 25);
    const personalSkills = Math.round((supervisorAvg / 5) * 25);
    const professionalSkills = Math.round((supervisorAvg / 5) * 50);
    const total = generalPerformance + personalSkills + professionalSkills;
    
    setFormData(prev => ({
      ...prev,
      finalEvaluation: {
        generalPerformance,
        personalSkills,
        professionalSkills,
        total
      }
    }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFacultyHead) {
      toast.error("Please select a Faculty Head to send the evaluation to");
      return;
    }
    
    setShowConfirmDialog(true);
  };

  const confirmSubmit = async () => {
    setLoading(true);
    setShowConfirmDialog(false);
    
    try {
      const formDataToSubmit = new FormData();
      
      // Add form data
      formDataToSubmit.append('studentId', studentId);
      formDataToSubmit.append('facultyHeadId', selectedFacultyHead);
      formDataToSubmit.append('data', JSON.stringify(formData));
      
      // Add files
      selectedFiles.forEach((file, index) => {
        formDataToSubmit.append('attachments', file);
      });
      
      await accountManagementAPI.submitFinalEvaluation(formDataToSubmit);
      
      const selectedFaculty = facultyHeads.find(f => f._id === selectedFacultyHead);
      toast.success(`Final evaluation submitted successfully to ${selectedFaculty?.name}!`);
      onBack();
    } catch (e: any) {
      toast.error(e?.message || "Failed to submit evaluation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">Final Evaluation Form</h1>
              <button
                onClick={onBack}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Back
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {/* Student Information */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-blue-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Student Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={formData.studentInfo.fullName}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      studentInfo: { ...prev.studentInfo, fullName: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">University</label>
                  <input
                    type="text"
                    value={formData.studentInfo.university}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      studentInfo: { ...prev.studentInfo, university: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={formData.studentInfo.department}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      studentInfo: { ...prev.studentInfo, department: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                  <input
                    type="text"
                    value={formData.studentInfo.companyName}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      studentInfo: { ...prev.studentInfo, companyName: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Adviser</label>
                  <input
                    type="text"
                    value={formData.studentInfo.companyAdviser}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      studentInfo: { ...prev.studentInfo, companyAdviser: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">University Adviser</label>
                  <input
                    type="text"
                    value={formData.studentInfo.universityAdviser}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      studentInfo: { ...prev.studentInfo, universityAdviser: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Internship Start Date</label>
                  <input
                    type="date"
                    value={formData.studentInfo.internshipStartDate}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      studentInfo: { ...prev.studentInfo, internshipStartDate: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Internship End Date</label>
                  <input
                    type="date"
                    value={formData.studentInfo.internshipEndDate}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      studentInfo: { ...prev.studentInfo, internshipEndDate: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Attendance Tracking */}
            <div className="bg-green-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-green-900 mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Attendance Tracking
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200">
                  <thead className="bg-green-100">
                    <tr>
                      <th className="border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700">Week</th>
                      <th className="border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700">Mon</th>
                      <th className="border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700">Tue</th>
                      <th className="border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700">Wed</th>
                      <th className="border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700">Thu</th>
                      <th className="border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700">Fri</th>
                      <th className="border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700">Absent Days</th>
                      <th className="border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700">Signature</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.attendance.weeks.map((week, index) => (
                      <tr key={week.weekNumber}>
                        <td className="border border-gray-200 px-3 py-2 text-sm text-center font-medium">
                          {week.weekNumber}
                        </td>
                        {["monday", "tuesday", "wednesday", "thursday", "friday"].map((day) => (
                          <td key={day} className="border border-gray-200 px-3 py-2">
                            <select
                              value={week[day as keyof typeof week] as string}
                              onChange={(e) => handleAttendanceChange(index, day, e.target.value)}
                              className="w-full text-sm border-0 focus:ring-0"
                            >
                              <option value="present">Present</option>
                              <option value="absent">Absent</option>
                              <option value="late">Late</option>
                              <option value="excused">Excused</option>
                            </select>
                          </td>
                        ))}
                        <td className="border border-gray-200 px-3 py-2 text-sm text-center font-medium">
                          {week.absentDays}
                        </td>
                        <td className="border border-gray-200 px-3 py-2">
                          <input
                            type="text"
                            placeholder="Initials"
                            className="w-full text-sm border-0 focus:ring-0"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-4 text-right">
                  <span className="text-sm font-medium text-gray-700">
                    Total Absent Days: {formData.attendance.totalAbsentDays}
                  </span>
                </div>
              </div>
            </div>

            {/* Supervisor Evaluation */}
            <div className="bg-yellow-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-yellow-900 mb-4 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                Supervisor Evaluation (Soft & Work Skills)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(formData.supervisorEvaluation).map(([skill, rating]) => (
                  <div key={skill} className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 capitalize">
                      {skill.replace(/([A-Z])/g, ' $1').trim()}
                    </label>
                    <select
                      value={rating}
                      onChange={(e) => {
                        setFormData(prev => ({
                          ...prev,
                          supervisorEvaluation: {
                            ...prev.supervisorEvaluation,
                            [skill]: parseInt(e.target.value)
                          }
                        }));
                        calculateFinalEvaluation();
                      }}
                      className="px-3 py-1 border border-gray-300 rounded-md"
                    >
                      <option value={1}>1 - Poor</option>
                      <option value={2}>2 - Fair</option>
                      <option value={3}>3 - Good</option>
                      <option value={4}>4 - Very Good</option>
                      <option value={5}>5 - Excellent</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* Final Evaluation */}
            <div className="bg-purple-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-purple-900 mb-4 flex items-center">
                <Award className="w-5 h-5 mr-2" />
                Final Evaluation (Weighted Percentage)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <label className="block text-sm font-medium text-gray-700 mb-1">General Performance</label>
                  <div className="text-2xl font-bold text-purple-600">{formData.finalEvaluation.generalPerformance}%</div>
                  <div className="text-xs text-gray-500">(25% weight)</div>
                </div>
                <div className="text-center">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Personal Skills</label>
                  <div className="text-2xl font-bold text-purple-600">{formData.finalEvaluation.personalSkills}%</div>
                  <div className="text-xs text-gray-500">(25% weight)</div>
                </div>
                <div className="text-center">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Professional Skills</label>
                  <div className="text-2xl font-bold text-purple-600">{formData.finalEvaluation.professionalSkills}%</div>
                  <div className="text-xs text-gray-500">(50% weight)</div>
                </div>
                <div className="text-center">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total</label>
                  <div className="text-2xl font-bold text-purple-800">{formData.finalEvaluation.total}%</div>
                  <div className="text-xs text-gray-500">(100%)</div>
                </div>
              </div>
            </div>

            {/* Comments */}
            <div className="bg-indigo-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-indigo-900 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Comments
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Major Strengths</label>
                  <textarea
                    value={formData.comments.majorStrengths}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      comments: { ...prev.comments, majorStrengths: e.target.value }
                    }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Areas of Improvement</label>
                  <textarea
                    value={formData.comments.areasOfImprovement}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      comments: { ...prev.comments, areasOfImprovement: e.target.value }
                    }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Final Recommendation</label>
                  <select
                    value={formData.comments.finalRecommendation}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      comments: { ...prev.comments, finalRecommendation: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="Continue">✔ Continue</option>
                    <option value="Not Recommended">✘ Not Recommended</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Faculty Head Selection */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-blue-900 mb-4 flex items-center">
                <GraduationCap className="w-5 h-5 mr-2" />
                Faculty Head Selection
              </h2>
              {studentProgram && (
                <div className="mb-4 p-3 bg-blue-100 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>Student Program:</strong> {studentProgram.name}
                  </p>
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Faculty Head to receive this evaluation *
                  </label>
                  <div className="relative">
                    <select
                      value={selectedFacultyHead}
                      onChange={(e) => setSelectedFacultyHead(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                      required
                    >
                      <option value="">-- Select Faculty Head --</option>
                      {facultyHeads.map((faculty) => (
                        <option key={faculty._id} value={faculty._id}>
                          {faculty.name} ({faculty.email})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                  {facultyHeads.length === 0 && (
                    <p className="text-sm text-red-600 mt-1">
                      No Faculty Heads available. Please contact your administrator.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* File Upload */}
            <div className="bg-green-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-green-900 mb-4 flex items-center">
                <Upload className="w-5 h-5 mr-2" />
                Supporting Documents
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload supporting documents (PDF, DOC, XLS, Images)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.jpg,.jpeg,.png,.gif"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        Click to upload files or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Maximum file size: 10MB per file
                      </p>
                    </label>
                  </div>
                </div>

                {/* Selected Files */}
                {selectedFiles.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Selected Files:</h4>
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white rounded-md border">
                        <div className="flex items-center space-x-3">
                          <FileText className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-700">{file.name}</span>
                          <span className="text-xs text-gray-500">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Signatures */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Signatures
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Adviser Name</label>
                  <input
                    type="text"
                    value={formData.signatures.companyAdviserName}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      signatures: { ...prev.signatures, companyAdviserName: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">University Adviser Name</label>
                  <input
                    type="text"
                    value={formData.signatures.universityAdviserName}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      signatures: { ...prev.signatures, universityAdviserName: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Stamp</label>
                  <input
                    type="text"
                    placeholder="Company stamp or seal"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={onBack}
                className="px-6 py-3 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Final Evaluation
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Confirm Submission</h3>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to send this final evaluation to:
              </p>
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center">
                  <GraduationCap className="w-5 h-5 text-blue-600 mr-2" />
                  <div>
                    <p className="font-medium text-blue-900">
                      {facultyHeads.find(f => f._id === selectedFacultyHead)?.name}
                    </p>
                    <p className="text-sm text-blue-700">
                      {facultyHeads.find(f => f._id === selectedFacultyHead)?.email}
                    </p>
                  </div>
                </div>
              </div>
              
              {selectedFiles.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">
                    Including {selectedFiles.length} attachment(s):
                  </p>
                  <div className="space-y-1">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="text-xs text-gray-500 flex items-center">
                        <FileText className="w-3 h-3 mr-1" />
                        {file.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={confirmSubmit}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Evaluation
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinalEvaluationForm;
