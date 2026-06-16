const express = require('express');
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { asyncHandler, createError } = require('../utils/http');
const mqttService = require('../services/mqtt.service');

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
            d.device_code as "deviceCode",
            d.box_name as "boxName",
            dc.id as componentId,
            dc.component_type as componentType,
            dc.component_name as "componentName",
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
  
  router.post('/components/:id/control', asyncHandler(async (req, res) => {
    const componentId = Number(req.params.id);
    const { value } = req.body; 

    const userId = req.user?.id || null; 

    if (!Number.isInteger(componentId)) {
      throw createError(400, 'ID komponen tidak valid.');
    }

    if (value === undefined) {
      throw createError(400, 'Nilai kontrol (value) tidak boleh kosong.');
    }

    // Standardisasi nilai ke huruf kapital dan hapus spasi tak sengaja
    // Ini menangani jika frontend mengirim "on", "off", "ON", atau "OFF"
    const normalizedValue = String(value).toUpperCase().trim();

    // PERBAIKAN: Ubah 'ONN' menjadi 'ON' agar sesuai dengan standar hardware/IoT
    if (!['ON', 'OFF'].includes(normalizedValue)) {
      throw createError(400, 'Nilai harus "ON" atau "OFF".');
    }

    // 1. Ambil info komponen dari database
    const componentResult = await pool.query(
      `select id, mqtt_topic, component_type 
      from device_components 
      where id = $1`,
      [componentId]
    );

    const component = componentResult.rows[0];

    if (!component) {
      throw createError(404, 'Komponen IoT tidak ditemukan di database.');
    }

    if (component.component_type !== 'actuator') {
      throw createError(400, 'Hanya komponen bertipe ACTUATOR yang bisa dikontrol.');
    }

    // 2. Tembak ke broker Mosquitto via mqtt.service menggunakan nilai yang sudah bersih
    let mqttStatus = 'FAILED';
    if (mqttService && typeof mqttService.publishToBroker === 'function') {
      try {
        // Mengirim string "ON" atau "OFF" yang murni ke hardware
        mqttService.publishToBroker(component.mqtt_topic, normalizedValue);
        console.log(`[MQTT] Berhasil kirim payload "${normalizedValue}" ke topik: ${component.mqtt_topic}`);
        mqttStatus = 'SUCCESS';
      } catch (mqttErr) {
        console.error('[MQTT] Gagal mengirim pesan ke broker:', mqttErr);
      }
    } else {
      console.warn('[MQTT] Fungsi publishToBroker tidak ditemukan di mqtt.service.js');
      mqttStatus = 'SENT'; 
    }

    // 3. Catat perintah dengan nilai terstandardisasi
    if (userId) {
      await pool.query(
        `insert into device_commands (component_id, command_value, status, issued_by, executed_at)
        values ($1, $2, $3, $4, now())`,
        [componentId, normalizedValue, mqttStatus, userId]
      );
    } else {
      console.warn('[DB] Perintah tidak dicatat ke device_commands karena token user_id kosong.');
    }

    res.json({
      ok: true,
      message: `Instruksi kontrol [${normalizedValue}] berhasil dikirim.`,
      data: { 
        topic: component.mqtt_topic, 
        value: normalizedValue,
        status: mqttStatus 
      }
    });
}));

module.exports = router;
