import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Bell,
  Calendar,
  Award,
  Download,
  Eye,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useApp } from "../../contexts/AppContext";
import RealTimeNotification from "../Common/RealTimeNotification";
import { advisersAPI } from "../../services/api";
import AdviserDocumentsPanel from "../Common/AdviserDocumentsPanel";

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const {
    applications,
    programs,
    notifications,
    getApplicationsByStudent,
    fetchApplications,
  } = useApp();
  const [userApplications, setUserApplications] = useState<any[]>([]);
  const [acceptancePapers, setAcceptancePapers] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [progressReports, setProgressReports] = useState<any[]>([]);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [adviserMessages, setAdviserMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchApplications();
      fetchAcceptancePapers();
      fetchAdviserData();
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      let filteredApplications = [];

      // Try getApplicationsByStudent first
      if (
        getApplicationsByStudent &&
        typeof getApplicationsByStudent === "function"
      ) {
        try {
          filteredApplications = getApplicationsByStudent(user.id);
        } catch (error) {
          console.error("Error with getApplicationsByStudent:", error);
        }
      }

      // If no results from getApplicationsByStudent, try manual filtering
      if (
        filteredApplications.length === 0 &&
        applications &&
        applications.length > 0
      ) {
        filteredApplications = applications.filter((app) => {
          // Check if studentId is an object with _id property
          if (
            app.studentId &&
            typeof app.studentId === "object" &&
            app.studentId._id
          ) {
            return app.studentId._id === user.id;
          }

          // Fallback to other possible field structures
          return (
            app.studentId === user.id ||
            app.userId === user.id ||
            app.student_id === user.id ||
            app.user_id === user.id ||
            (app.student && app.student.id === user.id) ||
            (app.user && app.user.id === user.id)
          );
        });
      }

      setUserApplications(filteredApplications);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [user?.id, applications, getApplicationsByStudent]);

  const fetchAcceptancePapers = async () => {
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:5000/api"
        }/acceptance-papers/student`,
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

  const fetchAdviserData = async () => {
    try {
      const [att, pr, ev, msgs] = await Promise.all([
        advisersAPI.listAttendance(user!.id),
        advisersAPI.listProgress(user!.id),
        advisersAPI.listEvaluations(user!.id),
        advisersAPI.listMessages(user!.id),
      ]);
      setAttendance(att.data?.attendance || att.attendance || []);
      setProgressReports(pr.data?.reports || pr.reports || []);
      setEvaluations(ev.data?.evaluations || ev.evaluations || []);
      const allMsgs = msgs.data?.messages || msgs.messages || [];
      setAdviserMessages(allMsgs.filter((m: any) => m.visibleToStudent));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadAcceptance = async (
    paperId: string,
    filename: string
  ) => {
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:5000/api"
        }/acceptance-papers/download/${paperId}`,
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
      }
    } catch (error) {
      console.error("Error downloading acceptance paper:", error);
    }
  };

  const handleViewAcceptance = async (paperId: string) => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL
        ? import.meta.env.VITE_API_URL.replace("/api", "")
        : "http://localhost:5000";

      const paper = acceptancePapers.find((p) => p._id === paperId);
      if (paper) {
        const fileUrl = `${baseUrl}/${paper.filePath}`;
        window.open(fileUrl, "_blank");
      }
    } catch (error) {
      console.error("Error viewing acceptance paper:", error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "accepted":
        return <CheckCircle className="icon success" />;
      case "rejected":
        return <XCircle className="icon error" />;
      default:
        return <Clock className="icon pending" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "accepted":
        return "Accepted";
      case "rejected":
        return "Rejected";
      default:
        return "Under Review";
    }
  };

  // Calculate dynamic statistics
  const totalApplications = userApplications.length;
  const acceptedApplications = userApplications.filter(
    (app) => app.status === "accepted"
  ).length;
  const pendingApplications = userApplications.filter(
    (app) => app.status === "pending"
  ).length;
  const rejectedApplications = userApplications.filter(
    (app) => app.status === "rejected"
  ).length;

  const userNotifications = notifications
    .filter((n) => n.userId === user?.id)
    .slice(0, 5);
  const unreadNotifications = userNotifications.filter((n) => !n.read).length;

  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-header">
          <div className="header-content">
            <h1 className="dashboard-title">Welcome back, {user?.name}! 👋</h1>
            <p className="dashboard-subtitle">
              Track your applications and stay updated on your internship
              journey.
            </p>
          </div>
          <div className="header-actions">
            <Link to="/programs" className="btn btn-primary">
              Browse Programs
            </Link>
          </div>
        </div>

        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-icon">
              <FileText className="icon" />
            </div>
            <div className="stat-content">
              <div className="stat-number">{totalApplications}</div>
              <div className="stat-label">Applications</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <CheckCircle className="icon" />
            </div>
            <div className="stat-content">
              <div className="stat-number">{acceptedApplications}</div>
              <div className="stat-label">Accepted</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <Clock className="icon" />
            </div>
            <div className="stat-content">
              <div className="stat-number">{pendingApplications}</div>
              <div className="stat-label">Pending</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <Bell className="icon" />
            </div>
            <div className="stat-content">
              <div className="stat-number">{unreadNotifications}</div>
              <div className="stat-label">New Notifications</div>
            </div>
          </div>
        </div>

        <div className="dashboard-content">
          <div className="main-content">
            <div className="section">
              <div className="section-header">
                <h2 className="section-title">My Applications</h2>
                <Link to="/programs" className="section-action">
                  Apply to More Programs
                </Link>
              </div>

              {loading ? (
                <div className="loading-state">
                  <p>Loading applications...</p>
                </div>
              ) : userApplications.length > 0 ? (
                <div className="applications-list">
                  {userApplications.map((application) => {
                    const program =
                      programs.find((p) => p.id === application.programId) ||
                      application.programDetails;
                    return (
                      <div key={application.id} className="application-card">
                        <div className="application-header">
                          <div className="application-info">
                            <h3 className="application-title">
                              {program?.name || "Program"}
                            </h3>
                            <p className="application-date">
                              Applied on{" "}
                              {new Date(
                                application.appliedAt || application.createdAt
                              ).toLocaleDateString()}
                            </p>
                          </div>
                          <div
                            className={`application-status ${application.status}`}
                          >
                            {getStatusIcon(application.status)}
                            <span>{getStatusText(application.status)}</span>
                          </div>
                        </div>

                        <div className="application-content">
                          <p className="application-description">
                            {program?.description || "Program description"}
                          </p>

                          <div className="application-details">
                            <div className="detail">
                              <Calendar className="icon" />
                              <span>
                                {program?.duration || "Duration not specified"}
                              </span>
                            </div>
                            {application.resumeUrl && (
                              <div className="detail">
                                <FileText className="icon" />
                                <span>Resume uploaded</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="application-actions">
                          <button className="btn btn-outline btn-small">
                            View Details
                          </button>
                          {application.status === "accepted" && (
                            <button className="btn btn-primary btn-small">
                              <Award className="icon" />
                              View Certificate
                            </button>
                          )}
                        </div>
                        {application.status === "rejected" &&
                          application.reviewNotes && (
                            <div className="mt-2 p-3 rounded-md bg-red-50 text-red-700 text-sm">
                              <strong>Rejection Reason:</strong>{" "}
                              {application.reviewNotes}
                            </div>
                          )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-state">
                  <FileText className="empty-icon" />
                  <h3>No Applications Yet</h3>
                  <p>
                    You haven't applied to any programs yet. Browse our
                    available programs and start your application today!
                  </p>
                  <Link to="/programs" className="btn btn-primary">
                    Browse Programs
                  </Link>
                </div>
              )}
            </div>

            {/* Acceptance Papers Section */}
            {acceptancePapers.length > 0 && (
              <div className="section">
                <div className="section-header">
                  <h2 className="section-title">Acceptance Papers</h2>
                  <span className="section-count">
                    {acceptancePapers.length} paper
                    {acceptancePapers.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="acceptance-papers-list">
                  {acceptancePapers.map((paper) => (
                    <div key={paper._id} className="acceptance-paper-card">
                      <div className="paper-header">
                        <div className="paper-icon">
                          <FileText className="icon" />
                        </div>
                        <div className="paper-status">
                          <CheckCircle className="icon success" />
                          <span>Available</span>
                        </div>
                      </div>
                      <div className="paper-content">
                        <h4 className="paper-title">{paper.programName}</h4>
                        <p className="paper-date">
                          Uploaded on{" "}
                          {new Date(paper.uploadDate).toLocaleDateString()}
                        </p>
                        {paper.message && (
                          <p className="paper-message">{paper.message}</p>
                        )}
                        <div className="paper-details">
                          <span>File: {paper.originalName}</span>
                          <span>Size: PDF Document</span>
                        </div>
                      </div>
                      <div className="paper-actions">
                        <button
                          onClick={() => handleViewAcceptance(paper._id)}
                          className="btn btn-outline btn-small"
                        >
                          <Eye className="icon" />
                          View
                        </button>
                        <button
                          onClick={() =>
                            handleDownloadAcceptance(
                              paper._id,
                              paper.originalName
                            )
                          }
                          className="btn btn-primary btn-small"
                        >
                          <Download className="icon" />
                          Download
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Attendance */}
            <div className="section">
              <div className="section-header">
                <h2 className="section-title">Attendance</h2>
                <span className="section-count">{attendance.length}</span>
              </div>
              {attendance.length ? (
                <div className="applications-list">
                  {attendance.slice(0, 10).map((a) => (
                    <div key={a._id} className="application-card">
                      <div className="application-header">
                        <div className="application-info">
                          <h3 className="application-title">
                            {new Date(a.date).toLocaleDateString()}
                          </h3>
                          <p className="application-date">{a.notes || ""}</p>
                        </div>
                        <div className={`application-status ${a.status}`}>
                          <span style={{ textTransform: "capitalize" }}>
                            {a.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <Calendar className="empty-icon" />
                  <h3>No attendance records</h3>
                </div>
              )}
            </div>

            {/* Progress Reports */}
            <div className="section">
              <div className="section-header">
                <h2 className="section-title">Progress Reports</h2>
                <span className="section-count">{progressReports.length}</span>
              </div>
              {progressReports.length ? (
                <div className="applications-list">
                  {progressReports.slice(0, 10).map((r) => (
                    <div key={r._id} className="application-card">
                      <div className="application-header">
                        <div className="application-info">
                          <h3 className="application-title">
                            {new Date(r.periodStart).toLocaleDateString()} -{" "}
                            {new Date(r.periodEnd).toLocaleDateString()}
                          </h3>
                          <p className="application-date">{r.summary}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <FileText className="empty-icon" />
                  <h3>No progress reports</h3>
                </div>
              )}
            </div>

            {/* Evaluations */}
            <div className="section">
              <div className="section-header">
                <h2 className="section-title">Evaluations</h2>
                <span className="section-count">{evaluations.length}</span>
              </div>
              {evaluations.length ? (
                <div className="applications-list">
                  {evaluations.slice(0, 10).map((e) => (
                    <div key={e._id} className="application-card">
                      <div className="application-header">
                        <div className="application-info">
                          <h3 className="application-title">
                            Grade: {e.grade || "N/A"}
                          </h3>
                          <p className="application-date">
                            Performance: {e.performanceRating || "-"}
                          </p>
                        </div>
                        {e.confirmedByUniversity && (
                          <div className="application-status accepted">
                            <CheckCircle className="icon success" />
                            <span>Confirmed</span>
                          </div>
                        )}
                      </div>
                      {e.feedback && (
                        <div className="mt-2 text-sm">{e.feedback}</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <Award className="empty-icon" />
                  <h3>No evaluations yet</h3>
                </div>
              )}
            </div>

            {/* Adviser Messages (visible) */}
            <div className="section">
              <div className="section-header">
                <h2 className="section-title">Adviser Messages</h2>
                <span className="section-count">{adviserMessages.length}</span>
              </div>
              {adviserMessages.length ? (
                <div className="applications-list">
                  {adviserMessages.slice(0, 10).map((m) => (
                    <div key={m._id} className="application-card">
                      <div className="application-header">
                        <div className="application-info">
                          <h3 className="application-title">Message</h3>
                          <p className="application-date">
                            {new Date(m.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 text-sm whitespace-pre-wrap">
                        {m.content}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <Bell className="empty-icon" />
                  <h3>No adviser messages</h3>
                </div>
              )}
            </div>

            {/* Documents visible to student */}
            <div className="section">
              <div className="section-header">
                <h2 className="section-title">Documents</h2>
              </div>
              {/* Reuse documents panel in read-only mode by passing canUpload={false} */}
              <AdviserDocumentsPanel studentId={user?.id as string} />
            </div>
          </div>

          <div className="sidebar">
            <div className="sidebar-section">
              <h3 className="sidebar-title">Recent Notifications</h3>
              <div className="notifications-list">
                {userNotifications.length > 0 ? (
                  userNotifications.map((notification) => (
                    <RealTimeNotification
                      key={notification.id}
                      notification={notification}
                    />
                  ))
                ) : (
                  <p className="no-notifications">No notifications yet</p>
                )}
              </div>
            </div>

            <div className="sidebar-section">
              <h3 className="sidebar-title">Quick Actions</h3>
              <div className="quick-actions">
                <Link to="/programs" className="quick-action">
                  <FileText className="icon" />
                  <span>Apply to Programs</span>
                </Link>
                <Link to="/profile" className="quick-action">
                  <FileText className="icon" />
                  <span>Update Profile</span>
                </Link>
                <Link to="/help" className="quick-action">
                  <FileText className="icon" />
                  <span>Get Help</span>
                </Link>
              </div>
            </div>

            <div className="sidebar-section">
              <h3 className="sidebar-title">Program Deadlines</h3>
              <div className="deadlines-list">
                <div className="deadline-item">
                  <div className="deadline-date">
                    <Calendar className="icon" />
                    <span>Feb 28</span>
                  </div>
                  <div className="deadline-info">
                    <strong>Applications Close</strong>
                    <p>All internship programs</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
