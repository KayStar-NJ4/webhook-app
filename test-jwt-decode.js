const jwt = require('jsonwebtoken');

const token = 'eyJhY2Nlc3MtdG9rZW4iOiJmc0Fhc1VURlpwSkJXUzdDLWdGR1l3IiwidG9rZW4tdHlwZSI6IkJlYXJlciIsImNsaWVudCI6InVjQzg2T0RxNS1penFyd2FhNTRFQnciLCJleHBpcnkiOiIxNzYyNzgyMjExIiwidWlkIjoidGh1YW5wdC53b3JrQGdtYWlsLmNvbSJ9';

console.log('JWT Token:', token);
console.log('Token length:', token.length);

try {
  const decoded = jwt.decode(token);
  console.log('Decoded JWT:', JSON.stringify(decoded, null, 2));
  
  if (decoded && decoded['access-token']) {
    console.log('Access token found:', decoded['access-token']);
    console.log('Client:', decoded.client);
    console.log('UID:', decoded.uid);
  } else {
    console.log('No access-token found in JWT payload');
  }
} catch (error) {
  console.error('JWT decode error:', error.message);
}
