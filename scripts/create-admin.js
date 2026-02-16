const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
let uri = '';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/MONGODB_URI=(.*)/);
  if (match) uri = match[1].trim().replace(/^['"]|['"]$/g, '');
}

async function createAdmin() {
  if (!uri) {
    console.error("❌ MONGODB_URI is not defined in .env.local");
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db("arnold-ai");

    const username = "admin";
    const password = "P@$$w0rd2026";
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update or create user
    await db.collection("users").updateOne(
      { username },
      { 
        $set: { 
          username, 
          password: hashedPassword,
          role: 'admin',
          updatedAt: new Date() 
        } 
      },
      { upsert: true }
    );

    console.log(`✅ Admin user created/updated successfully.`);
    console.log(`👤 Username: ${username}`);
    console.log(`🔑 Password: ${password}`);

  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    await client.close();
  }
}

createAdmin();
