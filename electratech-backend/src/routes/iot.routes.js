const express = require('express');
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { asyncHandler, createError } = require('../utils/http');

const router = express.Router();

router.use(requireAuth);

function getBatchAccessClause(req, paramIndex) {
  if (req.user.role === 'ADMIN') {
    return { clause: '', params: [] };
  }

  if (req.user.role === 'PRODUSEN') {
    return { clause: `and b.producer_id = $${paramIndex}`, params: [req.user.id] };
  }

  return {
    clause: `and exists (
      select 1
      from shipments s
      where s.batch_id = b.id and s.courier_id = $${paramIndex}
    )`,
    params: [req.user.id],
  };
}

router.get('/logs', asyncHandler(async (req, res) => {
  const { batchId, limit = 50 } = req.query;
  const access = getBatchAccessClause(req, 3);

  const result = await pool.query(
    `select il.id, b.public_id as batch_id, il.temperature_c, il.humidity_percent,
            il.light_lux, il.pump_on, il.fan_on, il.recorded_at
     from iot_logs il
     join batches b on b.id = il.batch_id
     where ($1::text is null or b.public_id = $1)
       ${access.clause}
     order by il.recorded_at desc
     limit $2`,
    [batchId || null, Math.min(Number(limit) || 50, 200), ...access.params],
  );

  res.json({ ok: true, data: result.rows });
}));

router.post('/logs', requireRole('ADMIN', 'PRODUSEN'), asyncHandler(async (req, res) => {
  const { batchId, temperatureC, humidityPercent, lightLux, pumpOn = false, fanOn = false } = req.body;

  if (temperatureC == null || humidityPercent == null || lightLux == null) {
    throw createError(400, 'temperatureC, humidityPercent, dan lightLux wajib diisi.');
  }

  const result = await pool.query(
    `insert into iot_logs (batch_id, temperature_c, humidity_percent, light_lux, pump_on, fan_on)
     select b.id, $2, $3, $4, $5, $6
     from batches b
     where b.public_id = $1
       and ($7::text = 'ADMIN' or b.producer_id = $8)
     returning id, temperature_c, humidity_percent, light_lux, pump_on, fan_on, recorded_at`,
    [batchId || null, temperatureC, humidityPercent, lightLux, pumpOn, fanOn, req.user.role, req.user.id],
  );

  if (!result.rows[0]) {
    throw createError(404, 'Batch tidak ditemukan atau bukan milik user login.');
  }

  res.status(201).json({ ok: true, data: result.rows[0] });
}));

module.exports = router;
