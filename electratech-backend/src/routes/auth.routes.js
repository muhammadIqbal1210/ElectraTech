const express = require('express');
const pool = require('../db/pool');
const { asyncHandler, createError } = require('../utils/http');
const { verifyPassword } = require('../utils/password');
const { signToken } = require('../utils/jwt');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/login', asyncHandler(async (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password) {
    throw createError(400, 'Username dan password wajib diisi.');
  }

  const result = await pool.query(
    `select id, public_id, name, username, role, password_hash, status
     from users
     where username = $1 and ($2::user_role is null or role = $2::user_role)
     limit 1`,
    [username, role || null],
  );

  const user = result.rows[0];

  if (!user || user.status !== 'ACTIVE' || !verifyPassword(password, user.password_hash)) {
    throw createError(401, 'Username, password, atau role tidak cocok.');
  }

  const token = signToken({
    id: user.id,
    publicId: user.public_id,
    name: user.name,
    username: user.username,
    role: user.role,
  });

  res.json({
    ok: true,
    token,
    user: {
      id: user.public_id,
      name: user.name,
      username: user.username,
      role: user.role,
    },
  });
}));

router.get('/me', requireAuth, (req, res) => {
  res.json({ ok: true, user: req.user });
});

module.exports = router;
