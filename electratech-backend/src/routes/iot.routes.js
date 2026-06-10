const express = require('express');
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { asyncHandler, createError } = require('../utils/http');

const router = express.Router();

router.use(requireAuth);

function getDeviceAccessClause(req, paramIndex) {
  if (req.user.role === 'ADMIN') {
    return { clause: '', params: [] };
  }

  return { clause: `and d.user_id = $${paramIndex}`, params: [req.user.id] };
}

router.get('/devices', asyncHandler(async (req, res) => {
  const access = getDeviceAccessClause(req, 1);

  const result = await pool.query(
    `select
       d.id,
       d.device_code as "deviceCode",
       d.box_name as "boxName",
       json_agg(json_build_object(
         'id', dc.id,
         'componentType', dc.component_type,
         'componentName', dc.component_name,
         'unit', dc.unit,
         'dataType', dc.data_type,
         'mqttTopic', dc.mqtt_topic,
         'isActive', dc.is_active,
         'lastValue', il.value,
         'lastRecordedAt', il.recorded_at
       ) order by dc.id) as components
     from devices d
     join device_components dc on dc.device_id = d.id
     left join lateral (
       select value, recorded_at
       from iot_logs
       where component_id = dc.id
       order by recorded_at desc
       limit 1
     ) il on true
     where 1=1 ${access.clause}
     group by d.id
     order by d.created_at desc`,
    [...access.params],
  );

  res.json({ ok: true, data: result.rows.map((row) => ({
    ...row,
    components: row.components || [],
  })) });
}));

router.get('/logs', asyncHandler(async (req, res) => {
  const { deviceCode, limit = 50 } = req.query;
  const access = getDeviceAccessClause(req, 3);

  const result = await pool.query(
    `select il.id,
            d.device_code as deviceCode,
            d.box_name as boxName,
            dc.id as componentId,
            dc.component_type as componentType,
            dc.component_name as componentName,
            dc.mqtt_topic as mqttTopic,
            il.value,
            il.recorded_at
     from iot_logs il
     join device_components dc on dc.id = il.component_id
     join devices d on d.id = dc.device_id
     where ($1::text is null or d.device_code = $1)
       ${access.clause}
     order by il.recorded_at desc
     limit $2`,
    [deviceCode || null, Math.min(Number(limit) || 50, 200), ...access.params],
  );

  res.json({ ok: true, data: result.rows });
}));

router.post('/logs', requireRole('ADMIN', 'PRODUSEN'), asyncHandler(async (req, res) => {
  const { componentId, mqttTopic, value } = req.body;

  if (value == null || (!componentId && !mqttTopic)) {
    throw createError(400, 'componentId atau mqttTopic dan value wajib diisi.');
  }

  const query = componentId
    ? `select dc.id
       from device_components dc
       join devices d on d.id = dc.device_id
       where dc.id = $1
         ${req.user.role === 'ADMIN' ? '' : 'and d.user_id = $2'}
       limit 1`
    : `select dc.id
       from device_components dc
       join devices d on d.id = dc.device_id
       where dc.mqtt_topic = $1
         ${req.user.role === 'ADMIN' ? '' : 'and d.user_id = $2'}
       limit 1`;

  const params = componentId ? [componentId] : [mqttTopic];
  if (req.user.role !== 'ADMIN') params.push(req.user.id);

  const componentResult = await pool.query(query, params);

  if (!componentResult.rows[0]) {
    throw createError(404, 'Komponen IoT tidak ditemukan atau tidak punya akses.');
  }

  const insertResult = await pool.query(
    `insert into iot_logs (component_id, value)
     values ($1, $2)
     returning id, component_id, value, recorded_at`,
    [componentResult.rows[0].id, value],
  );

  res.status(201).json({ ok: true, data: insertResult.rows[0] });
}));

module.exports = router;
