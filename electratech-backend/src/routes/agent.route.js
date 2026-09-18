// src/routes/agent.route.js
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { getAgentResponse, getPublicAgentResponse } = require('../services/agent.service');

// 1. Endpoint Publik AI Chatbot Halaman Depan (TIDAK Butuh Login & TIDAK Mengakses Database)
router.post('/public-chat', async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ ok: false, error: 'Pesan tidak boleh kosong.' });
    }

    const reply = await getPublicAgentResponse(message.trim(), history || []);
    return res.json({ ok: true, reply });
  } catch (error) {
    console.error('Error on Public Agent Route:', error);
    return res.status(500).json({ ok: false, error: 'Terjadi kendala pada layanan ElectraBot.' });
  }
});

// 2. Endpoint Dashboard Internal (Memerlukan Autentikasi & Akses Data Database)
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