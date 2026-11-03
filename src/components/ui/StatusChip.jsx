const statusConfig = {
  placed: { label: 'Order Placed', color: 'bg-blue-100 text-blue-700' },
  accepted: { label: 'Accepted', color: 'bg-indigo-100 text-indigo-700' },
  preparing: { label: 'Preparing', color: 'bg-orange-100 text-orange-700' },
  ready: { label: 'Ready', color: 'bg-green-100 text-green-700' },
  picked_up: { label: 'Picked Up', color: 'bg-gray-100 text-gray-600' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-600' },
  new: { label: 'New', color: 'bg-blue-100 text-blue-700' },
  pending_payment: { label: 'Payment Pending', color: 'bg-amber-100 text-amber-800' },
  payment_failed: { label: 'Payment Failed', color: 'bg-red-100 text-red-600' },
};

export const StatusChip = ({ status, size = 'sm' }) => {
  const config = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-600' };
  const sizes = {
    sm: 'text-xs px-2.5 py-1',
    md: 'text-sm px-3 py-1.5',
  };

  return (
    <span className={`inline-flex items-center rounded-chip font-medium ${config.color} ${sizes[size]}`}>
      {status === 'placed' || status === 'new' ? (
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5 animate-pulse" />
      ) : status === 'preparing' ? (
        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mr-1.5 animate-pulse" />
      ) : null}
      {config.label}
    </span>
  );
};

export default StatusChip;
