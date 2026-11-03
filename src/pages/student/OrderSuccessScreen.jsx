import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, Clock, Home, ClipboardList } from 'lucide-react';
import { motion } from 'framer-motion';
import Button from '../../components/ui/Button';
import StatusChip from '../../components/ui/StatusChip';
import VegIcon from '../../components/ui/VegIcon';
import { useOrderStore } from '../../store/orderStore';
import { useAuthStore } from '../../store/authStore';
import { fetchOrderStatus } from '../../utils/api';

export const OrderSuccessScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const orderId = location.state?.orderId || new URLSearchParams(location.search).get('orderId');
  const order = useOrderStore(store => store.orders.find(item => item.id === orderId));
  const { user } = useAuthStore();
  const upsertOrder = useOrderStore(store => store.upsertOrder);
  const [verificationError, setVerificationError] = useState('');

  useEffect(() => {
    if (!orderId
      || (order?.paymentStatus === 'paid' && order.paymentVerifiedAt)
      || order?.paymentStatus === 'failed') return undefined;
    let active = true;
    const refreshPaymentStatus = async () => {
      try {
        const { order: latestOrder } = await fetchOrderStatus(orderId);
        if (active) {
          upsertOrder(latestOrder);
          setVerificationError('');
        }
      } catch (error) {
        if (active) setVerificationError(error.message);
      }
    };
    refreshPaymentStatus();
    const intervalId = window.setInterval(refreshPaymentStatus, 3000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [orderId, order?.paymentStatus, order?.paymentVerifiedAt, upsertOrder]);

  if (!order) {
    return (
      <div className="app-container min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <p className="text-ink-secondary mb-4">This order receipt is not available.</p>
        <Button onClick={() => navigate('/orders')} variant="primary">View Order History</Button>
      </div>
    );
  }

  const paymentConfirmed = order.paymentStatus === 'paid' && Boolean(order.paymentVerifiedAt);
  const paymentFailed = order.paymentStatus === 'failed';
  const pickupTime = order.pickupSlot?.label
    || order.pickupSlot?.startTime
    || 'As arranged with the canteen';
  const statusMessage = order.status === 'ready'
    ? 'Your order is ready. Collect it from the canteen counter now.'
    : order.status === 'picked_up'
      ? 'This order has been collected. Thank you!'
      : order.status === 'cancelled'
        ? 'This order was cancelled. Please contact the canteen if you need help.'
        : paymentFailed
          ? 'Payment failed. No collection token was generated. Return to your cart to place a new order.'
          : !paymentConfirmed
          ? 'Payment Verification Pending. The server is checking Razorpay securely; this page will update automatically.'
          : 'Wait for staff to call your order number, then collect it from the canteen counter.';

  return (
    <div className="app-container">
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-5 py-10">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="mb-4"
        >
          {paymentConfirmed
            ? <CheckCircle2 size={64} className="stroke-success fill-green-100" strokeWidth={2} />
            : <Clock size={64} className="stroke-amber-500" strokeWidth={1.8} />}
        </motion.div>

        <div className="text-center mb-5">
          <h1 className="text-2xl font-bold text-ink-primary mb-2">
            {paymentConfirmed
              ? 'Order Received'
              : paymentFailed
                ? 'Payment Failed'
                : 'Payment Verification Pending'}
          </h1>
          <p className="text-sm text-ink-secondary">
            {paymentConfirmed
              ? 'Your payment is confirmed. Keep the token number handy for collection.'
              : paymentFailed
                ? 'Your payment was not completed. No order token was issued.'
                : 'We will show your collection token after Razorpay confirms payment.'}
          </p>
        </div>

        <div className="w-full max-w-sm bg-surface-bg rounded-card p-5 mb-5">
          <div className="text-center pb-4 mb-4 border-b border-surface-border">
            <p className="text-xs font-semibold text-ink-secondary uppercase tracking-wide mb-1">
              {paymentConfirmed ? 'Your Collection Token' : 'Payment Status'}
            </p>
            <p className={`text-2xl font-extrabold tracking-wider ${paymentFailed ? 'text-red-600' : 'text-primary-500'}`}>
              {paymentConfirmed ? order.orderNumber || order.token : paymentFailed ? 'Payment Failed' : 'Verification Pending'}
            </p>
            <p className="text-xs text-ink-secondary mt-2">
              {paymentConfirmed
                ? 'Staff will call this number when your order is ready.'
                : paymentFailed
                  ? 'No collection token was created.'
                  : 'Checking payment confirmation securely with the server.'}
            </p>
          </div>

          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-ink-secondary uppercase tracking-wide">Date &amp; Time</span>
            <span className="text-sm font-semibold text-ink-primary text-right">
              {new Date(order.createdAt).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-ink-secondary uppercase tracking-wide">Pickup</span>
            <span className="text-sm font-semibold text-primary-500">{pickupTime}</span>
          </div>
          {order.pickupDate && (
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold text-ink-secondary uppercase tracking-wide">Pickup Date</span>
              <span className="text-sm font-semibold text-ink-primary">{order.pickupDate}</span>
            </div>
          )}
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-ink-secondary uppercase tracking-wide">Payment</span>
            <span className="text-sm font-semibold text-ink-primary">
              {order.paymentMethod || 'UPI'} · {paymentConfirmed ? 'Paid' : paymentFailed ? 'Failed' : 'Verification pending'}
            </span>
          </div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-semibold text-ink-secondary uppercase tracking-wide">Order Status</span>
            <StatusChip status={order.status} size="sm" />
          </div>

          <div className="pt-3 border-t border-surface-border">
            <p className="text-xs font-semibold text-ink-secondary uppercase tracking-wide mb-2">Items</p>
            {order.items.map((item, index) => (
              <div key={`${item.itemId || item.name}-${index}`} className="flex items-center gap-2 py-1">
                <VegIcon type={item.vegType} size={14} />
                <span className="flex-1 text-sm text-ink-primary">{item.name} × {item.qty}</span>
                <span className="text-sm font-medium text-ink-primary">
                  ₹{(item.price * item.qty).toFixed(2)}
                </span>
              </div>
            ))}
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-surface-border">
              <span className="text-sm font-bold text-ink-primary">
                {paymentConfirmed ? 'Total Paid' : 'Total Amount'}
              </span>
              <span className="text-lg font-extrabold text-ink-primary">₹{order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <p className="w-full max-w-sm text-center text-sm font-medium text-ink-primary mb-5">
          {statusMessage}
        </p>
        {verificationError && !paymentConfirmed && !paymentFailed && (
          <p role="status" className="w-full max-w-sm text-center text-xs text-amber-800 mb-4">
            Could not refresh payment status: {verificationError}. Retrying automatically.
          </p>
        )}

        <div className="w-full max-w-sm flex flex-col gap-3">
          <Button
            onClick={() => navigate('/orders')}
            variant="primary"
            fullWidth
            size="lg"
            icon={<ClipboardList size={18} />}
          >
            View Order History
          </Button>
          <Button
            onClick={() => navigate('/home')}
            variant="outline"
            fullWidth
            size="lg"
            icon={<Home size={18} />}
          >
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessScreen;
