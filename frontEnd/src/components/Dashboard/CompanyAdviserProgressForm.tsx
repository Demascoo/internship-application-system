import React, { useState } from "react";
import toast from "react-hot-toast";
import { advisersAPI } from "../../services/api";

const CompanyAdviserProgressForm: React.FC = () => {
  const [studentId, setStudentId] = useState("");
  const [periodStart, setPeriodStart] = useState<string>(new Date().toISOString().substring(0, 10));
  const [periodEnd, setPeriodEnd] = useState<string>(new Date().toISOString().substring(0, 10));
  const [summary, setSummary] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) return;
    try {
      setSaving(true);
      await advisersAPI.submitProgress({ studentId, periodStart, periodEnd, summary });
      setMsg("Progress submitted");
      toast.success("Progress submitted");
    } catch (e: any) {
      setMsg(e?.message || "Failed");
      toast.error("Failed to submit progress");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="bg-white rounded shadow p-4 space-y-3">
      <h2 className="text-lg font-semibold">Submit Progress</h2>
      <input className="border rounded px-3 py-2 w-full" placeholder="Student ID" value={studentId} onChange={(e) => setStudentId(e.target.value)} />
      <div className="flex gap-2">
        <input className="border rounded px-3 py-2" type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
        <input className="border rounded px-3 py-2" type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
      </div>
      <textarea className="border rounded px-3 py-2 w-full" placeholder="Summary" value={summary} onChange={(e) => setSummary(e.target.value)} />
      <button disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded">{saving ? "Saving..." : "Save"}</button>
      {msg && <div className="text-sm mt-2">{msg}</div>}
    </form>
  );
};

export default CompanyAdviserProgressForm;


