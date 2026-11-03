import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.RAZORPAY_KEY_ID = 'rzp_test_unit_test';
process.env.RAZORPAY_KEY_SECRET = 'unit-test-key-secret';
process.env.RAZORPAY_WEBHOOK_SECRET = 'unit-test-webhook-secret';

const {
  createRazorpayClient,
  getIstDate,
  verifyCheckoutSignature,
  verifyWebhookSignature,
} = await import('./paymentService.js');

test('daily token date is calculated using Indian Standard Time', () => {
  assert.equal(getIstDate(new Date('2026-10-30T18:35:00.000Z')), '2026-10-31');
  assert.equal(getIstDate(new Date('2026-10-30T18:29:00.000Z')), '2026-10-30');
});

test('checkout signature accepts only the expected order/payment pair', () => {
  const signature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update('order_test_123|pay_test_456')
    .digest('hex');
  assert.equal(verifyCheckoutSignature('order_test_123', 'pay_test_456', signature), true);
  assert.equal(verifyCheckoutSignature('order_test_other', 'pay_test_456', signature), false);
  assert.equal(verifyCheckoutSignature('order_test_123', 'pay_test_456', 'not-a-signature'), false);
});

test('webhook signature validates the exact raw request body', () => {
  const body = Buffer.from('{"event":"payment.captured"}');
  const signature = crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(body)
    .digest('hex');
  assert.equal(verifyWebhookSignature(body, signature), true);
  assert.equal(verifyWebhookSignature(Buffer.from('{"event":"payment.failed"}'), signature), false);
});

test('live Razorpay credentials are rejected by the payment server', () => {
  const testKey = process.env.RAZORPAY_KEY_ID;
  process.env.RAZORPAY_KEY_ID = 'rzp_live_not_allowed';
  assert.throws(createRazorpayClient, /Only Razorpay Test Mode keys are allowed/);
  process.env.RAZORPAY_KEY_ID = testKey;
});
