const mongoose = require('mongoose');
const InternshipProgress = require('./models/InternshipProgress');
require('dotenv').config();

async function testStatusValidation() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sidama-internship');
    console.log('=== TESTING STATUS VALIDATION ===');
    
    const testData = {
      studentId: '68b1502f073875e0d260c357',
      companyAdviserId: '68b15166073875e0d260c445',
      tasks: [
        {
          id: 1,
          title: 'Test Task',
          description: 'Testing task status',
          assignedDate: '2024-01-01',
          dueDate: '2024-01-15',
          status: 'in_progress', // This should work now
          priority: 'medium'
        }
      ],
      reports: [
        {
          id: 1,
          title: 'Test Report',
          description: 'Testing report status',
          submittedDate: '2024-01-01',
          status: 'submitted' // This should work now
        }
      ]
    };
    
    console.log('📊 Testing task status: "in_progress"');
    console.log('📊 Testing report status: "submitted"');
    
    // Test validation by creating a new document
    const testProgress = new InternshipProgress(testData);
    
    try {
      await testProgress.validate();
      console.log('✅ Validation passed for both statuses');
    } catch (validationError) {
      console.error('❌ Validation failed:', validationError.message);
      console.error('❌ Validation errors:', validationError.errors);
    }
    
    // Test saving to database
    try {
      await testProgress.save();
      console.log('✅ Successfully saved test data with both statuses');
      
      // Clean up test data
      await InternshipProgress.deleteOne({ _id: testProgress._id });
      console.log('✅ Cleaned up test data');
      
    } catch (saveError) {
      console.error('❌ Save failed:', saveError.message);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

testStatusValidation();
