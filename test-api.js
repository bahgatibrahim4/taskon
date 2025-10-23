// تجربة API endpoint
const http = require('http');

function testExtractOperations() {
  const data = JSON.stringify({
    extractId: 'temp',
    contractorId: 'test',
    action: 'test',
    details: 'test operation',
    user: 'test user'
  });

  const options = {
    hostname: 'localhost',
    port: 4000,
    path: '/extract-operations',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  };

  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers: ${JSON.stringify(res.headers)}`);
    
    let responseData = '';
    res.on('data', (chunk) => {
      responseData += chunk;
    });
    
    res.on('end', () => {
      console.log('✅ استجابة:', responseData);
    });
  });

  req.on('error', (e) => {
    console.error(`❌ خطأ: ${e.message}`);
  });

  req.write(data);
  req.end();
}

testExtractOperations();