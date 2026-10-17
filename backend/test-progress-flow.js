const mongoose = require('mongoose');
const User = require('./models/User');
const InternshipProgress = require('./models/InternshipProgress');

// Test script to verify progress data flow between Company Adviser and University Adviser
async function testProgressDataFlow() {
  try {
    console.log('🔍 Testing Progress Data Flow...\n');

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sidama-internship');
    console.log('✅ Connected to database');

    // 1. Find a student with both Company Adviser and University Adviser
    const studentWithAdvisers = await User.findOne({
      role: 'student',
      companyAdviserId: { $exists: true, $ne: null },
      universityAdviserId: { $exists: true, $ne: null }
    }).populate('companyAdviserId universityAdviserId');

    if (!studentWithAdvisers) {
      console.log('❌ No student found with both Company and University Advisers');
      
      // Find students with advisers for debugging
      const studentsWithCompany = await User.countDocuments({
        role: 'student',
        companyAdviserId: { $exists: true, $ne: null }
      });
      const studentsWithUniversity = await User.countDocuments({
        role: 'student',
        universityAdviserId: { $exists: true, $ne: null }
      });
      
      console.log(`📊 Students with Company Adviser: ${studentsWithCompany}`);
      console.log(`📊 Students with University Adviser: ${studentsWithUniversity}`);
      
      process.exit(1);
    }

    console.log(`✅ Found test student: ${studentWithAdvisers.name}`);
    console.log(`   - Company Adviser: ${studentWithAdvisers.companyAdviserId.name}`);
    console.log(`   - University Adviser: ${studentWithAdvisers.universityAdviserId.name}\n`);

    // 2. Check existing progress data
    const existingProgress = await InternshipProgress.findOne({
      studentId: studentWithAdvisers._id
    });

    if (existingProgress) {
      console.log('✅ Found existing progress data:');
      console.log(`   - Progress ID: ${existingProgress._id}`);
      console.log(`   - Company Adviser ID: ${existingProgress.companyAdviserId}`);
      console.log(`   - Last Updated: ${existingProgress.lastUpdated}`);
      console.log(`   - Tasks: ${existingProgress.tasks?.length || 0}`);
      console.log(`   - Reports: ${existingProgress.reports?.length || 0}`);
      console.log(`   - Attendance %: ${existingProgress.attendanceData?.percentage || 0}%\n`);
    } else {
      console.log('❌ No existing progress data found\n');
      
      // 3. Create sample progress data (simulating Company Adviser saving data)
      console.log('📝 Creating sample progress data...');
      
      const sampleProgressData = {
        studentId: studentWithAdvisers._id,
        companyAdviserId: studentWithAdvisers.companyAdviserId._id,
        studentInfo: {
          name: studentWithAdvisers.name,
          email: studentWithAdvisers.email,
          university: studentWithAdvisers.university_name || 'Test University',
          program: studentWithAdvisers.groupAssignment?.programId?.name || 'Test Program'
        },
        internshipDetails: {
          company: 'Sidama Innovation and Technology Agency',
          position: 'Software Development Intern',
          supervisor: studentWithAdvisers.companyAdviserId.name,
          supervisorEmail: studentWithAdvisers.companyAdviserId.email,
          startDate: '2024-06-01',
          endDate: '2024-08-30',
          duration: '3 months',
          location: 'Hawassa, Ethiopia'
        },
        tasks: [
          {
            id: 1,
            title: 'Setup Development Environment',
            description: 'Install and configure development tools',
            assignedDate: '2024-06-01',
            dueDate: '2024-06-03',
            status: 'completed',
            completedDate: '2024-06-02',
            supervisorRemarks: 'Completed ahead of schedule'
          },
          {
            id: 2,
            title: 'Learn React Framework',
            description: 'Complete React tutorial and build sample project',
            assignedDate: '2024-06-03',
            dueDate: '2024-06-10',
            status: 'in_progress',
            supervisorRemarks: 'Good progress so far'
          }
        ],
        reports: [
          {
            id: 1,
            title: 'Week 1 Progress Report',
            description: 'Summary of first week activities',
            submittedDate: '2024-06-07',
            status: 'approved',
            grade: 'A',
            supervisorFeedback: 'Excellent work and clear documentation'
          }
        ],
        attendanceData: {
          percentage: 95,
          presentDays: 19,
          absentDays: 1,
          lateDays: 0,
          monthlyBreakdown: [
            {
              month: 'June 2024',
              present: 19,
              absent: 1,
              late: 0,
              total: 20
            }
          ]
        },
        milestones: [
          {
            id: 1,
            title: 'Complete Onboarding',
            description: 'Finish all onboarding requirements',
            targetDate: '2024-06-05',
            completed: true,
            completedDate: '2024-06-04'
          }
        ],
        evaluations: {
          midterm: {
            id: 1,
            type: 'midterm',
            evaluatedBy: studentWithAdvisers.companyAdviserId.name,
            evaluationDate: '2024-07-15',
            status: 'completed',
            scores: {
              technicalSkills: 4,
              communication: 5,
              teamwork: 4,
              problemSolving: 4,
              initiative: 5,
              overall: 4
            },
            strengths: ['Quick learner', 'Good communication'],
            improvements: ['Time management'],
            supervisorComments: 'Excellent intern with great potential'
          },
          final: {
            id: 2,
            type: 'final',
            evaluatedBy: studentWithAdvisers.companyAdviserId.name,
            status: 'not_started'
          }
        }
      };

      const savedProgress = await InternshipProgress.create(sampleProgressData);
      console.log(`✅ Created sample progress data with ID: ${savedProgress._id}\n`);
    }

    // 4. Test University Adviser access
    console.log('🔍 Testing University Adviser access...');
    
    const progressForUniversityAdviser = await InternshipProgress.findOne({
      studentId: studentWithAdvisers._id,
      companyAdviserId: studentWithAdvisers.companyAdviserId._id
    });

    if (progressForUniversityAdviser) {
      console.log('✅ University Adviser can access progress data:');
      console.log(`   - Student: ${progressForUniversityAdviser.studentInfo?.name}`);
      console.log(`   - Company: ${progressForUniversityAdviser.internshipDetails?.company}`);
      console.log(`   - Tasks: ${progressForUniversityAdviser.tasks?.length || 0}`);
      console.log(`   - Reports: ${progressForUniversityAdviser.reports?.length || 0}`);
      console.log(`   - Attendance: ${progressForUniversityAdviser.attendanceData?.percentage || 0}%`);
      
      // Test alternative query (without companyAdviserId constraint)
      const alternativeQuery = await InternshipProgress.findOne({
        studentId: studentWithAdvisers._id
      });
      
      if (alternativeQuery) {
        console.log('✅ Alternative query also works (studentId only)');
      }
      
    } else {
      console.log('❌ University Adviser cannot access progress data');
      
      // Debug: Check what progress data exists
      const allProgress = await InternshipProgress.find({});
      console.log(`📊 Total progress records in database: ${allProgress.length}`);
      
      if (allProgress.length > 0) {
        console.log('📊 Existing progress records:');
        allProgress.forEach((progress, index) => {
          console.log(`   ${index + 1}. Student: ${progress.studentId}, Company: ${progress.companyAdviserId}`);
        });
      }
    }

    console.log('\n🎉 Progress data flow test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  }
}

// Run the test
testProgressDataFlow();
