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

async function initDb() {
  if (!uri) {
    console.error("❌ MONGODB_URI is not defined in .env.local");
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db("arnold-ai");
    const collection = db.collection("ai_knowledge_embeddings");

    // Check if it already exists
    const count = await collection.countDocuments();
    
    const placeholder = {
      sourceId: "system-init",
      sourceType: "system",
      text: "System Initialized: Arnold Financial Sentinel is ready to learn.",
      embedding: new Array(512).fill(0), // Dummy vector
      updatedAt: new Date()
    };

    await collection.insertOne(placeholder);
    console.log("🚀 Successfully created 'ai_knowledge_embeddings' and inserted a placeholder.");
    console.log("👉 Now go to MongoDB Atlas and you will see the 'arnold-ai' database and its collections.");

  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    await client.close();
  }
}

initDb();
