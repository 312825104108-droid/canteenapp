import { create } from 'zustand';

export const useOrderStore = create((set, get) => ({
  orders: [],
  currentOrderId: null,

  upsertOrder: orderData => {
    const existing = get().orders.find(item => item.id === orderData.id);
    const order = {
      ...existing,
      ...orderData,
      rating: orderData.rating ?? existing?.rating ?? null,
      review: orderData.review ?? existing?.review ?? null,
    };
    set(state => ({
      orders: [order, ...state.orders.filter(item => item.id !== order.id)],
      currentOrderId: order.id,
    }));
    return order;
  },

  rateOrder: (orderId, rating, review) => {
    set(state => ({
      orders: state.orders.map(order => order.id === orderId ? { ...order, rating, review } : order),
    }));
  },

  getOrderById: orderId => get().orders.find(order => order.id === orderId),

  setCurrentOrderId: id => set({ currentOrderId: id }),
}));
