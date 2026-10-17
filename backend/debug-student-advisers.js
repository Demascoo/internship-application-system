const mongoose = require('mongoose');
const User = require('./models/User');

async function debugStudentAdviserAssignments() {
  try {
    console.log('🔍 Debugging Student-Adviser Assignments...\n');

    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sidama-internship');
    console.log('✅ Connected to database\n');

    // Check all students
    const allStudents = await User.find({ role: 'student' })
      .populate('companyAdviserId', 'name email role')
      .populate('universityAdviserId', 'name email role');

    console.log(`📊 Total students: ${allStudents.length}\n`);

    if (allStudents.length === 0) {
      console.log('❌ No students found in database');
      return;
    }

    // Analyze student assignments
    let studentsWithCompany = 0;
    let studentsWithUniversity = 0;
    let studentsWithBoth = 0;
    let studentsWithNeither = 0;

    console.log('📋 Student Assignment Analysis:');
    console.log('=' .repeat(80));

    allStudents.forEach((student, index) => {
      const hasCompany = !!student.companyAdviserId;
      const hasUniversity = !!student.universityAdviserId;

      console.log(`${index + 1}. ${student.name} (${student.email})`);
      console.log(`   Company Adviser: ${hasCompany ? student.companyAdviserId.name : 'NOT ASSIGNED'}`);
      console.log(`   University Adviser: ${hasUniversity ? student.universityAdviserId.name : 'NOT ASSIGNED'}`);
      console.log(`   Status: ${hasCompany && hasUniversity ? '✅ BOTH ASSIGNED' : 
                                hasCompany ? '⚠️  COMPANY ONLY' : 
                                hasUniversity ? '⚠️  UNIVERSITY ONLY' : '❌ NONE ASSIGNED'}`);
      console.log('');

      if (hasCompany) studentsWithCompany++;
      if (hasUniversity) studentsWithUniversity++;
      if (hasCompany && hasUniversity) studentsWithBoth++;
      if (!hasCompany && !hasUniversity) studentsWithNeither++;
    });

    console.log('📊 Summary:');
    console.log(`   Students with Company Adviser: ${studentsWithCompany}`);
    console.log(`   Students with University Adviser: ${studentsWithUniversity}`);
    console.log(`   Students with BOTH advisers: ${studentsWithBoth}`);
    console.log(`   Students with NO advisers: ${studentsWithNeither}\n`);

    // Check advisers
    const companyAdvisers = await User.find({ role: 'companyAdviser' });
    const universityAdvisers = await User.find({ role: 'universityAdviser' });

    console.log('👥 Available Advisers:');
    console.log(`   Company Advisers: ${companyAdvisers.length}`);
    companyAdvisers.forEach((adviser, index) => {
      console.log(`     ${index + 1}. ${adviser.name} (${adviser.email})`);
    });

    console.log(`   University Advisers: ${universityAdvisers.length}`);
    universityAdvisers.forEach((adviser, index) => {
      console.log(`     ${index + 1}. ${adviser.name} (${adviser.email})`);
    });

    // If we have students and advisers but no assignments, suggest fix
    if (allStudents.length > 0 && companyAdvisers.length > 0 && universityAdvisers.length > 0 && studentsWithBoth === 0) {
      console.log('\n🔧 SUGGESTED FIX: Assign advisers to students');
      console.log('   Run the assignment fix script to establish relationships');
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

debugStudentAdviserAssignments();
