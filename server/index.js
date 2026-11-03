import 'dotenv/config';
import crypto from 'node:crypto';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import { mockMenuItems } from '../src/data/mockData.js';
import { initializeDatabase, pool } from './pool.js';
import { getVerifiedStudentIdentity, normalizeCollegeEmail } from './studentIdentity.js';
import { demoAccounts } from '../src/data/demoAccounts.js';
import {
  authenticateDemoCredentials,
  clearedDemoSessionCookie,
  createDemoSessionToken,
  demoSessionCookie,
  isDemoModeEnabled,
  readDemoSession,
} from './demoAuth.js';
import {
  confirmCapturedPayment,
  createPaymentOrder,
  getAllOrders,
  getOrdersForUser,
  getOrderForUser,
  recordFailedPayment,
  updateOrderStatus,
  verifyCheckoutSignature,
  verifyWebhookSignature,
} from './paymentService.js';

const app = express();
const port = Number(process.env.PORT || 8787);
const menu = new Map(mockMenuItems.map(item => [item.id, item]));
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:3001')
  .split(',')
  .map(origin => origin.trim());
const staffPin = process.env.STAFF_PIN;
const staffSessionSecret = process.env.STAFF_SESSION_SECRET;
const failedStaffAttempts = new Map();
const otpRateLimits = new Map();
const profileDepartments = new Set([
  'Computer Science', 'Electronics & Communication', 'Mechanical Engineering',
  'Civil Engineering', 'Information Technology', 'Electrical Engineering',
  'Chemical Engineering', 'Biomedical Engineering', 'MBA', 'MCA',
]);
const profileYears = new Set(['1st Year', '2nd Year', '3rd Year', '4th Year', 'PG 1st Year', 'PG 2nd Year']);
let studentAuthClient;
let studentOtpClient;

const getStudentAuthClient = () => {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    const error = new Error('Supabase student authentication is not configured on the backend');
    error.status = 503;
    throw error;
  }
  if (!studentAuthClient) {
    studentAuthClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return studentAuthClient;
};

const getStudentOtpClient = () => {
  const { SUPABASE_URL, SUPABASE_ANON_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    const error = new Error('Supabase OTP is not configured on the backend');
    error.status = 503;
    throw error;
  }
  if (!studentOtpClient) {
    studentOtpClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return studentOtpClient;
};

const authenticateStudent = async (req, res, next) => {
  const token = req.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (token) {
    if (token.length > 8192) {
      return res.status(401).json({ error: 'A valid student session is required' });
    }
    try {
      const { data, error } = await getStudentAuthClient().auth.getUser(token);
      const identity = error ? null : getVerifiedStudentIdentity(data?.user);
      if (!identity) {
        return res.status(401).json({ error: 'Student session is invalid or expired' });
      }
      const profileResult = await pool.query(
        'SELECT auth_user_id, email, name, department, year FROM student_profiles WHERE auth_user_id = $1',
        [identity.id]
      );
      req.student = {
        id: identity.id,
        email: identity.email,
        profile: profileResult.rows[0] || null,
      };
      return next();
    } catch (error) {
      if (error.status === 503) return res.status(503).json({ error: error.message });
      console.error('Student session validation failed:', error.name || 'Error');
      return res.status(401).json({ error: 'Student session could not be validated' });
    }
  }

  const demoSession = readDemoSession(req);
  if (demoSession?.role === 'student') {
    req.student = {
      id: demoAccounts.student.profile.id,
      email: demoAccounts.student.profile.email,
      profile: demoAccounts.student.profile,
      isDemo: true,
    };
    return next();
  }
  return res.status(401).json({ error: 'A valid student session is required' });
};

app.disable('x-powered-by');
app.use(helmet({
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://checkout.razorpay.com'],
      connectSrc: ["'self'", 'https://api.razorpay.com', 'https://checkout.razorpay.com'],
      frameSrc: ["'self'", 'https://*.razorpay.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      styleSrc: ["'self'", "'unsafe-inline'"],
      fontSrc: ["'self'", 'data:', 'https:'],
    },
  },
}));
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin is not allowed by CORS'));
  },
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

