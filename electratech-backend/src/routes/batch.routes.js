const express = require('express');
const pool = require('../db/pool');
const { requireAuth, requireRole } = require('../middleware/auth');
const { asyncHandler, createError } = require('../utils/http');

const router = express.Router();

router.use(requireAuth);

router.get('/', asyncHandler(async (_req, res) => {
  const result = await pool.query(
    `select b.public_id as id, b.variety, b.generation, b.quantity, b.phase, b.health_status,
            u.name as producer_name, b.seeded_at, b.created_at
     from batches b
     join users u on u.id = b.producer_id
     order by b.created_at desc`,
  );

  res.json({ ok: true, data: result.rows });
}));

router.post('/', requireRole('ADMIN', 'PRODUSEN'), asyncHandler(async (req, res) => {
  const { publicId, variety, generation = 'G1', quantity, seededAt, healthStatus = 'SEHAT' } = req.body;

  if (!variety || !quantity) {
    throw createError(400, 'Varietas dan kuantitas wajib diisi.');
  }

  const result = await pool.query(
    `insert into batches (public_id, producer_id, variety, generation, quantity, seeded_at, health_status)
     values ($1, $2, $3, $4, $5, coalesce($6::date, current_date), $7)
     returning public_id as id, variety, generation, quantity, phase, health_status, seeded_at, created_at`,
    [publicId || null, req.user.id, variety, generation, quantity, seededAt || null, healthStatus],
  );

  res.status(201).json({ ok: true, data: result.rows[0] });
}));

router.get('/:batchId/logs', asyncHandler(async (req, res) => {
  const result = await pool.query(
    `select bl.id, b.public_id as batch_id, bl.from_phase, bl.to_phase, bl.notes, bl.created_at,
            u.name as created_by
     from batch_logs bl
     join batches b on b.id = bl.batch_id
     join users u on u.id = bl.created_by
     where b.public_id = $1
     order by bl.created_at desc`,
    [req.params.batchId],
  );

  res.json({ ok: true, data: result.rows });
}));

router.post('/:batchId/logs', requireRole('ADMIN', 'PRODUSEN'), asyncHandler(async (req, res) => {
  const { toPhase, notes, healthStatus } = req.body;

  if (!toPhase) {
    throw createError(400, 'Fase baru wajib diisi.');
  }

  const client = await pool.connect();

  try {
    await client.query('begin');

    const batchResult = await client.query(
      'select id, phase from batches where public_id = $1 for update',
      [req.params.batchId],
    );
    const batch = batchResult.rows[0];

    if (!batch) {
      throw createError(404, 'Batch tidak ditemukan.');
    }

    const logResult = await client.query(
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

    res.status(201).json({ ok: true, data: logResult.rows[0] });
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}));

module.exports = router;
