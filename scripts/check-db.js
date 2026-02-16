const { MongoClient } = require('mongodb');
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

async function checkDb() {
  if (!uri) {
    console.error("❌ MONGODB_URI is not defined in .env.local");
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    // 1. List Databases
    const adminDb = client.db().admin();
    const dbs = await adminDb.listDatabases();
    
    console.log("\n📊 Databases found:");
    dbs.databases.forEach(db => console.log(` - ${db.name}`));

    const targetDbName = "arnold-ai";
    const exists = dbs.databases.some(db => db.name === targetDbName);

    if (exists) {
      console.log(`\n✨ SUCCESS: Database '${targetDbName}' EXISTS.`);
      
      const db = client.db(targetDbName);
      const collections = await db.listCollections().toArray();
      
      console.log(`📦 Collections in '${targetDbName}':`);
      collections.forEach(col => console.log(` - ${col.name}`));
    } else {
      console.error(`\n❌ ERROR: Database '${targetDbName}' NOT found.`);
    }

  } catch (err) {
    console.error("❌ Error during check:", err);
  } finally {
    await client.close();
  }
}

checkDb();
