const axios = require('axios');

async function testAPIWithAuth() {
  try {
    console.log('Testing API with authentication...');
    
    // First, try to login
    const loginResponse = await axios.post('http://localhost:3000/auth/login', {
      username: 'superadmin', // or whatever your admin username is
      password: 'Turbo@2025'  // or whatever your admin password is
    });
    
    console.log('Login response:', loginResponse.data);
    
    if (loginResponse.data.success) {
      const token = loginResponse.data.data.token;
      console.log('Got token:', token.substring(0, 20) + '...');
      
      // Test platform mappings endpoint
      const mappingsResponse = await axios.get('http://localhost:3000/api/admin/platform-mappings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Platform mappings:', mappingsResponse.data);
      
      // Test connection for first mapping
      if (mappingsResponse.data.data && mappingsResponse.data.data.length > 0) {
        const firstMapping = mappingsResponse.data.data[0];
        console.log('Testing connection for mapping:', firstMapping.id);
        
        const testResponse = await axios.post(
          `http://localhost:3000/api/admin/platform-mappings/${firstMapping.id}/test-connection`,
          {},
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log('Test connection response:', JSON.stringify(testResponse.data, null, 2));
      }
    }
    
  } catch (error) {
    console.error('API test failed:', error.response?.data || error.message);
  }
}

testAPIWithAuth();
