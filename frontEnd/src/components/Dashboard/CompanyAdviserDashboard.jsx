import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CompanyAdviserAttendanceForm from "./CompanyAdviserAttendanceForm";
import CompanyAdviserProgressForm from "./CompanyAdviserProgressForm";
import CompanyAdviserEvaluationForm from "./CompanyAdviserEvaluationForm";
import AdviserDocumentsPanel from "../Common/AdviserDocumentsPanel";
import { advisersAPI } from "../../services/api";

const CompanyAdviserDashboard = () => {
  const [studentId, setStudentId] = useState("");
  const [students, setStudents] = useState([]);
  useEffect(() => { (async () => { try { const res = await advisersAPI.getAssignedStudents(); setStudents(res.data.students || res.data || []); } catch (e) {} })(); }, []);
  const navigate = useNavigate();
  return (
    <div className="container mx-auto px-6 py-8">
      <h1 className="text-2xl font-semibold mb-6">Company Adviser Dashboard</h1>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-medium mb-2">Attendance</h2>
          <p className="text-gray-600 text-sm">Record and review student attendance.</p>
          <div className="mt-4">
            <CompanyAdviserAttendanceForm />
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-medium mb-2">Progress</h2>
          <p className="text-gray-600 text-sm">Submit periodic progress updates.</p>
          <div className="mt-4">
            <CompanyAdviserProgressForm />
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-medium mb-2">Messages</h2>
          <p className="text-gray-600 text-sm">Communicate with the University Adviser/Admin.</p>
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
          <h2 className="text-xl font-medium mb-2">Evaluations</h2>
          <p className="text-gray-600 text-sm">Submit final evaluation and feedback.</p>
          <div className="mt-4">
            <CompanyAdviserEvaluationForm />
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-medium mb-2">Documents</h2>
          <p className="text-gray-600 text-sm">Upload and manage student-related documents.</p>
          <div className="mt-4">
            <AdviserDocumentsPanel studentId={studentId} canUpload />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyAdviserDashboard;
