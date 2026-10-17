import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { 
  Target, 
  CheckCircle, 
  Clock, 
  Plus, 
  Save, 
  FileText, 
  Upload, 
  Download,
  ChevronLeft,
  Calendar,
  TrendingUp,
  Award,
  Star
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

interface Milestone {
  _id?: string;
  title: string;
  description: string;
  completed: boolean;
  date?: Date;
  dueDate?: Date;
}

interface ProgressReport {
  _id: string;
  periodStart: string;
  periodEnd: string;
  summary: string;
  milestones: Milestone[];
  attachments?: Array<{
    filename: string;
    originalName: string;
    filePath: string;
    mimeType: string;
    size: number;
  }>;
  softSkills: {
    teamwork: number;
    punctuality: number;
    communication: number;
    initiative: number;
  };
  createdAt: string;
}

interface EnhancedProgressTrackingProps {
  student: Student;
  onBack?: () => void;
}

const EnhancedProgressTracking: React.FC<EnhancedProgressTrackingProps> = ({ 
  student, 
  onBack 
}) => {
  const [progressReports, setProgressReports] = useState<ProgressReport[]>([]);
  const [currentReport, setCurrentReport] = useState<Partial<ProgressReport>>({
    periodStart: new Date().toISOString().split('T')[0],
    periodEnd: new Date().toISOString().split('T')[0],
    summary: "",
    milestones: [],
    softSkills: {
      teamwork: 3,
      punctuality: 3,
      communication: 3,
      initiative: 3
    }
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [files, setFiles] = useState<FileList | null>(null);
  const [newMilestone, setNewMilestone] = useState({
    title: "",
    description: "",
    dueDate: ""
  });

  // Load progress reports
  const loadProgressReports = async () => {
    setLoading(true);
    try {
      const res = await advisersAPI.listProgress(student._id);
      setProgressReports(res.data?.reports || res.reports || res.data?.progress || res.progress || []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load progress reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProgressReports();
  }, [student._id]);

  // Submit progress report
  const submitProgressReport = async () => {
    if (!currentReport.summary || currentReport.milestones?.length === 0) {
      toast.error("Please fill in summary and add at least one milestone");
      return;
    }

    setSaving(true);
    try {
      if (files && files.length > 0) {
        const form = new FormData();
        form.append("studentId", student._id);
        form.append("periodStart", currentReport.periodStart!);
        form.append("periodEnd", currentReport.periodEnd!);
        form.append("summary", currentReport.summary);
        form.append("milestones", JSON.stringify(currentReport.milestones));
        form.append("softSkills", JSON.stringify(currentReport.softSkills));
        Array.from(files).forEach((f) => form.append("attachments", f));
        await advisersAPI.submitProgress(form);
      } else {
        await advisersAPI.submitProgress({
          studentId: student._id,
          periodStart: currentReport.periodStart,
          periodEnd: currentReport.periodEnd,
          summary: currentReport.summary,
          milestones: currentReport.milestones,
          softSkills: currentReport.softSkills
        });
      }
      
      await loadProgressReports();
      setShowForm(false);
      setCurrentReport({
        periodStart: new Date().toISOString().split('T')[0],
        periodEnd: new Date().toISOString().split('T')[0],
        summary: "",
        milestones: [],
        softSkills: {
          teamwork: 3,
          punctuality: 3,
          communication: 3,
          initiative: 3
        }
      });
      setFiles(null);
      toast.success("Progress report submitted successfully");
    } catch (e) {
      console.error(e);
      toast.error("Failed to submit progress report");
    } finally {
      setSaving(false);
    }
  };

  // Add milestone
  const addMilestone = () => {
    if (!newMilestone.title || !newMilestone.description) {
      toast.error("Please fill in milestone title and description");
      return;
    }

    const milestone: Milestone = {
      title: newMilestone.title,
      description: newMilestone.description,
      completed: false,
      dueDate: newMilestone.dueDate ? new Date(newMilestone.dueDate) : undefined
    };

    setCurrentReport(prev => ({
      ...prev,
      milestones: [...(prev.milestones || []), milestone]
    }));

    setNewMilestone({ title: "", description: "", dueDate: "" });
  };

  // Toggle milestone completion
  const toggleMilestone = (index: number) => {
    setCurrentReport(prev => ({
      ...prev,
      milestones: prev.milestones?.map((milestone, i) => 
        i === index ? { ...milestone, completed: !milestone.completed } : milestone
      )
    }));
  };

  // Remove milestone
  const removeMilestone = (index: number) => {
    setCurrentReport(prev => ({
      ...prev,
      milestones: prev.milestones?.filter((_, i) => i !== index)
    }));
  };

  // Calculate progress percentage
  const getProgressPercentage = (milestones: Milestone[]) => {
    if (milestones.length === 0) return 0;
    const completed = milestones.filter(m => m.completed).length;
    return Math.round((completed / milestones.length) * 100);
  };

  // Get skill level text
  const getSkillLevel = (score: number) => {
    if (score >= 4.5) return "Excellent";
    if (score >= 3.5) return "Good";
    if (score >= 2.5) return "Average";
    if (score >= 1.5) return "Below Average";
    return "Poor";
  };

  // Get skill color
  const getSkillColor = (score: number) => {
    if (score >= 4.5) return "text-green-600";
    if (score >= 3.5) return "text-blue-600";
    if (score >= 2.5) return "text-yellow-600";
    if (score >= 1.5) return "text-orange-600";
    return "text-red-600";
  };

  const currentProgress = getProgressPercentage(currentReport.milestones || []);

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
            <h2 className="text-2xl font-semibold text-gray-900">Progress Tracking</h2>
            <p className="text-gray-600">Student: {student.name}</p>
          </div>
        </div>
        
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Report</span>
        </button>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Reports</p>
              <p className="text-2xl font-bold text-blue-800">{progressReports.length}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Current Progress</p>
              <p className="text-2xl font-bold text-green-800">{currentProgress}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Active Milestones</p>
              <p className="text-2xl font-bold text-purple-800">
                {currentReport.milestones?.filter(m => !m.completed).length || 0}
              </p>
            </div>
            <Target className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Progress Form */}
      {showForm && (
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">New Progress Report</h3>
          
          {/* Period Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Period Start
              </label>
              <input
                type="date"
                value={currentReport.periodStart}
                onChange={(e) => setCurrentReport(prev => ({ ...prev, periodStart: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Period End
              </label>
              <input
                type="date"
                value={currentReport.periodEnd}
                onChange={(e) => setCurrentReport(prev => ({ ...prev, periodEnd: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Summary */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Progress Summary
            </label>
            <textarea
              value={currentReport.summary}
              onChange={(e) => setCurrentReport(prev => ({ ...prev, summary: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="Describe the student's progress during this period..."
            />
          </div>

          {/* Milestones */}
          <div className="mb-4">
            <h4 className="text-md font-medium text-gray-900 mb-3">Milestones & Tasks</h4>
            
            {/* Add New Milestone */}
            <div className="bg-white rounded-lg p-4 mb-4 border">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <input
                  type="text"
                  placeholder="Milestone title"
                  value={newMilestone.title}
                  onChange={(e) => setNewMilestone(prev => ({ ...prev, title: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Description"
                  value={newMilestone.description}
                  onChange={(e) => setNewMilestone(prev => ({ ...prev, description: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="date"
                  placeholder="Due date (optional)"
                  value={newMilestone.dueDate}
                  onChange={(e) => setNewMilestone(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={addMilestone}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Milestone</span>
              </button>
            </div>

            {/* Current Milestones */}
            <div className="space-y-2">
              {currentReport.milestones?.map((milestone, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
                  <button
                    onClick={() => toggleMilestone(index)}
                    className={`p-2 rounded-full transition-colors ${
                      milestone.completed 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-gray-100 text-gray-400 hover:bg-green-100 hover:text-green-600'
                    }`}
                  >
                    {milestone.completed ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                  </button>
                  
                  <div className="flex-1">
                    <h5 className={`font-medium ${milestone.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                      {milestone.title}
                    </h5>
                    <p className={`text-sm ${milestone.completed ? 'text-gray-400' : 'text-gray-600'}`}>
                      {milestone.description}
                    </p>
                    {milestone.dueDate && (
                      <p className="text-xs text-gray-500">
                        Due: {new Date(milestone.dueDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  
                  <button
                    onClick={() => removeMilestone(index)}
                    className="text-red-600 hover:text-red-800 p-1"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Soft Skills Assessment */}
          <div className="mb-4">
            <h4 className="text-md font-medium text-gray-900 mb-3">Soft Skills Assessment</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(currentReport.softSkills || {}).map(([skill, score]) => (
                <div key={skill} className="bg-white rounded-lg p-4 border">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 capitalize">
                      {skill}
                    </label>
                    <span className={`text-sm font-medium ${getSkillColor(score)}`}>
                      {getSkillLevel(score)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="0.5"
                    value={score}
                    onChange={(e) => setCurrentReport(prev => ({
                      ...prev,
                      softSkills: {
                        ...prev.softSkills!,
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

          {/* File Attachments */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Attachments (optional)
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
              onClick={submitProgressReport}
              disabled={saving}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Submit Report'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Recent Reports */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Progress Reports</h3>
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            </div>
          ) : progressReports.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No progress reports found</p>
            </div>
          ) : (
            progressReports
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((report) => (
                <div key={report._id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {new Date(report.periodStart).toLocaleDateString()} - {new Date(report.periodEnd).toLocaleDateString()}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Submitted on {new Date(report.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-600">
                        {getProgressPercentage(report.milestones)}%
                      </div>
                      <div className="text-xs text-gray-500">Progress</div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-700 mb-3">{report.summary}</p>
                  
                  {/* Milestones Summary */}
                  <div className="mb-3">
                    <h5 className="text-sm font-medium text-gray-900 mb-2">Milestones</h5>
                    <div className="space-y-1">
                      {report.milestones.slice(0, 3).map((milestone, index) => (
                        <div key={index} className="flex items-center space-x-2 text-sm">
                          {milestone.completed ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <Clock className="w-4 h-4 text-gray-400" />
                          )}
                          <span className={milestone.completed ? 'line-through text-gray-500' : 'text-gray-700'}>
                            {milestone.title}
                          </span>
                        </div>
                      ))}
                      {report.milestones.length > 3 && (
                        <p className="text-xs text-gray-500">
                          +{report.milestones.length - 3} more milestones
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Soft Skills */}
                  <div className="mb-3">
                    <h5 className="text-sm font-medium text-gray-900 mb-2">Soft Skills</h5>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(report.softSkills).map(([skill, score]) => (
                        <div key={skill} className="flex items-center justify-between text-sm">
                          <span className="capitalize text-gray-600">{skill}</span>
                          <div className="flex items-center space-x-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${
                                  i < score ? 'text-yellow-500 fill-current' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Attachments */}
                  {report.attachments && report.attachments.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-900 mb-2">Attachments</h5>
                      <div className="space-y-1">
                        {report.attachments.map((attachment, index) => (
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
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedProgressTracking;
