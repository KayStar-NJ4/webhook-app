const axios = require('axios');

async function testConnection() {
  try {
    console.log('Testing connection to server...');
    
    // Test health endpoint
    const healthResponse = await axios.get('http://localhost:3000/health');
    console.log('Health check:', healthResponse.data);
    
    // Test platform mappings endpoint (without auth for now)
    try {
      const mappingsResponse = await axios.get('http://localhost:3000/api/admin/platform-mappings');
      console.log('Platform mappings:', mappingsResponse.data);
    } catch (error) {
      console.log('Platform mappings error (expected - no auth):', error.response?.status, error.response?.data);
    }
    
  } catch (error) {
    console.error('Connection test failed:', error.message);
  }
}

testConnection();
