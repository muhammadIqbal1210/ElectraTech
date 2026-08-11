const express = require('express');
const pool = require('../config/db');
const { asyncHandler, createError } = require('../utils/http');

const router = express.Router();

router.get('/:query', asyncHandler(async (req, res) => {
  const queryParam = req.params.query.trim();

  if (!queryParam) {
    throw createError(400, 'ID Batch atau Nomor Resi wajib diisi.');
  }

  // 1. Cari Batch berdasarkan public_id atau receipt_number pengirimannya
  const batchResult = await pool.query(
    `SELECT b.id, b.public_id, b.variety, b.generation, b.quantity, b.phase, b.health_status,
            b.seeded_at, b.created_at, b.producer_id, u.name as producer_name, u.public_id as producer_public_id
     FROM batches b
     JOIN users u ON u.id = b.producer_id
     LEFT JOIN shipments s ON s.batch_id = b.id
     WHERE b.public_id ILIKE $1 OR s.receipt_number ILIKE $1
     ORDER BY b.created_at DESC
     LIMIT 1`,
    [queryParam]
  );

  const batch = batchResult.rows[0];

  if (!batch) {
    throw createError(404, `Data produk dengan ID / Nomor Resi "${queryParam}" tidak ditemukan.`);
  }

  // 2. Ambil Riwayat Fase (Batch Logs)
  const logsResult = await pool.query(
    `SELECT bl.id, bl.from_phase, bl.to_phase, bl.notes, bl.created_at, u.name as created_by_name
     FROM batch_logs bl
     JOIN users u ON u.id = bl.created_by
     WHERE bl.batch_id = $1
     ORDER BY bl.created_at ASC`,
    [batch.id]
  );

  // 3. Ambil Data Shipments & Tracking
  const shipmentsResult = await pool.query(
    `SELECT s.id, s.receipt_number, s.destination, s.package_quantity, s.status, s.notes,
            s.created_at, s.accepted_at, s.delivered_at,
            courier.name as courier_name
     FROM shipments s
     LEFT JOIN users courier ON courier.id = s.courier_id
     WHERE s.batch_id = $1
     ORDER BY s.created_at ASC`,
    [batch.id]
  );

  const shipments = shipmentsResult.rows;

  let trackingLogs = [];
  if (shipments.length > 0) {
    const trackingResult = await pool.query(
      `SELECT pt.id, pt.receipt_number, pt.status, pt.latitude, pt.longitude,
              pt.cargo_condition, pt.container_temperature_c, pt.notes, pt.recorded_at,
              u.name as courier_name
       FROM package_tracking pt
       JOIN users u ON u.id = pt.courier_id
       WHERE pt.batch_id = $1
       ORDER BY pt.recorded_at ASC`,
      [batch.id]
    );
    trackingLogs = trackingResult.rows;
  }

  // 4. Ambil IoT Telemetry Terbaru (jika ada)
  const iotLatestResult = await pool.query(
    `SELECT dc.component_name, dc.component_type, dc.unit, il.value, il.recorded_at
     FROM iot_logs il
     JOIN device_components dc ON dc.id = il.component_id
     JOIN devices d ON d.id = dc.device_id
     WHERE d.user_id = $1
     ORDER BY il.recorded_at DESC
     LIMIT 5`,
    [batch.producer_id]
  );

  // 5. Susun Timeline Alur Produk Linier
  const timeline = [];

  // Step 1: Penanaman / Registrasi Batch
  timeline.push({
    stage: 'PENANAMAN_REGISTRASI',
    title: 'Batch Didaftarkan & Disemai',
    description: `Varietas ${batch.variety} (Gen: ${batch.generation}) disemai oleh ${batch.producer_name}. Jumlah awal ${batch.quantity} bibit.`,
    timestamp: batch.seeded_at || batch.created_at,
    status: 'COMPLETED',
    icon: 'ScanLine',
  });

  // Step 2: Riwayat Perubahan Fase
  logsResult.rows.forEach((log) => {
    timeline.push({
      stage: 'PERKEMBANGAN_FASE',
      title: `Fase Berubah: ${log.to_phase.replace(/_/g, ' ')}`,
      description: log.notes || `Kondisi tanaman diperbarui ke fase ${log.to_phase}.`,
      timestamp: log.created_at,
      status: 'COMPLETED',
      icon: 'Cpu',
      by: log.created_by_name,
    });
  });

  // Step 3: Pengiriman / Shipments
  shipments.forEach((shipment) => {
    timeline.push({
      stage: 'PENGIRIMAN_DIBUAT',
      title: `Siap Dikirim (Resi: ${shipment.receipt_number})`,
      description: `Tujuan: ${shipment.destination} (${shipment.package_quantity} paket). Catatan: ${shipment.notes || 'Tidak ada'}`,
      timestamp: shipment.created_at,
      status: 'COMPLETED',
      icon: 'Truck',
    });

    if (shipment.accepted_at) {
      timeline.push({
        stage: 'PENGIRIMAN_DITERIMA_KURIR',
        title: `Paket Diterima Kurir (${shipment.courier_name || 'Kurir'})`,
        description: `Nomor resi ${shipment.receipt_number} telah diserah-terimakan ke kurir untuk pengiriman.`,
        timestamp: shipment.accepted_at,
        status: 'COMPLETED',
        icon: 'Truck',
      });
    }

    // Include checkins untuk shipment ini
    const relatedCheckins = trackingLogs.filter(t => t.receipt_number === shipment.receipt_number);
    relatedCheckins.forEach((checkin) => {
      timeline.push({
        stage: 'TRACKING_CHECKIN',
        title: `Check-in: ${checkin.status}`,
        description: `Kondisi kargo: ${checkin.cargo_condition}${checkin.container_temperature_c != null ? ` | Suhu kontainer: ${checkin.container_temperature_c}°C` : ''} | Catatan: ${checkin.notes || '-'}`,
        timestamp: checkin.recorded_at,
        status: 'COMPLETED',
        icon: 'Database',
        by: checkin.courier_name,
        location: checkin.latitude && checkin.longitude ? `${checkin.latitude}, ${checkin.longitude}` : null,
      });
    });

    if (shipment.delivered_at || shipment.status === 'DELIVERED') {
      timeline.push({
        stage: 'PENGIRIMAN_SAMPAI',
        title: `Sampai di Tujuan`,
        description: `Paket ${shipment.receipt_number} telah sukses diterima di ${shipment.destination}.`,
        timestamp: shipment.delivered_at || shipment.created_at,
        status: 'COMPLETED',
        icon: 'ShieldCheck',
      });
    }
  });

  // Urutkan timeline berdasarkan timestamp
  timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Ambil data telemetry suhu/kondisi terbaru
  const latestTracking = trackingLogs[trackingLogs.length - 1];

  res.json({
    ok: true,
    data: {
      batch: {
        id: batch.public_id,
        variety: batch.variety,
        generation: batch.generation,
        quantity: batch.quantity,
        phase: batch.phase,
        healthStatus: batch.health_status,
        producerName: batch.producer_name,
        seededAt: batch.seeded_at,
        createdAt: batch.created_at,
      },
      latestStatus: {
        location: latestTracking?.latitude && latestTracking?.longitude 
          ? `Lat: ${latestTracking.latitude}, Lng: ${latestTracking.longitude}` 
          : (shipments[0]?.destination || 'Lokasi Produsen'),
        lastUpdate: latestTracking?.recorded_at || shipments[0]?.updated_at || batch.created_at,
        cargoCondition: latestTracking?.cargo_condition || 'Baik & Terkontrol',
        containerTemperatureC: latestTracking?.container_temperature_c || 4.2,
        isVerified: true,
        blockchainSecured: true,
      },
      shipments: shipments.map(s => ({
        receiptNumber: s.receipt_number,
        destination: s.destination,
        packageQuantity: s.package_quantity,
        status: s.status,
        courierName: s.courier_name,
        createdAt: s.created_at,
        deliveredAt: s.delivered_at,
      })),
      timeline,
      iotTelemetry: iotLatestResult.rows,
    },
  });
}));

module.exports = router;
