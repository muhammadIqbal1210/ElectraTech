// src/services/agent.service.js
const { GoogleGenAI } = require('@google/genai');
const pool = require('../config/db'); // Koneksi pg pool Anda

// Fungsi pembantu untuk Retry jika terjadi Rate Limit (429)
const callGeminiWithRetry = async (fn, retries = 2, delay = 3000) => {
  try {
    return await fn();
  } catch (error) {
    const isRateLimit = error.status === 429 || (error.message && error.message.includes('429'));
    if (isRateLimit && retries > 0) {
      console.warn(`[Gemini API] Rate limit (429) tercapai. Mencoba lagi dalam ${delay / 1000} detik...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return callGeminiWithRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};

const getAgentResponse = async (message, history = [], user) => {
  const userId = user.id;
  const userRole = user.role;

  // === 1. Query Data Telemetri IoT & Device (LIMIT 20 Data Terbaru) ===
  let iotDataQuery;
  if (userRole === 'ADMIN') {
    iotDataQuery = await pool.query(`
      SELECT 
        d.box_name,
        dc.component_name,
        dc.component_type,
        dc.unit,
        il.value,
        il.recorded_at
      FROM iot_logs il
      JOIN device_components dc ON il.component_id = dc.id
      JOIN devices d ON dc.device_id = d.id
      WHERE dc.component_type IN ('sensor', 'actuator')
      ORDER BY il.recorded_at DESC
      LIMIT 20
    `);
  } else {
    iotDataQuery = await pool.query(`
      SELECT 
        d.box_name,
        dc.component_name,
        dc.component_type,
        dc.unit,
        il.value,
        il.recorded_at
      FROM iot_logs il
      JOIN device_components dc ON il.component_id = dc.id
      JOIN devices d ON dc.device_id = d.id
      WHERE dc.component_type IN ('sensor', 'actuator')
        AND d.user_id = $1
      ORDER BY il.recorded_at DESC
      LIMIT 20
    `, [userId]);
  }

  // === 2. Query Data Batch (LIMIT 15 Batch Terbaru) ===
  let batchDataQuery;
  if (userRole === 'ADMIN') {
    batchDataQuery = await pool.query(`
      SELECT 
        b.public_id,
        b.variety,
        b.generation,
        b.quantity,
        b.phase,
        b.health_status,
        u.name AS producer_name
      FROM batches b
      JOIN users u ON b.producer_id = u.id
      ORDER BY b.created_at DESC
      LIMIT 15
    `);
  } else if (userRole === 'PRODUSEN') {
    batchDataQuery = await pool.query(`
      SELECT 
        b.public_id,
        b.variety,
        b.generation,
        b.quantity,
        b.phase,
        b.health_status,
        u.name AS producer_name
      FROM batches b
      JOIN users u ON b.producer_id = u.id
      WHERE b.producer_id = $1
      ORDER BY b.created_at DESC
      LIMIT 15
    `, [userId]);
  } else {
    batchDataQuery = await pool.query(`
      SELECT DISTINCT
        b.public_id,
        b.variety,
        b.generation,
        b.quantity,
        b.phase,
        b.health_status,
        u.name AS producer_name
      FROM batches b
      JOIN users u ON b.producer_id = u.id
      WHERE EXISTS (
        SELECT 1 FROM shipments s
        WHERE s.batch_id = b.id AND s.courier_id = $1
      )
      ORDER BY b.created_at DESC
      LIMIT 15
    `, [userId]);
  }

  // === 3. Query Batch Logs (LIMIT 15 Log Terbaru) ===
  let batchLogsQuery;
  if (userRole === 'ADMIN') {
    batchLogsQuery = await pool.query(`
      SELECT 
        bl.id,
        b.public_id AS batch_public_id,
        bl.from_phase,
        bl.to_phase,
        bl.notes,
        u.name AS operator_name,
        bl.created_at
      FROM batch_logs bl
      JOIN batches b ON bl.batch_id = b.id
      JOIN users u ON bl.created_by = u.id
      ORDER BY bl.created_at DESC
      LIMIT 15
    `);
  } else if (userRole === 'PRODUSEN') {
    batchLogsQuery = await pool.query(`
      SELECT 
        bl.id,
        b.public_id AS batch_public_id,
        bl.from_phase,
        bl.to_phase,
        bl.notes,
        u.name AS operator_name,
        bl.created_at
      FROM batch_logs bl
      JOIN batches b ON bl.batch_id = b.id
      JOIN users u ON bl.created_by = u.id
      WHERE b.producer_id = $1
      ORDER BY bl.created_at DESC
      LIMIT 15
    `, [userId]);
  } else {
    batchLogsQuery = await pool.query(`
      SELECT 
        bl.id,
        b.public_id AS batch_public_id,
        bl.from_phase,
        bl.to_phase,
        bl.notes,
        u.name AS operator_name,
        bl.created_at
      FROM batch_logs bl
      JOIN batches b ON bl.batch_id = b.id
      JOIN users u ON bl.created_by = u.id
      WHERE EXISTS (
        SELECT 1 FROM shipments s
        WHERE s.batch_id = b.id AND s.courier_id = $1
      )
      ORDER BY bl.created_at DESC
      LIMIT 15
    `, [userId]);
  }

  // === 4. Query Shipments (LIMIT 15 Pengiriman Terbaru) ===
  let shipmentsQuery;
  if (userRole === 'ADMIN') {
    shipmentsQuery = await pool.query(`
      SELECT 
        s.receipt_number,
        b.public_id AS batch_public_id,
        p.name AS producer_name,
        c.name AS courier_name,
        s.destination,
        s.package_quantity,
        s.status,
        s.notes,
        s.created_at
      FROM shipments s
      JOIN batches b ON s.batch_id = b.id
      JOIN users p ON s.producer_id = p.id
      LEFT JOIN users c ON s.courier_id = c.id
      ORDER BY s.created_at DESC
      LIMIT 15
    `);
  } else if (userRole === 'PRODUSEN') {
    shipmentsQuery = await pool.query(`
      SELECT 
        s.receipt_number,
        b.public_id AS batch_public_id,
        p.name AS producer_name,
        c.name AS courier_name,
        s.destination,
        s.package_quantity,
        s.status,
        s.notes,
        s.created_at
      FROM shipments s
      JOIN batches b ON s.batch_id = b.id
      JOIN users p ON s.producer_id = p.id
      LEFT JOIN users c ON s.courier_id = c.id
      WHERE s.producer_id = $1
      ORDER BY s.created_at DESC
      LIMIT 15
    `, [userId]);
  } else {
    shipmentsQuery = await pool.query(`
      SELECT 
        s.receipt_number,
        b.public_id AS batch_public_id,
        p.name AS producer_name,
        c.name AS courier_name,
        s.destination,
        s.package_quantity,
        s.status,
        s.notes,
        s.created_at
      FROM shipments s
      JOIN batches b ON s.batch_id = b.id
      JOIN users p ON s.producer_id = p.id
      LEFT JOIN users c ON s.courier_id = c.id
      WHERE s.courier_id = $1
      ORDER BY s.created_at DESC
      LIMIT 15
    `, [userId]);
  }

  const allBatches = batchDataQuery.rows;
  const latestIotLogs = iotDataQuery.rows;
  const batchLogs = batchLogsQuery.rows;
  const shipments = shipmentsQuery.rows;

  // 5. Susun Konteks Ringkas
  let iotContextText = latestIotLogs.length > 0
    ? latestIotLogs.map(log => `- ${log.box_name} | ${log.component_name}: ${log.value} ${log.unit || ''} (${new Date(log.recorded_at).toISOString()})`).join('\n')
    : '- Belum ada data sensor IoT.';

  let batchesContextText = allBatches.length > 0
    ? allBatches.map(b => `- ID Batch: ${b.public_id} | Varietas: ${b.variety} (${b.generation}) | Qty: ${b.quantity} | Fase: ${b.phase} | Status: ${b.health_status} | Produsen: ${b.producer_name}`).join('\n')
    : '- Belum ada data batch.';

  let batchLogsContextText = batchLogs.length > 0
    ? batchLogs.map(l => `- [LOG] Batch ${l.batch_public_id}: ${l.from_phase || 'AWAL'} -> ${l.to_phase} | Note: "${l.notes || '-'}" | Oleh: ${l.operator_name}`).join('\n')
    : '- Belum ada riwayat pergerakan batch.';

  let shipmentsContextText = shipments.length > 0
    ? shipments.map(s => `- [SHIPMENT] Resi: ${s.receipt_number} | Tujuan: ${s.destination} | Status: ${s.status} | Batch: ${s.batch_public_id}`).join('\n')
    : '- Belum ada data pengiriman.';

  const systemContext = `
[PENGGUNA]: ${user.name || 'N/A'} (Role: ${userRole})

[STATUS BATCH TERBARU]:
${batchesContextText}

[LOG FASE BATCH TERBARU]:
${batchLogsContextText}

[SENSOR IOT TERBARU]:
${iotContextText}

[PENGIRIMAN TERBARU]:
${shipmentsContextText}
`;

  // 6. System Instruction
  const systemInstruction = `
Kamu adalah ElectraAgent Core, AI Assistant resmi untuk platform SmartLink IoT & TraceChain Ledger.

TUGAS UTAMA:
Membantu pengguna menganalisis data batch, status rantai pasok, dan kondisi sensor IoT secara real-time.

ATURAN KETAT:
1. Jawab HANYA berdasarkan konteks data database yang diberikan di bawah ini.
2. Data yang kamu lihat sudah difilter sesuai hak akses pengguna (role: ${userRole}). Jangan mengarang data di luar konteks.
3. Jika pengguna menanyakan hal di luar konteks IoT/Sistem pertanian/Rantai pasok, TOLAK dengan sopan.
4. Gunakan bahasa yang profesional, tegas, dan informatif.

KONTEKS DATABASE REAL-TIME:
${systemContext}
`;

  // Fallback offline response
  const buildOfflineResponse = (msg) => {
    const text = msg.toLowerCase();
    if (text.includes('suhu') || text.includes('sensor') || text.includes('kelembapan') || text.includes('iot')) {
      return `[Mode Offline - AI Tidak Aktif]\n\nData Sensor IoT Real-time saat ini:\n${iotContextText}`;
    }
    return `[Mode Offline - AI Tidak Aktif]\n\nSistem memantau ${allBatches.length} Batch dan merekam ${latestIotLogs.length} log sensor terbaru.`;
  };

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'YOUR_API_KEY') {
    return buildOfflineResponse(message);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    // PEMBATASAN HISTORY: Ambil maksimal 6 pesan terakhir (3 pasang percakapan) agar token tidak berlebihan
    const recentHistory = history.slice(-6);

    const formattedHistory = recentHistory.map(h => ({
      role: h.sender === 'user' ? 'user' : 'model',
      parts: [{ text: h.text }],
    }));

    // Gunakan wrapper Retry untuk mengeksekusi pemanggilan API
    return await callGeminiWithRetry(async () => {
      const chat = ai.chats.create({
        model: 'gemini-3.6-flash',
        config: {
          systemInstruction,
          temperature: 0.1,
        },
        history: formattedHistory,
      });

      const result = await chat.sendMessage({
        message: message,
      });

      return result.text || 'Maaf, tidak ada jawaban dari AI.';
    });

  } catch (error) {
    console.error('Gemini API Error:', error);
    
    let errorMsg = error.message || 'Error tidak diketahui';
    if (error.status === 429 || errorMsg.includes('429')) {
      errorMsg = 'Batas penggunaan AI (Rate Limit) tercapai. Harap tunggu 1 menit lalu coba lagi.';
    } else if (error.status === 404 || errorMsg.includes('404')) {
      errorMsg = 'Model AI tidak ditemukan atau tidak tersedia untuk API Key Anda.';
    }

    return `[Sistem Electra - Error AI]: ${errorMsg}\n\nRingkasan Data Saat Ini:\n- Batches: ${allBatches.length}\n- IoT Logs: ${latestIotLogs.length}`;
  }
};

module.exports = { getAgentResponse };