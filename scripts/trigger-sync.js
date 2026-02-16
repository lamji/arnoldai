const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/admin/sync-ai-knowledge',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  }
};

console.log("🚀 Triggering Knowledge Sync...");

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log("✅ Sync Successful!");
      console.log(data);
    } else {
      console.error(`❌ Sync Failed with status: ${res.statusCode}`);
      console.error(data);
    }
  });
});

req.on('error', (e) => {
  console.error(`❌ Connection Error: ${e.message}`);
  console.log("💡 Make sure your local server is running on port 3000!");
});

req.end();
