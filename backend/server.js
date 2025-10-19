const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Challenge flags
const challenges = {
  lucien: 'CTF{d34th_15_n0t_th3_3nd}',
  death: 'CTF{3v3ryth1ng_3nd5_but_m3}',
  morpheus: 'CTF{r34l1ty_15_wh4t_y0u_m4k3_1t}'
};

// Verify flag endpoint
app.post('/api/verify-flag', (req, res) => {
  const { roomId, flag } = req.body;
  
  console.log(`Flag verification attempt for ${roomId}: ${flag}`);
  
  const isCorrect = challenges[roomId] === flag;
  
  res.json({ 
    correct: isCorrect,
    message: isCorrect ? 'Flag correct!' : 'Flag incorrect!'
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'CTF Backend is running' });
});

// Get challenge info endpoint
app.get('/api/challenges', (req, res) => {
  res.json(challenges);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🔧 CTF Backend server running on port ${PORT}`);
  console.log(`🏴‍☠️  Available challenges: ${Object.keys(challenges).join(', ')}`);
});