const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const runMigrations = require('./config/migrate');
const logger = require('./config/logger');
const requestLogger = require('./middleware/requestLogger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const customerRoutes = require('./routes/customerRoutes');
const offerRoutes = require('./routes/offerRoutes');
const gapRoutes = require('./routes/gapRoutes');

runMigrations();

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());
app.use(requestLogger);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'softlend-api', timestamp: new Date().toISOString() });
});

app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/offers', offerRoutes);
app.use('/api/v1/credit-gaps', gapRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = parseInt(process.env.PORT || '3000', 10);

app.listen(PORT, () => {
  logger.info(`Softlend API running on http://localhost:${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
