const express = require('express');
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { asyncHandler, createError } = require('../utils/http');
const { hashPassword } = require('../utils/password');

const router = express.Router();

router.use(requireAuth, requireRole('ADMIN'));

function resolveComponentDataType(componentType) {
  return componentType === 'actuator' ? 'boolean' : 'number';
}

function toMqttTopicPart(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'component';
}

function buildMqttTopic(deviceCode, deviceId, componentName, index) {
  return `electra/${toMqttTopicPart(deviceCode)}/${deviceId}/${toMqttTopicPart(componentName)}_${index + 1}`;
}

router.get('/users', asyncHandler(async (_req, res) => {
  const result = await pool.query(
    `select public_id as id, name, username, role, status, created_at
     from users
     order by created_at desc`,
  );

  res.json({ ok: true, data: result.rows });
}));

router.post('/users', asyncHandler(async (req, res) => {
  const { publicId, name, username, password, role, status = 'ACTIVE' } = req.body;

  if (!name || !username || !password || !role) {
    throw createError(400, 'Nama, username, password, dan role wajib diisi.');
  }

  const result = await pool.query(
    `insert into users (public_id, name, username, password_hash, role, status)
     values ($1, $2, $3, $4, $5, $6)
     returning public_id as id, name, username, role, status, created_at`,
    [publicId || null, name, username, hashPassword(password), role, status],
  );

  res.status(201).json({ ok: true, data: result.rows[0] });
}));

router.put('/users/:publicId', asyncHandler(async (req, res) => {
  const { name, username, password, role, status } = req.body;

  if (!name || !username || !role || !status) {
    throw createError(400, 'Nama, username, role, dan status wajib diisi.');
  }

  const params = password
    ? [name, username, role, status, hashPassword(password), req.params.publicId]
    : [name, username, role, status, req.params.publicId];
  const query = password
    ? `update users
       set name = $1, username = $2, role = $3, status = $4, password_hash = $5, updated_at = now()
       where public_id = $6
       returning public_id as id, name, username, role, status, created_at`
    : `update users
       set name = $1, username = $2, role = $3, status = $4, updated_at = now()
       where public_id = $5
       returning public_id as id, name, username, role, status, created_at`;

  const result = await pool.query(query, params);

  if (!result.rows[0]) {
    throw createError(404, 'User tidak ditemukan.');
  }

  res.json({ ok: true, data: result.rows[0] });
}));

router.get('/devices', asyncHandler(async (req, res) => {
  const { userId } = req.query;

  const result = await pool.query(
    `select d.id,
            u.public_id as user_id,
            d.device_code,
            d.box_name,
            d.created_at,
            coalesce(
              json_agg(
                json_build_object(
                  'id', dc.id,
                  'componentType', dc.component_type,
                  'componentName', dc.component_name,
                  'unit', dc.unit,
                  'dataType', dc.data_type,
                  'mqttTopic', dc.mqtt_topic,
                  'isActive', dc.is_active
                )
                order by dc.id
              ) filter (where dc.id is not null),
              '[]'::json
            ) as components
     from devices d
     join users u on u.id = d.user_id
     left join device_components dc on dc.device_id = d.id
     where ($1::text is null or u.public_id = $1)
     group by d.id, u.public_id
     order by d.created_at desc`,
    [userId || null],
  );

  res.json({ ok: true, data: result.rows });
}));

