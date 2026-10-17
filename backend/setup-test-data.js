const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const InternshipProgress = require('./models/InternshipProgress');

async function setupTestData() {
  try {
    console.log('🔧 Setting up test data for progress tracking...\n');

    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sidama-internship');
    console.log('✅ Connected to database\n');

    // 1. Create Company Adviser
    let companyAdviser = await User.findOne({ role: 'companyAdviser', email: 'company.adviser@sidama.com' });
    if (!companyAdviser) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      companyAdviser = await User.create({
        name: 'John Smith',
        email: 'company.adviser@sidama.com',
        password: hashedPassword,
        role: 'companyAdviser',
        isActive: true,
        isVerified: true,
        company: 'Sidama Innovation and Technology Agency'
      });
      console.log('✅ Created Company Adviser: John Smith');
    } else {
      console.log('✅ Found existing Company Adviser: John Smith');
    }

    // 2. Create University Adviser
    let universityAdviser = await User.findOne({ role: 'universityAdviser', email: 'university.adviser@jimma.edu' });
    if (!universityAdviser) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      universityAdviser = await User.create({
        name: 'Dr. Sarah Johnson',
        email: 'university.adviser@jimma.edu',
        password: hashedPassword,
        role: 'universityAdviser',
        isActive: true,
        isVerified: true,
        university_name: 'Jimma University'
      });
      console.log('✅ Created University Adviser: Dr. Sarah Johnson');
    } else {
      console.log('✅ Found existing University Adviser: Dr. Sarah Johnson');
    }

    // 3. Create Test Student with both advisers assigned
    let testStudent = await User.findOne({ role: 'student', email: 'test.student@jimma.edu' });
    if (!testStudent) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      testStudent = await User.create({
        name: 'Ahmed Mohammed',
        email: 'test.student@jimma.edu',
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
      console.log('✅ Created Test Student: Ahmed Mohammed');
    } else {
      // Update existing student with adviser assignments
      testStudent.companyAdviserId = companyAdviser._id;
      testStudent.universityAdviserId = universityAdviser._id;
      await testStudent.save();
      console.log('✅ Updated existing Test Student: Ahmed Mohammed');
    }

    // 4. Create sample progress data (simulating Company Adviser saving data)
    let existingProgress = await InternshipProgress.findOne({
      studentId: testStudent._id,
      companyAdviserId: companyAdviser._id
    });

    if (!existingProgress) {
      const sampleProgressData = {
        studentId: testStudent._id,
        companyAdviserId: companyAdviser._id,
        studentInfo: {
          name: testStudent.name,
          email: testStudent.email,
          university: testStudent.university_name,
          program: testStudent.groupAssignment?.programName || 'IT Maintenance & Support'
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

      const savedProgress = await InternshipProgress.create(sampleProgressData);
      console.log(`✅ Created sample progress data with ID: ${savedProgress._id}`);
    } else {
      console.log('✅ Found existing progress data');
    }

    // 5. Verify the setup
    console.log('\n🔍 Verifying setup...');
    
    const verifyStudent = await User.findById(testStudent._id)
      .populate('companyAdviserId', 'name email')
      .populate('universityAdviserId', 'name email');
    
    const verifyProgress = await InternshipProgress.findOne({
      studentId: testStudent._id
    });

    console.log('✅ Setup Verification:');
    console.log(`   Student: ${verifyStudent.name}`);
    console.log(`   Company Adviser: ${verifyStudent.companyAdviserId?.name || 'NOT ASSIGNED'}`);
    console.log(`   University Adviser: ${verifyStudent.universityAdviserId?.name || 'NOT ASSIGNED'}`);
    console.log(`   Progress Data: ${verifyProgress ? 'EXISTS' : 'MISSING'}`);
    
    if (verifyProgress) {
      console.log(`   Tasks: ${verifyProgress.tasks?.length || 0}`);
      console.log(`   Reports: ${verifyProgress.reports?.length || 0}`);
      console.log(`   Attendance: ${verifyProgress.attendanceData?.percentage || 0}%`);
    }

    console.log('\n🎉 Test data setup completed successfully!');
    console.log('\n📋 Test Credentials:');
    console.log('   Company Adviser: company.adviser@sidama.com / password123');
    console.log('   University Adviser: university.adviser@jimma.edu / password123');
    console.log('   Student: test.student@jimma.edu / password123');

  } catch (error) {
    console.error('❌ Setup failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

setupTestData();
