const fs = require('fs');
const path = require('path');

// Generate HTML template for Final Evaluation PDF
const generateFinalEvaluationHTML = (evaluation) => {
  const student = evaluation.studentId;
  const companyAdviser = evaluation.companyAdviserId;
  const universityAdviser = evaluation.universityAdviserId;
  const facultyHead = evaluation.facultyHeadId;

  // Calculate attendance summary
  const totalWeeks = evaluation.attendance?.weeks?.length || 0;
  const totalAbsentDays = evaluation.attendance?.totalAbsentDays || 0;
  const attendancePercentage = totalWeeks > 0 ? ((totalWeeks * 5 - totalAbsentDays) / (totalWeeks * 5) * 100).toFixed(1) : 0;

  // Calculate final scores
  const generalScore = evaluation.finalEvaluation?.generalPerformance || 0;
  const personalScore = evaluation.finalEvaluation?.personalSkills || 0;
  const professionalScore = evaluation.finalEvaluation?.professionalSkills || 0;
  const totalScore = evaluation.finalEvaluation?.total || 0;

  // Determine grade
  let grade = 'F';
  if (totalScore >= 90) grade = 'A';
  else if (totalScore >= 80) grade = 'B';
  else if (totalScore >= 70) grade = 'C';
  else if (totalScore >= 60) grade = 'D';

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Final Result Evaluation - ${student?.name || 'Student'}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            line-height: 1.4;
            color: #333;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 20px;
        }
        .header h1 {
            color: #2563eb;
            margin-bottom: 10px;
        }
        .section {
            margin-bottom: 25px;
            page-break-inside: avoid;
        }
        .section-title {
            background-color: #f3f4f6;
            padding: 10px;
            border-left: 4px solid #2563eb;
            font-weight: bold;
            margin-bottom: 15px;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
        }
        .info-item {
            display: flex;
            margin-bottom: 8px;
        }
        .info-label {
            font-weight: bold;
            min-width: 150px;
            color: #4b5563;
        }
        .info-value {
            color: #111827;
        }
        .criteria-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        .criteria-table th,
        .criteria-table td {
            border: 1px solid #d1d5db;
            padding: 10px;
            text-align: left;
        }
        .criteria-table th {
            background-color: #f9fafb;
            font-weight: bold;
        }
        .attendance-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 12px;
        }
        .attendance-table th,
        .attendance-table td {
            border: 1px solid #d1d5db;
            padding: 5px;
            text-align: center;
        }
        .attendance-table th {
            background-color: #f9fafb;
        }
        .present { background-color: #dcfce7; }
        .absent { background-color: #fecaca; }
        .late { background-color: #fef3c7; }
        .excused { background-color: #e0e7ff; }
        .score-summary {
            background-color: #f0f9ff;
            border: 2px solid #2563eb;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
        }
        .final-grade {
            font-size: 48px;
            font-weight: bold;
            color: #2563eb;
            margin: 10px 0;
        }
        .comments-section {
            background-color: #f9fafb;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 15px;
        }
        .signature-section {
            margin-top: 40px;
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 30px;
        }
        .signature-box {
            text-align: center;
            border-top: 1px solid #000;
            padding-top: 10px;
            margin-top: 50px;
        }
        @media print {
            body { margin: 0; }
            .section { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>COMPANY ADVISER FINAL RESULT EVALUATION</h1>
        <p>Internship Management System</p>
    </div>

    <div class="section">
        <div class="section-title">Student Information</div>
        <div class="info-grid">
            <div>
                <div class="info-item">
                    <span class="info-label">Full Name:</span>
                    <span class="info-value">${evaluation.studentInfo?.fullName || student?.name || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">University:</span>
                    <span class="info-value">${evaluation.studentInfo?.university || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Department:</span>
                    <span class="info-value">${evaluation.studentInfo?.department || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Company:</span>
                    <span class="info-value">${evaluation.studentInfo?.companyName || 'N/A'}</span>
                </div>
            </div>
            <div>
                <div class="info-item">
                    <span class="info-label">Company Adviser:</span>
                    <span class="info-value">${companyAdviser?.name || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">University Adviser:</span>
                    <span class="info-value">${universityAdviser?.name || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Start Date:</span>
                    <span class="info-value">${evaluation.studentInfo?.internshipStartDate ? new Date(evaluation.studentInfo.internshipStartDate).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">End Date:</span>
                    <span class="info-value">${evaluation.studentInfo?.internshipEndDate ? new Date(evaluation.studentInfo.internshipEndDate).toLocaleDateString() : 'N/A'}</span>
                </div>
            </div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">Attendance Summary</div>
        <div class="info-grid">
            <div>
                <div class="info-item">
                    <span class="info-label">Total Weeks:</span>
                    <span class="info-value">${totalWeeks}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Total Absent Days:</span>
                    <span class="info-value">${totalAbsentDays}</span>
                </div>
            </div>
            <div>
                <div class="info-item">
                    <span class="info-label">Attendance Rate:</span>
                    <span class="info-value">${attendancePercentage}%</span>
                </div>
            </div>
        </div>
        
        ${evaluation.attendance?.weeks?.length > 0 ? `
        <table class="attendance-table">
            <thead>
                <tr>
                    <th>Week</th>
                    <th>Monday</th>
                    <th>Tuesday</th>
                    <th>Wednesday</th>
                    <th>Thursday</th>
                    <th>Friday</th>
                    <th>Absent Days</th>
                </tr>
            </thead>
            <tbody>
                ${evaluation.attendance.weeks.map(week => `
                <tr>
                    <td><strong>Week ${week.weekNumber}</strong></td>
                    <td class="${week.monday}">${week.monday?.charAt(0).toUpperCase()}</td>
                    <td class="${week.tuesday}">${week.tuesday?.charAt(0).toUpperCase()}</td>
                    <td class="${week.wednesday}">${week.wednesday?.charAt(0).toUpperCase()}</td>
                    <td class="${week.thursday}">${week.thursday?.charAt(0).toUpperCase()}</td>
                    <td class="${week.friday}">${week.friday?.charAt(0).toUpperCase()}</td>
                    <td>${week.absentDays || 0}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
        ` : '<p>No attendance data recorded.</p>'}
    </div>

    <div class="section">
        <div class="section-title">Evaluation Criteria & Scores</div>
        <table class="criteria-table">
            <thead>
                <tr>
                    <th>Category</th>
                    <th>Weight</th>
                    <th>Score</th>
                    <th>Weighted Score</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong>General Performance</strong><br>
                        <small>Punctuality, Reliability, Independence, Communication, Professionalism</small>
                    </td>
                    <td>25%</td>
                    <td>${generalScore}/25</td>
                    <td>${generalScore}</td>
                </tr>
                <tr>
                    <td><strong>Personal Skills</strong><br>
                        <small>Speed of Work, Accuracy, Engagement, Cooperation, Recommendation</small>
                    </td>
                    <td>25%</td>
                    <td>${personalScore}/25</td>
                    <td>${personalScore}</td>
                </tr>
                <tr>
                    <td><strong>Professional Skills</strong><br>
                        <small>Technical Knowledge, Problem Solving, Organizing, Responsibility, Initiative</small>
                    </td>
                    <td>50%</td>
                    <td>${professionalScore}/50</td>
                    <td>${professionalScore}</td>
                </tr>
                <tr style="background-color: #f3f4f6; font-weight: bold;">
                    <td>TOTAL</td>
                    <td>100%</td>
                    <td>${totalScore}/100</td>
                    <td>${totalScore}</td>
                </tr>
            </tbody>
        </table>
    </div>

    <div class="section">
        <div class="score-summary">
            <h3>Final Result</h3>
            <div class="final-grade">${grade}</div>
            <p><strong>Total Score: ${totalScore}/100</strong></p>
        </div>
    </div>

    <div class="section">
        <div class="section-title">Supervisor's Written Feedback</div>
        
        <div class="comments-section">
            <h4>Major Strengths:</h4>
            <p>${evaluation.comments?.majorStrengths || 'No comments provided.'}</p>
        </div>
        
        <div class="comments-section">
            <h4>Areas of Improvement:</h4>
            <p>${evaluation.comments?.areasOfImprovement || 'No comments provided.'}</p>
        </div>
        
        <div class="comments-section">
            <h4>Final Recommendation:</h4>
            <p><strong>${evaluation.comments?.finalRecommendation || 'N/A'}</strong></p>
        </div>
    </div>

    <div class="signature-section">
        <div>
            <div class="signature-box">
                <strong>Company Adviser</strong><br>
                ${evaluation.signatures?.companyAdviserName || companyAdviser?.name || 'N/A'}<br>
                <small>Signature & Date</small>
            </div>
        </div>
        <div>
            <div class="signature-box">
                <strong>University Adviser</strong><br>
                ${evaluation.signatures?.universityAdviserName || universityAdviser?.name || 'N/A'}<br>
                <small>Signature & Date</small>
            </div>
        </div>
        <div>
            <div class="signature-box">
                <strong>Faculty Head</strong><br>
                ${evaluation.signatures?.facultyHeadName || facultyHead?.name || 'N/A'}<br>
                <small>Signature & Date</small>
            </div>
        </div>
    </div>

    <div style="margin-top: 40px; text-align: center; font-size: 12px; color: #6b7280;">
        <p>Generated on ${new Date().toLocaleDateString()} | Internship Management System</p>
    </div>
</body>
</html>
  `;
};

module.exports = {
  generateFinalEvaluationHTML
};
