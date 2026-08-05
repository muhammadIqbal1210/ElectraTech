// src/routes/agent.route.js
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { getAgentResponse } = require('../services/agent.service');

// Semua endpoint agent memerlukan autentikasi
router.use(requireAuth);

// POST /api/agent/chat
router.post('/chat', async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Pesan tidak boleh kosong.' });
    }

    // Kirim user dari token JWT agar query difilter per-user
    const reply = await getAgentResponse(message, history, req.user);

    return res.json({ reply });
  } catch (error) {
    console.error('Error on Agent Route:', error);
    return res.status(500).json({ error: 'Internal Server Error pada ElectraAgent.' });
  }
});

module.exports = router;