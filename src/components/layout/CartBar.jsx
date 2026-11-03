import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { mockMenuItems } from '../../data/mockData';

export const CartBar = () => {
  const navigate = useNavigate();
  const { items, outletId, outletName } = useCartStore();

  const totalItems = items.reduce((sum, i) => sum + i.qty, 0);
  const subtotal = items.reduce((sum, i) => {
    const mi = mockMenuItems.find(m => m.id === i.itemId);
    return sum + (mi ? mi.price * i.qty : 0);
  }, 0);
  const taxes = Math.round(subtotal * 0.05 * 100) / 100;
  const total = subtotal + taxes;

  return (
    <AnimatePresence>
      {totalItems > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed bottom-[72px] left-1/2 -translate-x-1/2 w-full max-w-[430px]
                     px-4 pb-2 z-40 pointer-events-none"
        >
          <div
            className="bg-[#2C2C2C] rounded-2xl px-4 py-3.5 flex items-center justify-between
                       shadow-[0_-4px_24px_rgba(0,0,0,0.2)] pointer-events-auto"
          >
            {/* Left: item count + price + outlet */}
            <div className="flex flex-col">
              <span className="text-white font-bold text-base leading-tight">
                {totalItems} {totalItems === 1 ? 'item' : 'items'} · ₹{total.toFixed(2)}
              </span>
              <span className="text-gray-400 text-[11px] font-medium tracking-wide uppercase mt-0.5 leading-tight">
                {outletName || 'AGNI CANTEEN'}
              </span>
            </div>

            {/* Right: checkout button */}
            <button
              onClick={() => navigate('/cart')}
              className="bg-[#0252A1] text-white font-bold px-5 py-2.5 rounded-xl
                         text-sm flex items-center gap-1.5 active:scale-95 transition-transform
                         hover:bg-[#023d7a]"
            >
              Checkout
              <ChevronRight size={16} strokeWidth={3} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CartBar;