router.post('/devices', asyncHandler(async (req, res) => {
  const { userId, deviceCode, boxName, components = [] } = req.body;

  if (!userId || !deviceCode || !boxName) {
    throw createError(400, 'User, device code, dan nama box wajib diisi.');
  }

  if (!Array.isArray(components) || components.length === 0) {
    throw createError(400, 'Minimal satu komponen perangkat wajib diisi.');
  }

  components.forEach((component) => {
    if (!component.componentType || !component.componentName) {
      throw createError(400, 'Tipe dan nama komponen wajib diisi.');
    }

    if (!['sensor', 'actuator'].includes(component.componentType)) {
      throw createError(400, 'Tipe komponen harus sensor atau actuator.');
    }
  });

  const client = await pool.connect();

  try {
    await client.query('begin');

    const deviceResult = await client.query(
      `insert into devices (user_id, device_code, box_name)
       select id, $2, $3
       from users
       where public_id = $1
       returning id, device_code, box_name, created_at`,
      [userId, deviceCode, boxName],
    );

    if (!deviceResult.rows[0]) {
      throw createError(404, 'User tidak ditemukan.');
    }

    const device = deviceResult.rows[0];
    const componentRows = [];

    for (const [index, component] of components.entries()) {
      const componentResult = await client.query(
        `insert into device_components
          (device_id, component_type, component_name, unit, data_type, mqtt_topic, is_active)
         values ($1, $2, $3, $4, $5, $6, $7)
         returning id, component_type, component_name, unit, data_type, mqtt_topic, is_active`,
        [
          device.id,
          component.componentType,
          component.componentName,
          component.componentType === 'sensor' ? component.unit || null : null,
          resolveComponentDataType(component.componentType),
          buildMqttTopic(device.device_code, device.id, component.componentName, index),
          component.isActive ?? true,
        ],
      );
      componentRows.push(componentResult.rows[0]);
    }

    await client.query(
      `insert into device_configuration_logs (device_id, action, description, changed_by)
       select $1, 'CREATE', $2, id
       from users
       where public_id = $3`,
      [device.id, `Perangkat ${device.device_code} didaftarkan.`, userId],
    );

    await client.query('commit');

    res.status(201).json({
      ok: true,
      data: {
        id: device.id,
        user_id: userId,
        device_code: device.device_code,
        box_name: device.box_name,
        created_at: device.created_at,
        components: componentRows.map((component) => ({
          id: component.id,
          componentType: component.component_type,
          componentName: component.component_name,
          unit: component.unit,
          dataType: component.data_type,
          mqttTopic: component.mqtt_topic,
          isActive: component.is_active,
        })),
      },
    });
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}));

router.put('/devices/:id', asyncHandler(async (req, res) => {
  const { userId, deviceCode, boxName, components = [] } = req.body;
  const deviceId = Number(req.params.id);

  if (!Number.isInteger(deviceId)) {
    throw createError(400, 'ID perangkat tidak valid.');
  }

  if (!userId || !deviceCode || !boxName) {
    throw createError(400, 'User, device code, dan nama box wajib diisi.');
  }

  if (!Array.isArray(components) || components.length === 0) {
    throw createError(400, 'Minimal satu komponen perangkat wajib diisi.');
  }

  components.forEach((component) => {
    if (!component.componentType || !component.componentName) {
      throw createError(400, 'Tipe dan nama komponen wajib diisi.');
    }

    if (!['sensor', 'actuator'].includes(component.componentType)) {
      throw createError(400, 'Tipe komponen harus sensor atau actuator.');
    }
  });

  const client = await pool.connect();

  try {
    await client.query('begin');

    const deviceResult = await client.query(
      `update devices d
       set user_id = u.id,
           device_code = $2,
           box_name = $3
       from users u
       where d.id = $4 and u.public_id = $1
       returning d.id, d.device_code, d.box_name, d.created_at`,
      [userId, deviceCode, boxName, deviceId],
    );

    if (!deviceResult.rows[0]) {
      throw createError(404, 'Perangkat atau user tidak ditemukan.');
    }

    await client.query('delete from device_components where device_id = $1', [deviceId]);

    const componentRows = [];
    for (const [index, component] of components.entries()) {
      const componentResult = await client.query(
        `insert into device_components
          (device_id, component_type, component_name, unit, data_type, mqtt_topic, is_active)
         values ($1, $2, $3, $4, $5, $6, $7)
         returning id, component_type, component_name, unit, data_type, mqtt_topic, is_active`,
        [
          deviceId,
          component.componentType,
          component.componentName,
          component.componentType === 'sensor' ? component.unit || null : null,
          resolveComponentDataType(component.componentType),
          buildMqttTopic(deviceCode, deviceId, component.componentName, index),
          component.isActive ?? true,
        ],
      );
      componentRows.push(componentResult.rows[0]);
    }

    await client.query(
      `insert into device_configuration_logs (device_id, action, description, changed_by)
       select $1, 'UPDATE', $2, id
       from users
       where public_id = $3`,
      [deviceId, `Konfigurasi perangkat ${deviceCode} diperbarui.`, userId],
    );

    await client.query('commit');

    const device = deviceResult.rows[0];
    res.json({
      ok: true,
      data: {
        id: device.id,
        user_id: userId,
        device_code: device.device_code,
        box_name: device.box_name,
        created_at: device.created_at,
        components: componentRows.map((component) => ({
          id: component.id,
          componentType: component.component_type,
          componentName: component.component_name,
          unit: component.unit,
          dataType: component.data_type,
          mqttTopic: component.mqtt_topic,
          isActive: component.is_active,
        })),
      },
    });
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}));

router.delete('/devices/:id', asyncHandler(async (req, res) => {
  const result = await pool.query(
    `delete from devices
     where id = $1
     returning id`,
    [req.params.id],
  );

  if (!result.rows[0]) {
    throw createError(404, 'Perangkat tidak ditemukan.');
  }

  res.json({ ok: true, data: result.rows[0] });
}));

module.exports = router;
