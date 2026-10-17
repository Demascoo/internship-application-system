const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const InternshipProgress = require('./models/InternshipProgress');

async function fixStudentData() {
  try {
    console.log('🔧 Fixing student data for frontend compatibility...\n');

    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sidama-internship');
    console.log('✅ Connected to database\n');

    const frontendStudentId = '68b1502f073875e0d260c357';
    
    // Check if this student exists
    let frontendStudent = await User.findById(frontendStudentId);
    
    if (!frontendStudent) {
      console.log(`❌ Student ${frontendStudentId} not found, creating it...`);
      
      // Get our advisers
      const companyAdviser = await User.findOne({ role: 'companyAdviser', email: 'company.adviser@sidama.com' });
      const universityAdviser = await User.findOne({ role: 'universityAdviser', email: 'university.adviser@jimma.edu' });
      
      if (!companyAdviser || !universityAdviser) {
        console.log('❌ Advisers not found, run setup-test-data.js first');
        return;
      }

      // Create the student with the exact ID the frontend is looking for
      const hashedPassword = await bcrypt.hash('password123', 10);
      frontendStudent = new User({
        _id: new mongoose.Types.ObjectId(frontendStudentId),
        name: 'Ahmed Mohammed',
        email: 'ahmed.mohammed@jimma.edu',
        password: hashedPassword,
        role: 'student',
        isActive: true,
        isVerified: true,
        university_name: 'Jimma University',
        companyAdviserId: companyAdviser._id,
        universityAdviserId: universityAdviser._id,
        groupAssignment: {
          programName: 'IT Maintenance & Support'
        },
        profile: {
          university: 'Jimma University',
          course: 'Computer Science',
          phone: '+251911234567',
          address: 'Jimma, Ethiopia'
        }
      });
      
      await frontendStudent.save();
      console.log('✅ Created student with frontend ID');
    } else {
      console.log('✅ Frontend student exists, updating adviser assignments...');
      
      // Get our advisers
      const companyAdviser = await User.findOne({ role: 'companyAdviser', email: 'company.adviser@sidama.com' });
      const universityAdviser = await User.findOne({ role: 'universityAdviser', email: 'university.adviser@jimma.edu' });
      
      frontendStudent.companyAdviserId = companyAdviser._id;
      frontendStudent.universityAdviserId = universityAdviser._id;
      await frontendStudent.save();
      console.log('✅ Updated adviser assignments');
    }

    // Create progress data for this student
    const existingProgress = await InternshipProgress.findOne({
      studentId: frontendStudentId
    });

    if (!existingProgress) {
      console.log('📝 Creating progress data for frontend student...');
      
      const companyAdviser = await User.findOne({ role: 'companyAdviser', email: 'company.adviser@sidama.com' });
      
      const progressData = {
        studentId: frontendStudentId,
        companyAdviserId: companyAdviser._id,
        studentInfo: {
          name: frontendStudent.name,
          email: frontendStudent.email,
          university: frontendStudent.university_name,
          program: frontendStudent.groupAssignment?.programName || 'IT Maintenance & Support'
        },
        internshipDetails: {
          company: 'Sidama Innovation and Technology Agency',
          position: 'Software Development Intern',
          supervisor: companyAdviser.name,
          supervisorEmail: companyAdviser.email,
          startDate: '2024-06-01',
          endDate: '2024-08-30',
          duration: '3 months',
          location: 'Hawassa, Ethiopia'
        },
        tasks: [
          {
            id: 1,
            title: 'Setup Development Environment',
            description: 'Install and configure development tools including VS Code, Node.js, and Git',
            assignedDate: '2024-06-01',
            dueDate: '2024-06-03',
            status: 'completed',
            completedDate: '2024-06-02',
            supervisorRemarks: 'Completed ahead of schedule with excellent setup documentation'
          },
          {
            id: 2,
            title: 'Learn React Framework',
            description: 'Complete React tutorial and build a sample todo application',
            assignedDate: '2024-06-03',
            dueDate: '2024-06-10',
            status: 'in_progress',
            supervisorRemarks: 'Good progress, showing strong understanding of components'
          },
          {
            id: 3,
            title: 'Database Integration',
            description: 'Learn MongoDB and integrate with React application',
            assignedDate: '2024-06-10',
            dueDate: '2024-06-17',
            status: 'pending',
            supervisorRemarks: ''
          }
        ],
        reports: [
          {
            id: 1,
            title: 'Week 1 Progress Report',
            description: 'Summary of first week activities and learning outcomes',
            submittedDate: '2024-06-07',
            status: 'approved',
            grade: 'A',
            supervisorFeedback: 'Excellent work with clear documentation and good reflection on learning'
          },
          {
            id: 2,
            title: 'Week 2 Progress Report',
            description: 'React learning progress and project development',
            submittedDate: '2024-06-14',
            status: 'under_review',
            grade: 'B+',
            supervisorFeedback: 'Good progress, could improve on code organization'
          }
        ],
        attendanceData: {
          percentage: 95,
          presentDays: 19,
          absentDays: 1,
          lateDays: 0,
          totalDays: 20,
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
            title: 'Complete Onboarding Process',
            description: 'Finish all company onboarding requirements and orientation',
            targetDate: '2024-06-05',
            status: 'completed',
            completedDate: '2024-06-04'
          },
          {
            id: 2,
            title: 'First Project Milestone',
            description: 'Complete basic React application with CRUD operations',
            targetDate: '2024-06-20',
            status: 'in_progress',
            completedDate: ''
          }
        ],
        evaluations: {
          midterm: {
            id: 1,
            type: 'midterm',
            evaluatedBy: companyAdviser.name,
            evaluationDate: '2024-07-15',
            status: 'completed',
            performance: {
              punctuality: 5,
              communication: 4,
              teamwork: 4,
              problemSolving: 4,
              initiative: 5,
              reliability: 5
            },
            skills: {
              technicalSkills: 4,
              adaptability: 5,
              timeManagement: 3,
              attentionToDetail: 4,
              leadership: 3,
              creativity: 4
            },
            overallScore: 4.2,
            strengths: 'Quick learner, excellent communication skills, shows great initiative',
            improvements: 'Could improve time management and attention to detail',
            supervisorComments: 'Ahmed is an excellent intern with great potential. Shows strong technical aptitude and willingness to learn.',
            adviserRemarks: 'Recommended for advanced projects',
            adviserStatus: 'approved'
          },
          final: {
            id: 2,
            type: 'final',
            evaluatedBy: companyAdviser.name,
            status: 'not_started',
            performance: {
              punctuality: 0,
              communication: 0,
              teamwork: 0,
              problemSolving: 0,
              initiative: 0,
              reliability: 0
            },
            skills: {
              technicalSkills: 0,
              adaptability: 0,
              timeManagement: 0,
              attentionToDetail: 0,
              leadership: 0,
              creativity: 0
            },
            overallScore: 0,
            strengths: '',
            improvements: '',
            supervisorComments: '',
            adviserRemarks: '',
            adviserStatus: 'not_started'
          }
        },
        lastUpdated: new Date(),
        createdAt: new Date()
      };

      await InternshipProgress.create(progressData);
      console.log('✅ Created progress data for frontend student');
    } else {
      console.log('✅ Progress data already exists for frontend student');
    }

    console.log('\n🎉 Student data fix completed!');

  } catch (error) {
    console.error('❌ Fix failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

fixStudentData();
