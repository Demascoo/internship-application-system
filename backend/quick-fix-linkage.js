const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function quickFix() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sidama-internship');
    
    // Update student to have companyAdviserId
    await User.findByIdAndUpdate('68b1502f073875e0d260c357', {
      companyAdviserId: '68b15166073875e0d260c445'
    });
    
    console.log('✅ Fixed student-company adviser linkage');
    
    // Verify
    const student = await User.findById('68b1502f073875e0d260c357');
    console.log('Student companyAdviserId:', student.companyAdviserId?.toString());
    console.log('Expected:', '68b15166073875e0d260c445');
    console.log('Match:', student.companyAdviserId?.toString() === '68b15166073875e0d260c445');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

quickFix();
