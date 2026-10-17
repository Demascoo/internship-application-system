import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { 
  Award, 
  Star, 
  Save, 
  FileText, 
  Download,
  ChevronLeft,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Users
} from "lucide-react";
import { advisersAPI } from "../../services/api";

interface Student {
  _id: string;
  name: string;
  email: string;
  profile?: {
    university?: string;
    graduationYear?: number;
    course?: string;
  };
}

interface Evaluation {
  _id: string;
  grade: string;
  performanceRating: number;
  feedback: string;
  confirmedByUniversity: boolean;
  confirmedAt?: string;
  attachments?: Array<{
    filename: string;
    originalName: string;
    filePath: string;
    mimeType: string;
    size: number;
  }>;
  createdAt: string;
}

interface EnhancedEvaluationFormProps {
  student: Student;
  onBack?: () => void;
}

const EnhancedEvaluationForm: React.FC<EnhancedEvaluationFormProps> = ({ 
  student, 
  onBack 
}) => {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [currentEvaluation, setCurrentEvaluation] = useState({
    grade: "",
    performanceRating: 3,
    feedback: "",
    technicalSkills: {
      problemSolving: 3,
      codingAbility: 3,
      technicalKnowledge: 3,
      learningAbility: 3
    },
    softSkills: {
      teamwork: 3,
      punctuality: 3,
      communication: 3,
      initiative: 3,
      leadership: 3,
      adaptability: 3
    },
    workEthic: {
      reliability: 3,
      responsibility: 3,
      timeManagement: 3,
      attentionToDetail: 3
    }
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [files, setFiles] = useState<FileList | null>(null);

  // Load evaluations
  const loadEvaluations = async () => {
    setLoading(true);
    try {
      const res = await advisersAPI.listEvaluations(student._id);
      setEvaluations(res.data?.evaluations || []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load evaluations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvaluations();
  }, [student._id]);

  // Submit evaluation
  const submitEvaluation = async () => {
    if (!currentEvaluation.grade || !currentEvaluation.feedback) {
      toast.error("Please fill in grade and feedback");
      return;
    }

    setSaving(true);
    try {
      if (files && files.length > 0) {
        const form = new FormData();
        form.append("studentId", student._id);
        form.append("grade", currentEvaluation.grade);
        form.append("performanceRating", currentEvaluation.performanceRating.toString());
        form.append("feedback", currentEvaluation.feedback);
        form.append("technicalSkills", JSON.stringify(currentEvaluation.technicalSkills));
        form.append("softSkills", JSON.stringify(currentEvaluation.softSkills));
        form.append("workEthic", JSON.stringify(currentEvaluation.workEthic));
        Array.from(files).forEach((f) => form.append("attachments", f));
        await advisersAPI.submitEvaluation(form);
      } else {
        await advisersAPI.submitEvaluation({
          studentId: student._id,
          grade: currentEvaluation.grade,
          performanceRating: currentEvaluation.performanceRating,
          feedback: currentEvaluation.feedback,
          technicalSkills: currentEvaluation.technicalSkills,
          softSkills: currentEvaluation.softSkills,
          workEthic: currentEvaluation.workEthic
        });
      }
      
      await loadEvaluations();
      setShowForm(false);
      setCurrentEvaluation({
        grade: "",
        performanceRating: 3,
        feedback: "",
        technicalSkills: {
          problemSolving: 3,
          codingAbility: 3,
          technicalKnowledge: 3,
          learningAbility: 3
        },
        softSkills: {
          teamwork: 3,
          punctuality: 3,
          communication: 3,
          initiative: 3,
          leadership: 3,
          adaptability: 3
        },
        workEthic: {
          reliability: 3,
          responsibility: 3,
          timeManagement: 3,
          attentionToDetail: 3
        }
      });
      setFiles(null);
      toast.success("Evaluation submitted successfully");
    } catch (e) {
      console.error(e);
      toast.error("Failed to submit evaluation");
    } finally {
      setSaving(false);
    }
  };

  // Calculate average rating
  const calculateAverageRating = (skills: Record<string, number>) => {
    const values = Object.values(skills);
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  };

  // Get overall rating
  const getOverallRating = () => {
    const technicalAvg = calculateAverageRating(currentEvaluation.technicalSkills);
    const softAvg = calculateAverageRating(currentEvaluation.softSkills);
    const workEthicAvg = calculateAverageRating(currentEvaluation.workEthic);
    
    return (technicalAvg + softAvg + workEthicAvg) / 3;
  };

  // Get rating text
  const getRatingText = (rating: number) => {
    if (rating >= 4.5) return "Excellent";
    if (rating >= 3.5) return "Good";
    if (rating >= 2.5) return "Average";
    if (rating >= 1.5) return "Below Average";
    return "Poor";
  };

  // Get rating color
  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return "text-green-600";
    if (rating >= 3.5) return "text-blue-600";
    if (rating >= 2.5) return "text-yellow-600";
    if (rating >= 1.5) return "text-orange-600";
    return "text-red-600";
  };

  const overallRating = getOverallRating();
  const overallProgressPercent = Math.round((overallRating / 5) * 100);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Student Evaluation</h2>
            <p className="text-gray-600">Student: {student.name}</p>
          </div>
        </div>
        
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2"
        >
          <Award className="w-4 h-4" />
          <span>New Evaluation</span>
        </button>
      </div>

      {/* Evaluation Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Evaluations</p>
              <p className="text-2xl font-bold text-blue-800">{evaluations.length}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Overall Rating</p>
              <p className="text-2xl font-bold text-green-800">{overallRating.toFixed(1)}</p>
            </div>
            <Star className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Performance Level</p>
              <p className={`text-lg font-bold ${getRatingColor(overallRating)}`}>
                {getRatingText(overallRating)}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 font-medium">Progress</p>
              <p className="text-2xl font-bold text-orange-800">{overallProgressPercent}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Evaluation Form */}
      {showForm && (
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">New Evaluation</h3>
          
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Final Grade
              </label>
              <select
                value={currentEvaluation.grade}
                onChange={(e) => setCurrentEvaluation(prev => ({ ...prev, grade: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Grade</option>
                <option value="A+">A+ (90-100%)</option>
                <option value="A">A (85-89%)</option>
                <option value="A-">A- (80-84%)</option>
                <option value="B+">B+ (75-79%)</option>
                <option value="B">B (70-74%)</option>
                <option value="B-">B- (65-69%)</option>
                <option value="C+">C+ (60-64%)</option>
                <option value="C">C (55-59%)</option>
                <option value="C-">C- (50-54%)</option>
                <option value="D">D (40-49%)</option>
                <option value="F">F (Below 40%)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Overall Performance Rating
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="0.5"
                  value={currentEvaluation.performanceRating}
                  onChange={(e) => setCurrentEvaluation(prev => ({ 
                    ...prev, 
                    performanceRating: parseFloat(e.target.value) 
                  }))}
                  className="flex-1"
                />
                <div className="text-center">
                  <div className={`text-lg font-bold ${getRatingColor(currentEvaluation.performanceRating)}`}>
                    {currentEvaluation.performanceRating}
                  </div>
                  <div className="text-xs text-gray-500">
                    {getRatingText(currentEvaluation.performanceRating)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Technical Skills */}
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Technical Skills Assessment
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(currentEvaluation.technicalSkills).map(([skill, rating]) => (
                <div key={skill} className="bg-white rounded-lg p-4 border">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 capitalize">
                      {skill.replace(/([A-Z])/g, ' $1').trim()}
                    </label>
                    <span className={`text-sm font-medium ${getRatingColor(rating)}`}>
                      {getRatingText(rating)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="0.5"
                    value={rating}
                    onChange={(e) => setCurrentEvaluation(prev => ({
                      ...prev,
                      technicalSkills: {
                        ...prev.technicalSkills,
                        [skill]: parseFloat(e.target.value)
                      }
                    }))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1</span>
                    <span>2</span>
                    <span>3</span>
                    <span>4</span>
                    <span>5</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Soft Skills */}
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Soft Skills Assessment
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(currentEvaluation.softSkills).map(([skill, rating]) => (
                <div key={skill} className="bg-white rounded-lg p-4 border">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 capitalize">
                      {skill.replace(/([A-Z])/g, ' $1').trim()}
                    </label>
                    <span className={`text-sm font-medium ${getRatingColor(rating)}`}>
                      {getRatingText(rating)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="0.5"
                    value={rating}
                    onChange={(e) => setCurrentEvaluation(prev => ({
                      ...prev,
                      softSkills: {
                        ...prev.softSkills,
                        [skill]: parseFloat(e.target.value)
                      }
                    }))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1</span>
                    <span>2</span>
                    <span>3</span>
                    <span>4</span>
                    <span>5</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Work Ethic */}
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
              <Award className="w-5 h-5 mr-2" />
              Work Ethic Assessment
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(currentEvaluation.workEthic).map(([skill, rating]) => (
                <div key={skill} className="bg-white rounded-lg p-4 border">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 capitalize">
                      {skill.replace(/([A-Z])/g, ' $1').trim()}
                    </label>
                    <span className={`text-sm font-medium ${getRatingColor(rating)}`}>
                      {getRatingText(rating)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="0.5"
                    value={rating}
                    onChange={(e) => setCurrentEvaluation(prev => ({
                      ...prev,
                      workEthic: {
                        ...prev.workEthic,
                        [skill]: parseFloat(e.target.value)
                      }
                    }))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1</span>
                    <span>2</span>
                    <span>3</span>
                    <span>4</span>
                    <span>5</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Feedback */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Detailed Feedback & Comments
            </label>
            <textarea
              value={currentEvaluation.feedback}
              onChange={(e) => setCurrentEvaluation(prev => ({ ...prev, feedback: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={6}
              placeholder="Provide detailed feedback about the student's performance, strengths, areas for improvement, and overall assessment..."
            />
          </div>

          {/* File Attachments */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Supporting Documents (optional)
            </label>
            <input
              type="file"
              multiple
              onChange={(e) => setFiles(e.target.files)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {files && files.length > 0 && (
              <div className="mt-2 text-sm text-gray-600">
                {files.length} file(s) selected
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={submitEvaluation}
              disabled={saving}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Submit Evaluation'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Recent Evaluations */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Evaluations</h3>
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            </div>
          ) : evaluations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Award className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No evaluations found</p>
            </div>
          ) : (
            evaluations
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((evaluation) => (
                <div key={evaluation._id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Evaluation - {new Date(evaluation.createdAt).toLocaleDateString()}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Grade: {evaluation.grade} • Rating: {evaluation.performanceRating}/5
                      </p>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${getRatingColor(evaluation.performanceRating)}`}>
                        {getRatingText(evaluation.performanceRating)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {evaluation.confirmedByUniversity ? 'Confirmed' : (evaluation as any).seenByUniversity ? 'Seen' : 'Pending'}
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-700 mb-3">{evaluation.feedback}</p>
                  
                  {/* Attachments */}
                  {evaluation.attachments && evaluation.attachments.length > 0 && (
                    <div className="mb-3">
                      <h5 className="text-sm font-medium text-gray-900 mb-2">Supporting Documents</h5>
                      <div className="space-y-1">
                        {evaluation.attachments.map((attachment, index) => (
                          <a
                            key={index}
                            href={`/${attachment.filePath}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800"
                          >
                            <Download className="w-4 h-4" />
                            <span>{attachment.originalName}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Status */}
                  <div className="flex items-center space-x-2">
                    {evaluation.confirmedByUniversity ? (
                      <div className="flex items-center space-x-1 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm">Confirmed by University</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1 text-orange-600">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm">Pending University Review</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedEvaluationForm;
