const mongoose = require('mongoose');
const User = require('./models/User');
const AdviserLink = require('./models/AdviserLink');
require('dotenv').config();

async function fixCompanyAdviserLinkage() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sidama-internship');
    console.log('✅ Connected to database\n');

    const studentId = '68b1502f073875e0d260c357';
    const companyAdviserId = '68b15166073875e0d260c445'; // sorec@gmail.com

    console.log('🔍 Current situation:');
    console.log(`   Student ID: ${studentId}`);
    console.log(`   Company Adviser ID: ${companyAdviserId}`);

    // Check if student exists
    const student = await User.findById(studentId);
    if (!student) {
      console.log('❌ Student not found');
      return;
    }

    // Check if company adviser exists
    const companyAdviser = await User.findById(companyAdviserId);
    if (!companyAdviser) {
      console.log('❌ Company Adviser not found');
      return;
    }

    console.log(`\n📋 Student: ${student.name} (${student.email})`);
    console.log(`📋 Company Adviser: ${companyAdviser.name} (${companyAdviser.email})`);
    console.log(`📋 Current student.companyAdviserId: ${student.companyAdviserId}`);

    // Fix 1: Update student's companyAdviserId field
    if (!student.companyAdviserId || student.companyAdviserId.toString() !== companyAdviserId) {
      console.log('\n🔧 Fixing student.companyAdviserId...');
      await User.findByIdAndUpdate(studentId, {
        companyAdviserId: companyAdviserId
      });
      console.log('✅ Updated student.companyAdviserId');
    } else {
      console.log('✅ student.companyAdviserId already correct');
    }

    // Fix 2: Create/Update AdviserLink record
    console.log('\n🔧 Checking AdviserLink record...');
    let adviserLink = await AdviserLink.findOne({ studentId: studentId });
    
    if (!adviserLink) {
      console.log('Creating new AdviserLink record...');
      adviserLink = new AdviserLink({
        studentId: studentId,
        companyAdviserId: companyAdviserId,
        universityAdviserId: student.universityAdviserId,
        programId: student.groupAssignment?.programId || companyAdviser.linkedProgramId,
        createdBy: companyAdviserId,
        createdAt: new Date()
      });
      await adviserLink.save();
      console.log('✅ Created AdviserLink record');
    } else {
      console.log('Updating existing AdviserLink record...');
      adviserLink.companyAdviserId = companyAdviserId;
      if (!adviserLink.programId && companyAdviser.linkedProgramId) {
        adviserLink.programId = companyAdviser.linkedProgramId;
      }
      await adviserLink.save();
      console.log('✅ Updated AdviserLink record');
    }

    // Verify the fix
    console.log('\n🔍 Verification:');
    const updatedStudent = await User.findById(studentId);
    const finalAdviserLink = await AdviserLink.findOne({ studentId: studentId });
    
    console.log(`   Updated student.companyAdviserId: ${updatedStudent.companyAdviserId}`);
    console.log(`   AdviserLink.companyAdviserId: ${finalAdviserLink?.companyAdviserId}`);
    console.log(`   Match: ${updatedStudent.companyAdviserId?.toString() === companyAdviserId}`);

    console.log('\n✅ Company Adviser linkage fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

fixCompanyAdviserLinkage();
