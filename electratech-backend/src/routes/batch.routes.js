const express = require('express');
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { asyncHandler, createError } = require('../utils/http');
const {
  recordToBlockchain,
  getFromBlockchain,
  generateDataHash,
  isBlockchainConfigured,
} = require('../services/blockchain.service');

const router = express.Router();

router.use(requireAuth);

function getBatchAccessClause(req, alias = 'b') {
  if (req.user.role === 'ADMIN') {
    return { clause: '', params: [] };
  }

  if (req.user.role === 'PRODUSEN') {
    return { clause: `and ${alias}.producer_id = $1`, params: [req.user.id] };
  }

  return {
    clause: `and exists (
      select 1
      from shipments s
      where s.batch_id = ${alias}.id and s.courier_id = $1
    )`,
    params: [req.user.id],
  };
}

router.get('/', asyncHandler(async (req, res) => {
  const access = getBatchAccessClause(req);

  const result = await pool.query(
    `select b.public_id as id, b.variety, b.generation, b.quantity, b.phase, b.health_status,
            u.name as producer_name, b.seeded_at, b.created_at, b.blockchain_tx_hash
     from batches b
     join users u on u.id = b.producer_id
     where true
       ${access.clause}
     order by b.created_at desc`,
    access.params,
  );

  res.json({
    ok: true,
    data: result.rows.map((row) => ({
      ...row,
      blockchainConfigured: isBlockchainConfigured(),
    })),
  });
}));

router.get('/:batchId', asyncHandler(async (req, res) => {
  const access = getBatchAccessClause(req);
  const params = [req.params.batchId, ...access.params];
  const accessClause = access.clause.replace('$1', '$2');

  const batchResult = await pool.query(
    `select b.id, b.public_id, b.producer_id, b.variety, b.generation, b.quantity, b.phase,
            b.health_status, b.seeded_at, b.created_at, b.updated_at, b.blockchain_tx_hash,
            u.name as producer_name
     from batches b
     join users u on u.id = b.producer_id
     where b.public_id = $1
       ${accessClause}
     limit 1`,
    params,
  );

  const batch = batchResult.rows[0];

  if (!batch) {
    throw createError(404, 'Batch tidak ditemukan.');
  }

  const logsResult = await pool.query(
    `select bl.id, bl.from_phase, bl.to_phase, bl.notes, bl.created_at, bl.blockchain_tx_hash,
            u.name as created_by
     from batch_logs bl
     join users u on u.id = bl.created_by
     where bl.batch_id = $1
     order by bl.created_at asc`,
    [batch.id],
  );

  const onChainRecords = await getFromBlockchain(batch.public_id);

  res.json({
    ok: true,
    data: {
      ...batch,
      id: batch.public_id,
      blockchain: {
        configured: isBlockchainConfigured(),
        txHash: batch.blockchain_tx_hash,
        onChainRecordCount: onChainRecords.length,
        latestOnChainRecord: onChainRecords[onChainRecords.length - 1] || null,
      },
      logs: logsResult.rows,
    },
  });
}));

// 2. CREATE BATCH: Simpan DB PostgreSQL -> Catat Hash Pembuatan ke Polygon
router.post('/', requireRole('ADMIN', 'PRODUSEN'), asyncHandler(async (req, res) => {
  const { publicId, variety, generation = 'G1', quantity, seededAt, healthStatus = 'SEHAT' } = req.body;

  if (!variety || !quantity) {
    throw createError(400, 'Varietas dan kuantitas wajib diisi.');
  }

  const dbResult = await pool.query(
    `insert into batches (public_id, producer_id, variety, generation, quantity, seeded_at, health_status)
     values ($1, $2, $3, $4, $5, coalesce($6::date, current_date), $7)
     returning id, public_id, variety, generation, quantity, phase, health_status, seeded_at, created_at`,
    [publicId || null, req.user.id, variety, generation, quantity, seededAt || null, healthStatus],
  );

  const newBatch = dbResult.rows[0];

  const bcResult = await recordToBlockchain(
    newBatch.public_id,
    `CREATED: ${newBatch.phase}`,
    newBatch.created_at.toISOString(),
  );

  if (bcResult.success) {
    await pool.query(
      `update batches set blockchain_tx_hash = $1 where id = $2`,
      [bcResult.transactionHash, newBatch.id],
    );
  }

  res.status(201).json({
    ok: true,
    data: {
      ...newBatch,
      id: newBatch.public_id,
      blockchain: {
        configured: isBlockchainConfigured(),
        recorded: bcResult.success,
        txHash: bcResult.transactionHash,
        dataHash: bcResult.dataHash,
        reason: bcResult.reason || null,
      },
    },
  });
}));

