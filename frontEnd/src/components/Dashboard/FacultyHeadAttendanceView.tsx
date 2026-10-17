import React, { useState, useEffect } from "react";
import { advisersAPI } from "../../services/api";
import toast from "react-hot-toast";
import { Calendar, CheckCircle, XCircle, Clock, AlertCircle, Users, Search } from "lucide-react";

interface Student {
  _id: string;
  name: string;
  email: string;
  groupAssignment?: {
    programName?: string;
  };
}

interface AttendanceRecord {
  _id: string;
  date: string;
  status: "present" | "absent" | "late" | "excused";
  notes?: string;
  internshipStartDate?: string;
  internshipEndDate?: string;
}

interface FacultyHeadAttendanceViewProps {
  students: Student[];
}

const FacultyHeadAttendanceView: React.FC<FacultyHeadAttendanceViewProps> = ({ students }) => {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Load attendance records for selected student
  const loadAttendanceRecords = async (studentId: string) => {
    setLoading(true);
    try {
      console.log("📥 Loading attendance records for student:", studentId);
      const res = await advisersAPI.listAttendance(studentId);
      console.log("📊 Raw attendance response:", res);
      
      // Use same data extraction logic as University Adviser
      const records = res.data?.attendance || res.attendance || [];
      console.log("📋 Extracted attendance records:", records);
      
      // Filter out internship_dates records from display
      const actualAttendanceRecords = records.filter((r: any) => r.status !== "internship_dates");
      console.log("✅ Filtered attendance records:", actualAttendanceRecords);
      
      setAttendanceRecords(actualAttendanceRecords);
    } catch (error) {
      console.error("❌ Error loading attendance records:", error);
      toast.error("Failed to load attendance records");
      setAttendanceRecords([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate attendance stats - using same logic as University Adviser
  const calculateAttendanceStats = () => {
    // Get internship dates from the most recent attendance record
    const latestRecord = attendanceRecords.find(r => r.internshipStartDate && r.internshipEndDate);
    let totalInternshipDays = 0;
    
    if (latestRecord?.internshipStartDate && latestRecord?.internshipEndDate) {
      const startDate = new Date(latestRecord.internshipStartDate);
      const endDate = new Date(latestRecord.internshipEndDate);
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      totalInternshipDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }
    
    const presentDays = attendanceRecords.filter(r => r.status === "present").length;
    const absentDays = attendanceRecords.filter(r => r.status === "absent").length;
    const lateDays = attendanceRecords.filter(r => r.status === "late").length;
    const excusedDays = attendanceRecords.filter(r => r.status === "excused").length;
    const totalRecorded = presentDays + absentDays + lateDays + excusedDays;
    
    return {
      presentDays,
      absentDays,
      lateDays,
      excusedDays,
      totalRecorded,
      totalInternshipDays,
      attendanceRate: totalInternshipDays > 0 ? Math.round((presentDays / totalInternshipDays) * 100) : 0
    };
  };

  // Filter students based on search
  const filteredStudents = students.filter((student) => {
    const term = searchTerm.toLowerCase();
    return (
      student.name.toLowerCase().includes(term) ||
      student.email.toLowerCase().includes(term) ||
      (student.groupAssignment?.programName || "").toLowerCase().includes(term)
    );
  });

  // Handle student selection
  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student);
    loadAttendanceRecords(student._id);
  };

  const stats = selectedStudent ? calculateAttendanceStats() : null;

  return (
    <div className="flex h-[calc(100vh-300px)]">
      {/* Students List */}
      <div className="w-80 bg-white rounded-l-lg shadow-sm border-r border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Students Attendance</h3>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="overflow-y-auto h-full">
          {filteredStudents.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No students found</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredStudents.map((student) => (
                <button
                  key={student._id}
                  onClick={() => handleStudentSelect(student)}
                  className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                    selectedStudent?._id === student._id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{student.name}</p>
                      <p className="text-sm text-gray-600 truncate">{student.email}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {student.groupAssignment?.programName || 'No program'}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Attendance Details */}
      <div className="flex-1 bg-white rounded-r-lg shadow-sm">
        {!selectedStudent ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">Select a Student</h3>
              <p className="text-sm">Choose a student to view their attendance records</p>
            </div>
          </div>
        ) : (
          <div className="p-6 h-full overflow-y-auto">
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">{selectedStudent.name} - Attendance</h2>
              <p className="text-gray-600">{selectedStudent.email}</p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <>
                {/* Stats Cards */}
                {stats && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                      <p className="text-sm text-gray-600">Total Days</p>
                      <p className="text-xl font-bold text-blue-600">{stats.totalInternshipDays}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <p className="text-sm text-gray-600">Present</p>
                      <p className="text-xl font-bold text-green-600">{stats.presentDays}</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg text-center">
                      <p className="text-sm text-gray-600">Absent</p>
                      <p className="text-xl font-bold text-red-600">{stats.absentDays}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg text-center">
                      <p className="text-sm text-gray-600">Attendance Rate</p>
                      <p className="text-xl font-bold text-purple-600">{stats.attendanceRate}%</p>
                    </div>
                  </div>
                )}

                {/* Calendar View */}
                {attendanceRecords.length > 0 ? (
                  <div className="bg-white border rounded-lg p-4">
                    <h5 className="text-sm font-medium text-gray-700 mb-3">Attendance Calendar</h5>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700">Week</th>
                            <th className="border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700">Mon</th>
                            <th className="border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700">Tue</th>
                            <th className="border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700">Wed</th>
                            <th className="border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700">Thu</th>
                            <th className="border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700">Fri</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const weeks: { [key: string]: AttendanceRecord[] } = {};
                            
                            // Group records by week
                            attendanceRecords.forEach((record) => {
                              const date = new Date(record.date);
                              const weekStart = new Date(date);
                              weekStart.setDate(date.getDate() - date.getDay() + 1); // Monday
                              const weekKey = weekStart.toISOString().split('T')[0];
                              
                              if (!weeks[weekKey]) weeks[weekKey] = [];
                              weeks[weekKey].push(record);
                            });

                            return Object.entries(weeks)
                              .sort(([a], [b]) => a.localeCompare(b))
                              .map(([weekStart, weekRecords]) => {
                                const startDate = new Date(weekStart);
                                const weekDays = Array.from({ length: 5 }, (_, i) => {
                                  const day = new Date(startDate);
                                  day.setDate(startDate.getDate() + i);
                                  return day;
                                });

                                return (
                                  <tr key={weekStart}>
                                    <td className="border border-gray-200 px-3 py-2 text-xs text-gray-600 bg-gray-50">
                                      {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </td>
                                    {weekDays.map((day, dayIndex) => {
                                      const dayStr = day.toISOString().split('T')[0];
                                      const dayRecord = weekRecords.find((r) => 
                                        new Date(r.date).toISOString().split('T')[0] === dayStr
                                      );
                                      
                                      return (
                                        <td key={dayIndex} className="border border-gray-200 px-3 py-2 text-center">
                                          <div className="flex flex-col items-center">
                                            <span className="text-xs text-gray-500 mb-1">
                                              {day.getDate()}
                                            </span>
                                            {dayRecord ? (
                                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                                                dayRecord.status === 'present' ? 'bg-green-500' :
                                                dayRecord.status === 'absent' ? 'bg-red-500' :
                                                dayRecord.status === 'late' ? 'bg-yellow-500' :
                                                dayRecord.status === 'excused' ? 'bg-blue-500' : 'bg-gray-400'
                                              }`} title={dayRecord.notes || dayRecord.status}>
                                                {dayRecord.status === 'present' ? '✓' :
                                                 dayRecord.status === 'absent' ? '✗' :
                                                 dayRecord.status === 'late' ? 'L' :
                                                 dayRecord.status === 'excused' ? 'E' : '?'}
                                              </div>
                                            ) : (
                                              <div className="w-6 h-6 rounded-full bg-gray-100 border border-gray-300"></div>
                                            )}
                                          </div>
                                        </td>
                                      );
                                    })}
                                  </tr>
                                );
                              });
                          })()}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Legend */}
                    <div className="mt-4 flex flex-wrap gap-4 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">✓</div>
                        <span>Present</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white font-bold">✗</div>
                        <span>Absent</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold">L</div>
                        <span>Late</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">E</div>
                        <span>Excused</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">No attendance records found for this student</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FacultyHeadAttendanceView;
