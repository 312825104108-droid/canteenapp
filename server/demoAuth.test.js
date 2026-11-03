import test from 'node:test';
import assert from 'node:assert/strict';
import {
  authenticateDemoCredentials,
  createDemoSessionToken,
  isDemoModeEnabled,
  readDemoSession,
} from './demoAuth.js';

const originalEnv = {
  NODE_ENV: process.env.NODE_ENV,
  DEMO_MODE: process.env.DEMO_MODE,
  STAFF_SESSION_SECRET: process.env.STAFF_SESSION_SECRET,
};

test.before(() => {
  process.env.NODE_ENV = 'development';
  process.env.DEMO_MODE = 'true';
  process.env.STAFF_SESSION_SECRET = 'unit-test-session-secret';
});

test.after(() => {
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

test('local demo credentials create role-bound signed sessions', () => {
  assert.equal(authenticateDemoCredentials('student', 'student.demo@act.edu.in', 'StudentDemo2026!')?.role, 'student');
  assert.equal(authenticateDemoCredentials('admin', 'admin.demo@srisai.local', 'AdminDemo2026!')?.role, 'staff');
  assert.equal(authenticateDemoCredentials('student', 'student.demo@act.edu.in', 'wrong'), null);
  const token = createDemoSessionToken('student');
  assert.equal(readDemoSession({ get: () => `agni_demo_session=${token}` })?.role, 'student');
  assert.equal(readDemoSession({ get: () => `agni_demo_session=${token}tampered` }), null);
});

test('demo mode is disabled outside local development or without its explicit flag', () => {
  process.env.NODE_ENV = 'production';
  assert.equal(isDemoModeEnabled(), false);
  assert.equal(authenticateDemoCredentials('student', 'student.demo@act.edu.in', 'StudentDemo2026!'), null);
  process.env.NODE_ENV = 'development';
  process.env.DEMO_MODE = 'false';
  assert.equal(isDemoModeEnabled(), false);
});
