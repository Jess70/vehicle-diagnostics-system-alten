const http = require('http');

const options = {
  host: 'localhost',
  port: process.env.PORT || 3000,
  timeout: 5000,
  path: '/api/health'
};

const healthCheck = http.request(options, (res) => {
  console.log(`Health check - STATUS: ${res.statusCode}`);
  
  let data = '';
  res.on('data', chunk => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode === 200) {
      try {
        const healthData = JSON.parse(data);
        console.log(`Health check passed - Status: ${healthData.status}`);
        process.exit(0);
      } catch (parseError) {
        console.log('Health check passed but response not JSON');
        process.exit(0);
      }
    } else {
      console.error(`Health check failed with status: ${res.statusCode}`);
      process.exit(1);
    }
  });
});

healthCheck.on('error', (err) => {
  console.error('Health check ERROR:', err.message);
  process.exit(1);
});

healthCheck.setTimeout(5000, () => {
  console.error('Health check timeout after 5 seconds');
  healthCheck.destroy();
  process.exit(1);
});

healthCheck.end();
