import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';

// Manual env loading for standalone script
const envPath = path.join(process.cwd(), '.env.local');
let mongodbUri = process.env.MONGODB_URI;

if (!mongodbUri && fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/MONGODB_URI=(.*)/);
    if (match) mongodbUri = match[1].trim();
}

if (!mongodbUri) {
    console.error('❌ Error: MONGODB_URI not found in environment or .env.local');
    process.exit(1);
}

async function checkDatabases() {
    const client = new MongoClient(mongodbUri);

    try {
        console.log('📡 Connecting to MongoDB Atlas...');
        await client.connect();
        console.log('✅ Connected successfully!\n');

        const admin = client.db().admin();
        const { databases } = await admin.listDatabases();

        console.log('📦 AVAILABLE DATABASES:');
        console.log('======================');

        for (const dbInfo of databases) {
            const db = client.db(dbInfo.name);
            const collections = await db.listCollections().toArray();
            
            console.log(`\n📂 Database: ${dbInfo.name} (${(dbInfo.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
            
            if (collections.length === 0) {
                console.log('   (No collections)');
                continue;
            }

            for (const col of collections) {
                const count = await db.collection(col.name).countDocuments();
                console.log(`   └─ 📄 ${col.name.padEnd(20)} [${count} documents]`);
            }
        }

        console.log('\n======================');
        console.log('🏁 Diagnostic Complete.');

    } catch (error) {
        console.error('❌ Connection Error:', error.message);
    } finally {
        await client.close();
    }
}

checkDatabases();