router.get('/:batchId/logs', asyncHandler(async (req, res) => {
  const access = getBatchAccessClause(req);
  const params = [req.params.batchId, ...access.params];
  const accessClause = access.clause.replace('$1', '$2');

  const result = await pool.query(
    `select bl.id, b.public_id as batch_id, bl.from_phase, bl.to_phase, bl.notes, bl.created_at,
            bl.blockchain_tx_hash, u.name as created_by
     from batch_logs bl
     join batches b on b.id = bl.batch_id
     join users u on u.id = bl.created_by
     where b.public_id = $1
       ${accessClause}
     order by bl.created_at desc`,
    params,
  );

  res.json({
    ok: true,
    data: result.rows,
    blockchainConfigured: isBlockchainConfigured(),
  });
}));

router.post('/:batchId/logs', requireRole('ADMIN', 'PRODUSEN'), asyncHandler(async (req, res) => {
  const { toPhase, notes, healthStatus } = req.body;

  if (!toPhase) {
    throw createError(400, 'Fase baru wajib diisi.');
  }

  const client = await pool.connect();
  let logResult;
  let batchPublicId;

  try {
    await client.query('begin');

    const batchResult = await client.query(
      `select id, public_id, phase
       from batches
       where public_id = $1
         and ($2::text = 'ADMIN' or producer_id = $3)
       for update`,
      [req.params.batchId, req.user.role, req.user.id],
    );
    const batch = batchResult.rows[0];

    if (!batch) {
      throw createError(404, 'Batch tidak ditemukan.');
    }

    batchPublicId = batch.public_id;

    logResult = await client.query(
      `insert into batch_logs (batch_id, from_phase, to_phase, notes, created_by)
       values ($1, $2, $3, $4, $5)
       returning id, from_phase, to_phase, notes, created_at`,
      [batch.id, batch.phase, toPhase, notes || null, req.user.id],
    );

    await client.query(
      `update batches
       set phase = $1, health_status = coalesce($2, health_status), updated_at = now()
       where id = $3`,
      [toPhase, healthStatus || null, batch.id],
    );

    await client.query('commit');
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }

  const savedLog = logResult.rows[0];
  const bcResult = await recordToBlockchain(
    batchPublicId,
    `PHASE_CHANGE: ${savedLog.from_phase} -> ${savedLog.to_phase}`,
    savedLog.created_at.toISOString(),
  );

  if (bcResult.success) {
    await pool.query(
      `update batch_logs set blockchain_tx_hash = $1 where id = $2`,
      [bcResult.transactionHash, savedLog.id],
    );
  }

  res.status(201).json({
    ok: true,
    data: {
      ...savedLog,
      blockchain: {
        configured: isBlockchainConfigured(),
        recorded: bcResult.success,
        txHash: bcResult.transactionHash,
        dataHash: bcResult.dataHash,
        reason: bcResult.reason || null,
      },
    },
  });
}));

router.get('/:batchId/verify', asyncHandler(async (req, res) => {
  const { batchId } = req.params;

  const dbLogs = await pool.query(
    `select bl.id, bl.from_phase, bl.to_phase, bl.created_at, bl.blockchain_tx_hash
     from batch_logs bl
     join batches b on b.id = bl.batch_id
     where b.public_id = $1
     order by bl.created_at asc`,
    [batchId],
  );

  const onChainRecords = await getFromBlockchain(batchId);

  const verificationResult = dbLogs.rows.map((log, index) => {
    const statusText = `PHASE_CHANGE: ${log.from_phase} -> ${log.to_phase}`;
    const localHash = generateDataHash(batchId, statusText, log.created_at.toISOString());
    const onChainRecord = onChainRecords[index];

    const isAuthentic = Boolean(onChainRecord && onChainRecord.dataHash === localHash);

    return {
      logId: log.id,
      phaseChange: `${log.from_phase} -> ${log.to_phase}`,
      localHash,
      onChainHash: onChainRecord ? onChainRecord.dataHash : null,
      txHash: log.blockchain_tx_hash,
      isAuthentic,
    };
  });

  res.json({
    ok: true,
    batchId,
    blockchainConfigured: isBlockchainConfigured(),
    isFullyVerified: verificationResult.length > 0 && verificationResult.every((v) => v.isAuthentic),
    auditLogs: verificationResult,
  });
}));

module.exports = router;