const signStaffSession = () => {
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 8;
  const payload = Buffer.from(JSON.stringify({ role: 'staff', exp })).toString('base64url');
  const signature = crypto.createHmac('sha256', staffSessionSecret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
};

const requireStaff = (req, res, next) => {
  const demoSession = readDemoSession(req);
  if (demoSession?.role === 'staff') {
    req.staffDemo = true;
    return next();
  }
  const token = req.get('cookie')
    ?.split(';')
    .map(cookie => cookie.trim())
    .find(cookie => cookie.startsWith('agni_staff_session='))
    ?.slice('agni_staff_session='.length);
  if (!staffSessionSecret || !token) return res.status(401).json({ error: 'Staff authentication required' });
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return res.status(401).json({ error: 'Invalid staff session' });
  const expected = crypto.createHmac('sha256', staffSessionSecret).update(payload).digest('base64url');
  const providedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (providedBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(providedBuffer, expectedBuffer)) {
    return res.status(401).json({ error: 'Invalid staff session' });
  }
  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (session.role !== 'staff' || session.exp < Date.now() / 1000) {
      return res.status(401).json({ error: 'Staff session expired' });
    }
  } catch {
    return res.status(401).json({ error: 'Invalid staff session' });
  }
  return next();
};

const apiError = (res, error) => {
  console.error('Payment API request failed:', error.name || 'Error');
  return res.status(error.status || 500).json({
    error: error.status ? error.message : 'The payment service could not complete the request',
  });
};

app.post('/api/payments/webhook', express.raw({ type: 'application/json', limit: '1mb' }), async (req, res) => {
  if (!Buffer.isBuffer(req.body) || !verifyWebhookSignature(req.body, req.get('x-razorpay-signature'))) {
    return res.status(400).json({ error: 'Invalid webhook signature' });
  }
  try {
    const event = JSON.parse(req.body.toString('utf8'));
    const payment = event.payload?.payment?.entity;
    if (event.event === 'payment.captured' && payment?.order_id && payment?.id) {
      const orderResult = await pool.query(
        'SELECT id FROM canteen_orders WHERE razorpay_order_id = $1',
        [payment.order_id]
      );
      if (orderResult.rows[0]) {
        await confirmCapturedPayment({
          appOrderId: orderResult.rows[0].id,
          paymentId: payment.id,
          gatewayOrderId: payment.order_id,
        });
      }
    } else if (event.event === 'payment.failed' && payment?.order_id && payment?.id) {
      const orderResult = await pool.query(
        'SELECT id FROM canteen_orders WHERE razorpay_order_id = $1',
        [payment.order_id]
      );
      if (orderResult.rows[0]) {
        await recordFailedPayment({
          appOrderId: orderResult.rows[0].id,
          paymentId: payment.id,
          gatewayOrderId: payment.order_id,
        });
      }
    }
    return res.json({ received: true });
  } catch (error) {
    return apiError(res, error);
  }
});

app.use(express.json({ limit: '100kb' }));

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    return res.json({
      status: 'ok',
      mode: 'test',
      database: 'connected',
      razorpayConfigured: Boolean(process.env.RAZORPAY_KEY_ID
        && process.env.RAZORPAY_KEY_SECRET
        && process.env.RAZORPAY_WEBHOOK_SECRET),
      staffConfigured: Boolean(staffPin && staffSessionSecret),
      studentAuthConfigured: Boolean(process.env.SUPABASE_URL
        && process.env.SUPABASE_ANON_KEY
        && process.env.SUPABASE_SERVICE_ROLE_KEY),
      localDemoEnabled: isDemoModeEnabled(),
    });
  } catch (error) {
    console.error('Payment API database health check failed:', error.name || 'Error');
    return res.status(503).json({
      status: 'unavailable',
      mode: 'test',
      database: 'unavailable',
      razorpayConfigured: Boolean(process.env.RAZORPAY_KEY_ID
        && process.env.RAZORPAY_KEY_SECRET
        && process.env.RAZORPAY_WEBHOOK_SECRET),
      staffConfigured: Boolean(staffPin && staffSessionSecret),
      studentAuthConfigured: Boolean(process.env.SUPABASE_URL
        && process.env.SUPABASE_ANON_KEY
        && process.env.SUPABASE_SERVICE_ROLE_KEY),
      localDemoEnabled: isDemoModeEnabled(),
    });
  }
});

app.post('/api/staff/session', (req, res) => {
  const ip = req.ip;
  const attempt = failedStaffAttempts.get(ip);
  if (attempt && attempt.until > Date.now() && attempt.count >= 5) {
    return res.status(429).json({ error: 'Too many attempts. Try again later.' });
  }
  if (!staffPin || !staffSessionSecret || req.body?.pin !== staffPin) {
    const next = attempt?.until > Date.now() ? attempt : { count: 0, until: Date.now() + 15 * 60 * 1000 };
    next.count += 1;
    failedStaffAttempts.set(ip, next);
    return res.status(401).json({ error: 'Invalid staff credentials' });
  }
  failedStaffAttempts.delete(ip);
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', [
    `agni_staff_session=${signStaffSession()}; HttpOnly; SameSite=Strict; Path=/api; Max-Age=28800${secure}`,
    clearedDemoSessionCookie(),
  ]);
  return res.json({ authenticated: true, expiresIn: 28800 });
});

