function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function createError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function notFoundHandler(req, _res, next) {
  next(createError(404, `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan.`));
}

function errorHandler(error, _req, res, _next) {
  const status = error.status || 500;

  res.status(status).json({
    ok: false,
    message: error.message || 'Terjadi kesalahan server.',
  });
}

module.exports = {
  asyncHandler,
  createError,
  errorHandler,
  notFoundHandler,
};
