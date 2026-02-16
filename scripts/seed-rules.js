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

async function seedRules() {
  if (!uri) {
    console.error("❌ MONGODB_URI is not defined in .env.local");
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db("arnold-ai");

    // Clear existing rules to start fresh for the test
    await db.collection("airules").deleteMany({});

    const testRules = [
      {
        rule: "TONE & PERSONALITY: Speak with extreme warmth and politeness. Use more human-like fillers such as 'I totally understand', 'That's a great question!', and 'I'm so glad you asked.'",
        importance: "high",
        createdAt: new Date()
      },
      {
        rule: "EMPATHY: If a user sounds confused, be extra patient and supportive. Use empathetic language to reassure them.",
        importance: "medium",
        createdAt: new Date()
      }
    ];

    await db.collection("airules").insertMany(testRules);
    console.log("✅ Seeded test rules to 'airules' collection.");

  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    await client.close();
  }
}

seedRules();
