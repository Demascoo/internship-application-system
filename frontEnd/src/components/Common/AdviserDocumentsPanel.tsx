import React, { useEffect, useState } from "react";
import { advisersAPI } from "../../services/api";

interface Props {
  studentId: string;
  canUpload?: boolean;
}

const AdviserDocumentsPanel: React.FC<Props> = ({ studentId, canUpload }) => {
  const [items, setItems] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("other");
  const [visibleToStudent, setVisibleToStudent] = useState(true);

  const load = async () => {
    const res = await advisersAPI.listDocuments(studentId);
    setItems(res.data?.documents || res.documents || []);
  };

  useEffect(() => {
    if (studentId) load();
  }, [studentId]);

  const onUpload = async () => {
    if (!file) return;
    const form = new FormData();
    form.append("studentId", studentId);
    form.append("type", type);
    form.append("title", title || file.name);
    form.append("visibleToStudent", String(visibleToStudent));
    form.append("file", file);
    await advisersAPI.uploadDocument(form);
    setFile(null);
    setTitle("");
    await load();
  };

  const baseUrl = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace("/api", "");

  return (
    <div className="bg-white shadow rounded p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Documents</h2>
        <button onClick={load} className="text-sm underline">Refresh</button>
      </div>
      {canUpload && (
        <div className="border rounded p-3 flex flex-col gap-2">
          <div className="flex gap-2">
            <select className="border rounded px-2 py-1" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="acceptance">Acceptance</option>
              <option value="progress">Progress</option>
              <option value="attendance">Attendance</option>
              <option value="evaluation">Evaluation</option>
              <option value="other">Other</option>
            </select>
            <input className="border rounded px-2 py-1 flex-1" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <label className="text-sm flex items-center gap-1">
              <input type="checkbox" checked={visibleToStudent} onChange={(e) => setVisibleToStudent(e.target.checked)} />
              Visible to student
            </label>
            <button onClick={onUpload} className="bg-blue-600 text-white px-3 py-1 rounded">Upload</button>
          </div>
        </div>
      )}
      <div className="space-y-2">
        {items.map((d) => (
          <div key={d._id} className="border rounded p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{d.title}</div>
                <div className="text-xs opacity-75">{d.type} • {new Date(d.createdAt).toLocaleString()}</div>
              </div>
              <div className="text-sm">
                {d.visibleToStudent ? "Visible" : "Hidden"}
              </div>
            </div>
            <div className="mt-2">
              <a className="underline text-sm" href={`${baseUrl}/${d.filePath}`} target="_blank" rel="noreferrer">
                View / Download
              </a>
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="text-sm text-gray-600">No documents</div>}
      </div>
    </div>
  );
};

export default AdviserDocumentsPanel;


