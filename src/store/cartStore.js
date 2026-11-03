import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { mockMenuItems } from '../data/mockData';

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [], // { itemId, qty, customizations, note }
      outletId: null,
      outletName: '',
      note: '',
      selectedSlot: null,

      addItem: (itemId, outletId, outletName) => {
        const { items, outletId: currentOutletId } = get();
        const menuItem = mockMenuItems.find(i => i.id === itemId);
        if (!menuItem) return;

        // If adding from a different outlet, clear cart first
        if (currentOutletId && currentOutletId !== outletId) {
          set({
            items: [{ itemId, qty: 1, customizations: [], note: '' }],
            outletId,
            outletName,
          });
          return;
        }

        const existing = items.find(i => i.itemId === itemId);
        if (existing) {
          if (existing.qty >= menuItem.maxQtyPerOrder) {
            return { error: `Max ${menuItem.maxQtyPerOrder} per order` };
          }
          set({
            items: items.map(i =>
              i.itemId === itemId ? { ...i, qty: i.qty + 1 } : i
            ),
            outletId,
            outletName,
          });
        } else {
          set({
            items: [...items, { itemId, qty: 1, customizations: [], note: '' }],
            outletId,
            outletName,
          });
        }
      },

      removeItem: (itemId) => {
        const { items } = get();
        const existing = items.find(i => i.itemId === itemId);
        if (!existing) return;

        if (existing.qty <= 1) {
          const newItems = items.filter(i => i.itemId !== itemId);
          set({
            items: newItems,
            outletId: newItems.length === 0 ? null : get().outletId,
            outletName: newItems.length === 0 ? '' : get().outletName,
          });
        } else {
          set({
            items: items.map(i =>
              i.itemId === itemId ? { ...i, qty: i.qty - 1 } : i
            ),
          });
        }
      },

      removeLine: (itemId) => {
        const newItems = get().items.filter(item => item.itemId !== itemId);
        set({
          items: newItems,
          outletId: newItems.length === 0 ? null : get().outletId,
          outletName: newItems.length === 0 ? '' : get().outletName,
        });
      },

      setQty: (itemId, qty) => {
        const { items } = get();
        if (qty <= 0) {
          const newItems = items.filter(i => i.itemId !== itemId);
          set({
            items: newItems,
            outletId: newItems.length === 0 ? null : get().outletId,
            outletName: newItems.length === 0 ? '' : get().outletName,
          });
        } else {
          set({
            items: items.map(i =>
              i.itemId === itemId ? { ...i, qty } : i
            ),
          });
        }
      },

      setNote: (note) => set({ note }),

      setSlot: (slot) => set({ selectedSlot: slot }),

      clearCart: () => set({
        items: [],
        outletId: null,
        outletName: '',
        note: '',
        selectedSlot: null,
      }),

      getItemQty: (itemId) => {
        const item = get().items.find(i => i.itemId === itemId);
        return item ? item.qty : 0;
      },

      // Computed values
      get totalItems() {
        return get().items.reduce((sum, i) => sum + i.qty, 0);
      },

      get subtotal() {
        return get().items.reduce((sum, i) => {
          const menuItem = mockMenuItems.find(m => m.id === i.itemId);
          return sum + (menuItem ? menuItem.price * i.qty : 0);
        }, 0);
      },

      get taxes() {
        return Math.round(get().subtotal * 0.05 * 100) / 100;
      },

      get total() {
        return Math.round((get().subtotal + get().taxes) * 100) / 100;
      },
    }),
    {
      name: 'agni-cart',
      partialize: (state) => ({
        items: state.items,
        outletId: state.outletId,
        outletName: state.outletName,
        note: state.note,
        selectedSlot: state.selectedSlot,
      }),
    }
  )
);
