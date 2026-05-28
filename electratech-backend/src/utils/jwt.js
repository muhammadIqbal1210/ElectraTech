const crypto = require('crypto');

function base64Url(input) {
  return Buffer.from(JSON.stringify(input)).toString('base64url');
}

function signToken(payload, expiresInSeconds = 60 * 60 * 8) {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET belum diatur.');
  }

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'HS256', typ: 'JWT' };
  const body = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };
  const unsigned = `${base64Url(header)}.${base64Url(body)}`;
  const signature = crypto.createHmac('sha256', secret).update(unsigned).digest('base64url');

  return `${unsigned}.${signature}`;
}

function verifyToken(token) {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET belum diatur.');
  }

  const [header, payload, signature] = token.split('.');

  if (!header || !payload || !signature) {
    return null;
  }

  const unsigned = `${header}.${payload}`;
  const expected = crypto.createHmac('sha256', secret).update(unsigned).digest('base64url');

  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return null;
  }

  const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));

  if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }

  return decoded;
}

module.exports = {
  signToken,
  verifyToken,
};
