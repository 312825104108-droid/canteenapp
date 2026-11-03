import test from 'node:test';
import assert from 'node:assert/strict';
import { getVerifiedStudentIdentity, normalizeCollegeEmail } from './studentIdentity.js';

const authUserId = '631c9aa8-a73f-411a-88da-8d30963dc122';

test('college email normalization accepts only the configured student domain', () => {
  assert.equal(normalizeCollegeEmail('  STUDENT@ACT.EDU.IN '), 'student@act.edu.in');
  assert.equal(normalizeCollegeEmail('student@gmail.com'), null);
  assert.equal(normalizeCollegeEmail('student@notact.edu.in'), null);
});

test('backend identity comes from a confirmed provider user UUID', () => {
  assert.deepEqual(
    getVerifiedStudentIdentity({
      id: authUserId,
      email: 'student@act.edu.in',
      email_confirmed_at: '2026-11-02T10:00:00Z',
    }),
    { id: authUserId, email: 'student@act.edu.in' }
  );
  assert.equal(getVerifiedStudentIdentity({
    id: authUserId,
    email: 'student@act.edu.in',
    email_confirmed_at: null,
  }), null);
  assert.equal(getVerifiedStudentIdentity({
    id: authUserId,
    email: 'student@gmail.com',
    email_confirmed_at: '2026-11-02T10:00:00Z',
  }), null);
  assert.equal(getVerifiedStudentIdentity({
    id: 'demo-user-id',
    email: 'student@act.edu.in',
    email_confirmed_at: '2026-11-02T10:00:00Z',
  }), null);
});
