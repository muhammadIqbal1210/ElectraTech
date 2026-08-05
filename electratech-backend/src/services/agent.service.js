// src/services/agent.service.js
const { GoogleGenAI } = require('@google/genai');
const pool = require('../config/db'); // Koneksi pg pool Anda

const getAgentResponse = async (message, history = [], user) => {
  const userId = user.id;
  const userRole = user.role;

  // === 1. Query Data Telemetri IoT & Device (difilter per-user) ===
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
    `);
  } else {
    // PRODUSEN / KURIR: hanya device milik user sendiri
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
    `, [userId]);
  }

  // === 2. Query Data Batch (difilter per-user) ===
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
    `, [userId]);
  } else {
    // KURIR: hanya batch yang terkait shipment miliknya
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
    `, [userId]);
  }

  // === 3. Query Batch Logs (difilter per-user) ===
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
    `, [userId]);
  } else {
    // KURIR: log batch yang terkait shipment miliknya
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
    `, [userId]);
  }

  // === 4. Query Shipments (difilter per-user) ===
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
        s.created_at,
        s.accepted_at,
        s.delivered_at
      FROM shipments s
      JOIN batches b ON s.batch_id = b.id
      JOIN users p ON s.producer_id = p.id
      LEFT JOIN users c ON s.courier_id = c.id
      ORDER BY s.created_at DESC
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
        s.created_at,
        s.accepted_at,
        s.delivered_at
      FROM shipments s
      JOIN batches b ON s.batch_id = b.id
      JOIN users p ON s.producer_id = p.id
      LEFT JOIN users c ON s.courier_id = c.id
      WHERE s.producer_id = $1
      ORDER BY s.created_at DESC
    `, [userId]);
  } else {
    // KURIR: hanya shipment yang ditugaskan kepadanya
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
        s.created_at,
        s.accepted_at,
        s.delivered_at
      FROM shipments s
      JOIN batches b ON s.batch_id = b.id
      JOIN users p ON s.producer_id = p.id
      LEFT JOIN users c ON s.courier_id = c.id
      WHERE s.courier_id = $1
      ORDER BY s.created_at DESC
    `, [userId]);
  }

  const allBatches = batchDataQuery.rows;
  const latestIotLogs = iotDataQuery.rows;
  const batchLogs = batchLogsQuery.rows;
  const shipments = shipmentsQuery.rows;

  // 5. Susun Konteks
  let iotContextText = latestIotLogs.length > 0
    ? latestIotLogs.map(log => `- ${log.box_name} | ${log.component_name}: ${log.value} ${log.unit || ''} (Recorded: ${new Date(log.recorded_at).toISOString()})`).join('\n')
    : '- Belum ada data sensor IoT yang tercatat.';

  let batchesContextText = allBatches.length > 0
    ? allBatches.map(b => `- ID Batch: ${b.public_id || 'N/A'} | Varietas: ${b.variety || 'N/A'} (Generasi ${b.generation || 'G1'}) | Jumlah: ${b.quantity || 0} unit | Fase: ${b.phase || 'PENYEMAIAN'} | Status: ${b.health_status || 'SEHAT'} | Produsen: ${b.producer_name || 'N/A'}`).join('\n')
    : '- Belum ada data batch yang tercatat.';

  let batchLogsContextText = batchLogs.length > 0
    ? batchLogs.map(l => `- [LOG] Batch ${l.batch_public_id || 'N/A'}: Transisi ${l.from_phase || 'AWAL'} -> ${l.to_phase} | Catatan: "${l.notes || 'Tanpa Catatan'}" | Oleh: ${l.operator_name} (Tanggal: ${new Date(l.created_at).toISOString()})`).join('\n')
    : '- Belum ada riwayat pergerakan/log fase batch.';

  let shipmentsContextText = shipments.length > 0
    ? shipments.map(s => `- [SHIPMENT] No Resi: ${s.receipt_number} | QR: ${s.qr_code || 'N/A'} | Tujuan: ${s.destination || 'N/A'} | Status: ${s.status || 'N/A'} | Batch: ${s.batch_public_id || 'N/A'} | Produsen: ${s.producer_name || 'N/A'} (Tanggal: ${new Date(s.created_at).toISOString()})`).join('\n')
    : '- Belum ada data pengiriman yang tercatat.';

  const systemContext = `
[IDENTITAS PENGGUNA AKTIF]
- Nama: ${user.name || 'N/A'}
- Role: ${userRole}
- ID: ${user.publicId || user.id}

[DATA STATUS BATCH DI SISTEM]
${batchesContextText}

[DATA HISTORY LOG PERUBAHAN FASE BATCH]
${batchLogsContextText}

[DATA SENSOR IOT REAL-TIME DARI SYSTEM DATABASE]
${iotContextText}

[DATA PENGIRIMAN (SHIPMENT) TERBARU DARI SISTEM]
${shipmentsContextText}
`;

  // 6. Strict System Prompt
  const systemInstruction = `
Kamu adalah ElectraAgent Core, AI Assistant resmi untuk platform SmartLink IoT & TraceChain Ledger.

TUGAS UTAMA:
Membantu pengguna menganalisis data batch, status rantai pasok, dan kondisi sensor IoT secara real-time.

ATURAN KETAT:
1. Jawab HANYA berdasarkan konteks data database yang diberikan di bawah ini.
2. Data yang kamu lihat sudah difilter sesuai hak akses pengguna (role: ${userRole}). Jangan mengarang data di luar konteks.
3. Jika pengguna menanyakan hal di luar konteks IoT/Sistem pertanian/Rantai pasok (seperti resep makanan, coding umum, hiburan), TOLAK dengan sopan dan kembalikan ke fokus sistem Electra.
4. Jangan pernah mengarang data sensor atau ID batch yang tidak ada dalam konteks.
5. Gunakan bahasa yang profesional, tegas, dan informatif.

KONTEKS DATABASE REAL-TIME:
${systemContext}
`;

  // Fallback offline response jika API key belum dikonfigurasi
  const buildOfflineResponse = (msg) => {
    const text = msg.toLowerCase();
    if (text.includes('suhu') || text.includes('sensor') || text.includes('kelembapan') || text.includes('iot')) {
      return `[Mode Offline - AI Tidak Aktif]\n\nData Sensor IoT Real-time saat ini:\n${iotContextText}\n\n(Tambahkan GEMINI_API_KEY di .env untuk analisis AI otomatis).`;
    }
    if (text.includes('batch') || text.includes('status') || text.includes('bibit') || text.includes('fase')) {
      return `[Mode Offline - AI Tidak Aktif]\n\nStatus Semua Batch di Sistem:\n${batchesContextText}\n\n(Tambahkan GEMINI_API_KEY di .env untuk analisis AI otomatis).`;
    }
    return `[Mode Offline - AI Tidak Aktif]\n\nSistem memantau ${allBatches.length} Batch dan merekam ${latestIotLogs.length} log sensor terbaru.\n\n(Tambahkan GEMINI_API_KEY di .env untuk mendapatkan respons interaktif).`;
  };

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'YOUR_API_KEY') {
    return buildOfflineResponse(message);
  }

  try {
    // Inisialisasi SDK Google Gen AI
    const ai = new GoogleGenAI({ apiKey });

    // Format riwayat percakapan sesuai struktur Gemini (roles: 'user' / 'model')
    const formattedHistory = history.map(h => ({
      role: h.sender === 'user' ? 'user' : 'model',
      parts: [{ text: h.text }],
    }));

    // Membuat percakapan dengan model Gemini
    const chat = ai.chats.create({
      model: 'gemini-3.6-flash',
      config: {
        systemInstruction,
        temperature: 0.1, // Pertahankan konsistensi & minimalkan halusinasi
      },
      history: formattedHistory,
    });

    // Kirim pesan pengguna
    const result = await chat.sendMessage({
      message: message,
    });

    return result.text || 'Maaf, tidak ada jawaban dari AI.';
  } catch (error) {
    console.error('Gemini API Error:', error);
    
    let errorMsg = error.message || 'Error tidak diketahui';
    if (error.status === 429 || errorMsg.includes('429')) {
      errorMsg = 'Terlalu banyak permintaan ke AI (Rate Limit tercapai). Harap tunggu beberapa saat.';
    } else if (error.status === 404 || errorMsg.includes('404')) {
      errorMsg = 'Model AI tidak ditemukan atau tidak tersedia untuk API Key Anda.';
    }

    return `[Sistem Electra - Error AI]: Gagal menghubungi API Gemini (${errorMsg}).\n\nSebagai gantinya, berikut ringkasan data sistem saat ini:\nBatches terdaftar: ${allBatches.length}\nIoT Logs: ${latestIotLogs.length} data.`;
  }
};

module.exports = { getAgentResponse };