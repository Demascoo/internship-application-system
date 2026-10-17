import React, { useState } from "react";
import toast from "react-hot-toast";
import { advisersAPI } from "../../services/api";

const CompanyAdviserAttendanceForm: React.FC = () => {
  const [studentId, setStudentId] = useState("");
  const [date, setDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [status, setStatus] = useState("present");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) return;
    try {
      setSaving(true);
      await advisersAPI.recordAttendance({ studentId, date, status, notes });
      setMsg("Attendance recorded");
      toast.success("Attendance recorded");
    } catch (e: any) {
      setMsg(e?.message || "Failed");
      toast.error("Failed to record attendance");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="bg-white rounded shadow p-4 space-y-3">
      <h2 className="text-lg font-semibold">Record Attendance</h2>
      <input className="border rounded px-3 py-2 w-full" placeholder="Student ID" value={studentId} onChange={(e) => setStudentId(e.target.value)} />
      <div className="flex gap-2">
        <input className="border rounded px-3 py-2" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <select className="border rounded px-3 py-2" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="present">Present</option>
          <option value="absent">Absent</option>
          <option value="late">Late</option>
          <option value="excused">Excused</option>
        </select>
      </div>
      <textarea className="border rounded px-3 py-2 w-full" placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
      <button disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded">{saving ? "Saving..." : "Save"}</button>
      {msg && <div className="text-sm mt-2">{msg}</div>}
    </form>
  );
};

export default CompanyAdviserAttendanceForm;


