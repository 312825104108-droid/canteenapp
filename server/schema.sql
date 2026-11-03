CREATE TABLE IF NOT EXISTS student_profiles (
  auth_user_id UUID PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  year TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS canteen_orders (
  id UUID PRIMARY KEY,
  idempotency_key UUID NOT NULL UNIQUE,
  auth_user_id UUID NOT NULL REFERENCES student_profiles(auth_user_id),
  user_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  student_id TEXT NOT NULL,
  items JSONB NOT NULL,
  subtotal_paise INTEGER NOT NULL,
  tax_paise INTEGER NOT NULL,
  total_paise INTEGER NOT NULL,
  pickup_slot JSONB,
  pickup_date TEXT,
  note TEXT NOT NULL DEFAULT '',
  order_status TEXT NOT NULL DEFAULT 'PENDING_PAYMENT',
  payment_status TEXT NOT NULL DEFAULT 'PENDING',
  payment_method TEXT NOT NULL DEFAULT 'UPI',
  payment_verified_at TIMESTAMPTZ,
  razorpay_order_id TEXT UNIQUE,
  razorpay_payment_id TEXT UNIQUE,
  token_date DATE,
  daily_token INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (token_date, daily_token)
);

ALTER TABLE canteen_orders
  ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES student_profiles(auth_user_id);

UPDATE canteen_orders
SET auth_user_id = CASE
  WHEN user_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    THEN user_id::uuid
  ELSE NULL
END
WHERE auth_user_id IS NULL
  AND CASE
    WHEN user_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      THEN EXISTS (
        SELECT 1 FROM student_profiles
        WHERE student_profiles.auth_user_id = canteen_orders.user_id::uuid
      )
    ELSE FALSE
  END;

ALTER TABLE canteen_orders
  ADD COLUMN IF NOT EXISTS payment_verified_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS daily_order_tokens (
  token_date DATE PRIMARY KEY,
  last_token INTEGER NOT NULL
);
