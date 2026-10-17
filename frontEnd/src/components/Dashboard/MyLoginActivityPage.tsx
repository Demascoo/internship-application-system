import React, { useEffect, useState } from "react";

interface ActivityItem {
  _id: string;
  role: string;
  status: "success" | "failure";
  message?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

const MyLoginActivityPage: React.FC = () => {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchActivities = async (p = 1) => {
    setLoading(true);
    try {
      const base = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const res = await fetch(`${base}/login-activities/mine?page=${p}&limit=20`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const json = await res.json();
      if (json?.success) {
        setItems(json.data.items || []);
        setPages(json.data.pages || 1);
        setPage(json.data.page || 1);
      }
    } catch (e) {
      console.error("Failed to load my login activities", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities(1);
  }, []);

  return (
    <div className="container mx-auto px-6 py-8">
      <h1 className="text-2xl font-semibold mb-4">My Login Activity</h1>
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td className="px-6 py-4" colSpan={4}>Loading...</td></tr>
              ) : items.length === 0 ? (
                <tr><td className="px-6 py-4" colSpan={4}>No activity</td></tr>
              ) : (
                items.map((it) => (
                  <tr key={it._id}>
                    <td className={`px-6 py-4 text-sm ${it.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>{it.status}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{it.message || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{it.ipAddress || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(it.createdAt).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <button
            disabled={page <= 1}
            onClick={() => fetchActivities(page - 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >Previous</button>
          <span className="text-sm text-gray-600">Page {page} of {pages}</span>
          <button
            disabled={page >= pages}
            onClick={() => fetchActivities(page + 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >Next</button>
        </div>
      </div>
    </div>
  );
};

export default MyLoginActivityPage; 