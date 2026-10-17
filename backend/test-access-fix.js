const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function testAccessFix() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sidama-internship');
    console.log('=== TESTING ACCESS FIX ===');
    
    const studentId = '68b1502f073875e0d260c357';
    const adviserId = '68b15166073875e0d260c445';
    
    // Get student data
    const student = await User.findById(studentId);
    
    console.log('\n📋 Current student data:');
    console.log('Student name:', student.name);
    console.log('companyAdviserId raw:', student.companyAdviserId);
    console.log('companyAdviserId type:', typeof student.companyAdviserId);
    
    // Simulate the fixed access check logic
    let studentCompanyAdviserId;
    
    if (student.companyAdviserId) {
      if (student.companyAdviserId._id) {
        // Case: nested object with _id field
        studentCompanyAdviserId = student.companyAdviserId._id.toString();
        console.log('✅ Detected nested object, extracted _id');
      } else {
        // Case: direct ObjectId reference
        studentCompanyAdviserId = student.companyAdviserId.toString();
        console.log('✅ Detected direct ObjectId');
      }
    }
    
    const requestingAdviserId = adviserId.toString();
    
    console.log('\n🔍 Access Check Simulation:');
    console.log('Student companyAdviserId (extracted):', studentCompanyAdviserId);
    console.log('Requesting adviserId:', requestingAdviserId);
    console.log('Match:', studentCompanyAdviserId === requestingAdviserId);
    
    if (studentCompanyAdviserId === requestingAdviserId) {
      console.log('✅ ACCESS WOULD BE GRANTED');
    } else {
      console.log('❌ ACCESS WOULD BE DENIED');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

testAccessFix();
