import React from "react";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  FileText,
  Mail,
  Calendar,
  User,
  Eye,
} from "lucide-react";
import { Application } from "../../contexts/AppContext";
import { useApp } from "../../contexts/AppContext";

interface ApplicationReviewProps {
  application: Application;
  onBack: () => void;
  onStatusUpdate: (
    applicationId: string,
    status: "accepted" | "rejected"
  ) => void;
}

const ApplicationReview: React.FC<ApplicationReviewProps> = ({
  application,
  onBack,
  onStatusUpdate,
}) => {
  const { programs } = useApp();
  const program =
    programs.find((p) => p.id === application.programId) ||
    application.programDetails;

  const handleViewResume = () => {
    if (application.resumeUrl) {
      // Fix the URL construction - remove /api from base URL for file serving
      const baseUrl = import.meta.env.VITE_API_URL
        ? import.meta.env.VITE_API_URL.replace("/api", "")
        : "http://localhost:5000";

      const resumeUrl = application.resumeUrl.startsWith("http")
        ? application.resumeUrl
        : `${baseUrl}/${application.resumeUrl}`;

      console.log("Opening resume URL:", resumeUrl);
      window.open(resumeUrl, "_blank");
    } else {
      console.log("No resume URL available");
    }
  };

  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [rejectReason, setRejectReason] = React.useState("");

  return (
    <div className="application-review">
      <div className="container">
        <div className="review-header">
          <button onClick={onBack} className="back-btn">
            <ArrowLeft className="icon" />
            Back to Dashboard
          </button>

          <div className="review-title-section">
            <h1 className="review-title">Application Review</h1>
            <div className={`status-badge ${application.status}`}>
              {application.status === "accepted" && (
                <CheckCircle className="icon" />
              )}
              {application.status === "rejected" && (
                <XCircle className="icon" />
              )}
              {application.status === "pending" && (
                <FileText className="icon" />
              )}
              <span>{application.status}</span>
            </div>
          </div>
        </div>

        <div className="review-content">
          <div className="review-main">
            <div className="review-section">
              <h2 className="section-title">Applicant Information</h2>
              <div className="info-grid">
                <div className="info-item">
                  <User className="icon" />
                  <div>
                    <label>Full Name</label>
                    <span>{application.studentName}</span>
                  </div>
                </div>

                <div className="info-item">
                  <Mail className="icon" />
                  <div>
                    <label>Email</label>
                    <span>{application.studentEmail}</span>
                  </div>
                </div>

                <div className="info-item">
                  <Calendar className="icon" />
                  <div>
                    <label>Applied On</label>
                    <span>
                      {new Date(application.appliedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="review-section">
              <h2 className="section-title">
                Program Applied For: {program?.name || "Unknown Program"}
              </h2>
              <div className="program-info">
                <h3>{program?.name || "Program Name"}</h3>
                <p>
                  {program?.description || "Program description not available"}
                </p>
                <div className="program-details">
                  <span>
                    <strong>Program Type:</strong>{" "}
                    Internship Program
                  </span>
                  <span>
                    <strong>Application Status:</strong>{" "}
                    Open for applications
                  </span>
                </div>
              </div>
            </div>

            <div className="review-section">
              <h2 className="section-title">Application Details</h2>

              <div className="application-detail-item">
                <h4>Motivation</h4>
                <div className="detail-content">
                  <p>{application.motivation || "No motivation provided"}</p>
                </div>
              </div>

              {application.experience && (
                <div className="application-detail-item">
                  <h4>
                    <strong>Campus Name</strong>
                  </h4>
                  <div className="detail-content">
                    <p>{application.experience}</p>
                  </div>
                </div>
              )}

              {application.goals && (
                <div className="application-detail-item">
                  <h4>Goals</h4>
                  <div className="detail-content">
                    <p>{application.goals}</p>
                  </div>
                </div>
              )}

              <div className="application-detail-item">
                <h4>Preferences</h4>
                <div className="detail-content">
                  <div className="preference-grid">
                    <div className="preference-item">
                      <strong>Availability:</strong> {application.availability}
                    </div>
                    <div className="preference-item">
                      <strong>Desired Duration:</strong>{" "}
                      {application.desiredDuration} months
                    </div>
                    <div className="preference-item">
                      <strong>Preferred Start:</strong>{" "}
                      {application.preferredStartMonth}
                    </div>
                    <div className="preference-item">
                      <strong>Preferred End:</strong>{" "}
                      {application.preferredEndMonth}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {application.resumeUrl && (
              <div className="review-section">
                <h2 className="section-title">Resume</h2>
                <div className="resume-section">
                  <div className="file-info">
                    <FileText className="icon" />
                    <div>
                      <span className="file-name">Resume.pdf</span>
                      <span className="file-status">Uploaded</span>
                    </div>
                  </div>
                  <button
                    className="btn btn-outline"
                    onClick={handleViewResume}
                  >
                    <Eye className="icon" />
                    View Resume
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="review-sidebar">
            <div className="sidebar-card">
              <h3>Application Status</h3>
              <div className={`current-status ${application.status}`}>
                {application.status === "accepted" && (
                  <CheckCircle className="icon" />
                )}
                {application.status === "rejected" && (
                  <XCircle className="icon" />
                )}
                {application.status === "pending" && (
                  <FileText className="icon" />
                )}
                <span>{application.status}</span>
              </div>

              {application.status === "pending" && (
                <div className="status-actions">
                  <button
                    onClick={() => onStatusUpdate(application.id, "accepted")}
                    className="btn btn-success btn-full"
                  >
                    <CheckCircle className="icon" />
                    Accept Application
                  </button>
                  <button
                    onClick={() => setRejectOpen(true)}
                    className="btn btn-error btn-full"
                  >
                    <XCircle className="icon" />
                    Reject Application
                  </button>
                </div>
              )}
            </div>

            <div className="sidebar-card">
              <h3>Application Timeline</h3>
              <div className="timeline">
                <div className="timeline-item completed">
                  <div className="timeline-marker"></div>
                  <div className="timeline-content">
                    <strong>Application Submitted</strong>
                    <span>
                      {new Date(application.appliedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div
                  className={`timeline-item ${
                    application.status !== "pending" ? "completed" : ""
                  }`}
                >
                  <div className="timeline-marker"></div>
                  <div className="timeline-content">
                    <strong>Under Review</strong>
                    <span>
                      {application.status === "pending"
                        ? "In Progress"
                        : "Completed"}
                    </span>
                  </div>
                </div>

                <div
                  className={`timeline-item ${
                    application.status === "accepted" ? "completed" : ""
                  }`}
                >
                  <div className="timeline-marker"></div>
                  <div className="timeline-content">
                    <strong>Decision Made</strong>
                    <span>
                      {application.status !== "pending"
                        ? "Completed"
                        : "Pending"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="sidebar-card">
              <h3>Quick Actions</h3>
              <div className="quick-actions">
                <button className="quick-action">
                  <Mail className="icon" />
                  <span>Send Email</span>
                </button>
                <button className="quick-action">
                  <FileText className="icon" />
                  <span>Add Notes</span>
                </button>
                <button className="quick-action">
                  <User className="icon" />
                  <span>View Profile</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {rejectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-2">Reject Application</h3>
            <p className="text-sm text-gray-600 mb-4">Please provide the reason for rejection</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full border rounded-md p-2 text-sm h-28 mb-6"
              placeholder="Type the rejection reason here..."
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => { setRejectOpen(false); setRejectReason(""); }}
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!rejectReason.trim()) return;
                  onStatusUpdate(application.id, "rejected");
                  setRejectOpen(false);
                  setRejectReason("");
                }}
                disabled={!rejectReason.trim()}
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

export default ApplicationReview;
