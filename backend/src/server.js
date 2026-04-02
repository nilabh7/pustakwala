require('dotenv').config();
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const routes = require('./routes/index');
const { notFound, errorHandler } = require('./middleware/error.middleware');
const logger = require('./utils/logger');
const { pool } = require('./models/db');
const { verifyEmailTransport, getEmailStatus, EMAIL_VERIFY_ON_STARTUP } = require('./utils/email');

if (!fs.existsSync('logs')) fs.mkdirSync('logs');
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

const app = express();
const PORT = process.env.PORT || 3000;
const API_PREFIX = process.env.API_PREFIX || '/api/v1';

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: (origin, cb) => {
    const allowed = (process.env.FRONTEND_URL || 'http://localhost:4200').split(',');
    if (!origin || allowed.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many auth attempts, please try again in 15 minutes' },
});

app.use(`${API_PREFIX}/auth/login`, authLimiter);
app.use(`${API_PREFIX}/auth/register`, authLimiter);
app.use(API_PREFIX, limiter);

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: { write: (msg) => logger.info(msg.trim()) },
  }));
}

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    const { version } = require('../package.json');
    const email = getEmailStatus();
    const hasEmailIssue = email.enabled && email.verifyOnStartup && !email.ready;
    res.json({
      status: hasEmailIssue ? 'degraded' : 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version,
      email,
    });
  } catch (err) {
    logger.error(`Healthcheck DB probe failed: ${err.message}`);
    res.status(503).json({ status: 'unhealthy', error: err.message });
  }
});

app.use(API_PREFIX, routes);

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, async () => {
  logger.info(`Pustakwala API running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  logger.info(`API base: ${API_PREFIX}`);

  try {
    await pool.query('SELECT 1');
    logger.info('Database connection verified');
  } catch (err) {
    logger.error(`Database connection verification failed: ${err.message}`);
  }

  if (EMAIL_VERIFY_ON_STARTUP) {
    try {
      await verifyEmailTransport();
    } catch (err) {
      logger.error(`Email startup verification aborted boot: ${err.message}`);
      process.exit(1);
    }
  }
});

const shutdown = async (signal) => {
  logger.info(`${signal} received, shutting down gracefully`);
  await pool.end();
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
});

module.exports = app;
