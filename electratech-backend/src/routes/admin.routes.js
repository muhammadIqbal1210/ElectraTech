const express = require('express');
const pool = require('../db/pool');
const { requireAuth, requireRole } = require('../middleware/auth');
const { asyncHandler, createError } = require('../utils/http');
const { hashPassword } = require('../utils/password');

const router = express.Router();

router.use(requireAuth, requireRole('ADMIN'));

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

module.exports = router;
