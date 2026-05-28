const { createError } = require('../utils/http');
const { verifyToken } = require('../utils/jwt');

function requireAuth(req, _res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(createError(401, 'Token autentikasi wajib dikirim.'));
  }

  const user = verifyToken(token);

  if (!user) {
    return next(createError(401, 'Token tidak valid atau sudah kedaluwarsa.'));
  }

  req.user = user;
  return next();
}

function requireRole(...roles) {
  return (req, _res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(createError(403, 'Role tidak memiliki akses ke endpoint ini.'));
    }

    return next();
  };
}

module.exports = {
  requireAuth,
  requireRole,
};
