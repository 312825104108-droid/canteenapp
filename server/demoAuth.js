import crypto from 'node:crypto';
import { demoAccounts } from '../src/data/demoAccounts.js';

const SESSION_COOKIE = 'agni_demo_session';
const SESSION_DURATION_SECONDS = 60 * 60;

export const isDemoModeEnabled = () => (
  process.env.NODE_ENV === 'development'
  && process.env.DEMO_MODE === 'true'
  && Boolean(process.env.STAFF_SESSION_SECRET)
);

const sign = value => crypto
  .createHmac('sha256', process.env.STAFF_SESSION_SECRET)
  .update(value)
  .digest('base64url');

const safeEqual = (left, right) => {
  const leftBuffer = Buffer.from(left || '');
  const rightBuffer = Buffer.from(right || '');
  return leftBuffer.length === rightBuffer.length
    && crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

export const authenticateDemoCredentials = (role, email, password) => {
  if (!isDemoModeEnabled()) return null;
  const account = role === 'student' ? demoAccounts.student : role === 'admin' ? demoAccounts.admin : null;
  if (!account || !safeEqual(String(email || '').trim().toLowerCase(), account.email)
    || !safeEqual(String(password || ''), account.password)) {
    return null;
  }
  return {
    role: role === 'admin' ? 'staff' : 'student',
    account,
  };
};

export const createDemoSessionToken = role => {
  if (!isDemoModeEnabled() || !['student', 'staff'].includes(role)) return null;
  const payload = Buffer.from(JSON.stringify({
    role,
    exp: Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS,
  })).toString('base64url');
  return `${payload}.${sign(payload)}`;
};

export const readDemoSession = request => {
  if (!isDemoModeEnabled()) return null;
  const token = request.get('cookie')
    ?.split(';')
    .map(cookie => cookie.trim())
    .find(cookie => cookie.startsWith(`${SESSION_COOKIE}=`))
    ?.slice(SESSION_COOKIE.length + 1);
  if (!token) return null;
  const [payload, signature] = token.split('.');
  if (!payload || !signature || !safeEqual(signature, sign(payload))) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!['student', 'staff'].includes(session.role) || session.exp <= Date.now() / 1000) return null;
    return session;
  } catch {
    return null;
  }
};

export const demoSessionCookie = token => (
  `${SESSION_COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/api; Max-Age=${SESSION_DURATION_SECONDS}`
);

export const clearedDemoSessionCookie = () => (
  `${SESSION_COOKIE}=; HttpOnly; SameSite=Strict; Path=/api; Max-Age=0`
);
