import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Users,
  Download,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  FileText,
  UserPlus,
  Grid3X3,
  List,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Mail,
  Calendar,
  GraduationCap,
  Phone,
  User,
} from "lucide-react";
import toast from "react-hot-toast";

interface Student {
  _id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentPhone?: string;
  appliedAt: string;
  groupAssignment?: {
    groupName: string;
    assignedAt: string;
  };
}

interface ProgramWithStudents {
  _id: string;
  name: string;
  category: string;
  description: string;
  color: string;
  acceptedStudents: Student[];
  totalAccepted: number;
}

interface GroupFormData {
  groupName: string;
  studentIds: string[];
}

const StudentGrouping: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [programs, setPrograms] = useState<ProgramWithStudents[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [groupingMode, setGroupingMode] = useState<"auto" | "manual">("auto");
  const [autoGroupSize, setAutoGroupSize] = useState(10);
  const [manualGroups, setManualGroups] = useState<GroupFormData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "excel">("excel");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );

  // Fetch accepted students grouped by program
  const fetchAcceptedStudents = async () => {
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:5000/api"
        }/groups/programs/accepted-students`,
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
        toast.error("Failed to load student data");
      }
    } catch (error) {
      console.error("Error fetching accepted students:", error);
      toast.error("Error loading student data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAcceptedStudents();
  }, []);

  // Auto-generate groups
  const handleAutoGroup = () => {
    const selectedProg = programs.find((p) => p._id === selectedProgram);
    if (!selectedProg || selectedProg.acceptedStudents.length === 0) return;

    const students = selectedProg.acceptedStudents;
    const groups: GroupFormData[] = [];

    for (let i = 0; i < students.length; i += autoGroupSize) {
      const groupNumber = Math.floor(i / autoGroupSize) + 1;
      const groupLetter = String.fromCharCode(64 + groupNumber); // A, B, C, etc.

      groups.push({
        groupName: `Group ${groupLetter}`,
        studentIds: students
          .slice(i, i + autoGroupSize)
          .map((s) => s.studentId || s._id),
      });
    }

    setManualGroups(groups);
    setGroupingMode("manual");
    toast.success(`Generated ${groups.length} groups automatically`);
  };

  // Add manual group
  const addManualGroup = () => {
    setManualGroups((prev) => [
      ...prev,
      {
        groupName: `Group ${String.fromCharCode(65 + prev.length)}`,
        studentIds: [],
      },
    ]);
  };

  // Remove manual group
  const removeManualGroup = (index: number) => {
    setManualGroups((prev) => prev.filter((_, i) => i !== index));
  };

  // Update group name
  const updateGroupName = (index: number, name: string) => {
    setManualGroups((prev) =>
      prev.map((group, i) =>
        i === index ? { ...group, groupName: name } : group
      )
    );
  };

  // Toggle student in group
  const toggleStudentInGroup = (groupIndex: number, studentId: string) => {
    setManualGroups((prev) =>
      prev.map((group, i) => {
        if (i === groupIndex) {
          const isSelected = group.studentIds.includes(studentId);
          return {
            ...group,
            studentIds: isSelected
              ? group.studentIds.filter((id) => id !== studentId)
              : [...group.studentIds, studentId],
          };
        }
        // Remove student from other groups
        return {
          ...group,
          studentIds: group.studentIds.filter((id) => id !== studentId),
        };
      })
    );
  };

  // Submit groups
  const handleSubmitGroups = async () => {
    if (!selectedProgram || manualGroups.length === 0) {
      toast.error("Please create at least one group");
      return;
    }

    // Validate groups
    const validGroups = manualGroups.filter(
      (g) => g.groupName.trim() && g.studentIds.length > 0
    );
    if (validGroups.length === 0) {
      toast.error("Please add students to at least one group");
      return;
    }

    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:5000/api"
        }/groups/programs/${selectedProgram}/groups`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ groups: validGroups }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        toast.success(
          `Groups created successfully! ${data.data.studentsAssigned} students assigned.`
        );
        setShowGroupForm(false);
        setSelectedProgram(null);
        setManualGroups([]);
        fetchAcceptedStudents();
      } else {
        const data = await response.json();
        toast.error(data.message || "Failed to create groups");
      }
    } catch (error) {
      console.error("Error creating groups:", error);
      toast.error("Error creating groups");
    }
  };

  // Export student list with complete data
  const handleExportStudents = async (programId: string, groupId?: string) => {
    try {
      const url = `${
        import.meta.env.VITE_API_URL || "http://localhost:5000/api"
      }/groups/programs/${programId}/export${
        groupId ? `?groupId=${groupId}` : ""
      }`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const program = programs.find((p) => p._id === programId);

        // Create comprehensive CSV content with all student information
        const csvHeaders = [
          "Serial No.",
          "Student Name",
          "Email Address",
          "Phone Number",
          "Program Name",
          "Program Category",
          "Application Date",
          "Group Assignment",
          "Assignment Date",
          "Status",
        ];

        let csvContent = csvHeaders.join(",") + "\n";

        // Add student data rows
        if (data.data.students && data.data.students.length > 0) {
          csvContent += data.data.students
            .map((student: any, index: number) => {
              return [
                (index + 1).toString().padStart(3, "0"), // Serial number with padding
                `"${student.name || "Not provided"}"`,
                `"${student.email || "Not provided"}"`,
                `"${student.phone || "Not provided"}"`,
                `"${student.program || program?.name || "Unknown Program"}"`,
                `"${
                  student.category || program?.category || "Unknown Category"
                }"`,
                student.appliedAt
                  ? `"${new Date(student.appliedAt).toLocaleDateString()}"`
                  : '"Not available"',
                `"${student.group || "Unassigned"}"`,
                student.assignedAt
                  ? `"${new Date(student.assignedAt).toLocaleDateString()}"`
                  : '"Not assigned"',
                '"Accepted"',
              ].join(",");
            })
            .join("\n");
        } else {
          // Fallback if no data from backend
          const selectedProg = programs.find((p) => p._id === programId);
          if (selectedProg) {
            csvContent += selectedProg.acceptedStudents
              .map((student, index) => {
                return [
                  (index + 1).toString().padStart(3, "0"),
                  `"${student.studentName || "Not provided"}"`,
                  `"${student.studentEmail || "Not provided"}"`,
                  `"${student.studentPhone || "Not provided"}"`,
                  `"${selectedProg.name}"`,
                  `"${selectedProg.category}"`,
                  student.appliedAt
                    ? `"${new Date(student.appliedAt).toLocaleDateString()}"`
                    : '"Not available"',
                  `"${student.groupAssignment?.groupName || "Unassigned"}"`,
                  student.groupAssignment?.assignedAt
                    ? `"${new Date(
                        student.groupAssignment.assignedAt
                      ).toLocaleDateString()}"`
                    : '"Not assigned"',
                  '"Accepted"',
                ].join(",");
              })
              .join("\n");
          }
        }

        // Download CSV
        const blob = new Blob([csvContent], {
          type: "text/csv;charset=utf-8;",
        });
        const url2 = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url2;
        a.download = `${program?.name || "Program"}_Students_${
          new Date().toISOString().split("T")[0]
        }.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url2);
        document.body.removeChild(a);

        toast.success("Student list exported successfully with complete data!");
      } else {
        toast.error("Failed to export student list");
      }
    } catch (error) {
      console.error("Error exporting student list:", error);
      toast.error("Error exporting student list");
    }
  };

  const filteredPrograms = programs.filter(
    (program) =>
      program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      program.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  // Safe name display function
  const getStudentDisplayName = (student: Student) => {
    return student.studentName || student.name || "Unknown Student";
  };

  // Safe email display function
  const getStudentDisplayEmail = (student: Student) => {
    return student.studentEmail || student.email || "No email provided";
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

  if (showGroupForm && selectedProgram) {
    const selectedProg = programs.find((p) => p._id === selectedProgram);
    if (!selectedProg) return null;

    const unassignedCount = selectedProg.acceptedStudents.filter(
      (student) =>
        !manualGroups.some((group) =>
          group.studentIds.includes(student.studentId || student._id)
        )
    ).length;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="container mx-auto px-6 py-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => {
                    setShowGroupForm(false);
                    setSelectedProgram(null);
                    setManualGroups([]);
                  }}
                  className="flex items-center px-4 py-2 text-gray-600 bg-white rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-sm border border-gray-200"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back to Programs
                </button>

                <div className="h-8 w-px bg-gray-300"></div>

                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Create Student Groups
                  </h1>
                  <p className="text-gray-600 mt-1">
                    {selectedProg.name} • {selectedProg.acceptedStudents.length}{" "}
                    accepted students
                  </p>
                </div>
              </div>

              {manualGroups.length > 0 && (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-6 px-4 py-2 bg-white rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mr-2" />
                      <span className="text-sm font-medium text-gray-700">
                        {selectedProg.acceptedStudents.length - unassignedCount}{" "}
                        Assigned
                      </span>
                    </div>
                    <div className="flex items-center">
                      <AlertTriangle className="w-5 h-5 text-orange-500 mr-2" />
                      <span className="text-sm font-medium text-gray-700">
                        {unassignedCount} Unassigned
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleSubmitGroups}
                    disabled={unassignedCount > 0}
                    className="flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <UserPlus className="w-5 h-5 mr-2" />
                    Create Groups (
                    {manualGroups.filter((g) => g.studentIds.length > 0).length}
                    )
                  </button>
                </div>
              )}
            </div>

            {/* Grouping Mode Controls */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Grouping Method
                </h2>
                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setGroupingMode("auto")}
                    className={`px-4 py-2 rounded-md transition-all duration-200 text-sm font-medium ${
                      groupingMode === "auto"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-800"
                    }`}
                  >
                    Auto Group
                  </button>
                  <button
                    onClick={() => setGroupingMode("manual")}
                    className={`px-4 py-2 rounded-md transition-all duration-200 text-sm font-medium ${
                      groupingMode === "manual"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-800"
                    }`}
                  >
                    Manual Group
                  </button>
                </div>
              </div>

              {groupingMode === "auto" && (
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-3">
                    <label className="text-sm font-medium text-gray-700">
                      Students per group:
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={selectedProg.acceptedStudents.length}
                      value={autoGroupSize}
                      onChange={(e) =>
                        setAutoGroupSize(parseInt(e.target.value) || 1)
                      }
                      className="w-20 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                    />
                  </div>
                  <button
                    onClick={handleAutoGroup}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm"
                  >
                    <Grid3X3 className="w-4 h-4 mr-2" />
                    Generate Groups
                  </button>
                  <div className="text-sm text-gray-600">
                    Will create{" "}
                    {Math.ceil(
                      selectedProg.acceptedStudents.length / autoGroupSize
                    )}{" "}
                    groups
                  </div>
                </div>
              )}

              {groupingMode === "manual" && manualGroups.length === 0 && (
                <div className="text-center py-8">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Create Your First Group
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Start by creating a group and assigning students manually
                  </p>
                  <button
                    onClick={addManualGroup}
                    className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-lg mx-auto"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Create First Group
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Groups Management */}
          {manualGroups.length > 0 && (
            <div className="space-y-8">
              {/* Groups Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  Groups ({manualGroups.length})
                </h2>
                <button
                  onClick={addManualGroup}
                  className="flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 shadow-sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Group
                </button>
              </div>

              {/* Groups Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {manualGroups.map((group, groupIndex) => (
                  <div
                    key={groupIndex}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100"
                  >
                    {/* Group Header */}
                    <div className="p-6 border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={group.groupName}
                            onChange={(e) =>
                              updateGroupName(groupIndex, e.target.value)
                            }
                            className="text-xl font-bold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0 p-0 w-full"
                            placeholder="Group name"
                          />
                          <p className="text-sm text-gray-500 mt-1">
                            {group.studentIds.length} students assigned
                          </p>
                        </div>
                        {manualGroups.length > 1 && (
                          <button
                            onClick={() => removeManualGroup(groupIndex)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-150"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Students List */}
                    <div className="p-6">
                      <div className="space-y-2 max-h-80 overflow-y-auto">
                        {selectedProg.acceptedStudents.map(
                          (student, studentIndex) => {
                            const studentId = student.studentId || student._id;
                            const displayName = getStudentDisplayName(student);
                            const displayEmail =
                              getStudentDisplayEmail(student);

                            return (
                              <label
                                key={studentId}
                                className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors duration-150 cursor-pointer border border-transparent hover:border-gray-200"
                              >
                                <input
                                  type="checkbox"
                                  checked={group.studentIds.includes(studentId)}
                                  onChange={() =>
                                    toggleStudentInGroup(groupIndex, studentId)
                                  }
                                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                                />
                                <div className="ml-3 flex-1">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="flex items-center space-x-3">
                                        <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-1 rounded">
                                          #
                                          {(studentIndex + 1)
                                            .toString()
                                            .padStart(2, "0")}
                                        </span>
                                        <span className="font-medium text-gray-900">
                                          {displayName}
                                        </span>
                                      </div>
                                      <div className="text-sm text-gray-600 mt-1 flex items-center">
                                        <Mail className="w-3 h-3 mr-1" />
                                        {displayEmail}
                                      </div>
                                      {student.studentPhone && (
                                        <div className="text-sm text-gray-600 mt-1 flex items-center">
                                          <Phone className="w-3 h-3 mr-1" />
                                          {student.studentPhone}
                                        </div>
                                      )}
                                    </div>
                                    {manualGroups.some(
                                      (g, i) =>
                                        i !== groupIndex &&
                                        g.studentIds.includes(studentId)
                                    ) && (
                                      <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                                        In Another Group
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </label>
                            );
                          }
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Unassigned Students */}
              {unassignedCount > 0 && (
                <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-6">
                  <div className="flex items-center mb-4">
                    <AlertTriangle className="w-6 h-6 text-orange-600 mr-3" />
                    <h3 className="text-lg font-semibold text-orange-900">
                      Unassigned Students ({unassignedCount})
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {selectedProg.acceptedStudents
                      .filter(
                        (student) =>
                          !manualGroups.some((group) =>
                            group.studentIds.includes(
                              student.studentId || student._id
                            )
                          )
                      )
                      .map((student, index) => {
                        const displayName = getStudentDisplayName(student);
                        const displayEmail = getStudentDisplayEmail(student);

                        return (
                          <div
                            key={student.studentId || student._id}
                            className="flex items-center p-3 bg-white rounded-lg border border-orange-200"
                          >
                            <span className="text-xs font-mono text-orange-600 bg-orange-100 px-2 py-1 rounded mr-3">
                              #{(index + 1).toString().padStart(2, "0")}
                            </span>
                            <div>
                              <div className="font-medium text-gray-900">
                                {displayName}
                              </div>
                              <div className="text-sm text-gray-600">
                                {displayEmail}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                  <div className="mt-4 p-3 bg-orange-100 rounded-lg">
                    <p className="text-sm text-orange-800">
                      <strong>Note:</strong> All students must be assigned to a
                      group before you can create the groups.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
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
                  Student Grouping
                </h1>
                <p className="text-gray-600 mt-1">
                  Organize accepted students into groups by program
                </p>
              </div>
            </div>

            <div className="flex items-center bg-white rounded-xl border border-gray-200 shadow-sm">
              <button
                onClick={() => setViewMode("excel")}
                className={`px-4 py-2 rounded-l-xl transition-all duration-200 flex items-center ${
                  viewMode === "excel"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <List className="w-4 h-4 mr-2" />
                Excel View
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`px-4 py-2 rounded-r-xl transition-all duration-200 flex items-center ${
                  viewMode === "grid"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Grid3X3 className="w-4 h-4 mr-2" />
                Grid View
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="max-w-md">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search programs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Programs List with Accordion Style */}
        {viewMode === "excel" ? (
          <div className="space-y-4">
            {filteredPrograms.length > 0 ? (
              filteredPrograms.map((program) => {
                const isExpanded = expandedCategories.has(program.category);

                return (
                  <div
                    key={program._id}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                  >
                    {/* Category Header - Accordion Style */}
                    <div
                      className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 cursor-pointer hover:from-gray-100 hover:to-gray-200 transition-all duration-200"
                      onClick={() => toggleCategory(program.category)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-3">
                            {isExpanded ? (
                              <ChevronDown className="w-5 h-5 text-gray-600" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-gray-600" />
                            )}
                            <div
                              className={`w-12 h-12 rounded-lg bg-gradient-to-r ${program.color} flex-shrink-0 flex items-center justify-center`}
                            >
                              <GraduationCap className="w-6 h-6 text-white" />
                            </div>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 capitalize">
                              {program.category}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {program.name}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {program.totalAccepted}
                            </div>
                            <div className="text-xs text-gray-500">
                              Accepted Students
                            </div>
                          </div>

                          <div className="flex items-center space-x-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleExportStudents(program._id);
                              }}
                              className="flex items-center px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-all duration-200 text-sm font-medium"
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Export
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedProgram(program._id);
                                setShowGroupForm(true);
                              }}
                              className="flex items-center px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-all duration-200 text-sm font-medium"
                            >
                              <Users className="w-4 h-4 mr-1" />
                              Create Groups
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Student List - Expandable with Excel-like format */}
                    {isExpanded && (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                No.
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                Student Name
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                Email
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                Phone
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                Applied Date
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                Group Assignment
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-100">
                            {program.acceptedStudents.map((student, index) => {
                              const displayName =
                                getStudentDisplayName(student);
                              const displayEmail =
                                getStudentDisplayEmail(student);

                              return (
                                <tr
                                  key={student.studentId || student._id}
                                  className={`hover:bg-blue-25 transition-colors duration-150 ${
                                    index % 2 === 0 ? "bg-white" : "bg-gray-25"
                                  }`}
                                >
                                  <td className="px-6 py-4 text-sm font-mono text-gray-900">
                                    {(index + 1).toString().padStart(2, "0")}
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center">
                                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold mr-3">
                                        {displayName.charAt(0).toUpperCase()}
                                      </div>
                                      <div>
                                        <div className="font-medium text-gray-900">
                                          {displayName}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center text-sm text-gray-600">
                                      <Mail className="w-4 h-4 mr-2" />
                                      {displayEmail}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center text-sm text-gray-600">
                                      <Phone className="w-4 h-4 mr-2" />
                                      {student.studentPhone || "Not provided"}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-600">
                                    <div className="flex items-center">
                                      <Calendar className="w-4 h-4 mr-2" />
                                      {student.appliedAt
                                        ? new Date(
                                            student.appliedAt
                                          ).toLocaleDateString()
                                        : "Unknown"}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    {student.groupAssignment ? (
                                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                        {student.groupAssignment.groupName}
                                      </span>
                                    ) : (
                                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">
                                        Unassigned
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No Programs Found
                </h3>
                <p className="text-gray-600">
                  {searchTerm
                    ? "No programs match your search criteria."
                    : "No programs with accepted students found."}
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Grid View */
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredPrograms.length > 0 ? (
              filteredPrograms.map((program) => (
                <div
                  key={program._id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 overflow-hidden"
                >
                  {/* Program Header */}
                  <div
                    className={`h-24 bg-gradient-to-r ${program.color} relative`}
                  >
                    <div className="absolute inset-0 bg-black bg-opacity-10"></div>
                    <div className="absolute bottom-4 left-6">
                      <h3 className="text-lg font-bold text-white">
                        {program.name}
                      </h3>
                      <p className="text-white text-opacity-90 text-sm capitalize">
                        {program.category}
                      </p>
                    </div>
                  </div>

                  {/* Program Content */}
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <Users className="w-5 h-5 text-green-600 mr-2" />
                        <span className="text-xl font-bold text-green-600">
                          {program.totalAccepted}
                        </span>
                        <span className="text-gray-500 ml-1">accepted</span>
                      </div>
                    </div>

                    {program.acceptedStudents.length > 0 ? (
                      <div className="space-y-2 mb-6">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">
                          Student List:
                        </h4>
                        <div className="max-h-32 overflow-y-auto space-y-1">
                          {program.acceptedStudents.map((student, index) => {
                            const displayName = getStudentDisplayName(student);

                            return (
                              <div
                                key={student.studentId || student._id}
                                className="flex items-center text-sm py-1"
                              >
                                <span className="font-mono text-xs text-gray-400 mr-3 w-6">
                                  #{(index + 1).toString().padStart(2, "0")}
                                </span>
                                <span className="font-medium text-gray-900 flex-1">
                                  {displayName}
                                </span>
                                {student.groupAssignment && (
                                  <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                    {student.groupAssignment.groupName}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm">No accepted students</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    {program.acceptedStudents.length > 0 && (
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => handleExportStudents(program._id)}
                          className="flex items-center justify-center px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-all duration-200 text-sm font-medium"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Export
                        </button>
                        <button
                          onClick={() => {
                            setSelectedProgram(program._id);
                            setShowGroupForm(true);
                          }}
                          className="flex items-center justify-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-all duration-200 text-sm font-medium"
                        >
                          <Users className="w-4 h-4 mr-1" />
                          Create Groups
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full">
                <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No Programs Found
                  </h3>
                  <p className="text-gray-600">
                    {searchTerm
                      ? "No programs match your search criteria."
                      : "No programs with accepted students found."}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentGrouping;
