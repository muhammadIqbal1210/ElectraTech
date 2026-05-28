const express = require('express');
const pool = require('../db/pool');
const { requireAuth, requireRole } = require('../middleware/auth');
const { asyncHandler, createError } = require('../utils/http');

const router = express.Router();

router.use(requireAuth);

router.get('/logs', asyncHandler(async (req, res) => {
  const { batchId, limit = 50 } = req.query;

  const result = await pool.query(
    `select il.id, b.public_id as batch_id, il.temperature_c, il.humidity_percent,
            il.light_lux, il.pump_on, il.fan_on, il.recorded_at
     from iot_logs il
     left join batches b on b.id = il.batch_id
     where ($1::text is null or b.public_id = $1)
     order by il.recorded_at desc
     limit $2`,
    [batchId || null, Math.min(Number(limit) || 50, 200)],
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
     values ((select id from batches where public_id = $1), $2, $3, $4, $5, $6)
     returning id, temperature_c, humidity_percent, light_lux, pump_on, fan_on, recorded_at`,
    [batchId || null, temperatureC, humidityPercent, lightLux, pumpOn, fanOn],
  );

  res.status(201).json({ ok: true, data: result.rows[0] });
}));

module.exports = router;
