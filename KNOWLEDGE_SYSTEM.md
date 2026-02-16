# 🧠 Kaiser AI Knowledge & Memory System

This document outlines how the Arnold AI (Kaiser Financial Sentinel) learns from user corrections and maintains a persistent memory using Semantic RAG.

---

## 🛠️ MongoDB Atlas Search Configuration

To enable the priority search for rules and corrections, you MUST create a second vector index in your MongoDB dashboard:

1. Go to **Atlas Search** in your MongoDB dashboard.
2. Click **Create Search Index**.
3. Select **JSON Editor** and choose the `ai_knowledge_embeddings` collection in the `arnold-ai` database.
4. Paste the following configuration:
```json
{
  "fields": [
    {
      "numDimensions": 512,
      "path": "embedding",
      "similarity": "cosine",
      "type": "vector"
    }
  ]
}
```
5. Name the index **`ai_knowledge_index`**.
6. Click **Create Search Index**.

---

## 🔧 AI Memory Pipeline

### 1. Detecting Corrections
The AI is programmed via `defaultRules.ts` to detect when a user corrects its facts. 
- **Trigger**: When the AI identifies a correction, it appends a hidden tag: `[TRIGGER_SAVE_CORRECTION:CorrectInfo:OriginalFact]`.

### 2. Immediate Persistence
The `useAgent.ts` hook parses this tag and immediately sends it to `/api/admin/corrections`.
- **Action**: The backend saves the correction to `knowledge_corrections` and generates a vector embedding immediately.
- **Sync**: It then inserts the embedding into `ai_knowledge_embeddings` for instant RAG availability.

### 3. Semantic Retrieval (RAG)
When the AI generates a response, it searches two collections:
1. **`ai_knowledge_embeddings`**: (Priority) Recent corrections and system rules.
2. **`kaiser_knowledge`**: General industry knowledge and manual entries.

Results are combined and injected into the system prompt under `🚨 SYSTEM RULES & RECENT CORRECTIONS`, ensuring the AI respects the latest updates.

---

## 🚀 Admin Commands

### Full Re-Sync
If you manually edit rules or corrections in the database, run this command to re-index everything:
```bash
curl -X POST http://localhost:3000/api/admin/sync-ai-knowledge
```

### View All Corrections
To see what the AI has learned from users:
```bash
GET http://localhost:3000/api/admin/corrections
```
