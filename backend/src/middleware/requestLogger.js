const logger = require('../config/logger');
const { getCorrelationId } = require('./correlationId');

function requestLogger(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const reqId = getCorrelationId() || '-';
    logger.info(`[${reqId}] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });

  next();
}

module.exports = requestLogger;
