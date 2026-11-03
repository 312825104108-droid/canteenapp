# Agni — Sri Sai Cafe

A mobile-first college canteen ordering application. Students can browse the menu, choose pickup times, pay through UPI, and collect orders using a daily token number.

## 🎨 Design

Matches the provided screenshots **exactly** in look, spacing, color, and interaction:
- **Colors**: Deep Royal Blue (#0252A1) primary accent, blue gradient headers
- **Typography**: Plus Jakarta Sans / Outfit, geometric sans-serif
- **Components**: Item cards, quantity steppers, filter chips, status chips, pickup selectors, payment rows
- **UX**: Mobile-first, one-hand usable, optimistic UI, smooth transitions

## ✨ Features

### UPI Test Payment Integration
- Razorpay Checkout is configured to offer UPI only and uses Razorpay Test Mode keys.
- The backend calculates order totals from the server menu and creates the Razorpay payment order.
- PostgreSQL stores pending orders, verified payment references, and sequential daily collection tokens.
- Checkout signatures, signed webhooks, and Razorpay's payment API are verified server-side before a token is issued.
- Student receipts poll for delayed confirmation; failed or unverified payments never receive a token.
- Staff orders and status updates use the same backend database and require a server-issued HttpOnly staff session cookie.
- Live Razorpay keys are rejected by the backend. Do not enable live payments from this build.

Student sign-in uses Supabase email OTP for confirmed `@act.edu.in` addresses. The backend verifies provider sessions and derives the student identity from the provider UUID. Supabase and PostgreSQL must be configured before students can sign in or place orders. This integration is for gateway testing only; production launch also requires deployment-level database, webhook, institutional enrollment verification, staff authentication, and operational configuration.

### Student Features
- ✅ **Splash & Onboarding** — 3-slide onboarding flow
- ✅ **Login/Signup** — Supabase email OTP for confirmed college email (@act.edu.in), profile setup
- ✅ **Home (Agni Canteen Menu)** — Direct access to categories, popular items, search, add to cart
- ✅ **Cart** — Quantity stepper, pickup-time selection, note to kitchen, payment summary
- ✅ **Payment** — Razorpay UPI-only test checkout with server-side verification
- ✅ **Order Receipt** — Daily token issued after confirmed payment; no QR pickup or live tracking
- ✅ **Orders List** — Persisted receipts and collection status
- ✅ **Favorites** — Saved items, quick add
- ✅ **Profile** — Edit profile, settings, dietary preference (veg-only mode), logout
- ✅ **Notifications** — Order updates, promotions
- ✅ **Search** — Live search, recent searches, popular dishes
- ✅ **Help** — FAQs, contact support

### Staff Features
- ✅ **Staff Login** — 4-digit PIN entry (demo: 1234)
- ✅ **Dashboard** — Server-synchronized orders and today's stats
- ✅ **Order Management** — Accept, reject, mark preparing, mark ready, mark collected
- ✅ **Menu Management** — (placeholder for adding/editing items)
- ✅ **Analytics** — (placeholder for sales charts)

## 🛠 Tech Stack

- **Framework**: React 18 + Vite
- **API**: Node.js + Express
- **Database**: PostgreSQL
- **Payments**: Official Razorpay Node SDK (Test Mode only)
- **Styling**: Tailwind CSS 3
- **Routing**: React Router 7
- **State Management**: Zustand (persistent cart and per-user favorites; order receipts loaded from backend)
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

## 🚀 Getting Started

### Prerequisites
- Node.js 20.19+ or 22.12+ and npm

### Installation

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# In another terminal, start the payment API (PostgreSQL and .env must be configured)
npm run server

# Build for production
npm run build

# Preview production build
npm run preview
```

The app will run on **http://localhost:3000**

## 📁 Project Structure

```
src/
├── components/
│   ├── ui/                   # Reusable UI components
│   └── layout/               # Layout components
├── pages/
│   ├── auth/                 # Login, signup
│   ├── student/              # Student-facing pages
│   └── admin/                # Staff dashboard
├── store/                    # Zustand stores
├── data/                     # Mock data
├── App.jsx
└── main.jsx
```

## Data and authentication notes

Menu items are currently sourced from local menu data. Student profiles, payment orders, and staff-managed order statuses are persisted in PostgreSQL. Student identity comes only from a confirmed Supabase session; no student ID entered by a customer is used for authorization. The staff PIN flow remains a local/demo credential mechanism and must be replaced with institutional staff authentication before production.

## Razorpay sandbox setup

1. Install and start PostgreSQL, then create an empty `agni_canteen` database.
2. Copy `.env.example` to `.env`. The provided Razorpay test API key file was used to populate local `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`; those values are ignored by Git and must never be copied into frontend variables.
3. Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` from the Supabase project settings. Configure matching server-only `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` in `.env`. Never expose the service-role key to Vite.
4. In Supabase Auth, enable email OTP, configure the college email sender, and update the Magic Link / OTP email template to include `{{ .Token }}` so users receive a six-digit code. Configure the project site URL and redirect allowlist for your app.
5. Set `DATABASE_URL` to your PostgreSQL credentials. Set `STAFF_PIN` for local testing and keep `STAFF_SESSION_SECRET` private. Do not put either in frontend code.
6. In the Razorpay dashboard, add a webhook for `payment.captured` and `payment.failed`, pointing to `https://<public-backend-host>/api/payments/webhook`. Use the exact value of `RAZORPAY_WEBHOOK_SECRET` in `.env` as the webhook secret. A public HTTPS callback/tunnel is required; Razorpay cannot reach a localhost webhook.
7. Run `npm run server` and `npm run dev` in separate terminals. Sign in with an accessible `@act.edu.in` mailbox, verify the real email OTP, and complete only a Razorpay Test Mode UPI payment.
8. Confirm `/api/health` reports the database and provider configuration as ready before attempting checkout.

The server creates the PostgreSQL tables from `server/schema.sql` at startup. Tokens are allocated transactionally in Asia/Kolkata time, beginning at `#001` each IST calendar day. They are assigned only after the gateway API reports a captured INR UPI payment for the exact order and amount. Repeated webhook delivery and repeated verification do not allocate another token.

Student sessions are verified against Supabase Auth by the backend on every student API request. The order owner and profile ID come from the verified Supabase UUID; client-supplied user IDs are ignored. Only confirmed `@act.edu.in` email accounts can create profiles or orders.

**Go-live blockers:** configure an approved Razorpay account and signed webhook on a deployed HTTPS backend, use managed PostgreSQL with backups/TLS, verify student eligibility against an authoritative enrollment roster or college SSO (a college email address alone does not prove current enrollment), replace the demo staff PIN with institutional staff authentication, configure production origins and shared rate limiting, and conduct Razorpay's required production approval. The server intentionally refuses live API keys.

## 📱 PWA Support

Install `vite-plugin-pwa` and add manifest.json for full PWA support.

## 📄 License

Built for educational/demo purposes.

---
**Happy coding! 🍽️**
# canteenapp
