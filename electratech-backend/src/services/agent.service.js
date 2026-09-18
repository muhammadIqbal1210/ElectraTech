// src/services/agent.service.js
const { GoogleGenAI } = require('@google/genai');
const pool = require('../config/db'); // Koneksi pg pool Anda

// Fungsi pembantu untuk Retry jika terjadi Rate Limit (429) atau Server Overload / High Demand (503)
const callGeminiWithRetry = async (fn, retries = 2, delay = 2000) => {
  try {
    return await fn();
  } catch (error) {
    const status = error.status || (error.error && error.error.code);
    const msg = error.message || '';
    const isRetryable = status === 429 || status === 503 || msg.includes('429') || msg.includes('503') || msg.includes('high demand') || msg.includes('UNAVAILABLE');

    if (isRetryable && retries > 0) {
      console.warn(`[Gemini API] Kendala sementara (${status || 'Spike Demand'}). Mencoba lagi dalam ${delay / 1000} detik... (Sisa retry: ${retries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return callGeminiWithRetry(fn, retries - 1, delay * 1.5);
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
    } else if (error.status === 503 || errorMsg.includes('503') || errorMsg.includes('high demand') || errorMsg.includes('UNAVAILABLE')) {
      errorMsg = 'Server Google AI sedang mengalami lonjakan beban (High Demand). Sistem otomatis mencoba alternatif, silakan coba beberapa detik lagi.';
    } else if (error.status === 404 || errorMsg.includes('404')) {
      errorMsg = 'Model AI tidak ditemukan atau tidak tersedia untuk API Key Anda.';
    }

    return `[Sistem Electra - Error AI]: ${errorMsg}\n\nRingkasan Data Saat Ini:\n- Batches: ${allBatches.length}\n- IoT Logs: ${latestIotLogs.length}`;
  }
};

/**
 * AI Chatbot Publik untuk Halaman Depan / Landing Page
 * - TIDAK MENGAMBIL DATA DARI DATABASE (Zero database queries, no private data)
 * - Khusus menjawab seputar layanan, fitur, dan modul sistem Electra Tech
 * - MENOLAK KERAS:
 *   1. Permintaan pembuatan kode / coding (HTML, Python, JS, smart contract, dll)
 *   2. Pertanyaan umum/random di luar sistem (resep masakan, politik, matematika, dll)
 *   3. Permintaan data internal/database (suruh login ke dashboard jika butuh data akun)
 */
const getPublicAgentResponse = async (message, history = []) => {
  const publicSystemInstruction = `
Kamu adalah ElectraBot, asisten virtual resmi untuk platform Electra Tech Indonesia.

TUGAS UTAMA:
Menjawab pertanyaan pengunjung seputar layanan, arsitektur solusi, dan teknologi yang disediakan oleh Electra Tech Indonesia.

LAYANAN & FITUR UTAMA ELECTRA TECH:
1. TraceChain Blockchain:
   - Infrastruktur pencatatan ledger digital terdistribusi di Polygon Network.
   - Mengamankan riwayat sertifikasi, mutasi fase budidaya benih, dan data logistik secara permanen (immutable & anti-manipulasi).
2. SmartLink IoT Control:
   - Pemantauan telemetri sensor lingkungan (suhu udara, kelembaban, pH/nutrisi) secara real-time.
   - Otomatisasi pengendalian aktuator cerdas (pompa air/nutrisi, exhaust fan, misting) menggunakan protokol MQTT.
3. Supply Chain Core & Cold-Chain Tracking:
   - Manajemen manifest pengiriman paket dari penangkar/produsen ke kurir dan agen.
   - Pemantauan kondisi muatan, suhu box kontainer, dan checkpoint kurir secara live.
4. QR Code & Ledger Verification:
   - Konsumen, mitra tani, dan agen dapat memindai QR Code atau memasukkan nomor resi/ID batch di landing page untuk memverifikasi keaslian dan riwayat benih dari hulu ke hilir.
5. AI ElectraAgent (Core):
   - Modul kecerdasan buatan di dashboard produsen untuk memantau tren telemetri dan deteksi anomali pertumbuhan bibit.

BATASAN & ATURAN KETAT (WAJIB DIPATUHI):
1. DILARANG MEMBERIKAN KODE PEMROGRAMAN:
   - Jika pengguna meminta pembuatan kode program (seperti JavaScript, Python, Solidity, script, SQL, HTML, atau instruksi coding apapun), TOLAK DENGAN SOPAN:
   "Maaf, saya tidak dapat membantu pembuatan kode pemrograman. Saya di sini khusus untuk memberikan informasi seputar layanan dan solusi sistem Electra Tech."
2. TIDAK MENGAMBIL / MEMILIKI AKSES DATABASE:
   - Kamu tidak terhubung ke database dan tidak menyimpan data pengguna spesifik.
   - Jika pengguna menanyakan data transaksi spesifik, status batch akun mereka, atau data internal, jelaskan:
   "Saya tidak memiliki akses ke database pengguna. Untuk melihat data operasional atau batch Anda, silakan login ke dashboard sistem Electra Tech."
3. TOLAK PERTANYAAN DI LUAR SISTEM (OUT OF CONTEXT / RANDOM):
   - Jika ditanya hal umum/acak di luar sistem Electra Tech (seperti resep masakan, politik, lelucon, selebriti, cuaca dunia, tugas sekolah umum, dll), TOLAK DENGAN SINGKAT:
   "Maaf, pertanyaan tersebut di luar lingkup sistem Electra Tech. Saya hanya dapat menjawab pertanyaan seputar layanan SmartLink IoT, TraceChain Blockchain, dan sistem agritech Electra Tech."
4. GAYA BAHASA:
   - Ramah, profesional, ringkas, dan jelas dalam Bahasa Indonesia.
   - Gunakan format Markdown (bold, bullet points) agar mudah dibaca.
`;

  const fallbackPublicOffline = (msg) => {
    const text = msg.toLowerCase();

    // 1. Deteksi permintaan kode
    const codePatterns = ['bikin kode', 'buatkan kode', 'coding', 'script', 'buatkan script', 'program python', 'buatkan fungsi', 'buatkan query'];
    if (codePatterns.some((p) => text.includes(p))) {
      return 'Maaf, saya tidak dapat membantu pembuatan kode pemrograman. Saya di sini khusus untuk memberikan informasi seputar layanan dan solusi sistem Electra Tech.';
    }

    // 2. Deteksi out of scope random
    const outOfScope = ['resep', 'masak', 'makanan', 'politik', 'presiden', 'cuaca', 'lagu', 'artis', 'game', 'lelucon', 'lucu', 'matematika'];
    if (outOfScope.some((p) => text.includes(p))) {
      return 'Maaf, pertanyaan tersebut di luar lingkup sistem Electra Tech. Saya hanya dapat menjawab pertanyaan seputar layanan SmartLink IoT, TraceChain Blockchain, dan sistem agritech Electra Tech.';
    }

    // 3. Respon seputar layanan sistem
    if (text.includes('blockchain') || text.includes('ledger') || text.includes('tracechain')) {
      return 'TraceChain Blockchain di Electra Tech mencatat setiap mutasi fase bibit dan pengiriman ke smart contract Polygon Network, menjamin transparansi data yang permanen dan anti-manipulasi.';
    }
    if (text.includes('iot') || text.includes('sensor') || text.includes('smartlink') || text.includes('aktuator')) {
      return 'SmartLink IoT memantau kondisi lingkungan budidaya (suhu, kelembaban, pH) secara real-time dan mengontrol aktuator (pompa, misting, fan) secara otomatis via protokol MQTT.';
    }
    if (text.includes('qr') || text.includes('verifikasi') || text.includes('lacak') || text.includes('resi')) {
      return 'Layanan verifikasi QR Code memungkinkan siapa saja memindai barcode fisik pada kemasan benih untuk melihat sertifikasi keaslian dan riwayat perjalanan dari persemaian hingga pengiriman.';
    }
    if (text.includes('layanan') || text.includes('fitur') || text.includes('sistem')) {
      return 'Electra Tech menyediakan 3 pilar layanan utama:\n1. **TraceChain Blockchain**: Pencatatan riwayat benih permanen.\n2. **SmartLink IoT**: Telemetri sensor & kontrol aktuator otomatis.\n3. **Supply Chain Core**: Pelacakan logistik kargo & verifikasi QR Code.';
    }

    return 'Selamat datang di Electra Tech! Ada yang bisa saya bantu terkait layanan SmartLink IoT, TraceChain Blockchain, atau sistem verifikasi benih kami?';
  };

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'YOUR_API_KEY') {
    return fallbackPublicOffline(message);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    // Batasi 4 percakapan terakhir agar fokus dan hemat token
    const recentHistory = (history || []).slice(-4);
    const formattedHistory = recentHistory.map((h) => ({
      role: h.sender === 'user' ? 'user' : 'model',
      parts: [{ text: h.text }],
    }));

    const callWithModel = async (modelName) => {
      const chat = ai.chats.create({
        model: modelName,
        config: {
          systemInstruction: publicSystemInstruction,
          temperature: 0.2,
        },
        history: formattedHistory,
      });

      const result = await chat.sendMessage({
        message,
      });

      return result.text;
    };

    return await callGeminiWithRetry(async () => {
      try {
        const text = await callWithModel('gemini-3.6-flash');
        return text || fallbackPublicOffline(message);
      } catch (err) {
        const isUnavailable = err.status === 503 || (err.message && err.message.includes('503'));
        if (isUnavailable) {
          console.warn('[Gemini API] gemini-3.6-flash sedang high demand (503), mencoba fallback model gemini-2.5-flash-lite...');
          const altText = await callWithModel('gemini-3.5-flash-lite');
          return altText || fallbackPublicOffline(message);
        }
        throw err;
      }
    });
  } catch (error) {
    console.error('Public Gemini API Error:', error);
    // Kembalikan jawaban informatif dari fallback sistem agar pengunjung tetap mendapatkan jawaban
    return fallbackPublicOffline(message);
  }
};

module.exports = { getAgentResponse, getPublicAgentResponse };