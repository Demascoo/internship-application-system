import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import UniversityAdviserEvaluationsPanel from "./UniversityAdviserEvaluationsPanel";
import AdviserDocumentsPanel from "../Common/AdviserDocumentsPanel";
import { advisersAPI } from "../../services/api";

const UniversityAdviserDashboard = () => {
  const [studentId, setStudentId] = useState("");
  const [students, setStudents] = useState([]);
  useEffect(() => { (async () => { try { const res = await advisersAPI.getAssignedStudents(); setStudents(res.data.students || res.data || []); } catch (e) {} })(); }, []);
  const navigate = useNavigate();
  return (
    <div className="container mx-auto px-6 py-8">
      <h1 className="text-2xl font-semibold mb-6">University Adviser Dashboard</h1>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-medium mb-2">Messaging</h2>
          <p className="text-gray-600 text-sm">Message the Company Adviser/Admin.</p>
          <div className="mt-4 flex items-center gap-2">
            <select className="border rounded px-3 py-2 flex-1" value={studentId} onChange={(e) => setStudentId(e.target.value)}>
              <option value="">Select Student</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.fullName} — {s.programName}</option>
              ))}
            </select>
            <button onClick={() => studentId && navigate(`/adviser/messaging/${studentId}`)} className="bg-blue-600 text-white px-4 py-2 rounded">Open Messaging</button>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-medium mb-2">Progress</h2>
          <p className="text-gray-600 text-sm">Review and track student progress.</p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-medium mb-2">Evaluations</h2>
          <p className="text-gray-600 text-sm">Review and confirm final evaluations.</p>
          <div className="mt-4">
            {studentId && <UniversityAdviserEvaluationsPanel studentId={studentId} />}
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-medium mb-2">Document Upload</h2>
          <p className="text-gray-600 text-sm">Upload acceptance letters and related documents.</p>
          <div className="mt-4">
            {studentId && <AdviserDocumentsPanel studentId={studentId} canUpload />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UniversityAdviserDashboard;
