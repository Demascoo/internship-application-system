import React, { useEffect, useState } from "react";
import { advisersAPI, programsAPI } from "../../services/api";

type Props = { onBack: () => void };

const AdviserManagement: React.FC<Props> = ({ onBack }) => {
  const [programs, setPrograms] = useState<any[]>([]);
  const [form, setForm] = useState({ fullName: "", email: "", password: "", role: "universityAdviser", programId: "" });
  const [loading, setLoading] = useState(false);
  const [advisers, setAdvisers] = useState<any[]>([]);
  const [adviserUsers, setAdviserUsers] = useState<any[]>([]);
  const [syncForm, setSyncForm] = useState({ userId: "", programId: "" });
  const [filter, setFilter] = useState({ role: "all", programId: "all" });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await programsAPI.getAll();
        setPrograms(res.data.programs || res.data || []);
        const adv = await advisersAPI.listAdvisers();
        setAdvisers(adv.data.advisers || adv.data || []);
        const au = await advisersAPI.listAdviserUsers({ missingOnly: true });
        setAdviserUsers(au.data.users || au.data || []);
      } catch (e: any) {
        setError(e?.message || "Failed to load data");
      }
    })();
  }, []);

  const reloadAdvisers = async () => {
    const params: any = {};
    if (filter.role !== "all") params.role = filter.role;
    if (filter.programId !== "all") params.programId = filter.programId;
    const adv = await advisersAPI.listAdvisers(params);
    setAdvisers(adv.data.advisers || adv.data || []);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      await advisersAPI.createAdviser(form);
      setSuccess("Adviser created successfully");
      setForm({ fullName: "", email: "", password: "", role: form.role, programId: form.programId });
      await reloadAdvisers();
    } catch (e: any) {
      setError(e?.message || "Failed to create adviser");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="container">
        <div className="dashboard-header">
          <div className="header-content">
            <h1 className="dashboard-title">Adviser Management</h1>
            <p className="dashboard-subtitle">Create University and Company advisers and view list</p>
          </div>
          <button onClick={onBack} className="btn btn-outline">Back</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <form onSubmit={submit} className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Create Adviser</h2>
            {error && <div className="text-red-600 mb-2 text-sm">{error}</div>}
            {success && <div className="text-green-600 mb-2 text-sm">{success}</div>}
            <div className="space-y-3">
              <input className="input" placeholder="Full Name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
              <input className="input" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              <input className="input" type="password" placeholder="Temporary Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
              <select className="select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="universityAdviser">University Adviser</option>
                <option value="companyAdviser">Company Adviser</option>
              </select>
              <select className="select" value={form.programId} onChange={(e) => setForm({ ...form, programId: e.target.value })} required>
                <option value="">Select Program</option>
                {programs.map((p: any) => (
                  <option key={p.id || p._id} value={p.id || p._id}>{p.name}</option>
                ))}
              </select>
              <button disabled={loading} className="btn btn-success w-full">{loading ? "Creating..." : "Create Adviser"}</button>
            </div>
          </form>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Advisers</h2>
            <div className="flex gap-2 mb-3">
              <select className="select" value={filter.role} onChange={(e) => setFilter((f) => ({ ...f, role: e.target.value }))}>
                <option value="all">All Roles</option>
                <option value="universityAdviser">University Adviser</option>
                <option value="companyAdviser">Company Adviser</option>
              </select>
              <select className="select" value={filter.programId} onChange={async (e) => { setFilter((f) => ({ ...f, programId: e.target.value })); }}>
                <option value="all">All Programs</option>
                {programs.map((p: any) => (
                  <option key={p.id || p._id} value={p.id || p._id}>{p.name}</option>
                ))}
              </select>
              <button onClick={reloadAdvisers} className="btn btn-outline">Filter</button>
            </div>
            <div className="space-y-2 max-h-96 overflow-auto">
              {advisers.map((a: any) => (
                <div key={a._id} className="flex items-center justify-between border rounded p-3">
                  <div>
                    <div className="font-medium">{a.fullName} — {a.role === 'universityAdviser' ? 'University' : 'Company'}</div>
                    <div className="text-sm text-gray-600">{a.userId?.email} • {a.programId?.name}</div>
                  </div>
                </div>
              ))}
              {advisers.length === 0 && <div className="text-sm text-gray-500">No advisers</div>}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Link Existing Adviser Users</h2>
            <div className="grid grid-cols-1 gap-3">
              <select className="select" value={syncForm.userId} onChange={(e) => setSyncForm((f) => ({ ...f, userId: e.target.value }))}>
                <option value="">Select Adviser User</option>
                {adviserUsers.map((u: any) => (
                  <option key={u.id} value={u.id}>{u.fullName} — {u.email} — {u.role}</option>
                ))}
              </select>
              <select className="select" value={syncForm.programId} onChange={(e) => setSyncForm((f) => ({ ...f, programId: e.target.value }))}>
                <option value="">Select Program</option>
                {programs.map((p: any) => (
                  <option key={p.id || p._id} value={p.id || p._id}>{p.name}</option>
                ))}
              </select>
              <button
                className="btn btn-success"
                disabled={!syncForm.userId || !syncForm.programId || loading}
                onClick={async () => {
                  setError(null); setSuccess(null);
                  try {
                    await advisersAPI.syncAdviserUser(syncForm);
                    setSuccess("Linked adviser user successfully");
                    setSyncForm({ userId: "", programId: "" });
                    await reloadAdvisers();
                    const au = await advisersAPI.listAdviserUsers({ missingOnly: true });
                    setAdviserUsers(au.data.users || au.data || []);
                  } catch (e: any) {
                    setError(e?.message || "Failed to link adviser user");
                  }
                }}
              >
                Link Adviser
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdviserManagement;


