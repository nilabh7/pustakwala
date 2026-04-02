const nodemailer = require('nodemailer');
const logger = require('./logger');

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';

const EMAIL_ENABLED = (process.env.EMAIL_ENABLED || (isProduction ? 'true' : 'false')).toLowerCase() === 'true';
const EMAIL_VERIFY_ON_STARTUP = (process.env.EMAIL_VERIFY_ON_STARTUP || 'true').toLowerCase() === 'true';
const EMAIL_FAIL_FAST = (process.env.EMAIL_FAIL_FAST || (isProduction ? 'true' : 'false')).toLowerCase() === 'true';

const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
const smtpSecure = (process.env.SMTP_SECURE || String(smtpPort === 465)).toLowerCase() === 'true';
const smtpRequireTls = (process.env.SMTP_REQUIRE_TLS || 'true').toLowerCase() === 'true';

const requiredEnv = ['EMAIL_FROM', 'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];

function getMissingEmailEnv() {
  return requiredEnv.filter((key) => !process.env[key]);
}

function buildTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: smtpPort,
    secure: smtpSecure,
    requireTLS: smtpRequireTls,
    pool: true,
    maxConnections: parseInt(process.env.SMTP_MAX_CONNECTIONS || '5', 10),
    maxMessages: parseInt(process.env.SMTP_MAX_MESSAGES || '100', 10),
    connectionTimeout: parseInt(process.env.SMTP_CONNECTION_TIMEOUT_MS || '10000', 10),
    greetingTimeout: parseInt(process.env.SMTP_GREETING_TIMEOUT_MS || '10000', 10),
    socketTimeout: parseInt(process.env.SMTP_SOCKET_TIMEOUT_MS || '20000', 10),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: (process.env.SMTP_TLS_REJECT_UNAUTHORIZED || 'true').toLowerCase() === 'true',
    },
  });
}

let transporter = null;
let transportReady = false;
let startupVerified = false;
let startupError = null;

function ensureTransportConfigured() {
  if (!EMAIL_ENABLED) return;

  const missing = getMissingEmailEnv();
  if (!missing.length) return;

  const message = `Email is enabled but missing environment variables: ${missing.join(', ')}`;
  startupError = new Error(message);
  if (EMAIL_FAIL_FAST) {
    throw startupError;
  }
  logger.warn(message);
}

function ensureTransporter() {
  if (!EMAIL_ENABLED) return null;
  if (transporter) return transporter;

  ensureTransportConfigured();
  if (startupError && EMAIL_FAIL_FAST) {
    throw startupError;
  }
  if (getMissingEmailEnv().length) return null;

  transporter = buildTransporter();
  return transporter;
}

async function verifyEmailTransport() {
  if (!EMAIL_ENABLED) {
    startupVerified = true;
    transportReady = false;
    logger.info('Email transport disabled');
    return { enabled: false, ready: false };
  }

  try {
    const mailer = ensureTransporter();
    if (!mailer) {
      return { enabled: true, ready: false, error: startupError?.message || 'Email transporter not configured' };
    }

    await mailer.verify();
    startupVerified = true;
    transportReady = true;
    startupError = null;
    logger.info(`Email transport verified via ${process.env.SMTP_HOST}:${process.env.SMTP_PORT}`);
    return { enabled: true, ready: true };
  } catch (err) {
    startupVerified = true;
    transportReady = false;
    startupError = err;
    logger.error(`Email transport verification failed: ${err.message}`);
    if (EMAIL_FAIL_FAST) {
      throw err;
    }
    return { enabled: true, ready: false, error: err.message };
  }
}

function getEmailStatus() {
  return {
    enabled: EMAIL_ENABLED,
    verifyOnStartup: EMAIL_VERIFY_ON_STARTUP,
    ready: transportReady,
    startupVerified,
    lastError: startupError?.message || null,
    host: process.env.SMTP_HOST || null,
    port: process.env.SMTP_PORT || null,
    from: process.env.EMAIL_FROM || null,
  };
}

async function sendMail({ to, subject, html, text, replyTo, throwOnFailure = false }) {
  if (!EMAIL_ENABLED) {
    logger.info(`Email skipped because EMAIL_ENABLED=false: ${subject} -> ${to}`);
    return { ok: false, skipped: true, reason: 'disabled' };
  }

  try {
    const mailer = ensureTransporter();
    if (!mailer) {
      const message = startupError?.message || 'Email transporter is not configured';
      if (throwOnFailure) throw new Error(message);
      logger.error(`Email skipped: ${message}`);
      return { ok: false, skipped: true, reason: message };
    }

    const info = await mailer.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
      replyTo: replyTo || process.env.EMAIL_REPLY_TO || undefined,
    });

    logger.info(`Email sent to ${to}: ${subject} (${info.messageId})`);
    return { ok: true, messageId: info.messageId };
  } catch (err) {
    logger.error(`Email failed to ${to}: ${err.message}`);
    if (throwOnFailure) throw err;
    return { ok: false, error: err.message };
  }
}

const templates = {
  welcome: (name) => ({
    subject: 'Welcome to Pustakwala',
    html: `<h2>Welcome, ${name}!</h2><p>Your account is ready. Happy reading!</p>`,
    text: `Welcome, ${name}! Your account is ready. Happy reading!`,
  }),
  verifyEmail: (name, link) => ({
    subject: 'Verify your Pustakwala email',
    html: `<h2>Hi ${name},</h2><p>Click <a href="${link}">here</a> to verify your email.</p>`,
    text: `Hi ${name}, verify your email here: ${link}`,
  }),
  passwordReset: (name, link) => ({
    subject: 'Reset your Pustakwala password',
    html: `<h2>Hi ${name},</h2><p>Click <a href="${link}">here</a> to reset your password. Link expires in 1 hour.</p>`,
    text: `Hi ${name}, reset your password here: ${link}. Link expires in 1 hour.`,
  }),
  sellerApproved: (name, storeName) => ({
    subject: 'Your Pustakwala seller account is approved',
    html: `<h2>Congratulations ${name}!</h2><p>Your store <strong>${storeName}</strong> is now live. Start listing your books!</p>`,
    text: `Congratulations ${name}! Your store ${storeName} is now live. Start listing your books!`,
  }),
  sellerRejected: (name, reason) => ({
    subject: 'Pustakwala Seller Application Update',
    html: `<h2>Hi ${name},</h2><p>Your seller application was not approved. Reason: ${reason}</p><p>You may re-apply after addressing the issues.</p>`,
    text: `Hi ${name}, your seller application was not approved. Reason: ${reason}. You may re-apply after addressing the issues.`,
  }),
  orderConfirmed: (name, orderNumber, total) => ({
    subject: `Order #${orderNumber} Confirmed`,
    html: `<h2>Hi ${name},</h2><p>Your order <strong>#${orderNumber}</strong> for Rs.${total} has been confirmed. We'll notify you when it ships.</p>`,
    text: `Hi ${name}, your order #${orderNumber} for Rs.${total} has been confirmed. We'll notify you when it ships.`,
  }),
  orderShipped: (name, orderNumber, tracking) => ({
    subject: `Your order #${orderNumber} is on the way`,
    html: `<h2>Hi ${name},</h2><p>Your order <strong>#${orderNumber}</strong> has been shipped. Tracking: <strong>${tracking}</strong></p>`,
    text: `Hi ${name}, your order #${orderNumber} has been shipped. Tracking: ${tracking}.`,
  }),
};

module.exports = {
  sendMail,
  templates,
  verifyEmailTransport,
  getEmailStatus,
  EMAIL_ENABLED,
  EMAIL_VERIFY_ON_STARTUP,
};
