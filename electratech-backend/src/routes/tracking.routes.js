const express = require('express');
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { asyncHandler, createError } = require('../utils/http');
const { recordToBlockchain, isBlockchainConfigured } = require('../services/blockchain.service');

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
    blockchainTxHash: row.blockchain_tx_hash || null,
  };
}

function getShipmentAccessClause(req, alias = 's', paramIndex = 1, includeUnassignedCourier = true) {
  if (req.user.role === 'ADMIN') {
    return { clause: '', params: [] };
  }

  if (req.user.role === 'PRODUSEN') {
    return { clause: `and ${alias}.producer_id = $${paramIndex}`, params: [req.user.id] };
  }

  return {
    clause: includeUnassignedCourier
      ? `and (${alias}.courier_id = $${paramIndex} or ${alias}.courier_id is null)`
      : `and ${alias}.courier_id = $${paramIndex}`,
    params: [req.user.id],
  };
}

async function recordShipmentBlockchainEvent(batchId, actionStatus, timestampStr = new Date().toISOString()) {
  if (!isBlockchainConfigured()) {
    return { success: false, recorded: false, reason: 'BLOCKCHAIN_NOT_CONFIGURED' };
  }

  return recordToBlockchain(batchId, actionStatus, timestampStr);
}

router.get('/shipments', asyncHandler(async (req, res) => {
  const { status } = req.query;
  const params = [status || null];
  const access = getShipmentAccessClause(req, 's', 2);

  const result = await pool.query(
    `select s.id, s.receipt_number, b.public_id as batch_id, b.variety, b.generation,
            s.producer_id, s.courier_id, producer.name as producer_name, courier.name as courier_name,
            s.destination, s.package_quantity, s.status, s.notes, s.blockchain_tx_hash,
            s.created_at, s.accepted_at, s.delivered_at
     from shipments s
     join batches b on b.id = s.batch_id
     join users producer on producer.id = s.producer_id
     left join users courier on courier.id = s.courier_id
     where ($1::text is null or s.status = $1)
       ${access.clause}
     order by s.created_at desc`,
    [...params, ...access.params],
  );

  res.json({ ok: true, data: result.rows.map(mapShipment), blockchainConfigured: isBlockchainConfigured() });
}));

