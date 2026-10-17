import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Download,
  Eye,
  Calendar,
} from "lucide-react";
import toast from "react-hot-toast";

interface ProgramStatistics {
  program: {
    _id: string;
    name: string;
    description: string;
    category: string;
    totalSpots: number;
    availableSpots: number;
    duration: string;
    startDate: string;
    endDate: string;
  };
  statistics: {
    totalApplications: number;
    pendingApplications: number;
    acceptedApplications: number;
    rejectedApplications: number;
    spotsRemaining: number;
    spotsTaken: number;
  };
  acceptedStudents: Array<{
    _id: string;
    studentId: {
      _id: string;
      name: string;
      email: string;
      groupAssignment?: {
        groupName: string;
        assignedAt: string;
      };
    };
    appliedAt: string;
  }>;
  studentGroups: Array<{
    _id: string;
    groupName: string;
    students: string[];
    createdAt: string;
  }>;
}

const ProgramStats: React.FC<{ programId: string; onBack: () => void }> = ({
  programId,
  onBack,
}) => {
  const [stats, setStats] = useState<ProgramStatistics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProgramStats = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/programs/${programId}/statistics`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      } else {
        toast.error("Failed to load program statistics");
      }
    } catch (error) {
      console.error("Error fetching program statistics:", error);
      toast.error("Error loading statistics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgramStats();
  }, [programId]);

  const handleExportStudents = async () => {
    if (!stats) return;
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/groups/programs/${programId}/export`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        // Create CSV content
        const csvContent = [
          ['No.', 'Name', 'Email', 'Group', 'Applied Date'].join(','),
          ...data.data.students.map((student: any) =>
            [
              student.number,
              `"${student.name}"`,
              student.email,
              `"${student.group || 'Unassigned'}"`,
              new Date(student.appliedAt || '').toLocaleDateString()
            ].join(',')
          )
        ].join('\n');

        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${stats.program.name}_students_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast.success("Student list exported successfully!");
      } else {
        toast.error("Failed to export student list");
      }
    } catch (error) {
      console.error("Error exporting student list:", error);
      toast.error("Error exporting student list");
    }
  };

  if (loading) {
    return (
      <div className="program-stats">
        <div className="container">
          <div className="flex items-center justify-center min-h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="program-stats">
        <div className="container">
          <div className="error-state">
            <h3>Failed to load program statistics</h3>
            <button onClick={onBack} className="btn btn-primary">
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const acceptanceRate = stats.statistics.totalApplications > 0 
    ? ((stats.statistics.acceptedApplications / stats.statistics.totalApplications) * 100).toFixed(1)
    : '0';

  return (
    <div className="program-stats">
      <div className="container">
        <div className="stats-header">
          <button onClick={onBack} className="back-btn">
            <ArrowLeft className="icon" />
            Back to Programs
          </button>

          <div className="header-content">
            <h1 className="stats-title">{stats.program.name}</h1>
            <p className="stats-subtitle">Program Statistics & Analytics</p>
          </div>

          <div className="header-actions">
            <button onClick={handleExportStudents} className="btn btn-primary">
              <Download className="icon" />
              Export Students
            </button>
          </div>
        </div>

        {/* Program Overview */}
        <div className="program-overview">
          <div className="overview-card">
            <div className="program-info">
              <h2>{stats.program.name}</h2>
              <p>{stats.program.description}</p>
              <div className="program-meta">
                <span className="category-badge">{stats.program.category}</span>
                <span className="duration">
                  <Clock className="icon" />
                  {stats.program.duration}
                </span>
                <span className="dates">
                  <Calendar className="icon" />
                  {new Date(stats.program.startDate).toLocaleDateString()} - {new Date(stats.program.endDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <FileText className="icon" />
            </div>
            <div className="stat-content">
              <div className="stat-number">{stats.statistics.totalApplications}</div>
              <div className="stat-label">Total Applications</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <Clock className="icon" />
            </div>
            <div className="stat-content">
              <div className="stat-number">{stats.statistics.pendingApplications}</div>
              <div className="stat-label">Pending Review</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <CheckCircle className="icon" />
            </div>
            <div className="stat-content">
              <div className="stat-number">{stats.statistics.acceptedApplications}</div>
              <div className="stat-label">Accepted</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <XCircle className="icon" />
            </div>
            <div className="stat-content">
              <div className="stat-number">{stats.statistics.rejectedApplications}</div>
              <div className="stat-label">Rejected</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <Users className="icon" />
            </div>
            <div className="stat-content">
              <div className="stat-number">{stats.statistics.spotsRemaining}</div>
              <div className="stat-label">Spots Remaining</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <CheckCircle className="icon" />
            </div>
            <div className="stat-content">
              <div className="stat-number">{acceptanceRate}%</div>
              <div className="stat-label">Acceptance Rate</div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="charts-section">
          <div className="chart-card">
            <h3>Application Status Breakdown</h3>
            <div className="progress-chart">
              <div className="progress-item">
                <div className="progress-info">
                  <span>Accepted</span>
                  <span>{stats.statistics.acceptedApplications} ({((stats.statistics.acceptedApplications / Math.max(stats.statistics.totalApplications, 1)) * 100).toFixed(1)}%)</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill accepted" 
                    style={{ width: `${(stats.statistics.acceptedApplications / Math.max(stats.statistics.totalApplications, 1)) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="progress-item">
                <div className="progress-info">
                  <span>Pending</span>
                  <span>{stats.statistics.pendingApplications} ({((stats.statistics.pendingApplications / Math.max(stats.statistics.totalApplications, 1)) * 100).toFixed(1)}%)</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill pending" 
                    style={{ width: `${(stats.statistics.pendingApplications / Math.max(stats.statistics.totalApplications, 1)) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="progress-item">
                <div className="progress-info">
                  <span>Rejected</span>
                  <span>{stats.statistics.rejectedApplications} ({((stats.statistics.rejectedApplications / Math.max(stats.statistics.totalApplications, 1)) * 100).toFixed(1)}%)</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill rejected" 
                    style={{ width: `${(stats.statistics.rejectedApplications / Math.max(stats.statistics.totalApplications, 1)) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="chart-card">
            <h3>Capacity Utilization</h3>
            <div className="capacity-chart">
              <div className="capacity-circle">
                <svg width="150" height="150" viewBox="0 0 150 150">
                  <circle
                    cx="75"
                    cy="75"
                    r="60"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="12"
                  />
                  <circle
                    cx="75"
                    cy="75"
                    r="60"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="12"
                    strokeDasharray={`${(stats.statistics.spotsTaken / stats.program.totalSpots) * 377} 377`}
                    strokeDashoffset="0"
                    transform="rotate(-90 75 75)"
                  />
                </svg>
                <div className="capacity-text">
                  <div className="capacity-percentage">
                    {((stats.statistics.spotsTaken / stats.program.totalSpots) * 100).toFixed(0)}%
                  </div>
                  <div className="capacity-label">Filled</div>
                </div>
              </div>
              <div className="capacity-details">
                <p>{stats.statistics.spotsTaken} out of {stats.program.totalSpots} spots filled</p>
                <p>{stats.statistics.spotsRemaining} spots remaining</p>
              </div>
            </div>
          </div>
        </div>

        {/* Accepted Students */}
        {stats.acceptedStudents.length > 0 && (
          <div className="students-section">
            <div className="section-header">
              <h3>Accepted Students ({stats.acceptedStudents.length})</h3>
              <div className="section-actions">
                <button onClick={handleExportStudents} className="btn btn-outline btn-small">
                  <Download className="icon" />
                  Export
                </button>
              </div>
            </div>

            <div className="students-table">
              <div className="table-header">
                <div className="table-cell">No.</div>
                <div className="table-cell">Name</div>
                <div className="table-cell">Email</div>
                <div className="table-cell">Group</div>
                <div className="table-cell">Applied Date</div>
              </div>

              <div className="table-body">
                {stats.acceptedStudents.map((application, index) => (
                  <div key={application._id} className="table-row">
                    <div className="table-cell">{index + 1}</div>
                    <div className="table-cell">
                      <div className="student-info">
                        <Users className="icon" />
                        {application.studentId.name}
                      </div>
                    </div>
                    <div className="table-cell">{application.studentId.email}</div>
                    <div className="table-cell">
                      {application.studentId.groupAssignment ? (
                        <span className="group-badge">
                          {application.studentId.groupAssignment.groupName}
                        </span>
                      ) : (
                        <span className="no-group">Unassigned</span>
                      )}
                    </div>
                    <div className="table-cell">
                      {new Date(application.appliedAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Student Groups */}
        {stats.studentGroups.length > 0 && (
          <div className="groups-section">
            <h3>Student Groups ({stats.studentGroups.length})</h3>
            <div className="groups-grid">
              {stats.studentGroups.map((group) => (
                <div key={group._id} className="group-card">
                  <div className="group-header">
                    <h4>{group.groupName}</h4>
                    <span className="group-count">{group.students.length} students</span>
                  </div>
                  <div className="group-meta">
                    <span>Created: {new Date(group.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgramStats;