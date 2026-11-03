import crypto from 'node:crypto';
import { timingSafeEqual } from 'node:crypto';
import Razorpay from 'razorpay';
import { pool } from './pool.js';

const IST_DATE = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Kolkata',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export const getIstDate = (date = new Date()) => IST_DATE.format(date);

const configurationError = message => {
  const error = new Error(message);
  error.status = 503;
  return error;
};

export const createRazorpayClient = () => {
  const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    throw configurationError('Razorpay Test Mode credentials are not configured on the server');
  }
  if (!RAZORPAY_KEY_ID.startsWith('rzp_test_')) {
    throw configurationError('Only Razorpay Test Mode keys are allowed by this application');
  }
  if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
    throw configurationError('Configure the Razorpay webhook secret before accepting test payments');
  }
  return new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
};

const safeEqualHex = (provided, expected) => {
  if (!/^[a-f0-9]+$/i.test(provided || '') || provided.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(provided, 'hex'), Buffer.from(expected, 'hex'));
};

export const verifyCheckoutSignature = (orderId, paymentId, signature) => {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret || !orderId || !paymentId || !signature) return false;
  const digest = crypto.createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return safeEqualHex(signature, digest);
};

export const verifyWebhookSignature = (body, signature) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const digest = crypto.createHmac('sha256', secret).update(body).digest('hex');
  return safeEqualHex(signature, digest);
};

const toClientOrder = row => ({
  id: row.id,
  userId: row.auth_user_id,
  customerName: row.customer_name,
  studentId: row.student_id,
  items: row.items,
  subtotal: row.subtotal_paise / 100,
  taxes: row.tax_paise / 100,
  total: row.total_paise / 100,
  pickupSlot: row.pickup_slot,
  pickupDate: row.pickup_date,
  outletName: 'Sri Sai Cafe',
  note: row.note,
  status: row.order_status === 'PENDING_PAYMENT' ? 'pending_payment' : row.order_status.toLowerCase(),
  paymentStatus: row.payment_status.toLowerCase(),
  paymentMethod: row.payment_method,
  orderNumber: row.daily_token == null ? null : `#${String(row.daily_token).padStart(3, '0')}`,
  tokenDate: row.token_date,
  paymentVerifiedAt: row.payment_verified_at,
  createdAt: row.created_at,
  razorpayOrderId: row.razorpay_order_id,
  razorpayPaymentId: row.razorpay_payment_id,
});

const fetchOrder = async (client, id, lock = false) => {
  const result = await client.query(
    `SELECT * FROM canteen_orders WHERE id = $1 ${lock ? 'FOR UPDATE' : ''}`,
    [id]
  );
  return result.rows[0] || null;
};

