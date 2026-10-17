import React, { useState } from "react";
import toast from "react-hot-toast";
import { advisersAPI } from "../../services/api";

const CompanyAdviserEvaluationForm: React.FC = () => {
  const [studentId, setStudentId] = useState("");
  const [grade, setGrade] = useState("");
  const [performanceRating, setPerformanceRating] = useState<number | "">("");
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) return;
    try {
      setSaving(true);
      await advisersAPI.submitEvaluation({ studentId, grade, performanceRating, feedback });
      setMsg("Evaluation submitted");
      toast.success("Evaluation submitted");
    } catch (e: any) {
      setMsg(e?.message || "Failed");
      toast.error("Failed to submit evaluation");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="bg-white rounded shadow p-4 space-y-3">
      <h2 className="text-lg font-semibold">Submit Evaluation</h2>
      <input className="border rounded px-3 py-2 w-full" placeholder="Student ID" value={studentId} onChange={(e) => setStudentId(e.target.value)} />
      <input className="border rounded px-3 py-2 w-full" placeholder="Grade" value={grade} onChange={(e) => setGrade(e.target.value)} />
      <input className="border rounded px-3 py-2 w-full" type="number" min={1} max={5} placeholder="Performance (1-5)" value={performanceRating as any} onChange={(e) => setPerformanceRating(e.target.value ? Number(e.target.value) : "")} />
      <textarea className="border rounded px-3 py-2 w-full" placeholder="Feedback" value={feedback} onChange={(e) => setFeedback(e.target.value)} />
      <button disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded">{saving ? "Saving..." : "Save"}</button>
      {msg && <div className="text-sm mt-2">{msg}</div>}
    </form>
  );
};

export default CompanyAdviserEvaluationForm;


