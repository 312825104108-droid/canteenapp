import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Info, ShieldCheck } from 'lucide-react';
import VegIcon from '../../components/ui/VegIcon';
import { useCartStore } from '../../store/cartStore';
import { useOrderStore } from '../../store/orderStore';
import { useAuthStore } from '../../store/authStore';
import { mockMenuItems } from '../../data/mockData';
import { formatPickupTime, usePickupTimeStore } from '../../store/pickupTimeStore';
import { createPaymentOrder, reportPaymentFailure, verifyPayment } from '../../utils/api';
import toast from 'react-hot-toast';

const loadRazorpay = () => new Promise(resolve => {
  if (window.Razorpay) return resolve(true);
  const script = document.createElement('script');
  script.src = 'https://checkout.razorpay.com/v1/checkout.js';
  script.onload = () => resolve(Boolean(window.Razorpay));
  script.onerror = () => resolve(false);
  document.body.appendChild(script);
});

export const PaymentScreen = () => {
  const navigate = useNavigate();
  const { items, outletName, selectedSlot, note, clearCart } = useCartStore();
  const { upsertOrder } = useOrderStore();
  const { user } = useAuthStore();
  const pickupTimes = usePickupTimeStore(state => state.pickupTimes);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const idempotencyKey = useRef(null);
  const idempotencyFingerprint = useRef('');
  const cartItems = items.map(cartItem => ({
    cartItem,
    menuItem: mockMenuItems.find(item => item.id === cartItem.itemId),
  })).filter(({ menuItem }) => menuItem);
  const subtotal = cartItems.reduce((sum, { cartItem, menuItem }) => (
    sum + menuItem.price * cartItem.qty
  ), 0);
  const taxes = Math.round(subtotal * 0.05 * 100) / 100;
  const total = subtotal + taxes;
  const pickupTimeIsAvailable = pickupTimes.includes(selectedSlot?.time);

  const startPayment = async () => {
    if (isSubmitting || !user || cartItems.length === 0 || !pickupTimeIsAvailable) {
      toast.error('Please review your cart and pickup time');
      return;
    }

    setIsSubmitting(true);
    try {
      const requestItems = cartItems.map(({ cartItem }) => ({ itemId: cartItem.itemId, qty: cartItem.qty }));
      const pickupDate = new Date().toLocaleDateString('en-IN', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      const fingerprint = JSON.stringify({ requestItems, selectedSlot, note, pickupDate });
      if (idempotencyFingerprint.current !== fingerprint) {
        idempotencyKey.current = crypto.randomUUID();
        idempotencyFingerprint.current = fingerprint;
      }
      const { order, checkout } = await createPaymentOrder({
        idempotencyKey: idempotencyKey.current,
        items: requestItems,
        pickupSlot: selectedSlot,
        pickupDate,
        note,
      });

      if (!await loadRazorpay()) {
        throw new Error('Razorpay Checkout could not be loaded. Please try again.');
      }

      upsertOrder(order);
      const options = {
        key: checkout.keyId,
        order_id: checkout.orderId,
        amount: checkout.amount,
        currency: checkout.currency,
        name: checkout.name,
        description: checkout.description,
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.phone,
        },
        method: {
          upi: true,
          card: false,
          netbanking: false,
          wallet: false,
          emi: false,
          paylater: false,
        },
        config: {
          display: {
            blocks: {
              upi: { name: 'Pay using UPI', instruments: [{ method: 'upi' }] },
            },
            sequence: ['block.upi'],
            preferences: { show_default_blocks: false },
          },
        },
        handler: async result => {
          try {
            const verified = await verifyPayment({
              appOrderId: checkout.appOrderId,
              razorpay_order_id: result.razorpay_order_id,
              razorpay_payment_id: result.razorpay_payment_id,
              razorpay_signature: result.razorpay_signature,
            });
            upsertOrder(verified.order);
          } catch {
            toast('Payment verification is pending. We will check the secure payment status.');
          }
          clearCart();
          navigate(`/order-success?orderId=${encodeURIComponent(checkout.appOrderId)}`, {
            state: { orderId: checkout.appOrderId },
            replace: true,
          });
        },
        modal: {
          ondismiss: () => setIsSubmitting(false),
        },
        theme: { color: '#0252A1' },
      };
      const checkoutModal = new window.Razorpay(options);
      checkoutModal.on('payment.failed', async event => {
        try {
          const result = await reportPaymentFailure({
            appOrderId: checkout.appOrderId,
            razorpay_order_id: event.error?.metadata?.order_id || checkout.orderId,
            razorpay_payment_id: event.error?.metadata?.payment_id,
          });
          upsertOrder(result.order);
          clearCart();
          navigate(`/order-success?orderId=${encodeURIComponent(checkout.appOrderId)}`, {
            state: { orderId: checkout.appOrderId },
            replace: true,
          });
        } catch (error) {
          toast.error(`Payment status could not be confirmed yet: ${error.message}`);
          setIsSubmitting(false);
        }
      });
      checkoutModal.open();
    } catch (error) {
      toast.error(error.message || 'Could not start UPI payment');
      setIsSubmitting(false);
    }
  };

  if (cartItems.length === 0 || !pickupTimeIsAvailable) {
    return (
      <div className="app-container min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <h1 className="text-xl font-bold text-ink-primary mb-2">Checkout unavailable</h1>
        <p className="text-sm text-ink-secondary mb-5">
          Your cart or pickup time is no longer available. Please review your cart and choose an available time.
        </p>
        <button onClick={() => navigate('/cart')} className="btn-primary">Return to Cart</button>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="min-h-screen bg-white flex flex-col">
        <header className="header-gradient px-4 pt-12 pb-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/cart')}
              aria-label="Back to cart"
              className="w-10 h-10 flex items-center justify-center bg-white/70 rounded-full"
            >
              <ArrowLeft size={20} className="stroke-ink-primary" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-ink-primary">Checkout</h1>
              <p className="text-sm text-ink-secondary">{outletName}</p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-5 pb-8">
          <section className="mb-5">
            <h2 className="text-base font-bold text-ink-primary mb-3">Order Summary</h2>
            <div className="bg-white border border-surface-border rounded-card divide-y divide-surface-border">
              {cartItems.map(({ cartItem, menuItem }) => (
                <div key={cartItem.itemId} className="flex items-center gap-3 p-3">
                  <img
                    src={menuItem.image}
                    alt={menuItem.name}
                    className="w-14 h-14 object-cover rounded-image"
                  />
                  <VegIcon type={menuItem.vegType} size={16} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ink-primary">{menuItem.name}</p>
                    <p className="text-xs text-ink-secondary">Qty: {cartItem.qty}</p>
                  </div>
                  <p className="text-sm font-bold text-ink-primary">
                    ₹{(menuItem.price * cartItem.qty).toFixed(2)}
                  </p>
                </div>
              ))}
              <div className="p-3 space-y-2 bg-surface-bg">
                <div className="flex justify-between text-sm">
                  <span className="text-ink-secondary">Subtotal</span>
                  <span className="text-ink-primary">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-ink-secondary">Service fee</span>
                  <span className="text-ink-primary">₹{taxes.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-surface-border">
                  <span className="font-bold text-ink-primary">Total Amount</span>
                  <span className="font-extrabold text-ink-primary">₹{total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-5">
            <h2 className="text-base font-bold text-ink-primary mb-3">Pickup Details</h2>
            <div className="bg-primary-50 border border-primary-200 rounded-card p-4 flex items-center gap-3">
              <Clock size={20} className="stroke-primary-500" />
              <div>
                <p className="text-xs text-ink-secondary">Pickup date</p>
                <p className="text-sm font-semibold text-ink-primary">
                  {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </p>
                <p className="text-sm font-semibold text-primary-500">
                  {selectedSlot.label || formatPickupTime(selectedSlot.time)}
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-base font-bold text-ink-primary mb-3">UPI Payment</h2>
            <div className="bg-white border border-surface-border rounded-card p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-lg">₹</div>
                <div>
                  <p className="text-sm font-semibold text-ink-primary">UPI Payment</p>
                  <p className="text-xs text-ink-secondary">Only supported payment method</p>
                </div>
              </div>
              <div className="p-3 rounded-card bg-primary-50 border border-primary-200 flex gap-2">
                <ShieldCheck size={18} className="stroke-primary-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-900">
                  Payments are handled by Razorpay in UPI-only test mode. The server verifies payment status,
                  amount, currency, and order before generating your collection token.
                </p>
              </div>
              <div className="mt-3 p-3 rounded-card bg-amber-50 border border-amber-200 flex gap-2">
                <Info size={18} className="stroke-amber-700 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-900">
                  Test payments only. Do not enter a real UPI PIN or make a live payment from this environment.
                </p>
              </div>
            </div>
          </section>
        </main>

        <footer className="flex-shrink-0 px-4 py-4 bg-white border-t border-surface-border">
          <button
            type="button"
            onClick={startPayment}
            disabled={isSubmitting}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Opening secure payment…' : `Continue to secure UPI payment · ₹${total.toFixed(2)}`}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default PaymentScreen;
