const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
const http = require('https');

// Manually parse .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
let uri = '';
let voyageKey = '';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const uriMatch = envContent.match(/MONGODB_URI=(.*)/);
  if (uriMatch) uri = uriMatch[1].trim().replace(/^['"]|['"]$/g, '');
  const keyMatch = envContent.match(/VOYAGE_AI_KEY=(.*)/);
  if (keyMatch) voyageKey = keyMatch[1].trim().replace(/^['"]|['"]$/g, '');
}

async function getEmbeddings(text) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      input: [text],
      model: "voyage-3-lite"
    });

    const options = {
      hostname: 'api.voyageai.com',
      path: '/v1/embeddings',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${voyageKey}`
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (d) => body += d);
      res.on('end', () => {
        const parsed = JSON.parse(body);
        resolve(parsed.data[0].embedding);
      });
    });

    req.on('error', (e) => reject(e));
    req.write(data);
    req.end();
  });
}

async function seedFirstCorrection() {
  if (!uri || !voyageKey) {
    console.error("❌ Missing URI or Voyage Key");
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db("arnold-ai");

    const correction = "When users ask how to join IMG, you MUST prioritize providing the Direct Registration Link: https://img.com.ph/quote/UKHB/?agentcode=193214ph. Mention that all enrollment steps happen on that secure portal.";
    
    console.log("🧠 Vectorizing initial correction...");
    const embedding = await getEmbeddings(correction);

    const doc = {
      sourceType: "correction",
      text: `USER CORRECTION (PRIORITY): ${correction}`,
      embedding: embedding,
      metadata: { importance: "high", context: "onboarding" },
      updatedAt: new Date()
    };

    await db.collection("ai_knowledge_embeddings").insertOne(doc);
    console.log("✅ Seeded first critical correction to Vector DB!");

  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    await client.close();
  }
}

seedFirstCorrection();
