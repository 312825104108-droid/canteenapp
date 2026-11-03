import { useState } from 'react';
import { Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import VegIcon from './VegIcon';
import { AddButton } from './Stepper';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

export const ItemCard = ({ item, outletId, outletName, onCardClick }) => {
  const { getItemQty, addItem, removeItem } = useCartStore();
  const { user, toggleFavorite } = useAuthStore();
  const qty = getItemQty(item.id);
  const isFav = user?.favorites?.includes(item.id);
  const [imgError, setImgError] = useState(false);

  const handleAdd = (e) => {
    e.stopPropagation();
    const result = addItem(item.id, outletId, outletName);
    if (result?.error) {
      toast.error(result.error);
    }
  };

  const handleIncrease = (e) => {
    e?.stopPropagation();
    if (qty >= item.maxQtyPerOrder) {
      toast.error(`Max ${item.maxQtyPerOrder} per order`);
      return;
    }
    addItem(item.id, outletId, outletName);
  };

  const handleDecrease = (e) => {
    e?.stopPropagation();
    removeItem(item.id);
  };

  const handleFav = (e) => {
    e.stopPropagation();
    if (!user) {
      toast.error('Login to save favourites');
      return;
    }
    toggleFavorite(item.id);
    toast.success(isFav ? 'Removed from favourites' : 'Added to favourites', { duration: 1500 });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      onClick={() => onCardClick?.(item)}
      className={`
        bg-white border border-surface-border rounded-card p-4 shadow-card
        flex gap-3 cursor-pointer transition-shadow hover:shadow-card-hover
        ${!item.isAvailable ? 'opacity-60' : ''}
      `}
    >
      {/* Left: info */}
      <div className="flex-1 flex flex-col gap-1 min-w-0">
        {/* Veg icon */}
        <VegIcon type={item.vegType} size={18} />

        {/* Item name */}
        <h3 className="text-base font-bold text-ink-primary leading-tight mt-1 line-clamp-2">
          {item.name}
        </h3>

        {/* Size/weight */}
        <p className="text-sm text-ink-secondary">{item.sizeLabel}</p>

        {/* Description */}
        {item.description && (
          <p className="text-xs text-ink-secondary line-clamp-2 mt-0.5">{item.description}</p>
        )}

        {/* Price */}
        <p className="text-base font-bold text-ink-primary mt-auto pt-1">
          ₹{item.price.toFixed(2)}
        </p>
      </div>

      {/* Right: image + controls */}
      <div className="flex flex-col items-center gap-2 flex-shrink-0">
        {/* Image container */}
        <div className="relative" style={{ width: 110, height: 110 }}>
          {/* Image */}
          <img
            src={imgError ? 'https://via.placeholder.com/110x110?text=Food' : item.image}
            alt={item.name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover rounded-image"
            loading="lazy"
          />

          {/* Heart icon */}
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={handleFav}
            aria-label={isFav ? 'Remove from favourites' : 'Add to favourites'}
            className="absolute top-1.5 right-1.5 w-7 h-7 bg-white/80 backdrop-blur-sm
                       rounded-full flex items-center justify-center shadow-sm"
          >
            <Heart
              size={14}
              className={isFav ? 'fill-red-500 stroke-red-500' : 'stroke-gray-500'}
            />
          </motion.button>

          {/* Sold out overlay */}
          {!item.isAvailable && (
            <div className="absolute inset-0 bg-white/70 rounded-image flex items-center justify-center">
              <span className="text-xs font-semibold text-ink-secondary bg-white/90 px-2 py-0.5 rounded-full">
                Sold out
              </span>
            </div>
          )}
        </div>

        {/* Add / Stepper — below image */}
        {item.isAvailable && (
          <div onClick={e => e.stopPropagation()}>
            <AddButton
              itemId={item.id}
              qty={qty}
              onAdd={handleAdd}
              onIncrease={handleIncrease}
              onDecrease={handleDecrease}
              max={item.maxQtyPerOrder}
              size="sm"
            />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ItemCard;
