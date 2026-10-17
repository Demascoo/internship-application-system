import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Archive,
  Users,
  Calendar,
  Clock,
  ArrowLeft,
  Search,
  Filter,
  BarChart3,
  Settings,
  TrendingUp,
  Award,
} from "lucide-react";
import { useApp } from "../../contexts/AppContext";
import ProgramForm from "./ProgramForm";
import ProgramStats from "./ProgramStats";
import toast from "react-hot-toast";

interface Program {
  _id: string;
  name: string;
  description: string;
  category: string;
  totalSpots: number;
  availableSpots: number;
  duration: string;
  startDate: string;
  endDate: string;
  applicationDeadline: string;
  isActive: boolean;
  createdAt: string;
  color: string;
  createdBy: {
    name: string;
    email: string;
  };
}

const ProgramManagement: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [showStats, setShowStats] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [archiveConfirmId, setArchiveConfirmId] = useState<string | null>(null);
  const [reactivateConfirmId, setReactivateConfirmId] = useState<string | null>(null);

  // Fetch programs from backend
  const fetchPrograms = async () => {
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:5000/api"
        }/programs/admin/all?includeInactive=true`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPrograms(data.data.programs);
      } else {
        toast.error("Failed to load programs");
      }
    } catch (error) {
      console.error("Error fetching programs:", error);
      toast.error("Error loading programs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  const handleCreateProgram = () => {
    setSelectedProgram(null);
    setShowForm(true);
  };

  const handleEditProgram = (program: Program) => {
    setSelectedProgram(program);
    setShowForm(true);
  };

  const handleDeleteProgram = async (programId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this program? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:5000/api"
        }/programs/${programId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        toast.success("Program deleted successfully");
        fetchPrograms();
      } else {
        const data = await response.json();
        toast.error(data.message || "Failed to delete program");
      }
    } catch (error) {
      console.error("Error deleting program:", error);
      toast.error("Error deleting program");
    }
  };

  const handleArchiveProgram = async (programId: string) => {
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:5000/api"
        }/programs/${programId}/archive`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        toast.success("Program archived successfully");
        fetchPrograms();
      } else {
        const data = await response.json();
        toast.error(data.message || "Failed to archive program");
      }
    } catch (error) {
      console.error("Error archiving program:", error);
      toast.error("Error archiving program");
    }
  };

  const handleReactivateProgram = async (programId: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/programs/${programId}/reactivate`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        toast.success("Program reactivated successfully");
        fetchPrograms();
      } else {
        const data = await response.json();
        toast.error(data.message || "Failed to reactivate program");
      }
    } catch (error) {
      console.error("Error reactivating program:", error);
      toast.error("Error reactivating program");
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedProgram(null);
    fetchPrograms();
  };

  const filteredPrograms = programs.filter((program) => {
    const matchesSearch =
      program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      program.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      program.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "active" && program.isActive) ||
      (filterStatus === "inactive" && !program.isActive);

    return matchesSearch && matchesFilter;
  });

  // Calculate overview stats
  const stats = {
    total: programs.length,
    active: programs.filter((p) => p.isActive).length,
    archived: programs.filter((p) => !p.isActive).length,
    totalSpots: programs.reduce((sum, p) => sum + p.totalSpots, 0),
    availableSpots: programs
      .filter((p) => p.isActive)
      .reduce((sum, p) => sum + p.availableSpots, 0),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
              <div className="absolute inset-0 rounded-full border-t-4 border-blue-200"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <ProgramForm
        program={selectedProgram}
        onBack={() => {
          setShowForm(false);
          setSelectedProgram(null);
        }}
        onSuccess={handleFormSuccess}
      />
    );
  }

  if (showStats) {
    return (
      <ProgramStats programId={showStats} onBack={() => setShowStats(null)} />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center px-4 py-2 text-gray-600 bg-white rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-sm border border-gray-200"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Dashboard
              </button>

              <div className="h-8 w-px bg-gray-300"></div>

              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Program Management
                </h1>
                <p className="text-gray-600 mt-1">
                  Create, edit, and manage internship programs
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex items-center bg-white rounded-xl border border-gray-200 shadow-sm">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-4 py-2 rounded-l-xl transition-all duration-200 ${
                    viewMode === "grid"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`px-4 py-2 rounded-r-xl transition-all duration-200 ${
                    viewMode === "table"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Table
                </button>
              </div>

              <button
                onClick={handleCreateProgram}
                className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Program
              </button>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Total Programs
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {stats.total}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Settings className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-500 uppercase tracking-wide">
                    Active
                  </p>
                  <p className="text-3xl font-bold text-green-600 mt-1">
                    {stats.active}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-500 uppercase tracking-wide">
                    Archived
                  </p>
                  <p className="text-3xl font-bold text-orange-600 mt-1">
                    {stats.archived}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Archive className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-500 uppercase tracking-wide">
                    Total Spots
                  </p>
                  <p className="text-3xl font-bold text-purple-600 mt-1">
                    {stats.totalSpots}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-teal-500 uppercase tracking-wide">
                    Available
                  </p>
                  <p className="text-3xl font-bold text-teal-600 mt-1">
                    {stats.availableSpots}
                  </p>
                </div>
                <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                  <Award className="w-6 h-6 text-teal-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search programs by name, category, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm"
                />
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="pl-10 pr-8 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm appearance-none cursor-pointer"
                >
                  <option value="all">All Programs</option>
                  <option value="active">Active Programs</option>
                  <option value="inactive">Archived Programs</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Programs Content */}
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredPrograms.length > 0 ? (
              filteredPrograms.map((program) => (
                <div
                  key={program._id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:scale-105 overflow-hidden"
                >
                  {/* Program Header */}
                  <div
                    className={`h-32 bg-gradient-to-r ${program.color} relative overflow-hidden`}
                  >
                    <div className="absolute inset-0 bg-black bg-opacity-10"></div>
                    <div className="absolute top-4 right-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          program.isActive
                            ? "bg-green-100 text-green-800 border border-green-200"
                            : "bg-red-100 text-red-800 border border-red-200"
                        }`}
                      >
                        {program.isActive ? "Active" : "Archived"}
                      </span>
                    </div>
                    <div className="absolute bottom-4 left-6">
                      <h3 className="text-xl font-bold text-white mb-1">
                        {program.name}
                      </h3>
                      <p className="text-white text-opacity-90 text-sm capitalize">
                        {program.category}
                      </p>
                    </div>
                  </div>

                  {/* Program Content */}
                  <div className="p-6">
                    <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                      {program.description}
                    </p>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-gray-500">
                          <Users className="w-4 h-4 mr-2" />
                          <span>Capacity</span>
                        </div>
                        <div className="flex items-center">
                          <span className="font-semibold text-green-600">
                            {program.availableSpots}
                          </span>
                          <span className="text-gray-400 mx-1">/</span>
                          <span className="text-gray-600">
                            {program.totalSpots}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-gray-500">
                          <Clock className="w-4 h-4 mr-2" />
                          <span>Duration</span>
                        </div>
                        <span className="font-medium text-gray-700">
                          {program.duration}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-gray-500">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span>Deadline</span>
                        </div>
                        <span className="font-medium text-gray-700">
                          {new Date(
                            program.applicationDeadline
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500 mb-4">
                      Created by {program.createdBy?.name} •{" "}
                      {new Date(program.createdAt).toLocaleDateString()}
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setShowStats(program._id)}
                        className="flex items-center justify-center px-3 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-all duration-200 text-sm font-medium"
                      >
                        <BarChart3 className="w-4 h-4 mr-1" />
                        Analytics
                      </button>

                      <button
                        onClick={() => handleEditProgram(program)}
                        className="flex items-center justify-center px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-all duration-200 text-sm font-medium"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {program.isActive ? (
                        <button
                          onClick={() => setArchiveConfirmId(program._id)}
                          className="flex items-center justify-center px-3 py-2 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-all duration-200 text-sm font-medium"
                        >
                          <Archive className="w-4 h-4 mr-1" />
                          Archive
                        </button>
                      ) : (
                        <button
                          onClick={() => setReactivateConfirmId(program._id)}
                          className="flex items-center justify-center px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-all duration-200 text-sm font-medium"
                        >
                          Reactivate
                        </button>
                      )}

                      <button
                        onClick={() => setShowStats(program._id)}
                        className="flex items-center justify-center px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-all duration-200 text-sm font-medium"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Details
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full">
                <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                  <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No Programs Found
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {searchTerm || filterStatus !== "all"
                      ? "No programs match your current filters."
                      : "Get started by creating your first program."}
                  </p>
                  <button
                    onClick={handleCreateProgram}
                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-lg"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Create First Program
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Table View */
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Program
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Capacity
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deadline
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPrograms.map((program, index) => (
                    <tr
                      key={program._id}
                      className={`hover:bg-gray-50 transition-colors duration-150 ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-25"
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div
                            className={`w-10 h-10 rounded-lg bg-gradient-to-r ${program.color} flex-shrink-0 mr-4`}
                          ></div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {program.name}
                            </div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {program.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 capitalize">
                        {program.category}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="flex items-center">
                          <span className="font-semibold text-green-600">
                            {program.availableSpots}
                          </span>
                          <span className="text-gray-400 mx-1">/</span>
                          <span>{program.totalSpots}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {program.duration}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {new Date(
                          program.applicationDeadline
                        ).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            program.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {program.isActive ? "Active" : "Archived"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setShowStats(program._id)}
                            className="text-indigo-600 hover:text-indigo-900 transition-colors duration-150"
                            title="View Analytics"
                          >
                            <BarChart3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditProgram(program)}
                            className="text-blue-600 hover:text-blue-900 transition-colors duration-150"
                            title="Edit Program"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {program.isActive ? (
                            <button
                              onClick={() => setArchiveConfirmId(program._id)}
                              className="text-orange-600 hover:text-orange-900 transition-colors duration-150"
                              title="Archive Program"
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => setReactivateConfirmId(program._id)}
                              className="text-green-600 hover:text-green-900 transition-colors duration-150"
                              title="Reactivate Program"
                            >
                              Reactivate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      {archiveConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-2">Confirm Archive</h3>
            <p className="text-sm text-gray-600 mb-6">Are you sure you want to archive this program?</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setArchiveConfirmId(null)}
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const id = archiveConfirmId;
                  setArchiveConfirmId(null);
                  if (id) {
                    await handleArchiveProgram(id);
                  }
                }}
                className="px-4 py-2 rounded-md bg-orange-600 text-white hover:bg-orange-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
      {reactivateConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-2">Confirm Reactivate</h3>
            <p className="text-sm text-gray-600 mb-6">Are you sure you want to reactivate this program?</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setReactivateConfirmId(null)}
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const id = reactivateConfirmId;
                  setReactivateConfirmId(null);
                  if (id) {
                    await handleReactivateProgram(id);
                  }
                }}
                className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgramManagement;
