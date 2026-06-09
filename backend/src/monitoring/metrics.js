const promClient = require('prom-client');

const collectDefaultMetrics = promClient.collectDefaultMetrics;
collectDefaultMetrics({ timeout: 5000 });

const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 5],
});

function metricsMiddleware(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;
    httpRequestDuration.observe(
      { method: req.method, route: sanitizeRoute(route), status_code: res.statusCode },
      duration,
    );
  });
  next();
}

function sanitizeRoute(route) {
  if (typeof route !== 'string') return 'unknown';
  return route.replace(/\/[0-9]+/g, '/:id');
}

async function metricsEndpoint(req, res) {
  res.set('Content-Type', promClient.register.contentType);
  res.end(await promClient.register.metrics());
}

module.exports = { metricsMiddleware, metricsEndpoint, httpRequestDuration };