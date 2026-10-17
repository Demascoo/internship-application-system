const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function debugStudentStructure() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sidama-internship');
    console.log('=== INVESTIGATING STUDENT DATA STRUCTURE ===');
    
    const student = await User.findById('68b1502f073875e0d260c357');
    
    console.log('\n📋 Student companyAdviserId field analysis:');
    console.log('Type:', typeof student.companyAdviserId);
    console.log('Value:', student.companyAdviserId);
    console.log('Is ObjectId?', mongoose.Types.ObjectId.isValid(student.companyAdviserId));
    
    if (student.companyAdviserId && typeof student.companyAdviserId === 'object') {
      console.log('\n🔍 Nested object detected:');
      console.log('Object keys:', Object.keys(student.companyAdviserId));
      if (student.companyAdviserId._id) {
        console.log('_id field:', student.companyAdviserId._id);
        console.log('_id type:', typeof student.companyAdviserId._id);
      }
      if (student.companyAdviserId.name) {
        console.log('name field:', student.companyAdviserId.name);
      }
      if (student.companyAdviserId.email) {
        console.log('email field:', student.companyAdviserId.email);
      }
    }
    
    // Test toString() behavior
    console.log('\n🧪 toString() test:');
    console.log('student.companyAdviserId.toString():', student.companyAdviserId?.toString());
    
    // Check what we expect vs what we get
    const expectedId = '68b15166073875e0d260c445';
    console.log('\n⚖️ Comparison test:');
    console.log('Expected ID:', expectedId);
    console.log('Actual toString():', student.companyAdviserId?.toString());
    console.log('Match:', student.companyAdviserId?.toString() === expectedId);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

debugStudentStructure();
