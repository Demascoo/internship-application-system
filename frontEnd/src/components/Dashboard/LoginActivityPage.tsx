import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

interface TimelineItem {
  _id: string;
  kind: "login" | "activity";
  user?: { _id: string; name: string; email: string; role: string } | string;
  role?: string;
  status?: "success" | "failure"; // for login
  action?: string; // for activity
  method?: string;
  path?: string;
  entityType?: string;
  entityId?: string;
  success?: boolean;
  statusCode?: number;
  message?: string;
  ipAddress?: string;
  userAgent?: string;
  actionDetails?: any;
  requestBody?: string;
  queryParams?: string;
  responseTime?: number;
  sessionId?: string;
  deviceInfo?: string;
  location?: string;
  createdAt: string;
}

interface UserActivitySummary {
  summary: {
    totalActivities: number;
    successfulActivities: number;
    avgResponseTime: number;
    successRate: string;
    uniqueEntityTypesCount: number;
    firstActivity: string;
    lastActivity: string;
  };
  recentActivities: any[];
  activityByType: any[];
  period: string;
}

const LoginActivityPage: React.FC = () => {
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [userSummary, setUserSummary] = useState<UserActivitySummary | null>(null);
  const [detailedActivities, setDetailedActivities] = useState<any[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const fetchTimeline = async (p = 1, userId?: string) => {
    setLoading(true);
    try {
      const base = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const query = new URLSearchParams({ page: String(p), limit: "20", ...(userId ? { userId } : {}) });
      const res = await fetch(`${base}/login-activities/timeline?${query.toString()}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const json = await res.json();
      if (json?.success) {
        setItems(json.data.items || []);
        setPages(json.data.pages || 1);
        setPage(json.data.page || 1);
      }
    } catch (e) {
      console.error("Failed to load activity timeline", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserSummary = async (userId: string) => {
    setSummaryLoading(true);
    try {
      const base = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const res = await fetch(`${base}/login-activities/user/${userId}/summary?days=30`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const json = await res.json();
      if (json?.success) {
        setUserSummary(json.data);
      }
    } catch (e) {
      console.error("Failed to load user summary", e);
    } finally {
      setSummaryLoading(false);
    }
  };

  const fetchDetailedActivities = async (userId: string) => {
    try {
      const base = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const res = await fetch(`${base}/login-activities/detailed?userId=${userId}&limit=50`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const json = await res.json();
      if (json?.success) {
        setDetailedActivities(json.data.activities || []);
      }
    } catch (e) {
      console.error("Failed to load detailed activities", e);
    }
  };

  const handleUserClick = async (userId: string, userName: string) => {
    setSelectedUser({ id: userId, name: userName });
    setShowUserDetails(true);
    await Promise.all([
      fetchUserSummary(userId),
      fetchDetailedActivities(userId)
    ]);
  };

  const deleteAllMyActivities = async () => {
    if (!confirm("Are you sure you want to delete all your activities? This action cannot be undone.")) {
      return;
    }
    
    try {
      const base = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const res = await fetch(`${base}/login-activities/my-activities`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const json = await res.json();
      if (json?.success) {
        alert(`Successfully deleted ${json.data.totalDeleted} activities`);
        fetchTimeline(1, selectedUser?.id);
      } else {
        alert("Failed to delete activities: " + (json.message || "Unknown error"));
      }
    } catch (e) {
      console.error("Failed to delete activities", e);
      alert("Failed to delete activities");
    }
  };

  const deleteAllActivities = async () => {
    setShowDeleteModal(false);
    
    try {
      const base = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const res = await fetch(`${base}/login-activities/all-activities`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const json = await res.json();
      if (json?.success) {
        alert(`Successfully deleted ${json.data.totalDeleted} activities from all users`);
        fetchTimeline(1, selectedUser?.id);
      } else {
        alert("Failed to delete activities: " + (json.message || "Unknown error"));
      }
    } catch (e) {
      console.error("Failed to delete activities", e);
      alert("Failed to delete activities");
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const userId = params.get("userId") || undefined;
    const userName = params.get("userName") || undefined;
    setSelectedUser(userId && userName ? { id: userId, name: userName } : null);
    fetchTimeline(1, userId);
  }, []);

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">
          {selectedUser ? `Activity Timeline — ${selectedUser.name}` : "User Activity Timeline"}
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium"
          >
            Delete All Activities
          </button>
          {selectedUser && (
            <button
              onClick={() => {
                setSelectedUser(null);
                navigate("/admin/login-activities", { replace: true });
                fetchTimeline(1);
              }}
              className="px-3 py-1 border rounded text-sm hover:bg-gray-50"
            >
              Clear Filter
            </button>
          )}
        </div>
      </div>

      {/* Styled Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete All Login Activities</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete all login activities? This will permanently remove all activity records from all users in the system.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={deleteAllActivities}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors font-medium"
              >
                Yes, Delete All
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="divide-y">
          {loading ? (
            <div className="p-6">Loading...</div>
          ) : items.length === 0 ? (
            <div className="p-6">No activity</div>
          ) : (
            items.map((it) => {
              const name = typeof it.user === 'object' ? it.user?.name : String(it.user || 'Unknown');
              const userId = typeof it.user === 'object' ? (it.user?._id as string) : undefined;
              const time = new Date(it.createdAt).toLocaleString();
              return (
                <div key={it._id} className="p-4 flex items-start gap-3">
                  <div className={`w-2 h-2 mt-2 rounded-full ${
                    it.kind === 'login'
                      ? (it.status === 'success' ? 'bg-green-500' : 'bg-red-500')
                      : (it.success ? 'bg-blue-500' : 'bg-red-500')
                  }`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-gray-900">
                        {userId ? (
                          <button
                            className="underline hover:no-underline text-blue-600 hover:text-blue-800"
                            onClick={() => handleUserClick(userId, name)}
                          >
                            {name}
                          </button>
                        ) : (
                          name
                        )}
                        <span className="text-gray-500"> ({it.role || (typeof it.user === 'object' ? it.user?.role : '')})</span>
                      </div>
                      <div className="text-xs text-gray-500">{time}</div>
                    </div>
                    {it.kind === 'login' ? (
                      <div className="mt-1 text-sm">
                        <span className={`${it.status === 'success' ? 'text-green-700' : 'text-red-700'}`}>Login {it.status}</span>
                        {it.message ? ` — ${it.message}` : ''}
                        {it.ipAddress ? ` — IP: ${it.ipAddress}` : ''}
                      </div>
                    ) : (
                      <div className="mt-1 text-sm">
                        <span className={`${it.success ? 'text-blue-700' : 'text-red-700'}`}>{it.action}</span>
                        {it.path ? ` — ${it.method} ${it.path}` : ''}
                        {typeof it.statusCode === 'number' ? ` — ${it.statusCode}` : ''}
                        {it.message ? ` — ${it.message}` : ''}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <button
            disabled={page <= 1}
            onClick={() => fetchTimeline(page - 1, selectedUser?.id)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >Previous</button>
          <span className="text-sm text-gray-600">Page {page} of {pages}</span>
          <button
            disabled={page >= pages}
            onClick={() => fetchTimeline(page + 1, selectedUser?.id)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >Next</button>
        </div>
      </div>

      {/* User Details Modal */}
      {showUserDetails && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-semibold text-gray-900">
                Activity Details - {selectedUser.name}
              </h2>
              <button
                onClick={() => {
                  setShowUserDetails(false);
                  setUserSummary(null);
                  setDetailedActivities([]);
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {summaryLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-lg">Loading user activity details...</div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Activity Summary Cards */}
                  {userSummary && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{userSummary.summary.totalActivities}</div>
                        <div className="text-sm text-blue-800">Total Activities</div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{userSummary.summary.successRate}%</div>
                        <div className="text-sm text-green-800">Success Rate</div>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{userSummary.summary.avgResponseTime?.toFixed(0) || 0}ms</div>
                        <div className="text-sm text-purple-800">Avg Response Time</div>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">{userSummary.summary.uniqueEntityTypesCount}</div>
                        <div className="text-sm text-orange-800">Entity Types Used</div>
                      </div>
                    </div>
                  )}

                  {/* Activity by Type */}
                  {userSummary?.activityByType && userSummary.activityByType.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-3">Activity Breakdown by Type</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {userSummary.activityByType.map((type, index) => (
                          <div key={index} className="bg-gray-50 p-3 rounded">
                            <div className="font-medium text-gray-900">{type._id || 'Unknown'}</div>
                            <div className="text-sm text-gray-600">{type.count} activities</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Detailed Activity Timeline */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Recent Activity Timeline</h3>
                    <div className="bg-gray-50 rounded-lg max-h-96 overflow-y-auto">
                      {detailedActivities.length === 0 ? (
                        <div className="p-6 text-center text-gray-500">No detailed activities found</div>
                      ) : (
                        <div className="divide-y">
                          {detailedActivities.map((activity, index) => (
                            <div key={index} className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <div className={`w-2 h-2 rounded-full ${
                                      activity.success ? 'bg-green-500' : 'bg-red-500'
                                    }`} />
                                    <span className="font-medium text-gray-900">{activity.action}</span>
                                    <span className="text-xs px-2 py-1 bg-gray-200 rounded">{activity.entityType}</span>
                                  </div>
                                  
                                  <div className="text-sm text-gray-600 space-y-1">
                                    {activity.message && (
                                      <div>📝 {activity.message}</div>
                                    )}
                                    {activity.deviceInfo && (
                                      <div>💻 {activity.deviceInfo}</div>
                                    )}
                                    {activity.ipAddress && (
                                      <div>🌐 IP: {activity.ipAddress}</div>
                                    )}
                                    {activity.responseTime && (
                                      <div>⏱️ Response: {activity.responseTime}ms</div>
                                    )}
                                    {activity.actionDetails && Object.keys(activity.actionDetails).length > 0 && (
                                      <div className="mt-2">
                                        <details className="cursor-pointer">
                                          <summary className="text-xs text-blue-600 hover:text-blue-800">View Details</summary>
                                          <pre className="text-xs bg-white p-2 rounded mt-1 overflow-x-auto">
                                            {JSON.stringify(activity.actionDetails, null, 2)}
                                          </pre>
                                        </details>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="text-xs text-gray-500 ml-4">
                                  {new Date(activity.createdAt).toLocaleString()}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Session Information */}
                  {userSummary && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-2">Session Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-blue-800 font-medium">Period:</span> {userSummary.period}
                        </div>
                        {userSummary.summary.firstActivity && (
                          <div>
                            <span className="text-blue-800 font-medium">First Activity:</span> {new Date(userSummary.summary.firstActivity).toLocaleString()}
                          </div>
                        )}
                        {userSummary.summary.lastActivity && (
                          <div>
                            <span className="text-blue-800 font-medium">Last Activity:</span> {new Date(userSummary.summary.lastActivity).toLocaleString()}
                          </div>
                        )}
                        <div>
                          <span className="text-blue-800 font-medium">Successful Activities:</span> {userSummary.summary.successfulActivities} / {userSummary.summary.totalActivities}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end p-6 border-t bg-gray-50">
              <button
                onClick={() => {
                  setShowUserDetails(false);
                  setUserSummary(null);
                  setDetailedActivities([]);
                }}
                className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginActivityPage; 