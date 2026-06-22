const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const hpp = require('hpp');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const runMigrations = require('./config/migrate');
const setupSwagger = require('./config/swagger');
const logger = require('./config/logger');
const { correlationId } = require('./middleware/correlationId');
const requestLogger = require('./middleware/requestLogger');
const limiter = require('./middleware/rateLimiter');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const customerRoutes = require('./routes/customerRoutes');
const offerRoutes = require('./routes/offerRoutes');
const gapRoutes = require('./routes/gapRoutes');
const { metricsMiddleware, metricsEndpoint } = require('./middleware/metrics');

runMigrations();

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN === '*' ? '*' : process.env.CORS_ORIGIN?.split(',') || '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID']
}));
app.use(hpp());
app.use(express.json({ limit: '1mb' }));
app.use(correlationId);
app.use(requestLogger);
app.use(limiter);
app.use(metricsMiddleware);

setupSwagger(app);

app.get('/health', (_req, res) => {
  const db = require('./config/database');
  let dbStatus = 'ok';
  try {
    db.prepare('SELECT 1').get();
  } catch {
    dbStatus = 'degraded';
  }
  res.json({
    status: dbStatus === 'ok' ? 'ok' : 'degraded',
    service: 'softlend-api',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbStatus
  });
});

app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/offers', offerRoutes);
app.use('/api/v1/credit-gaps', gapRoutes);
app.use('/metrics', metricsEndpoint);

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = parseInt(process.env.PORT || '3000', 10);

app.listen(PORT, () => {
  logger.info(`Softlend API running on http://localhost:${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Swagger UI: http://localhost:${PORT}/api/docs`);
});

module.exports = app;
