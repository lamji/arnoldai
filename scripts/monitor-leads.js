/**
 * 🚀 Arnold AI: Lead Scraper & Email Processor
 * This script scans for inactive sessions and emails them as leads.
 * Run this periodically (e.g. every 5-10 mins).
 */

const http = require('http');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load env
const envPath = path.resolve(process.cwd(), '.env.local');
let adminKey = '';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/ADMIN_SECRET_KEY=(.*)/);
  if (match) adminKey = match[1].trim().replace(/^['"]|['"]$/g, '');
}

if (!adminKey) {
  console.error("❌ ADMIN_SECRET_KEY not found in .env.local");
  process.exit(1);
}

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/admin/leads/process', // Uses the GET endpoint we created
  method: 'GET',
  headers: {
    'x-admin-key': adminKey
  }
};

console.log(`[Sentintel Monitor] 🛡️ Checking for inactive leads...`);

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    if (res.statusCode === 200) {
      const result = JSON.parse(data);
      if (result.sent > 0) {
        console.log(`✅ SUCCESS: Processed ${result.processed} sessions. Sent ${result.sent} new lead emails.`);
      } else {
        console.log(`😴 IDLE: No new inactive leads found at this time.`);
      }
    } else {
      console.error(`❌ FAILED: Status ${res.statusCode}`);
      console.log(data);
    }
  });
});

req.on('error', (e) => {
  console.error(`❌ Connection Error: ${e.message}`);
  console.log("💡 Tip: Ensure your local server is running on port 3000.");
});

req.end();
