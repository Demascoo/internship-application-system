import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Calendar, CheckCircle, XCircle, Clock, AlertCircle, Plus, Save, ChevronLeft, ChevronRight } from "lucide-react";
import { advisersAPI } from "../../services/api";

interface Student {
  _id: string;
  name: string;
  email: string;
  profile?: {
    university?: string;
    graduationYear?: number;
    course?: string;
  };
}

interface AttendanceRecord {
  _id: string;
  date: string;
  status: "present" | "absent" | "late" | "excused";
  notes?: string;
  createdAt: string;
}

interface EnhancedAttendanceTrackingProps {
  student: Student;
  onBack?: () => void;
}

const EnhancedAttendanceTracking: React.FC<EnhancedAttendanceTrackingProps> = ({ 
  student, 
  onBack 
}) => {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [quickEntry, setQuickEntry] = useState({
    status: "present" as const,
    notes: ""
  });
  const [internshipDates, setInternshipDates] = useState({
    startDate: "",
    endDate: ""
  });
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [savingDates, setSavingDates] = useState(false);

  // Load internship dates
  const loadInternshipDates = async () => {
    try {
      const res = await advisersAPI.getInternshipDates(student._id);
      if (res.data?.startDate && res.data?.endDate) {
        setInternshipDates({
          startDate: new Date(res.data.startDate).toISOString().split('T')[0],
          endDate: new Date(res.data.endDate).toISOString().split('T')[0]
        });
      }
    } catch (e) {
      console.error("Failed to load internship dates:", e);
    }
  };

  // Save internship dates
  const saveInternshipDates = async () => {
    if (!internshipDates.startDate || !internshipDates.endDate) {
      toast.error("Please enter both start and end dates");
      return;
    }

    setSavingDates(true);
    try {
      await advisersAPI.saveInternshipDates({
        studentId: student._id,
        startDate: internshipDates.startDate,
        endDate: internshipDates.endDate
      });
      toast.success("Internship dates saved successfully");
    } catch (e) {
      console.error("Failed to save internship dates:", e);
      toast.error("Failed to save internship dates");
    } finally {
      setSavingDates(false);
    }
  };

  // Load attendance records
  const loadAttendance = async () => {
    setLoading(true);
    try {
      const res = await advisersAPI.listAttendance(student._id);
      const records = res.data?.attendance || [];
      // Filter out internship_dates records from display
      const actualAttendance = records.filter((r: any) => r.status !== "internship_dates");
      setAttendanceRecords(actualAttendance);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load attendance records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
    loadInternshipDates();
  }, [student._id]);

  // Generate calendar days
  const getCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= lastDay || currentDate.getDay() !== 0) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };

  // Get attendance for a specific date
  const getAttendanceForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return attendanceRecords.find(record => 
      new Date(record.date).toISOString().split('T')[0] === dateStr
    );
  };

  // Record attendance
  const recordAttendance = async (date: Date, status: string, notes?: string) => {
    setSaving(true);
    try {
      await advisersAPI.recordAttendance({
        studentId: student._id,
        date: date.toISOString(),
        status,
        notes,
        internshipStartDate: internshipDates.startDate || undefined,
        internshipEndDate: internshipDates.endDate || undefined
      });
      
      await loadAttendance();
      toast.success("Attendance recorded successfully");
    } catch (e) {
      console.error(e);
      toast.error("Failed to record attendance");
    } finally {
      setSaving(false);
    }
  };

  // Calculate total internship days
  const calculateTotalDays = () => {
    if (!internshipDates.startDate || !internshipDates.endDate) return 0;
    const start = new Date(internshipDates.startDate);
    const end = new Date(internshipDates.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1;
  };

  // Calculate present and absent days
  const calculateAttendanceStats = () => {
    const presentDays = attendanceRecords.filter(r => r.status === "present").length;
    const absentDays = attendanceRecords.filter(r => r.status === "absent").length;
    const totalRecorded = presentDays + absentDays;
    const totalInternshipDays = calculateTotalDays();
    
    return {
      presentDays,
      absentDays,
      totalRecorded,
      totalInternshipDays,
      isComplete: totalRecorded >= totalInternshipDays && totalInternshipDays > 0
    };
  };

  // Quick entry for today
  const handleQuickEntry = async () => {
    if (!quickEntry.status) {
      toast.error("Please select a status first");
      return;
    }
    
    if (selectedDays.length === 0) {
      toast.error("Please select days first");
      return;
    }
    
    const stats = calculateAttendanceStats();
    if (stats.isComplete) {
      toast.error("Total internship days are finished! Cannot add more attendance.");
      return;
    }
    
    await recordAttendance(new Date(), quickEntry.status, quickEntry.notes);
    setQuickEntry({ status: "present", notes: "" });
    setSelectedDays([]);
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "present": return "bg-green-100 text-green-800 border-green-200";
      case "absent": return "bg-red-100 text-red-800 border-red-200";
      case "late": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "excused": return "bg-blue-100 text-blue-800 border-blue-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present": return <CheckCircle className="w-4 h-4" />;
      case "absent": return <XCircle className="w-4 h-4" />;
      case "late": return <Clock className="w-4 h-4" />;
      case "excused": return <AlertCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  // Calculate weekly stats
  const getWeeklyStats = () => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    
    const weekRecords = attendanceRecords.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate >= weekStart && recordDate <= today;
    });

    const present = weekRecords.filter(r => r.status === "present").length;
    const total = weekRecords.length;
    
    return { present, total, percentage: total > 0 ? Math.round((present / total) * 100) : 0 };
  };

  const weeklyStats = getWeeklyStats();
  const calendarDays = getCalendarDays();

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Attendance Tracking</h2>
            <p className="text-gray-600">Student: {student.name}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-gray-500" />
          <span className="text-sm text-gray-600">
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Internship Dates Section */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Internship Duration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Internship Start Date
            </label>
            <input
              type="date"
              value={internshipDates.startDate}
              onChange={(e) => setInternshipDates(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Internship End Date
            </label>
            <input
              type="date"
              value={internshipDates.endDate}
              onChange={(e) => setInternshipDates(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        {calculateTotalDays() > 0 && (
          <div className="mt-3 p-3 bg-blue-100 rounded-md">
            <p className="text-sm font-medium text-blue-800">
              Total Internship Days: <span className="text-lg">{calculateTotalDays()}</span> days
            </p>
          </div>
        )}
        <div className="mt-4 flex justify-end">
          <button
            onClick={saveInternshipDates}
            disabled={!internshipDates.startDate || !internshipDates.endDate || savingDates}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {savingDates ? "Saving..." : "Save Dates"}
          </button>
        </div>
      </div>

      {/* Quick Entry Section */}
      <div className="bg-blue-50 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Quick Entry - Today</h3>
        <div className="flex items-center space-x-4">
          <select
            value={quickEntry.status}
            onChange={(e) => setQuickEntry(prev => ({ ...prev, status: e.target.value as any }))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="late">Late</option>
            <option value="excused">Excused</option>
          </select>
          
          <input
            type="text"
            placeholder="Notes (optional)"
            value={quickEntry.notes}
            onChange={(e) => setQuickEntry(prev => ({ ...prev, notes: e.target.value }))}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="selectDay"
              checked={selectedDays.includes(new Date().toISOString().split('T')[0])}
              onChange={(e) => {
                const today = new Date().toISOString().split('T')[0];
                if (e.target.checked) {
                  setSelectedDays(prev => [...prev, today]);
                } else {
                  setSelectedDays(prev => prev.filter(day => day !== today));
                }
              }}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="selectDay" className="text-sm text-gray-700">
              Select Today
            </label>
          </div>
          
          <button
            onClick={handleQuickEntry}
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Save</span>
          </button>
        </div>
      </div>

      {/* Attendance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Present Days</p>
              <p className="text-2xl font-bold text-green-800">{calculateAttendanceStats().presentDays}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-red-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-medium">Absent Days</p>
              <p className="text-2xl font-bold text-red-800">{calculateAttendanceStats().absentDays}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Days</p>
              <p className="text-2xl font-bold text-blue-800">{calculateAttendanceStats().totalInternshipDays}</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className={`rounded-lg p-4 ${
          calculateAttendanceStats().isComplete 
            ? 'bg-orange-50' 
            : calculateAttendanceStats().totalRecorded >= calculateAttendanceStats().totalInternshipDays * 0.8 
              ? 'bg-yellow-50' 
              : 'bg-purple-50'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${
                calculateAttendanceStats().isComplete 
                  ? 'text-orange-600' 
                  : calculateAttendanceStats().totalRecorded >= calculateAttendanceStats().totalInternshipDays * 0.8 
                    ? 'text-yellow-600' 
                    : 'text-purple-600'
              }`}>
                {calculateAttendanceStats().isComplete ? 'Status: Complete!' : 'Progress'}
              </p>
              <p className={`text-2xl font-bold ${
                calculateAttendanceStats().isComplete 
                  ? 'text-orange-800' 
                  : calculateAttendanceStats().totalRecorded >= calculateAttendanceStats().totalInternshipDays * 0.8 
                    ? 'text-yellow-800' 
                    : 'text-purple-800'
              }`}>
                {calculateAttendanceStats().totalRecorded}/{calculateAttendanceStats().totalInternshipDays}
              </p>
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              calculateAttendanceStats().isComplete 
                ? 'bg-orange-600' 
                : calculateAttendanceStats().totalRecorded >= calculateAttendanceStats().totalInternshipDays * 0.8 
                  ? 'bg-yellow-600' 
                  : 'bg-purple-600'
            }`}>
              <span className="text-white text-xs font-bold">
                {calculateAttendanceStats().totalInternshipDays > 0 
                  ? Math.round((calculateAttendanceStats().totalRecorded / calculateAttendanceStats().totalInternshipDays) * 100)
                  : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Validation Warning */}
      {calculateAttendanceStats().isComplete && (
        <div className="bg-orange-100 border border-orange-400 text-orange-700 px-4 py-3 rounded mb-6">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span className="font-medium">
              Total internship days are finished! All {calculateAttendanceStats().totalInternshipDays} days have been recorded.
            </span>
          </div>
        </div>
      )}

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <h3 className="text-lg font-medium text-gray-900">
          {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h3>
        
        <button
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 mb-6">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {calendarDays.map((day, index) => {
          const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
          const isToday = day.toDateString() === new Date().toDateString();
          const attendance = getAttendanceForDate(day);
          const isWeekend = day.getDay() === 0 || day.getDay() === 6;
          
          return (
            <div
              key={index}
              className={`
                p-2 min-h-[60px] border border-gray-200 cursor-pointer transition-colors
                ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'}
                ${isToday ? 'ring-2 ring-blue-500' : ''}
                ${isWeekend ? 'bg-gray-50' : ''}
                hover:bg-gray-50
              `}
              onClick={() => setSelectedDate(day)}
            >
              <div className="text-sm font-medium text-gray-900 mb-1">
                {day.getDate()}
              </div>
              
              {attendance && (
                <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs border ${getStatusColor(attendance.status)}`}>
                  {getStatusIcon(attendance.status)}
                  <span className="capitalize">{attendance.status}</span>
                </div>
              )}
              
              {isToday && !attendance && (
                <div className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800 border border-yellow-200">
                  <Plus className="w-3 h-3" />
                  <span>Add</span>
                </div>
              )}
            </div>
          );
        })}
      </div>


      {/* Attendance Modal */}
      {selectedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">
              Record Attendance - {selectedDate.toLocaleDateString()}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={quickEntry.status}
                  onChange={(e) => setQuickEntry(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late</option>
                  <option value="excused">Excused</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (optional)
                </label>
                <textarea
                  value={quickEntry.notes}
                  onChange={(e) => setQuickEntry(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Add any notes about the attendance..."
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setSelectedDate(null)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!quickEntry.status) {
                    toast.error("Please select a status first");
                    return;
                  }
                  
                  const stats = calculateAttendanceStats();
                  if (stats.isComplete) {
                    toast.error("Total internship days are finished! Cannot add more attendance.");
                    return;
                  }
                  
                  await recordAttendance(selectedDate, quickEntry.status, quickEntry.notes);
                  setSelectedDate(null);
                  setQuickEntry({ status: "present", notes: "" });
                }}
                disabled={saving || calculateAttendanceStats().isComplete}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedAttendanceTracking;
