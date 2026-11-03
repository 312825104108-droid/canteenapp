import { getSupabaseClient } from './supabase';

const request = async (path, options = {}) => {
  let accessToken;
  try {
    const { data } = await getSupabaseClient().auth.getSession();
    accessToken = data.session?.access_token;
  } catch {
    accessToken = null;
  }
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error || `Request failed (${response.status})`);
  }
  return result;
};

export const createPaymentOrder = payload => request('/payments/orders', {
  method: 'POST',
  body: JSON.stringify(payload),
});

export const verifyPayment = payload => request('/payments/verify', {
  method: 'POST',
  body: JSON.stringify(payload),
});

export const reportPaymentFailure = payload => request('/payments/failure', {
  method: 'POST',
  body: JSON.stringify(payload),
});

export const fetchOrderStatus = orderId => request(`/payments/orders/${encodeURIComponent(orderId)}`);

export const fetchStudentOrders = () => request('/student/orders');

export const requestStudentOtp = email => request('/auth/otp', {
  method: 'POST',
  body: JSON.stringify({ email }),
});

export const fetchStudentProfile = () => request('/student/profile');

export const saveStudentProfile = profile => request('/student/profile', {
  method: 'POST',
  body: JSON.stringify(profile),
});

export const createStaffSession = pin => request('/staff/session', {
  method: 'POST',
  body: JSON.stringify({ pin }),
});

export const fetchStaffOrders = () => request('/staff/orders');

export const updateStaffOrderStatus = (orderId, status) => request(
  `/staff/orders/${encodeURIComponent(orderId)}/status`,
  {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }
);

export const logoutStaffSession = () => request('/staff/logout', { method: 'POST' });