app.post('/api/demo/session', (req, res) => {
  const account = authenticateDemoCredentials(req.body?.role, req.body?.email, req.body?.password);
  if (!account) return res.status(isDemoModeEnabled() ? 401 : 404).json({ error: 'Local demo sign-in is unavailable or credentials are invalid' });
  const token = createDemoSessionToken(account.role);
  if (!token) return res.status(404).json({ error: 'Local demo sign-in is unavailable' });
  res.setHeader('Set-Cookie', demoSessionCookie(token));
  return res.json({
    authenticated: true,
    role: account.role,
    profile: account.account.profile,
  });
});

app.delete('/api/demo/session', (_req, res) => {
  res.setHeader('Set-Cookie', clearedDemoSessionCookie());
  return res.json({ loggedOut: true });
});

app.post('/api/staff/logout', (_req, res) => {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', [
    `agni_staff_session=; HttpOnly; SameSite=Strict; Path=/api; Max-Age=0${secure}`,
    clearedDemoSessionCookie(),
  ]);
  return res.json({ loggedOut: true });
});

app.post('/api/auth/otp', async (req, res) => {
  const email = normalizeCollegeEmail(req.body?.email);
  if (!email) {
    return res.status(400).json({ error: 'Use a valid @act.edu.in college email address' });
  }
  const key = `${req.ip}:${email}`;
  const now = Date.now();
  const attempts = (otpRateLimits.get(key) || []).filter(timestamp => now - timestamp < 15 * 60 * 1000);
  if (attempts.length >= 3) {
    return res.status(429).json({ error: 'Too many verification requests. Please wait before trying again.' });
  }
  attempts.push(now);
  otpRateLimits.set(key, attempts);
  if (otpRateLimits.size > 10000) {
    for (const [entry, timestamps] of otpRateLimits) {
      if (!timestamps.some(timestamp => now - timestamp < 15 * 60 * 1000)) otpRateLimits.delete(entry);
    }
  }
  try {
    const { error } = await getStudentOtpClient().auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    if (error) {
      console.error('Student OTP request rejected by provider:', error.name || 'Error');
      return res.status(503).json({ error: 'The email verification service could not send a code. Please try again later.' });
    }
    return res.json({ sent: true });
  } catch (error) {
    return apiError(res, error);
  }
});

app.get('/api/student/profile', authenticateStudent, async (req, res) => {
  return res.json({ profile: req.student.profile ? {
    id: req.student.id,
    studentId: req.student.profile.studentId || req.student.id,
    email: req.student.email,
    name: req.student.profile.name,
    department: req.student.profile.department,
    year: req.student.profile.year,
  } : null });
});

