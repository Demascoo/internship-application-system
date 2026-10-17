const mongoose = require('mongoose');
const User = require('./models/User');
const InternshipProgress = require('./models/InternshipProgress');

async function testAPIEndpoint() {
  try {
    console.log('🔍 Testing API endpoint with actual student ID...\n');

    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sidama-internship');
    console.log('✅ Connected to database\n');

    // Find the student ID being used in the frontend
    const frontendStudentId = '68b1502f073875e0d260c357';
    console.log(`🔍 Checking student ID from frontend: ${frontendStudentId}`);

    const frontendStudent = await User.findById(frontendStudentId);
    if (frontendStudent) {
      console.log(`✅ Found frontend student: ${frontendStudent.name}`);
      console.log(`   Company Adviser: ${frontendStudent.companyAdviserId || 'NOT ASSIGNED'}`);
      console.log(`   University Adviser: ${frontendStudent.universityAdviserId || 'NOT ASSIGNED'}`);
    } else {
      console.log(`❌ Student with ID ${frontendStudentId} not found`);
    }

    // Check our test student
    const testStudent = await User.findOne({ email: 'test.student@jimma.edu' });
    if (testStudent) {
      console.log(`\n✅ Our test student: ${testStudent.name}`);
      console.log(`   ID: ${testStudent._id}`);
      console.log(`   Company Adviser: ${testStudent.companyAdviserId || 'NOT ASSIGNED'}`);
      console.log(`   University Adviser: ${testStudent.universityAdviserId || 'NOT ASSIGNED'}`);
    }

    // Check progress data for both students
    console.log('\n🔍 Checking progress data...');
    
    const frontendProgress = await InternshipProgress.findOne({ studentId: frontendStudentId });
    console.log(`Frontend student progress: ${frontendProgress ? 'EXISTS' : 'MISSING'}`);
    
    const testProgress = await InternshipProgress.findOne({ studentId: testStudent?._id });
    console.log(`Test student progress: ${testProgress ? 'EXISTS' : 'MISSING'}`);

    // List all students and their progress data
    console.log('\n📊 All students in database:');
    const allStudents = await User.find({ role: 'student' });
    for (const student of allStudents) {
      const progress = await InternshipProgress.findOne({ studentId: student._id });
      console.log(`   ${student.name} (${student._id}): ${progress ? 'HAS PROGRESS' : 'NO PROGRESS'}`);
    }

    // Test the actual API query logic
    console.log('\n🔍 Testing API query logic...');
    
    // Simulate the backend controller query for the frontend student
    if (frontendStudent) {
      console.log(`\nTesting query for frontend student: ${frontendStudentId}`);
      
      // Primary query (with companyAdviserId)
      const primaryQuery = await InternshipProgress.findOne({
        studentId: frontendStudentId,
        companyAdviserId: frontendStudent.companyAdviserId
      });
      console.log(`Primary query result: ${primaryQuery ? 'FOUND' : 'NOT FOUND'}`);
      
      // Fallback query (studentId only)
      const fallbackQuery = await InternshipProgress.findOne({
        studentId: frontendStudentId
      });
      console.log(`Fallback query result: ${fallbackQuery ? 'FOUND' : 'NOT FOUND'}`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

testAPIEndpoint();
