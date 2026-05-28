const express = require('express');
const pool = require('../db/pool');
const { requireAuth, requireRole } = require('../middleware/auth');
const { asyncHandler, createError } = require('../utils/http');

const router = express.Router();

router.use(requireAuth);

function mapShipment(row) {
  return {
    id: row.id,
    receiptNumber: row.receipt_number,
    batchId: row.batch_id,
    variety: row.variety,
    generation: row.generation,
    producerName: row.producer_name,
    courierName: row.courier_name,
    destination: row.destination,
    packageQuantity: row.package_quantity,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
    acceptedAt: row.accepted_at,
    deliveredAt: row.delivered_at,
  };
}

router.get('/shipments', asyncHandler(async (req, res) => {
  const { status } = req.query;
  const params = [status || null];

  let ownershipClause = '';

  if (req.user.role === 'PRODUSEN') {
    params.push(req.user.id);
    ownershipClause = `and s.producer_id = $${params.length}`;
  } else if (req.user.role === 'KURIR') {
    params.push(req.user.id);
    ownershipClause = `and (s.courier_id = $${params.length} or s.courier_id is null)`;
  }

  const result = await pool.query(
    `select s.id, s.receipt_number, b.public_id as batch_id, b.variety, b.generation,
            s.producer_id, s.courier_id, producer.name as producer_name, courier.name as courier_name,
            s.destination, s.package_quantity, s.status, s.notes,
            s.created_at, s.accepted_at, s.delivered_at
     from shipments s
     join batches b on b.id = s.batch_id
     join users producer on producer.id = s.producer_id
     left join users courier on courier.id = s.courier_id
     where ($1::text is null or s.status = $1)
       ${ownershipClause}
     order by s.created_at desc`,
    params,
  );

  res.json({ ok: true, data: result.rows.map(mapShipment) });
}));

router.get('/shipments/:receiptNumber', asyncHandler(async (req, res) => {
  const result = await pool.query(
    `select s.id, s.receipt_number, b.public_id as batch_id, b.variety, b.generation,
            s.producer_id, s.courier_id, producer.name as producer_name, courier.name as courier_name,
            s.destination, s.package_quantity, s.status, s.notes,
            s.created_at, s.accepted_at, s.delivered_at
     from shipments s
     join batches b on b.id = s.batch_id
     join users producer on producer.id = s.producer_id
     left join users courier on courier.id = s.courier_id
     where s.receipt_number = $1
     limit 1`,
    [req.params.receiptNumber],
  );

  const shipment = result.rows[0];

  if (!shipment) {
    throw createError(404, 'Paket tidak ditemukan.');
  }

  if (req.user.role === 'PRODUSEN' && shipment.producer_id !== req.user.id) {
    throw createError(403, 'Paket ini bukan milik produsen login.');
  }

  res.json({ ok: true, data: mapShipment(shipment) });
}));

router.post('/shipments', requireRole('ADMIN', 'PRODUSEN'), asyncHandler(async (req, res) => {
  const { batchId, destination, packageQuantity, notes } = req.body;

  if (!batchId || !destination || !packageQuantity) {
    throw createError(400, 'Batch, tujuan, dan jumlah paket wajib diisi.');
  }

  const result = await pool.query(
    `insert into shipments (batch_id, producer_id, destination, package_quantity, notes)
     select b.id, $2, $3, $4, $5
     from batches b
     where b.public_id = $1
     returning id, receipt_number, destination, package_quantity, status, notes, created_at`,
    [batchId, req.user.id, destination, packageQuantity, notes || null],
  );

  if (!result.rows[0]) {
    throw createError(404, 'Batch tidak ditemukan.');
  }

  res.status(201).json({ ok: true, data: result.rows[0] });
}));

router.post('/shipments/:receiptNumber/accept', requireRole('ADMIN', 'KURIR'), asyncHandler(async (req, res) => {
  const result = await pool.query(
    `update shipments
     set courier_id = $1, status = 'ACCEPTED_BY_COURIER', accepted_at = coalesce(accepted_at, now()), updated_at = now()
     where receipt_number = $2 and status = 'READY_FOR_PICKUP' and courier_id is null
     returning receipt_number, status, accepted_at`,
    [req.user.id, req.params.receiptNumber],
  );

  if (!result.rows[0]) {
    throw createError(409, 'Paket tidak tersedia untuk diterima atau sudah diterima kurir lain.');
  }

  res.json({ ok: true, data: result.rows[0] });
}));

router.get('/', asyncHandler(async (req, res) => {
  const { receiptNumber } = req.query;

  const result = await pool.query(
    `select pt.id, pt.receipt_number, b.public_id as batch_id, u.name as courier_name,
            pt.status, pt.latitude, pt.longitude, pt.cargo_condition, pt.container_temperature_c,
            pt.notes, pt.recorded_at
     from package_tracking pt
     join batches b on b.id = pt.batch_id
     join users u on u.id = pt.courier_id
     where ($1::text is null or pt.receipt_number = $1)
     order by pt.recorded_at desc`,
    [receiptNumber || null],
  );

  res.json({ ok: true, data: result.rows });
}));

router.post('/checkins', requireRole('ADMIN', 'KURIR'), asyncHandler(async (req, res) => {
  const {
    receiptNumber,
    batchId,
    status,
    latitude,
    longitude,
    cargoCondition,
    containerTemperatureC,
    notes,
  } = req.body;

  if (!receiptNumber || !batchId || !status || !cargoCondition) {
    throw createError(400, 'Nomor resi, batchId, status, dan kondisi muatan wajib diisi.');
  }

  const shipmentResult = await pool.query(
    `select s.id, s.batch_id, s.courier_id, s.status
     from shipments s
     where s.receipt_number = $1
     limit 1`,
    [receiptNumber],
  );
  const shipment = shipmentResult.rows[0];

  if (!shipment) {
    throw createError(404, 'Paket belum dibuat oleh produsen.');
  }

  if (req.user.role === 'KURIR' && shipment.courier_id !== req.user.id) {
    throw createError(403, 'Kurir harus menerima paket ini sebelum check-in.');
  }

  const batchResult = await pool.query('select public_id from batches where id = $1 limit 1', [shipment.batch_id]);

  if (batchResult.rows[0]?.public_id !== batchId) {
    throw createError(400, 'Batch ID tidak cocok dengan nomor resi paket.');
  }

  const result = await pool.query(
    `insert into package_tracking (
       receipt_number, batch_id, courier_id, status, latitude, longitude,
       cargo_condition, container_temperature_c, notes
     )
     values ($1, (select id from batches where public_id = $2), $3, $4, $5, $6, $7, $8, $9)
     returning id, receipt_number, status, latitude, longitude, cargo_condition,
               container_temperature_c, notes, recorded_at`,
    [
      receiptNumber,
      batchId,
      req.user.id,
      status,
      latitude || null,
      longitude || null,
      cargoCondition,
      containerTemperatureC || null,
      notes || null,
    ],
  );

  const nextShipmentStatus = status === 'Diserahkan ke penerima' ? 'DELIVERED' : 'IN_TRANSIT';

  await pool.query(
    `update shipments
     set status = $1,
         delivered_at = case when $1 = 'DELIVERED' then coalesce(delivered_at, now()) else delivered_at end,
         updated_at = now()
     where receipt_number = $2`,
    [nextShipmentStatus, receiptNumber],
  );

  res.status(201).json({ ok: true, data: result.rows[0] });
}));

module.exports = router;
