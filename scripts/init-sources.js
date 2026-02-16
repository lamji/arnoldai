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

async function initSources() {
  if (!uri) {
    console.error("❌ MONGODB_URI is not defined in .env.local");
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db("arnold-ai");

    // 1. Initialize knowledge_corrections
    const correctionsCount = await db.collection("knowledge_corrections").countDocuments();
    if (correctionsCount === 0) {
      await db.collection("knowledge_corrections").insertOne({
        correction: "Join IMG via the registration link: https://img.com.ph/quote/UKHB/?agentcode=193214ph",
        originalFact: "General inquiry",
        context: "Initial Seeding",
        createdAt: new Date()
      });
      console.log("✅ Created 'knowledge_corrections' collection.");
    }

    // 2. Initialize kaiser_knowledge
    const knowledgeCount = await db.collection("kaiser_knowledge").countDocuments();
    if (knowledgeCount === 0) {
      await db.collection("kaiser_knowledge").insertOne({
        text: "Kaiser International Healthgroup is a premier HMO partner of IMG.",
        source: "manual",
        createdAt: new Date()
      });
      console.log("✅ Created 'kaiser_knowledge' collection.");
    }

    console.log("\n🚀 All source collections are now active in the 'arnold-ai' database.");

  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    await client.close();
  }
}

initSources();