router.get('/shipments/:receiptNumber', asyncHandler(async (req, res) => {
  const result = await pool.query(
    `select s.id, s.receipt_number, b.public_id as batch_id, b.variety, b.generation,
            s.producer_id, s.courier_id, producer.name as producer_name, courier.name as courier_name,
            s.destination, s.package_quantity, s.status, s.notes, s.blockchain_tx_hash,
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

  if (req.user.role === 'KURIR' && shipment.courier_id && shipment.courier_id !== req.user.id) {
    throw createError(403, 'Paket ini sedang ditangani kurir lain.');
  }

  res.json({ ok: true, data: mapShipment(shipment), blockchainConfigured: isBlockchainConfigured() });
}));

router.post('/shipments', requireRole('ADMIN', 'PRODUSEN'), asyncHandler(async (req, res) => {
  const { batchId, destination, packageQuantity, notes } = req.body;

  if (!batchId || !destination || !packageQuantity) {
    throw createError(400, 'Batch, tujuan, dan jumlah paket wajib diisi.');
  }

  const result = await pool.query(
    `insert into shipments (batch_id, producer_id, destination, package_quantity, notes)
     select b.id, b.producer_id, $2, $3, $4
     from batches b
     where b.public_id = $1
       and ($5::text = 'ADMIN' or b.producer_id = $6)
     returning id, receipt_number, destination, package_quantity, status, notes, created_at, batch_id`,
    [batchId, destination, packageQuantity, notes || null, req.user.role, req.user.id],
  );

  if (!result.rows[0]) {
    throw createError(404, 'Batch tidak ditemukan atau bukan milik user login.');
  }

  const shipment = result.rows[0];
  const bcResult = await recordShipmentBlockchainEvent(batchId, `SHIPMENT_CREATED:${shipment.receipt_number}`);

  if (bcResult.success) {
    await pool.query(
      `update shipments set blockchain_tx_hash = $1 where id = $2`,
      [bcResult.transactionHash, shipment.id],
    );
  }

  res.status(201).json({
    ok: true,
    data: {
      ...shipment,
      blockchain: {
        configured: isBlockchainConfigured(),
        recorded: bcResult.success,
        txHash: bcResult.transactionHash,
        reason: bcResult.reason || null,
      },
    },
  });
}));

router.post('/shipments/:receiptNumber/accept', requireRole('ADMIN', 'KURIR'), asyncHandler(async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const shipmentResult = await client.query(
      `update shipments
       set courier_id = $1,
           status = 'ACCEPTED_BY_COURIER',
           accepted_at = coalesce(accepted_at, now()),
           updated_at = now()
       where receipt_number = $2 and status = 'READY_FOR_PICKUP' and courier_id is null
       returning id, batch_id, receipt_number, status, accepted_at`,
      [req.user.id, req.params.receiptNumber],
    );

    const shipment = shipmentResult.rows[0];

    if (!shipment) {
      throw createError(409, 'Paket tidak tersedia untuk diterima atau sudah diterima kurir lain.');
    }

    await client.query(
      `insert into package_tracking (
         receipt_number, batch_id, courier_id, status,
         cargo_condition, notes, recorded_at
       )
       values ($1, $2, $3, $4, $5, $6, $7)`,
      [
        shipment.receipt_number,
        shipment.batch_id,
        req.user.id,
        'Diterima Kurir',
        'GOOD',
        'Paket berhasil diterima oleh kurir.',
        shipment.accepted_at,
      ],
    );

    await client.query('COMMIT');

    const batchPublicResult = await pool.query(
      `select public_id from batches where id = $1 limit 1`,
      [shipment.batch_id],
    );
    const batchPublicId = batchPublicResult.rows[0]?.public_id;
    const bcResult = await recordShipmentBlockchainEvent(batchPublicId, `SHIPMENT_ACCEPTED:${shipment.receipt_number}`);

    if (bcResult.success && batchPublicId) {
      await pool.query(
        `update shipments set blockchain_tx_hash = $1 where id = $2`,
        [bcResult.transactionHash, shipment.id],
      );
    }

    res.json({
      ok: true,
      data: shipment,
      blockchain: {
        configured: isBlockchainConfigured(),
        recorded: bcResult.success,
        txHash: bcResult.transactionHash,
        reason: bcResult.reason || null,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}));

router.get('/', asyncHandler(async (req, res) => {
  const { receiptNumber } = req.query;
  const access = getShipmentAccessClause(req, 's', 2, false);

  const result = await pool.query(
    `select pt.id, pt.receipt_number, b.public_id as batch_id, u.name as courier_name,
            pt.status, pt.latitude, pt.longitude, pt.cargo_condition, pt.container_temperature_c,
            pt.notes, pt.blockchain_tx_hash, pt.recorded_at
     from package_tracking pt
     join batches b on b.id = pt.batch_id
     join shipments s on s.receipt_number = pt.receipt_number
     join users u on u.id = pt.courier_id
     where ($1::text is null or pt.receipt_number = $1)
       ${access.clause}
     order by pt.recorded_at desc`,
    [receiptNumber || null, ...access.params],
  );

  res.json({ ok: true, data: result.rows, blockchainConfigured: isBlockchainConfigured() });
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

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const result = await client.query(
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

    await client.query(
      `update shipments
       set status = $1,
           delivered_at = case when $1 = 'DELIVERED' then coalesce(delivered_at, now()) else delivered_at end,
           updated_at = now()
       where receipt_number = $2`,
      [nextShipmentStatus, receiptNumber],
    );

    await client.query('COMMIT');

    const bcResult = await recordShipmentBlockchainEvent(batchId, `PACKAGE_TRACKING:${status}:${receiptNumber}`);

    if (bcResult.success) {
      await pool.query(
        `update package_tracking set blockchain_tx_hash = $1 where id = $2`,
        [bcResult.transactionHash, result.rows[0].id],
      );
    }

    res.status(201).json({
      ok: true,
      data: result.rows[0],
      blockchain: {
        configured: isBlockchainConfigured(),
        recorded: bcResult.success,
        txHash: bcResult.transactionHash,
        reason: bcResult.reason || null,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}));

module.exports = router;
