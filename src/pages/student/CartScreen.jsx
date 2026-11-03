import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Minus, Heart, FileText, Trash2, Clock } from 'lucide-react';
import VegIcon from '../../components/ui/VegIcon';
import EmptyState from '../../components/ui/EmptyState';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { mockMenuItems, mockOutlets } from '../../data/mockData';
import { formatPickupTime, usePickupTimeStore } from '../../store/pickupTimeStore';
import toast from 'react-hot-toast';

const CartItemCard = ({ cartItem }) => {
  const { addItem, removeItem, removeLine, outletId, outletName } = useCartStore();
  const { user, toggleFavorite } = useAuthStore();
  const item = mockMenuItems.find(m => m.id === cartItem.itemId);
  if (!item) return null;

  const isFav = user?.favorites?.includes(item.id);

  return (
    <div className="flex gap-3 py-4 border-b border-surface-border last:border-0">
      <div className="relative flex-shrink-0">
        <img
          src={item.image}
          alt={item.name}
          className="w-20 h-20 object-cover rounded-image"
        />
        <button
          onClick={() => { toggleFavorite(item.id); toast.success(isFav ? 'Removed' : 'Saved'); }}
          className="absolute top-1 right-1 w-6 h-6 bg-white/80 rounded-full flex items-center justify-center"
          aria-label="Toggle favourite"
        >
          <Heart size={12} className={isFav ? 'fill-red-500 stroke-red-500' : 'stroke-gray-500'} />
        </button>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <VegIcon type={item.vegType} size={16} />
            <h3 className="text-sm font-bold text-ink-primary mt-1">{item.name}</h3>
            <p className="text-xs text-ink-secondary">{item.sizeLabel}</p>
            <p className="text-xs text-ink-secondary mt-1">₹{item.price.toFixed(2)} each</p>
            <p className="text-sm font-bold text-ink-primary mt-0.5">₹{(item.price * cartItem.qty).toFixed(2)}</p>
          </div>
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <div className="flex items-center bg-surface-dark rounded-button">
              <button
                onClick={() => removeItem(item.id)}
                className="w-8 h-8 flex items-center justify-center text-white font-bold"
                aria-label="Decrease quantity"
              >
                <Minus size={14} />
              </button>
              <span className="w-8 text-center text-white font-bold text-sm">{cartItem.qty}</span>
              <button
                onClick={() => {
                  if (cartItem.qty >= item.maxQtyPerOrder) {
                    toast.error(`Max ${item.maxQtyPerOrder} per order`);
                    return;
                  }
                  addItem(item.id, outletId, outletName);
                }}
                className="w-8 h-8 flex items-center justify-center text-white font-bold"
                aria-label="Increase quantity"
              >
                <Plus size={14} />
              </button>
            </div>
            <button
              onClick={() => removeLine(item.id)}
              className="flex items-center gap-1 text-xs font-medium text-red-600"
              aria-label={`Remove ${item.name} from cart`}
            >
              <Trash2 size={14} />
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const CartScreen = () => {
  const navigate = useNavigate();
  const { items, outletId, outletName, note, setNote, selectedSlot, setSlot } = useCartStore();
  const pickupTimes = usePickupTimeStore(state => state.pickupTimes);

  const outlet = mockOutlets.find(o => o.id === outletId);

  const subtotal = items.reduce((s, i) => {
    const m = mockMenuItems.find(m => m.id === i.itemId);
    return s + (m ? m.price * i.qty : 0);
  }, 0);
  const taxes = Math.round(subtotal * 0.05 * 100) / 100;
  const total = subtotal + taxes;
  const selectedTimeIsAvailable = pickupTimes.includes(selectedSlot?.time);

  if (items.length === 0) {
    return (
      <div className="app-container">
        <div className="min-h-screen bg-white flex flex-col">
          <div className="header-gradient px-4 pt-12 pb-6 flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center bg-white/70 rounded-full">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold text-ink-primary">My Cart</h1>
          </div>
          <EmptyState
            type="cart"
            title="Your cart is empty"
            description="Add items from a canteen to get started."
            ctaLabel="Start Shopping"
            onCta={() => navigate('/home')}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="min-h-screen bg-white flex flex-col">
        <div className="header-gradient px-4 pt-12 pb-5 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center bg-white/70 rounded-full">
              <ArrowLeft size={20} className="stroke-ink-primary" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-ink-primary">My Cart</h1>
              <p className="text-sm text-ink-secondary">{outlet?.location}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pb-32">
          <div className="px-4 pt-4">
            <h2 className="text-base font-semibold text-ink-secondary mb-2">
              {items.reduce((s, i) => s + i.qty, 0)} {items.reduce((s, i) => s + i.qty, 0) === 1 ? 'item' : 'items'}
            </h2>
            {items.map(ci => (
              <CartItemCard key={ci.itemId} cartItem={ci} />
            ))}

            <button
              onClick={() => navigate('/home')}
              className="flex items-center gap-2 text-blue-link font-semibold text-sm mt-3 py-2 underline"
            >
              Continue Shopping
            </button>
          </div>

          <div className="h-2 bg-surface-bg my-3" />

          <div className="px-4 py-2">
            <h3 className="text-base font-semibold text-ink-primary mb-2 flex items-center gap-2">
              <FileText size={16} />
              Note to kitchen
            </h3>
            <div className="relative">
              <textarea
                value={note}
                onChange={e => setNote(e.target.value.slice(0, 100))}
                placeholder="Any special instructions? (e.g., no onion, less spicy)"
                rows={2}
                className="w-full px-4 py-3 border-2 border-surface-border rounded-card text-sm
                           text-ink-primary placeholder:text-ink-disabled resize-none focus:border-primary-500"
              />
              <span className="absolute bottom-2 right-3 text-xs text-ink-secondary">{note.length}/100</span>
            </div>
          </div>

          <div className="h-2 bg-surface-bg my-3" />

          <div className="px-4 py-2">
            <h3 className="text-base font-semibold text-ink-primary mb-1 flex items-center gap-2">
              <Clock size={17} />
              Select Pickup Time
            </h3>
            <p className="text-xs text-ink-secondary mb-3">Choose when you plan to collect your order.</p>
            {pickupTimes.length === 0 ? (
              <p className="text-sm text-ink-secondary rounded-card bg-surface-bg p-4">
                Pickup times have not been configured yet. Please check back later.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {pickupTimes.map(time => (
                  <button
                    key={time}
                    type="button"
                    aria-pressed={selectedTimeIsAvailable && selectedSlot?.time === time}
                    onClick={() => setSlot({
                      id: time,
                      time,
                      label: formatPickupTime(time),
                      startTime: formatPickupTime(time),
                      endTime: formatPickupTime(time),
                    })}
                    className={`rounded-card border px-2 py-3 text-sm font-semibold transition-colors
                      ${selectedTimeIsAvailable && selectedSlot?.time === time
                        ? 'border-primary-500 bg-primary-50 text-primary-500'
                        : 'border-surface-border bg-white text-ink-primary hover:border-primary-300'}`}
                  >
                    {formatPickupTime(time)}
                  </button>
                ))}
              </div>
            )}
            {!selectedTimeIsAvailable && pickupTimes.length > 0 && (
              <p className="text-xs text-ink-secondary mt-2">Select a pickup time to continue.</p>
            )}
          </div>

          <div className="h-2 bg-surface-bg my-3" />

          <div className="px-4 py-2">
            <h3 className="text-base font-semibold text-ink-primary mb-3">Order Total</h3>
            <div className="flex justify-between text-sm">
              <span className="text-ink-secondary">Subtotal</span>
              <span className="text-ink-primary font-medium">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-ink-secondary">Service fee</span>
              <span className="text-ink-primary font-medium">₹{taxes.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center mt-3 pt-3 border-t border-surface-border">
              <span className="text-base font-bold text-ink-primary">Grand Total</span>
              <span className="text-xl font-extrabold text-ink-primary">₹{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 px-4 py-4 bg-white border-t border-surface-border">
          <button
            onClick={() => {
              if (!selectedTimeIsAvailable) {
                toast.error('Select a pickup time to continue');
                return;
              }
              navigate('/payment', { state: { total, subtotal, taxes } });
            }}
            disabled={!selectedTimeIsAvailable || pickupTimes.length === 0}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Proceed to Checkout · ₹{total.toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartScreen;
