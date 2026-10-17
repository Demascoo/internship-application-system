import React from "react";
import {
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  FileText
} from "lucide-react";

interface AttendanceRecord {
  date: string;
  status: 'Present' | 'Absent' | 'Excused' | 'Late';
  notes?: string;
}

interface AttendanceAndFeedbackProps {
  attendanceRecords: AttendanceRecord[];
  attendanceData: {
    totalDaysPresent: number;
    totalDaysAbsent: number;
    attendancePercentage: number;
  };
  supervisorFeedback: {
    majorStrengths: string;
    areasOfImprovement: string;
    finalRemarks: string;
    supervisorName: string;
    supervisorSignature: string;
    supervisorStamp: string;
  };
  onAttendanceChange: (index: number, status: AttendanceRecord['status']) => void;
  onAttendanceNoteChange: (index: number, notes: string) => void;
  onFeedbackChange: (field: string, value: string) => void;
}

export const AttendanceAndFeedbackSection: React.FC<AttendanceAndFeedbackProps> = ({
  attendanceRecords,
  attendanceData,
  supervisorFeedback,
  onAttendanceChange,
  onAttendanceNoteChange,
  onFeedbackChange
}) => {
  return (
    <>
      {/* Attendance & Commitment */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-orange-500" />
          Attendance & Commitment
        </h3>
        
        {/* Attendance Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">{attendanceData.totalDaysPresent}</p>
            <p className="text-sm text-green-700">Days Present</p>
          </div>
          <div className="bg-red-50 rounded-lg p-4 text-center">
            <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-red-600">{attendanceData.totalDaysAbsent}</p>
            <p className="text-sm text-red-700">Days Absent</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600">{attendanceData.attendancePercentage}%</p>
            <p className="text-sm text-blue-700">Attendance Rate</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <Clock className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-600">{attendanceRecords.length}</p>
            <p className="text-sm text-gray-700">Total Days</p>
          </div>
        </div>

        {/* Attendance Records */}
        <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {attendanceRecords.map((record, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {new Date(record.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={record.status}
                      onChange={(e) => onAttendanceChange(index, e.target.value as AttendanceRecord['status'])}
                      className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Present">Present</option>
                      <option value="Absent">Absent</option>
                      <option value="Excused">Excused</option>
                      <option value="Late">Late</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={record.notes || ''}
                      onChange={(e) => onAttendanceNoteChange(index, e.target.value)}
                      className="text-sm border border-gray-300 rounded px-2 py-1 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Optional notes"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Supervisor's Written Feedback */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FileText className="w-5 h-5 mr-2 text-indigo-500" />
          Supervisor's Written Feedback
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Major Strengths of the Intern</label>
            <textarea
              value={supervisorFeedback.majorStrengths}
              onChange={(e) => onFeedbackChange('majorStrengths', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe the intern's major strengths..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Areas of Improvement</label>
            <textarea
              value={supervisorFeedback.areasOfImprovement}
              onChange={(e) => onFeedbackChange('areasOfImprovement', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Suggest areas where the intern can improve..."
            />
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Final Remarks</label>
          <textarea
            value={supervisorFeedback.finalRemarks}
            onChange={(e) => onFeedbackChange('finalRemarks', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Overall comments and recommendations..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Supervisor Name</label>
            <input
              type="text"
              value={supervisorFeedback.supervisorName}
              onChange={(e) => onFeedbackChange('supervisorName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter supervisor name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Supervisor Signature</label>
            <input
              type="text"
              value={supervisorFeedback.supervisorSignature}
              onChange={(e) => onFeedbackChange('supervisorSignature', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Digital signature or initials"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Supervisor Stamp</label>
            <input
              type="text"
              value={supervisorFeedback.supervisorStamp}
              onChange={(e) => onFeedbackChange('supervisorStamp', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Official stamp or seal"
            />
          </div>
        </div>
      </div>
    </>
  );
};
