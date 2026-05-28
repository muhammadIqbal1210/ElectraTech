const crypto = require('crypto');

const KEY_LENGTH = 64;

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, KEY_LENGTH).toString('hex');

  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  const [salt, hash] = storedHash.split(':');

  if (!salt || !hash) {
    return false;
  }

  const candidate = crypto.scryptSync(password, salt, KEY_LENGTH);
  const original = Buffer.from(hash, 'hex');

  return original.length === candidate.length && crypto.timingSafeEqual(original, candidate);
}

module.exports = {
  hashPassword,
  verifyPassword,
};
