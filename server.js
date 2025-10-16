require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();
app.use(cors());
app.use(express.json());

const uri = process.env.MONGO_URI;
if (!uri) {
  console.error('❌ Missing MONGODB_URI in .env');
  process.exit(1);
}

// Reuse one client/connection for the whole app
const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });

let db;

// Start server only after DB connects
async function start() {
  try {
    await client.connect();
    db = client.db('COP4331Cards');           // ← your DB name
    console.log('✅ Connected to MongoDB');

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () =>
      console.log(`🚀 Server running on http://localhost:${PORT}`)
    );
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
}
start();

// ---------- Routes ----------

// Basic
app.get('/api/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// Login (DB-backed)
// incoming: { login, password }
// outgoing: { id, firstName, lastName, error }
app.post('/api/login', async (req, res) => {
  try {
    const { login, password } = req.body;
    const users = db.collection('Users');

    const results = await users
      .find({ Login: login, Password: password })
      .limit(1)
      .toArray();

    let id = -1, fn = '', ln = '';
    if (results.length > 0) {
      id = results[0].UserID;
      fn = results[0].FirstName;
      ln = results[0].LastName;
    }

    res.status(200).json({ id, firstName: fn, lastName: ln, error: '' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ id: -1, firstName: '', lastName: '', error: 'server error' });
  }
});

// Add Card (DB-backed)
// incoming: { userId, card }
// outgoing: { error }
app.post('/api/addcard', async (req, res) => {
  const { userId, card } = req.body;
  let error = '';

  try {
    const result = await db.collection('Cards').insertOne({ Card: card, UserId: userId });
    // result.insertedId available if you want to return it
  } catch (e) {
    console.error(e);
    error = e.toString();
  }

  res.status(200).json({ error });
});

// Search Cards (DB-backed)
// incoming: { userId, search }
// outgoing: { results: string[], error }
app.post('/api/searchcards', async (req, res) => {
  try {
    const { userId, search } = req.body;
    const _search = (search || '').trim();

    const results = await db.collection('Cards')
      .find({ Card: { $regex: _search + '.*', $options: 'i' } })
      .project({ Card: 1, _id: 0 })
      .toArray();

    const list = results.map(r => r.Card);
    res.status(200).json({ results: list, error: '' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ results: [], error: 'server error' });
  }
});

// Optional: graceful shutdown
process.on('SIGINT', async () => {
  try { await client.close(); } catch {}
  process.exit(0);
});

