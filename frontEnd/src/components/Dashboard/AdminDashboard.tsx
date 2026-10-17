import React, { useState } from "react";
import {
  Users,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Upload,
  Settings,
  BarChart3,
  TrendingUp,
  Award,
  Grid3X3,
  UserCheck,
  FileCheck,
  ArrowRight,
  BookOpen,
  Target,
  Shield,
  PieChart,
} from "lucide-react";
import { useApp } from "../../contexts/AppContext";
import ApplicationReview from "./ApplicationReview";
import AcceptancePaperUpload from "./AcceptancePaperUpload";
import ProgramManagement from "./ProgramManagement";
import StudentGrouping from "./StudentGrouping";
import AdviserManagement from "./AdviserManagement";
import AdviserAssignment from "./AdviserAssignment";
import CompanyAdviserAssignment from "./CompanyAdviserAssignment";
import EnhancedAccountManagement from "./EnhancedAccountManagement";

const AdminDashboard: React.FC = () => {
  const { applications, programs, updateApplicationStatus } = useApp();
  const [selectedApplication, setSelectedApplication] = useState<string | null>(
    null
  );
  const [showAcceptanceUpload, setShowAcceptanceUpload] = useState(false);
  const [showProgramManagement, setShowProgramManagement] = useState(false);
  const [showStudentGrouping, setShowStudentGrouping] = useState(false);
  const [showAdviserManagement, setShowAdviserManagement] = useState(false);
  const [showAdviserAssignment, setShowAdviserAssignment] = useState(false);
  const [showCompanyAdviserAssignment, setShowCompanyAdviserAssignment] = useState(false);
  const [showEnhancedAccountManagement, setShowEnhancedAccountManagement] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterProgram, setFilterProgram] = useState<string>("all");
  const [rejectModal, setRejectModal] = useState<{ id: string | null; reason: string }>(() => ({ id: null, reason: "" }));

  const filteredApplications = applications.filter((app) => {
    const statusMatch = filterStatus === "all" || app.status === filterStatus;
    const programMatch =
      filterProgram === "all" || app.programId === filterProgram;
    return statusMatch && programMatch;
  });

  const stats = {
    total: applications.length,
    pending: applications.filter((app) => app.status === "pending").length,
    accepted: applications.filter((app) => app.status === "accepted").length,
    rejected: applications.filter((app) => app.status === "rejected").length,
    totalPrograms: programs.length,
    activePrograms: programs.filter((p) => p.availableSpots > 0).length,
  };

  const handleStatusUpdate = (
    applicationId: string,
    status: "accepted" | "rejected"
  ) => {
    updateApplicationStatus(applicationId, status);
  };

  if (showAcceptanceUpload) {
    return (
      <AcceptancePaperUpload onBack={() => setShowAcceptanceUpload(false)} />
    );
  }

  if (showProgramManagement) {
    return <ProgramManagement onBack={() => setShowProgramManagement(false)} />;
  }

  if (showStudentGrouping) {
    return <StudentGrouping onBack={() => setShowStudentGrouping(false)} />;
  }

  if (showAdviserManagement) {
    return <AdviserManagement onBack={() => setShowAdviserManagement(false)} />;
  }

  if (showAdviserAssignment) {
    return <AdviserAssignment onBack={() => setShowAdviserAssignment(false)} />;
  }

  if (showCompanyAdviserAssignment) {
    return <CompanyAdviserAssignment onBack={() => setShowCompanyAdviserAssignment(false)} />;
  }

  if (showEnhancedAccountManagement) {
    return <EnhancedAccountManagement onBack={() => setShowEnhancedAccountManagement(false)} />;
  }

  if (selectedApplication) {
    const application = applications.find(
      (app) => app.id === selectedApplication
    );
    if (application) {
      return (
        <ApplicationReview
          application={application}
          onBack={() => setSelectedApplication(null)}
          onStatusUpdate={handleStatusUpdate}
        />
      );
    }
  }

  return (
    <div className="admin-dashboard">
      <div className="container">
        <div className="dashboard-header">
          <div className="header-content">
            <h1 className="dashboard-title">Admin Dashboard</h1>
            <p className="dashboard-subtitle">
              Manage applications, programs, and students
            </p>
          </div>
        </div>

        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-icon">
              <FileText className="icon" />
            </div>
            <div className="stat-content">
              <div className="stat-number">{stats.total}</div>
              <div className="stat-label">Total Applications</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <Clock className="icon" />
            </div>
            <div className="stat-content">
              <div className="stat-number">{stats.pending}</div>
              <div className="stat-label">Pending Review</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <CheckCircle className="icon" />
            </div>
            <div className="stat-content">
              <div className="stat-number">{stats.accepted}</div>
              <div className="stat-label">Accepted</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <XCircle className="icon" />
            </div>
            <div className="stat-content">
              <div className="stat-number">{stats.rejected}</div>
              <div className="stat-label">Rejected</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <Settings className="icon" />
            </div>
            <div className="stat-content">
              <div className="stat-number">{stats.totalPrograms}</div>
              <div className="stat-label">Total Programs</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <BarChart3 className="icon" />
            </div>
            <div className="stat-content">
              <div className="stat-number">{stats.activePrograms}</div>
              <div className="stat-label">Active Programs</div>
            </div>
          </div>
        </div>

        {/* Enhanced Quick Actions Section */}
        <div className="quick-actions-section">
          <h2 className="section-title">Management Hub</h2>
          <div className="quick-actions-grid">
            {/* Program Management Card */}
            <button
              onClick={() => setShowProgramManagement(true)}
              className="quick-action-card enhanced-card program-management-card"
            >
              <div className="card-header">
                <div className="action-icon program-icon">
                  <Settings className="icon" />
                </div>
                <div className="card-badge">
                  <span className="badge-text">Essential</span>
                </div>
              </div>
              <div className="action-content">
                <h3>Program Management</h3>
                <p>
                  Create, edit, and manage internship programs with full control
                  over program details
                </p>
                <div className="card-features">
                  <div className="feature-item">
                    <BookOpen className="feature-icon" />
                    <span>Create Programs</span>
                  </div>
                  <div className="feature-item">
                    <Target className="feature-icon" />
                    <span>Track Analytics</span>
                  </div>
                  <div className="feature-item">
                    <Shield className="feature-icon" />
                    <span>Manage Access</span>
                  </div>
                </div>
              </div>
              <div className="card-footer">
                <div className="action-stats">
                  <span className="stat-item">
                    <TrendingUp className="stat-icon" />
                    {stats.totalPrograms} Programs
                  </span>
                </div>
                <ArrowRight className="arrow-icon" />
              </div>
            </button>

            {/* Student Grouping Card */}
            <button
              onClick={() => setShowStudentGrouping(true)}
              className="quick-action-card enhanced-card student-grouping-card"
            >
              <div className="card-header">
                <div className="action-icon grouping-icon">
                  <Users className="icon" />
                </div>
                <div className="card-badge">
                  <span className="badge-text">Organization</span>
                </div>
              </div>
              <div className="action-content">
                <h3>Student Grouping</h3>
                <p>
                  Organize accepted students into groups by program categories
                  with detailed analytics
                </p>
                <div className="card-features">
                  <div className="feature-item">
                    <UserCheck className="feature-icon" />
                    <span>Auto Grouping</span>
                  </div>
                  <div className="feature-item">
                    <Grid3X3 className="feature-icon" />
                    <span>Manual Control</span>
                  </div>
                  <div className="feature-item">
                    <PieChart className="feature-icon" />
                    <span>Export Data</span>
                  </div>
                </div>
              </div>
              <div className="card-footer">
                <div className="action-stats">
                  <span className="stat-item">
                    <UserCheck className="stat-icon" />
                    {stats.accepted} Accepted
                  </span>
                </div>
                <ArrowRight className="arrow-icon" />
              </div>
            </button>



            {/* Company Adviser Assignment Card */}
            <button
              onClick={() => setShowCompanyAdviserAssignment(true)}
              className="quick-action-card enhanced-card student-grouping-card"
            >
              <div className="card-header">
                <div className="action-icon grouping-icon">
                  <Users className="icon" />
                </div>
                <div className="card-badge">
                  <span className="badge-text">Enhanced</span>
                </div>
              </div>
              <div className="action-content">
                <h3>Assign Company Advisers</h3>
                <p>
                  Assign company advisers to students using accordion interface with multi-selection
                </p>
                <div className="card-features">
                  <div className="feature-item">
                    <Grid3X3 className="feature-icon" />
                    <span>Program Groups</span>
                  </div>
                  <div className="feature-item">
                    <UserCheck className="feature-icon" />
                    <span>Multi-Select</span>
                  </div>
                  <div className="feature-item">
                    <Target className="feature-icon" />
                    <span>Auto-Refresh</span>
                  </div>
                </div>
              </div>
              <div className="card-footer">
                <div className="action-stats">
                  <span className="stat-item">
                    <Users className="stat-icon" />
                    Unassigned Students
                  </span>
                </div>
                <ArrowRight className="arrow-icon" />
              </div>
            </button>

            {/* Acceptance Paper Upload Card */}
            <button
              onClick={() => setShowAcceptanceUpload(true)}
              className="quick-action-card enhanced-card acceptance-upload-card"
            >
              <div className="card-header">
                <div className="action-icon upload-icon">
                  <Upload className="icon" />
                </div>
                <div className="card-badge">
                  <span className="badge-text">Documents</span>
                </div>
              </div>
              <div className="action-content">
                <h3>Acceptance Papers</h3>
                <p>
                  Upload and distribute acceptance documents to students with
                  tracking capabilities
                </p>
                <div className="card-features">
                  <div className="feature-item">
                    <FileCheck className="feature-icon" />
                    <span>Bulk Upload</span>
                  </div>
                  <div className="feature-item">
                    <Award className="feature-icon" />
                    <span>Auto Distribute</span>
                  </div>
                  <div className="feature-item">
                    <BarChart3 className="feature-icon" />
                    <span>Track Status</span>
                  </div>
                </div>
              </div>
              <div className="card-footer">
                <div className="action-stats">
                  <span className="stat-item">
                    <FileCheck className="stat-icon" />
                    Document Center
                  </span>
                </div>
                <ArrowRight className="arrow-icon" />
              </div>
            </button>

            {/* Enhanced Account Management Card */}
            <button
              onClick={() => setShowEnhancedAccountManagement(true)}
              className="quick-action-card enhanced-card program-management-card"
            >
              <div className="card-header">
                <div className="action-icon program-icon">
                  <Shield className="icon" />
                </div>
                <div className="card-badge">
                  <span className="badge-text">Enhanced</span>
                </div>
              </div>
              <div className="action-content">
                <h3>Enhanced Account Management</h3>
                <p>
                  Create temporary accounts for advisers and faculty head with credentials
                </p>
              </div>
              <div className="card-footer">
                <ArrowRight className="arrow-icon" />
              </div>
            </button>
          </div>
        </div>

        <div className="applications-section">
          <div className="section-header">
            <h2 className="section-title">Recent Applications</h2>

            <div className="filters">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
              </select>

              <select
                value={filterProgram}
                onChange={(e) => setFilterProgram(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Programs</option>
                {programs.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="applications-table">
            <div className="table-header">
              <div className="table-cell">Student</div>
              <div className="table-cell">Program</div>
              <div className="table-cell">Applied Date</div>
              <div className="table-cell">Status</div>
              <div className="table-cell">Actions</div>
            </div>

            <div className="table-body">
              {filteredApplications.slice(0, 10).map((application) => {
                const program =
                  programs.find((p) => p.id === application.programId) ||
                  application.programDetails;
                return (
                  <div key={application.id} className="table-row">
                    <div className="table-cell">
                      <div className="student-info">
                        <div className="student-avatar">
                          <Users className="icon" />
                        </div>
                        <div>
                          <div className="student-name">
                            {application.studentName}
                          </div>
                          <div className="student-email">
                            {application.studentEmail}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="table-cell">
                      <div className="program-info">
                        <div className="program-name">
                          {program?.name || "Unknown Program"}
                        </div>
                        <div className="program-details">
                          <span>
                            Program available for applications
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="table-cell">
                      <div className="apply-date">
                        {new Date(application.appliedAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="table-cell">
                      <div className={`status-badge ${application.status}`}>
                        {application.status === "accepted" && (
                          <CheckCircle className="icon" />
                        )}
                        {application.status === "rejected" && (
                          <XCircle className="icon" />
                        )}
                        {application.status === "pending" && (
                          <Clock className="icon" />
                        )}
                        <span>{application.status}</span>
                      </div>
                    </div>

                    <div className="table-cell">
                      <div className="action-buttons">
                        <button
                          onClick={() => setSelectedApplication(application.id)}
                          className="btn btn-outline btn-small"
                        >
                          <Eye className="icon" />
                          Review
                        </button>

                        {application.status === "pending" && (
                          <>
                            <button
                              onClick={() =>
                                handleStatusUpdate(application.id, "accepted")
                              }
                              className="btn btn-success btn-small"
                            >
                              <CheckCircle className="icon" />
                              Accept
                            </button>
                            <button
                              onClick={() => setRejectModal({ id: application.id, reason: "" })}
                              className="btn btn-error btn-small"
                            >
                              <XCircle className="icon" />
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredApplications.length === 0 && (
              <div className="empty-state">
                <FileText className="empty-icon" />
                <h3>No Applications Found</h3>
                <p>No applications match your current filters.</p>
              </div>
            )}

            {filteredApplications.length > 10 && (
              <div className="table-footer">
                <p>Showing 10 of {filteredApplications.length} applications</p>
                <button className="btn btn-outline">
                  View All Applications
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {rejectModal.id && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-2">Reject Application</h3>
            <p className="text-sm text-gray-600 mb-4">Please provide the reason for rejection</p>
            <textarea
              value={rejectModal.reason}
              onChange={(e) => setRejectModal((prev) => ({ ...prev, reason: e.target.value }))}
              className="w-full border rounded-md p-2 text-sm h-28 mb-6"
              placeholder="Type the rejection reason here..."
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setRejectModal({ id: null, reason: "" })}
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!rejectModal.reason.trim()) return;
                  const id = rejectModal.id!;
                  const reason = rejectModal.reason.trim();
                  setRejectModal({ id: null, reason: "" });
                  await updateApplicationStatus(id, "rejected", reason);
                }}
                disabled={!rejectModal.reason.trim()}
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
