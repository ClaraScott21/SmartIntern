// ============================================
// NEXORA — Express server
// ============================================
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');

const app = express();

// ---------- Middleware ----------
app.use(cors({
  origin: '*', // for dev; tighten later if you deploy
  credentials: true
}));
app.use(express.json());

// ---------- Health check ----------
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'NEXORA API', time: new Date().toISOString() });
});

// ---------- Routes ----------
app.use('/api/auth', authRoutes);

// ---------- 404 handler ----------
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// ---------- Error handler ----------
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ---------- Start ----------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 NEXORA backend running on http://localhost:${PORT}`);
});