app.post('/api/student/profile', authenticateStudent, async (req, res) => {
  if (req.student.isDemo) return res.status(403).json({ error: 'Profile changes are disabled for local demo accounts' });
  if (!req.body?.name || typeof req.body.name !== 'string'
    || req.body.name.trim().length < 2 || req.body.name.trim().length > 100
    || !profileDepartments.has(req.body.department)
    || !profileYears.has(req.body.year)) {
    return res.status(400).json({ error: 'Enter a valid name, department, and year of study' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO student_profiles (auth_user_id, email, name, department, year)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (auth_user_id) DO UPDATE SET
         name = EXCLUDED.name, department = EXCLUDED.department, year = EXCLUDED.year,
         updated_at = NOW()
       RETURNING auth_user_id, email, name, department, year`,
      [req.student.id, req.student.email, req.body.name.trim(), req.body.department, req.body.year]
    );
    const profile = result.rows[0];
    return res.json({ profile: {
      id: profile.auth_user_id,
      studentId: profile.auth_user_id,
      email: profile.email,
      name: profile.name,
      department: profile.department,
      year: profile.year,
    } });
  } catch (error) {
    return apiError(res, error);
  }
});

app.get('/api/staff/orders', requireStaff, async (req, res) => {
  if (req.staffDemo) return res.json({ orders: [] });
  try {
    return res.json({ orders: await getAllOrders() });
  } catch (error) {
    return apiError(res, error);
  }
});

app.get('/api/student/orders', authenticateStudent, async (req, res) => {
  if (req.student.isDemo) return res.json({ orders: [] });
  if (!req.student.profile) return res.status(403).json({ error: 'Complete your student profile first' });
  try {
    return res.json({ orders: await getOrdersForUser(req.student.id) });
  } catch (error) {
    return apiError(res, error);
  }
});

app.patch('/api/staff/orders/:id/status', requireStaff, async (req, res) => {
  if (req.staffDemo) return res.status(403).json({ error: 'Order changes are disabled for local demo accounts' });
  if (!['ACCEPTED', 'PREPARING', 'READY', 'PICKED_UP', 'CANCELLED'].includes(req.body?.status)) {
    return res.status(400).json({ error: 'Invalid order status' });
  }
  try {
    const order = await updateOrderStatus(req.params.id, req.body.status);
    return order
      ? res.json({ order })
      : res.status(404).json({ error: 'Paid order not found' });
  } catch (error) {
    return apiError(res, error);
  }
});

app.post('/api/payments/orders', authenticateStudent, async (req, res) => {
  if (req.student.isDemo) return res.status(403).json({ error: 'Payments are disabled for local demo accounts' });
  if (!req.student.profile) return res.status(403).json({ error: 'Complete your student profile first' });
  try {
    const { idempotencyKey, items, pickupSlot, pickupDate, note } = req.body || {};
    const result = await createPaymentOrder(
      {
        idempotencyKey,
        userId: req.student.id,
        customerName: req.student.profile.name,
        studentId: req.student.id,
        items,
        pickupSlot,
        pickupDate,
        note,
      },
      menu
    );
    return res.status(201).json(result);
  } catch (error) {
    return apiError(res, error);
  }
});

app.post('/api/payments/verify', authenticateStudent, async (req, res) => {
  if (req.student.isDemo) return res.status(403).json({ error: 'Payments are disabled for local demo accounts' });
  const { appOrderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
  if (!verifyCheckoutSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
    return res.status(400).json({ error: 'Payment signature verification failed' });
  }
  try {
    const result = await pool.query(
      'SELECT id, auth_user_id, razorpay_order_id FROM canteen_orders WHERE id = $1',
      [appOrderId]
    );
    if (!result.rows[0] || result.rows[0].auth_user_id !== req.student.id
      || result.rows[0].razorpay_order_id !== razorpay_order_id) {
      return res.status(404).json({ error: 'Payment order was not found' });
    }
    const order = await confirmCapturedPayment({
      appOrderId,
      paymentId: razorpay_payment_id,
      gatewayOrderId: razorpay_order_id,
    });
    return res.json({ order });
  } catch (error) {
    return apiError(res, error);
  }
});

app.post('/api/payments/failure', authenticateStudent, async (req, res) => {
  if (req.student.isDemo) return res.status(403).json({ error: 'Payments are disabled for local demo accounts' });
  const { appOrderId, razorpay_order_id, razorpay_payment_id } = req.body || {};
  if (!appOrderId || !razorpay_order_id || !razorpay_payment_id) {
    return res.status(400).json({ error: 'Payment failure reference is incomplete' });
  }
  try {
    const owner = await pool.query('SELECT auth_user_id FROM canteen_orders WHERE id = $1', [appOrderId]);
    if (owner.rows[0]?.auth_user_id !== req.student.id) {
      return res.status(404).json({ error: 'Payment order was not found' });
    }
    const order = await recordFailedPayment({
      appOrderId,
      paymentId: razorpay_payment_id,
      gatewayOrderId: razorpay_order_id,
    });
    return res.json({ order });
  } catch (error) {
    return apiError(res, error);
  }
});

app.get('/api/payments/orders/:id', authenticateStudent, async (req, res) => {
  if (req.student.isDemo) return res.status(404).json({ error: 'Order not found' });
  try {
    const order = await getOrderForUser(req.params.id, req.student.id);
    return order ? res.json({ order }) : res.status(404).json({ error: 'Order not found' });
  } catch (error) {
    return apiError(res, error);
  }
});

app.use((error, _req, res, _next) => {
  if (error.message === 'Origin is not allowed by CORS') {
    return res.status(403).json({ error: 'Origin is not allowed' });
  }
  return apiError(res, error);
});

await initializeDatabase();
const server = app.listen(port, () => {
  console.log(`Canteen payment API listening on port ${port} in Razorpay Test Mode`);
});

const shutdown = async () => {
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
