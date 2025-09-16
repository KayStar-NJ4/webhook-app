const axios = require('axios');

async function testChatwootWithFullHeaders() {
  try {
    console.log('Testing Chatwoot with full headers...');
    
    const baseUrl = 'https://chatwoot.turbo.vn';
    const accountId = 1;
    
    // Headers from browser request
    const headers = {
      'access-token': 'fsAasUTFZpJBWS7C-gFGYw',
      'client': 'ucC86ODq5-izqrwaa54EBw',
      'uid': 'thuanpt.work@gmail.com',
      'authorization': 'Bearer eyJhY2Nlc3MtdG9rZW4iOiJmc0Fhc1VURlpwSkJXUzdDLWdGR1l3IiwidG9rZW4tdHlwZSI6IkJlYXJlciIsImNsaWVudCI6InVjQzg2T0RxNS1penFyd2FhNTRFQnciLCJleHBpcnkiOiIxNzYyNzgyMjExIiwidWlkIjoidGh1YW5wdC53b3JrQGdtYWlsLmNvbSJ9',
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/plain, */*',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    };
    
    console.log('Testing with headers:', {
      'access-token': headers['access-token'],
      'client': headers.client,
      'uid': headers.uid,
      'authorization': headers.authorization.substring(0, 50) + '...'
    });
    
    const response = await axios.get(`${baseUrl}/api/v1/accounts/${accountId}`, {
      headers,
      timeout: 10000
    });
    
    console.log('✅ Success!');
    console.log('Response:', response.data);
    
  } catch (error) {
    console.log('❌ Failed:', error.response?.status, error.response?.data);
  }
}

testChatwootWithFullHeaders();
