const logger = require('./logger');

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';

const parseBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
};

const EMAIL_ENABLED = parseBoolean(process.env.EMAIL_ENABLED, isProduction);
const EMAIL_VERIFY_ON_STARTUP = parseBoolean(process.env.EMAIL_VERIFY_ON_STARTUP, true);
const EMAIL_FAIL_FAST = parseBoolean(process.env.EMAIL_FAIL_FAST, isProduction);
const EMAIL_PROVIDER = (process.env.EMAIL_PROVIDER || (process.env.RESEND_API_KEY ? 'resend_api' : 'smtp')).toLowerCase();
const RESEND_API_URL = process.env.RESEND_API_URL || 'https://api.resend.com/emails';

const requiredEnvByProvider = {
  resend_api: ['EMAIL_FROM', 'RESEND_API_KEY'],
  smtp: ['EMAIL_FROM', 'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'],
};

let startupVerified = false;
let providerReady = false;
let startupError = null;

function getMissingEmailEnv() {
  const required = requiredEnvByProvider[EMAIL_PROVIDER] || ['EMAIL_FROM'];
  return required.filter((key) => !process.env[key]);
}

async function verifyResendConfig() {
  const missing = getMissingEmailEnv();
  if (missing.length) {
    throw new Error(`Email provider ${EMAIL_PROVIDER} is missing environment variables: ${missing.join(', ')}`);
  }

  providerReady = true;
  logger.info('Resend API email provider configured');
  return { enabled: true, ready: true, provider: EMAIL_PROVIDER };
}

async function verifyEmailTransport() {
  if (!EMAIL_ENABLED) {
    startupVerified = true;
    providerReady = false;
    startupError = null;
    logger.info('Email transport disabled');
    return { enabled: false, ready: false, provider: EMAIL_PROVIDER };
  }

  try {
    let result;
    if (EMAIL_PROVIDER === 'resend_api') {
      result = await verifyResendConfig();
    } else {
      const missing = getMissingEmailEnv();
      if (missing.length) {
        throw new Error(`Email provider ${EMAIL_PROVIDER} is missing environment variables: ${missing.join(', ')}`);
      }
      providerReady = true;
      logger.warn('SMTP email provider is configured, but Railway free tiers require HTTPS email APIs');
      result = { enabled: true, ready: true, provider: EMAIL_PROVIDER };
    }

    startupVerified = true;
    startupError = null;
    return result;
  } catch (err) {
    startupVerified = true;
    providerReady = false;
    startupError = err;
    logger.error(`Email provider verification failed: ${err.message}`);
    if (EMAIL_FAIL_FAST) throw err;
    return { enabled: true, ready: false, provider: EMAIL_PROVIDER, error: err.message };
  }
}

function getEmailStatus() {
  return {
    enabled: EMAIL_ENABLED,
    provider: EMAIL_PROVIDER,
    verifyOnStartup: EMAIL_VERIFY_ON_STARTUP,
    ready: providerReady,
    startupVerified,
    lastError: startupError?.message || null,
    from: process.env.EMAIL_FROM || null,
  };
}

async function sendWithResendApi({ to, subject, html, text, replyTo }) {
  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text: text || html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
      reply_to: replyTo || process.env.EMAIL_REPLY_TO || undefined,
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || `Resend API failed with status ${response.status}`);
  }

  return { ok: true, messageId: payload.id };
}

async function sendMail({ to, subject, html, text, replyTo, throwOnFailure = false }) {
  if (!EMAIL_ENABLED) {
    logger.info(`Email skipped because EMAIL_ENABLED=false: ${subject} -> ${to}`);
    return { ok: false, skipped: true, reason: 'disabled' };
  }

  try {
    if (EMAIL_PROVIDER !== 'resend_api') {
      throw new Error(`Unsupported email provider for this deployment profile: ${EMAIL_PROVIDER}`);
    }

    const result = await sendWithResendApi({ to, subject, html, text, replyTo });
    logger.info(`Email sent to ${Array.isArray(to) ? to.join(',') : to}: ${subject} (${result.messageId})`);
    return result;
  } catch (err) {
    logger.error(`Email failed to ${Array.isArray(to) ? to.join(',') : to}: ${err.message}`);
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
  verifyEmailOtp: (name, otp, minutes) => ({
    subject: 'Your Pustakwala verification OTP',
    html: `<h2>Hi ${name},</h2><p>Your Pustakwala verification code is <strong style="font-size:24px;letter-spacing:4px;">${otp}</strong>.</p><p>This OTP expires in ${minutes} minutes.</p>`,
    text: `Hi ${name}, your Pustakwala verification OTP is ${otp}. It expires in ${minutes} minutes.`,
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
