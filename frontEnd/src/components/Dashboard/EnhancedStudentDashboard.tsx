import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { 
  Calendar, 
  Target, 
  Award, 
  FileText, 
  Download,
  User,
  Eye,
  TrendingUp,
  CheckCircle,
  Star,
  Bell,
  Clock,
  AlertCircle
} from "lucide-react";
import { advisersAPI } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { useApp } from "../../contexts/AppContext";

interface AttendanceRecord {
  _id: string;
  date: string;
  status: "present" | "absent" | "late" | "excused";
  notes?: string;
  createdAt: string;
}

interface ProgressReport {
  _id: string;
  periodStart: string;
  periodEnd: string;
  summary: string;
  milestones: Array<{
    title: string;
    description: string;
    completed: boolean;
    date?: Date;
  }>;
  softSkills: {
    teamwork: number;
    punctuality: number;
    communication: number;
    initiative: number;
  };
  createdAt: string;
}

interface Evaluation {
  _id: string;
  grade: string;
  performanceRating: number;
  feedback: string;
  confirmedByUniversity: boolean;
  confirmedAt?: string;
  technicalSkills?: Record<string, number>;
  softSkills?: Record<string, number>;
  workEthic?: Record<string, number>;
  createdAt: string;
}

interface AcceptanceDocument {
  _id: string;
  filename: string;
  originalName: string;
  filePath: string;
  programName: string;
  uploadDate: string;
}

type TabType = "overview" | "attendance" | "progress" | "evaluation" | "documents";

const EnhancedStudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [loading, setLoading] = useState(false);
  const { notifications: appNotifications, markAllUserNotificationsRead } = useApp();
  const [notifications, setNotifications] = useState<any[]>([]);
  
  // Student data
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [progressReports, setProgressReports] = useState<ProgressReport[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [acceptanceDocuments, setAcceptanceDocuments] = useState<AcceptanceDocument[]>([]);

  // Load student data
  const loadStudentData = async () => {
    const uid = (user as any)?._id || (user as any)?.id;
    if (!uid) return;
    
    setLoading(true);
    try {
      // Load attendance records
      const attendanceRes = await advisersAPI.listAttendance(uid);
      setAttendanceRecords(attendanceRes.data?.attendance || attendanceRes.attendance || []);
      
      // Load progress reports
      const progressRes = await advisersAPI.listProgress(uid);
      setProgressReports(progressRes.data?.reports || progressRes.reports || progressRes.data?.progress || progressRes.progress || []);
      
      // Load evaluations
      const evaluationRes = await advisersAPI.listEvaluations(uid);
      setEvaluations(evaluationRes.data?.evaluations || evaluationRes.evaluations || []);
      
      // Load acceptance documents
      const documentsRes = await advisersAPI.listDocuments(uid);
      setAcceptanceDocuments(documentsRes.data?.documents || documentsRes.documents || []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load student data");
    } finally {
      setLoading(false);
    }
  };

  // Load notifications
  const loadNotifications = async () => {
    try {
      const res = await advisersAPI.getNotifications();
      const list = res.data?.notifications || res.notifications || [];
      setNotifications(list);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadStudentData();
    loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [(user as any)?._id, (user as any)?.id]);

  // Get tab icon
  const getTabIcon = (tab: TabType) => {
    switch (tab) {
      case "overview": return <Eye className="w-5 h-5" />;
      case "attendance": return <Calendar className="w-5 h-5" />;
      case "progress": return <Target className="w-5 h-5" />;
      case "evaluation": return <Award className="w-5 h-5" />;
      case "documents": return <FileText className="w-5 h-5" />;
    }
  };

  // Get tab label
  const getTabLabel = (tab: TabType) => {
    switch (tab) {
      case "overview": return "Overview";
      case "attendance": return "Attendance";
      case "progress": return "Progress";
      case "evaluation": return "Evaluation";
      case "documents": return "Documents";
    }
  };

  // Calculate attendance percentage
  const getAttendancePercentage = () => {
    if (attendanceRecords.length === 0) return 0;
    const present = attendanceRecords.filter(r => r.status === "present").length;
    return Math.round((present / attendanceRecords.length) * 100);
  };

  // Calculate progress percentage
  const getProgressPercentage = (milestones: any[]) => {
    if (!milestones || milestones.length === 0) return 0;
    const completed = milestones.filter(m => m.completed).length;
    return Math.round((completed / milestones.length) * 100);
  };

  const getProgressPercentageFromEvaluations = (evals: Evaluation[]) => {
    if (!evals || evals.length === 0) return 0;
    const latest = [...evals].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    const parts: number[] = [];
    if (typeof latest.performanceRating === "number") parts.push(latest.performanceRating);
    const pushValues = (obj?: Record<string, number>) => {
      if (!obj) return;
      for (const v of Object.values(obj)) if (typeof v === "number") parts.push(v);
    };
    pushValues(latest.technicalSkills as any);
    pushValues(latest.softSkills as any);
    pushValues(latest.workEthic as any);
    if (parts.length === 0) return 0;
    const avg = parts.reduce((a, b) => a + b, 0) / parts.length;
    return Math.round((avg / 5) * 100);
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "present": return "bg-green-100 text-green-800";
      case "absent": return "bg-red-100 text-red-800";
      case "late": return "bg-yellow-100 text-yellow-800";
      case "excused": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Render overview tab
  const renderOverviewTab = () => {
    const attendancePercentage = getAttendancePercentage();
    const latestProgress = getProgressPercentageFromEvaluations(evaluations);
    const latestGrade = evaluations.length > 0 ? evaluations[0].grade : "N/A";
    const latestRating = evaluations.length > 0 ? evaluations[0].performanceRating : 0;

    return (
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">Welcome back, {user?.name}!</h2>
          <p className="text-blue-100">
            Track your internship progress and stay updated with your performance.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Attendance Rate</p>
                <p className="text-2xl font-bold text-green-800">{attendancePercentage}%</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Current Progress</p>
                <p className="text-2xl font-bold text-blue-800">{latestProgress}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Latest Grade</p>
                <p className="text-2xl font-bold text-purple-800">{latestGrade}</p>
              </div>
              <Award className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">Performance</p>
                <p className="text-2xl font-bold text-orange-800">{latestRating}/5</p>
              </div>
              <Star className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Attendance */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Attendance</h3>
            <div className="space-y-3">
              {attendanceRecords.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No attendance records found</p>
              ) : (
                attendanceRecords
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .slice(0, 5)
                  .map((record) => (
                    <div key={record._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${getStatusColor(record.status)}`}>
                          {record.status === "present" && <CheckCircle className="w-4 h-4" />}
                          {record.status === "absent" && <AlertCircle className="w-4 h-4" />}
                          {record.status === "late" && <Clock className="w-4 h-4" />}
                          {record.status === "excused" && <AlertCircle className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {new Date(record.date).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-600 capitalize">
                            {record.status}
                            {record.notes && ` • ${record.notes}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* Recent Progress */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Progress</h3>
            <div className="space-y-3">
              {progressReports.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No progress reports found</p>
              ) : (
                progressReports
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .slice(0, 3)
                  .map((report) => (
                    <div key={report._id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">
                          {new Date(report.periodStart).toLocaleDateString()} - {new Date(report.periodEnd).toLocaleDateString()}
                        </h4>
                        <span className="text-sm font-bold text-blue-600">{getProgressPercentageFromEvaluations(evaluations)}%</span>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{report.summary}</p>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Notifications</h3>
            <div className="space-y-3">
              {notifications.slice(0, 5).map((notification, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                  <Bell className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                    <p className="text-xs text-gray-600">{notification.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render attendance tab
  const renderAttendanceTab = () => {
    return (
      <div className="space-y-6">
        {/* Attendance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Attendance Rate</p>
                <p className="text-2xl font-bold text-green-800">{getAttendancePercentage()}%</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Days</p>
                <p className="text-2xl font-bold text-blue-800">{attendanceRecords.length}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Present Days</p>
                <p className="text-2xl font-bold text-purple-800">
                  {attendanceRecords.filter(r => r.status === "present").length}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Attendance Records */}
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="p-6 border-b">
            <h3 className="text-lg font-medium text-gray-900">Attendance Records</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recorded
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendanceRecords.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                      No attendance records found
                    </td>
                  </tr>
                ) : (
                  attendanceRecords
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((record) => (
                      <tr key={record._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(record.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}>
                            {record.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {record.notes || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(record.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Render progress tab
  const renderProgressTab = () => {
    return (
      <div className="space-y-6">
        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <p className="text-sm text-green-600 font-medium">Latest Progress</p>
                <p className="text-2xl font-bold text-green-800">
                  {progressReports.length > 0 
                    ? getProgressPercentage(progressReports[0].milestones) 
                    : 0}%
                </p>
              </div>
              <Target className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Last Updated</p>
                <p className="text-sm font-bold text-purple-800">
                  {progressReports.length > 0 
                    ? new Date(progressReports[0].createdAt).toLocaleDateString()
                    : "Never"}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Progress Reports */}
        <div className="space-y-4">
          {progressReports.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No progress reports found</p>
            </div>
          ) : (
            progressReports
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((report) => (
                <div key={report._id} className="bg-white rounded-lg border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {new Date(report.periodStart).toLocaleDateString()} - {new Date(report.periodEnd).toLocaleDateString()}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Submitted on {new Date(report.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-600">{getProgressPercentageFromEvaluations(evaluations)}%</div>
                      <div className="text-xs text-gray-500">Progress</div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-700 mb-4">{report.summary}</p>
                  
                  {/* Milestones */}
                  <div className="mb-4">
                    <h5 className="text-sm font-medium text-gray-900 mb-2">Milestones</h5>
                    <div className="space-y-2">
                      {report.milestones.map((milestone, index) => (
                        <div key={index} className="flex items-center space-x-2 text-sm">
                          {milestone.completed ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />
                          )}
                          <span className={milestone.completed ? 'line-through text-gray-500' : 'text-gray-700'}>
                            {milestone.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Soft Skills */}
                  <div>
                    <h5 className="text-sm font-medium text-gray-900 mb-2">Soft Skills Assessment</h5>
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
                </div>
              ))
          )}
        </div>
      </div>
    );
  };

  // Render evaluation tab
  const renderEvaluationTab = () => {
    return (
      <div className="space-y-6">
        {/* Evaluation Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Evaluations</p>
                <p className="text-2xl font-bold text-blue-800">{evaluations.length}</p>
              </div>
              <Award className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Latest Grade</p>
                <p className="text-2xl font-bold text-green-800">
                  {evaluations.length > 0 ? evaluations[0].grade : "N/A"}
                </p>
              </div>
              <Star className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">Status</p>
                <p className="text-lg font-bold text-orange-800">
                  {evaluations.length > 0 && evaluations[0].confirmedByUniversity ? 'Confirmed' : 'Pending'}
                </p>
              </div>
              {evaluations.length > 0 && evaluations[0].confirmedByUniversity ? (
                <CheckCircle className="w-8 h-8 text-orange-600" />
              ) : (
                <div className="w-8 h-8 border-2 border-orange-600 rounded-full" />
              )}
            </div>
          </div>
        </div>

        {/* Evaluations */}
        <div className="space-y-4">
          {evaluations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Award className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No evaluations found</p>
            </div>
          ) : (
            evaluations
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((evaluation) => (
                <div key={evaluation._id} className="bg-white rounded-lg border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Evaluation - {new Date(evaluation.createdAt).toLocaleDateString()}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Grade: {evaluation.grade} • Rating: {evaluation.performanceRating}/5
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-600">
                        {evaluation.performanceRating}/5
                      </div>
                      <div className="text-xs text-gray-500">Performance</div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-700 mb-4">{evaluation.feedback}</p>
                  {(evaluation.technicalSkills || evaluation.softSkills || evaluation.workEthic) && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      {evaluation.technicalSkills && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-900 mb-2">Technical Skills</h5>
                          <div className="space-y-1 text-sm">
                            {Object.entries(evaluation.technicalSkills).map(([k,v]) => (
                              <div key={k} className="flex justify-between"><span className="capitalize text-gray-600">{k.replace(/([A-Z])/g, ' $1').trim()}</span><span className="font-medium">{v}/5</span></div>
                            ))}
                          </div>
                        </div>
                      )}
                      {evaluation.softSkills && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-900 mb-2">Soft Skills</h5>
                          <div className="space-y-1 text-sm">
                            {Object.entries(evaluation.softSkills).map(([k,v]) => (
                              <div key={k} className="flex justify-between"><span className="capitalize text-gray-600">{k.replace(/([A-Z])/g, ' $1').trim()}</span><span className="font-medium">{v}/5</span></div>
                            ))}
                          </div>
                        </div>
                      )}
                      {evaluation.workEthic && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-900 mb-2">Work Ethic</h5>
                          <div className="space-y-1 text-sm">
                            {Object.entries(evaluation.workEthic).map(([k,v]) => (
                              <div key={k} className="flex justify-between"><span className="capitalize text-gray-600">{k.replace(/([A-Z])/g, ' $1').trim()}</span><span className="font-medium">{v}/5</span></div>
                            ))}
                          </div>
                        </div>
                      )}
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
                        <div className="w-4 h-4 border-2 border-orange-600 rounded-full" />
                        <span className="text-sm">Pending University Review</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
    );
  };

  // Render documents tab
  const renderDocumentsTab = () => {
    return (
      <div className="space-y-6">
        {/* Documents Overview */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Documents</p>
              <p className="text-2xl font-bold text-blue-800">{acceptanceDocuments.length}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        {/* Documents List */}
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="p-6 border-b">
            <h3 className="text-lg font-medium text-gray-900">Acceptance Documents</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {acceptanceDocuments.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No documents found</p>
              </div>
            ) : (
              acceptanceDocuments
                .sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())
                .map((document) => (
                  <div key={document._id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{document.originalName}</h4>
                          <p className="text-sm text-gray-600">
                            Program: {document.programName} • Uploaded: {new Date(document.uploadDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <a
                        href={`/${document.filePath}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
                      >
                        <Download className="w-4 h-4" />
                        <span className="text-sm">Download</span>
                      </a>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return renderOverviewTab();
      case "attendance":
        return renderAttendanceTab();
      case "progress":
        return renderProgressTab();
      case "evaluation":
        return renderEvaluationTab();
      case "documents":
        return renderDocumentsTab();
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-semibold text-gray-900">Student Dashboard</h1>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <User className="w-4 h-4" />
                <span>{user?.name}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <div className="relative">
                <button
                  className="p-2 text-gray-400 hover:text-gray-600 relative"
                  onClick={() => {
                    setNotifications([]);
                    const uid = (user as any)?._id || (user as any)?.id;
                    if (uid) {
                      markAllUserNotificationsRead(uid);
                    }
                    navigate("/notifications");
                  }}
                >
                  <Bell className="w-6 h-6" />
                  {(appNotifications?.filter?.((n: any) => !n.read)?.length || notifications.length) > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {appNotifications?.filter?.((n: any) => !n.read)?.length || notifications.length}
                    </span>
                  )}
                </button>
              </div>
              <Link to="/dashboard" className="px-3 py-2 rounded-md border text-sm text-gray-700 hover:bg-gray-50">Back to Main Dashboard</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {(["overview", "attendance", "progress", "evaluation", "documents"] as TabType[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {getTabIcon(tab)}
                  <span>{getTabLabel(tab)}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              renderTabContent()
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedStudentDashboard;
