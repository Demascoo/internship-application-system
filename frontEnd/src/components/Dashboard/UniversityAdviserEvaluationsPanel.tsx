import React, { useEffect, useState } from "react";
import { advisersAPI } from "../../services/api";

interface Props {
  studentId: string;
}

const UniversityAdviserEvaluationsPanel: React.FC<Props> = ({ studentId }) => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      const res = await advisersAPI.listEvaluations(studentId);
      setItems(res.data?.evaluations || res.evaluations || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (studentId) load();
  }, [studentId]);

  const confirm = async (id: string) => {
    try {
      await advisersAPI.reviewEvaluation(id);
      await load();
    } catch (e) {
      console.error(e);
    }
  };

  if (!studentId) return null;

  return (
    <div className="bg-white shadow rounded p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Evaluations</h2>
        <button onClick={load} className="text-sm underline">Refresh</button>
      </div>
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <div className="space-y-3">
        {items.map((e) => (
          <div key={e._id} className="border rounded p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Grade: {e.grade || "N/A"}</div>
                <div className="text-sm opacity-75">Performance: {e.performanceRating || "-"}</div>
              </div>
              <div className="flex items-center gap-2">
                {e.confirmedByUniversity ? (
                  <span className="text-green-600 text-sm">Confirmed</span>
                ) : (
                  <button onClick={() => confirm(e._id)} className="bg-green-600 text-white px-3 py-1 rounded text-sm">Confirm</button>
                )}
              </div>
            </div>
            {e.feedback && <div className="text-sm mt-2">{e.feedback}</div>}
          </div>
        ))}
        {items.length === 0 && <div className="text-sm text-gray-600">No evaluations yet</div>}
      </div>
    </div>
  );
};

export default UniversityAdviserEvaluationsPanel;