export const recordFailedPayment = async ({ appOrderId, paymentId, gatewayOrderId }) => {
  const initial = await pool.query('SELECT * FROM canteen_orders WHERE id = $1', [appOrderId]);
  const order = initial.rows[0];
  if (!order) throw new Error('Order not found');
  if (order.payment_status === 'PAID') return toClientOrder(order);
  if (order.razorpay_order_id !== gatewayOrderId) {
    throw new Error('Gateway order does not match the canteen order');
  }
  const payment = await createRazorpayClient().payments.fetch(paymentId);
  if (payment.order_id !== gatewayOrderId
    || payment.amount !== order.total_paise
    || payment.currency !== 'INR'
    || payment.status !== 'failed') {
    throw new Error('Gateway has not confirmed a failed payment for this order');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const row = await fetchOrder(client, appOrderId, true);
    if (!row) throw new Error('Order not found');
    if (row.payment_status !== 'PAID') {
      await client.query(
        `UPDATE canteen_orders
         SET payment_status = 'FAILED', order_status = 'PAYMENT_FAILED', updated_at = NOW()
         WHERE id = $1`,
        [appOrderId]
      );
    }
    const updated = await fetchOrder(client, appOrderId);
    await client.query('COMMIT');
    return toClientOrder(updated);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const confirmCapturedPayment = async ({ appOrderId, paymentId, gatewayOrderId }) => {
  const row = await pool.query('SELECT * FROM canteen_orders WHERE id = $1', [appOrderId]);
  const order = row.rows[0];
  if (!order) throw new Error('Order not found');
  if (!order.razorpay_order_id || order.razorpay_order_id !== gatewayOrderId) {
    throw new Error('Gateway order does not match the canteen order');
  }
  if (order.payment_status === 'PAID') {
    if (order.razorpay_payment_id !== paymentId) {
      throw new Error('A different payment reference has already paid this order');
    }
    return toClientOrder(order);
  }

  const payment = await createRazorpayClient().payments.fetch(paymentId);
  if (payment.order_id !== order.razorpay_order_id
    || payment.amount !== order.total_paise
    || payment.currency !== 'INR'
    || payment.status !== 'captured'
    || payment.method !== 'upi') {
    if (payment.status === 'failed') {
      await recordFailedPayment({ appOrderId, paymentId, gatewayOrderId });
    }
    throw new Error('Gateway payment is not a captured UPI payment for the expected amount and currency');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const current = await fetchOrder(client, appOrderId, true);
    if (!current) throw new Error('Order not found');
    if (current.payment_status === 'PAID') {
      if (current.razorpay_payment_id !== paymentId) {
        throw new Error('A different payment reference has already paid this order');
      }
      await client.query('COMMIT');
      return toClientOrder(current);
    }
    if (current.razorpay_order_id !== gatewayOrderId
      || current.total_paise !== payment.amount
      || !['PENDING', 'FAILED'].includes(current.payment_status)) {
      throw new Error('Order is no longer eligible for payment confirmation');
    }

    const tokenDate = getIstDate();
    const tokenResult = await client.query(
      `INSERT INTO daily_order_tokens (token_date, last_token)
       VALUES ($1::date, 1)
       ON CONFLICT (token_date)
       DO UPDATE SET last_token = daily_order_tokens.last_token + 1
       RETURNING last_token`,
      [tokenDate]
    );
    const token = tokenResult.rows[0].last_token;
    const updated = await client.query(
      `UPDATE canteen_orders
       SET payment_status = 'PAID', order_status = 'NEW',
           razorpay_payment_id = $2, token_date = $3::date, daily_token = $4,
           payment_verified_at = NOW(),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [appOrderId, paymentId, tokenDate, token]
    );
    await client.query('COMMIT');
    return toClientOrder(updated.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const createPaymentOrder = async ({ idempotencyKey, userId, customerName, studentId, items, pickupSlot, pickupDate, note }, menu) => {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idempotencyKey || '')
    || !userId || !customerName || !studentId || !Array.isArray(items) || items.length === 0 || items.length > 30) {
    const error = new Error('Order details are incomplete');
    error.status = 400;
    throw error;
  }

  const validatedItems = items.map(({ itemId, qty }) => {
    const product = menu.get(itemId);
    if (!product || !product.isAvailable || !Number.isInteger(qty) || qty < 1 || qty > product.maxQtyPerOrder) {
      const error = new Error('One or more items are unavailable or have an invalid quantity');
      error.status = 400;
      throw error;
    }
    return {
      itemId: product.id,
      name: product.name,
      qty,
      price: product.price,
      vegType: product.vegType,
    };
  });
  const subtotalPaise = Math.round(validatedItems.reduce((sum, item) => sum + item.price * item.qty, 0) * 100);
  const taxPaise = Math.round(subtotalPaise * 0.05);
  const totalPaise = subtotalPaise + taxPaise;
  const sameItems = existingItems => JSON.stringify(
    existingItems.map(({ itemId, qty }) => ({ itemId, qty }))
      .sort((a, b) => a.itemId.localeCompare(b.itemId))
  ) === JSON.stringify(
    validatedItems.map(({ itemId, qty }) => ({ itemId, qty }))
      .sort((a, b) => a.itemId.localeCompare(b.itemId))
  );
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [idempotencyKey]);
    let orderResult = await client.query(
      'SELECT * FROM canteen_orders WHERE idempotency_key = $1 FOR UPDATE',
      [idempotencyKey]
    );
    let order = orderResult.rows[0];
    if (order && order.user_id !== userId) {
      const error = new Error('Idempotency key already belongs to another order');
      error.status = 409;
      throw error;
    }

    if (!order) {
      const appOrderId = crypto.randomUUID();
      orderResult = await client.query(
        `INSERT INTO canteen_orders
         (id, idempotency_key, auth_user_id, user_id, customer_name, student_id, items, subtotal_paise, tax_paise, total_paise, pickup_slot, pickup_date, note)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING *`,
        [
          appOrderId, idempotencyKey, userId, userId, customerName, studentId, JSON.stringify(validatedItems),
          subtotalPaise, taxPaise, totalPaise, JSON.stringify(pickupSlot || null),
          pickupDate || null, String(note || '').slice(0, 100),
        ]
      );
      order = orderResult.rows[0];
    } else if (order.payment_status === 'PAID') {
      const error = new Error('This order has already been paid');
      error.status = 409;
      throw error;
    } else if (order.total_paise !== totalPaise
      || !sameItems(order.items)
      || order.pickup_date !== (pickupDate || null)
      || order.note !== String(note || '').slice(0, 100)) {
      const error = new Error('Idempotency key was reused with different order contents');
      error.status = 409;
      throw error;
    }

    let gatewayOrderId = order.razorpay_order_id;
    let gatewayAmount = order.total_paise;
    if (!gatewayOrderId || order.payment_status === 'FAILED') {
      const gatewayOrder = await createRazorpayClient().orders.create({
        amount: order.total_paise,
        currency: 'INR',
        receipt: order.id,
        notes: { canteen_order_id: order.id },
      });
      gatewayOrderId = gatewayOrder.id;
      gatewayAmount = gatewayOrder.amount;
      orderResult = await client.query(
        `UPDATE canteen_orders
         SET razorpay_order_id = $2, payment_status = 'PENDING',
             order_status = 'PENDING_PAYMENT', updated_at = NOW()
         WHERE id = $1 RETURNING *`,
        [order.id, gatewayOrderId]
      );
      order = orderResult.rows[0];
    }

    await client.query('COMMIT');
    return {
      order: toClientOrder(order),
      checkout: {
        keyId: process.env.RAZORPAY_KEY_ID,
        orderId: gatewayOrderId,
        amount: gatewayAmount,
        currency: 'INR',
        name: 'Sri Sai Cafe',
        description: 'Agni College canteen order',
        appOrderId: order.id,
      },
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const getOrderForUser = async (orderId, userId) => {
  const result = await pool.query('SELECT * FROM canteen_orders WHERE id = $1 AND auth_user_id = $2', [orderId, userId]);
  return result.rows[0] ? toClientOrder(result.rows[0]) : null;
};

export const getAllOrders = async () => {
  const result = await pool.query('SELECT * FROM canteen_orders WHERE auth_user_id IS NOT NULL ORDER BY created_at DESC LIMIT 300');
  return result.rows.map(toClientOrder);
};

export const getOrdersForUser = async userId => {
  const result = await pool.query(
    'SELECT * FROM canteen_orders WHERE auth_user_id = $1 ORDER BY created_at DESC LIMIT 100',
    [userId]
  );
  return result.rows.map(toClientOrder);
};

export const updateOrderStatus = async (orderId, status) => {
  const result = await pool.query(
    `UPDATE canteen_orders SET order_status = $2, updated_at = NOW()
     WHERE id = $1 AND payment_status = 'PAID'
     RETURNING *`,
    [orderId, status]
  );
  return result.rows[0] ? toClientOrder(result.rows[0]) : null;
};
