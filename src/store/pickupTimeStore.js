import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const defaultPickupTimes = [
  '09:00', '09:15', '09:30', '09:45', '10:00',
  '12:00', '12:15', '12:30', '13:00', '13:15',
  '16:00', '16:15', '16:30',
];

export const formatPickupTime = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${String(minutes).padStart(2, '0')} ${period}`;
};

export const usePickupTimeStore = create(
  persist(
    (set, get) => ({
      pickupTimes: defaultPickupTimes,

      addPickupTime: (time) => {
        if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time) || get().pickupTimes.includes(time)) {
          return false;
        }
        set(state => ({
          pickupTimes: [...state.pickupTimes, time].sort(),
        }));
        return true;
      },

      removePickupTime: (time) => set(state => ({
        pickupTimes: state.pickupTimes.filter(pickupTime => pickupTime !== time),
      })),
    }),
    { name: 'agni-pickup-times' }
  )
);
