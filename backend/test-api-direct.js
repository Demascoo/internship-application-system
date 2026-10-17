const axios = require('axios');
const mongoose = require('mongoose');
const User = require('./models/User');

async function testAPIDirectly() {
  try {
    console.log('🔍 Testing API endpoint directly...\n');

    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sidama-internship');
    console.log('✅ Connected to database\n');

    const frontendStudentId = '68b1502f073875e0d260c357';
    
    // Get University Adviser for authentication
    const universityAdviser = await User.findOne({ 
      role: 'universityAdviser', 
      email: 'university.adviser@jimma.edu' 
    });

    if (!universityAdviser) {
      console.log('❌ University Adviser not found');
      return;
    }

    console.log(`✅ Found University Adviser: ${universityAdviser.name}`);
    console.log(`   ID: ${universityAdviser._id}`);

    // Test API endpoint directly
    console.log(`\n🔍 Testing GET /api/progress/${frontendStudentId}`);
    
    try {
      const response = await axios.get(`http://localhost:5000/api/progress/${frontendStudentId}`, {
        headers: {
          'Authorization': `Bearer fake-token-for-${universityAdviser._id}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ API Response Status:', response.status);
      console.log('✅ API Response Data:', JSON.stringify(response.data, null, 2));

    } catch (apiError) {
      console.error('❌ API Error:', apiError.response?.status, apiError.response?.data || apiError.message);
      
      if (apiError.response?.status === 401) {
        console.log('🔍 Authentication issue - this is expected in direct test');
      }
    }

    // Test without authentication to see if server is running
    console.log('\n🔍 Testing server connectivity...');
    try {
      const healthCheck = await axios.get('http://localhost:5000/api/health', {
        timeout: 5000
      });
      console.log('✅ Server is running');
    } catch (healthError) {
      console.error('❌ Server not responding:', healthError.message);
      console.log('💡 Make sure backend server is running on port 5000');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

testAPIDirectly();
