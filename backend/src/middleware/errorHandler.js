function errorHandler(err, req, res, next) {
  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err.message || err);
  if (err.stack) console.error(err.stack);
  const status = err.status || 500;
  res.status(status).json({
    message: err.message || 'Internal server error',
    ...(err.errors && { errors: err.errors }),
  });
}

module.exports = { errorHandler };
