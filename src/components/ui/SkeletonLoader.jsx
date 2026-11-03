export const SkeletonCard = () => (
  <div className="bg-white border border-surface-border rounded-card p-4 flex gap-3">
    <div className="flex-1 flex flex-col gap-2">
      <div className="skeleton h-4 w-4 rounded-sm" />
      <div className="skeleton h-5 w-3/4 rounded" />
      <div className="skeleton h-3 w-1/3 rounded" />
      <div className="skeleton h-3 w-full rounded" />
      <div className="skeleton h-3 w-4/5 rounded" />
      <div className="skeleton h-5 w-1/4 rounded mt-2" />
    </div>
    <div className="flex flex-col gap-2 items-center">
      <div className="skeleton rounded-image" style={{ width: 110, height: 110 }} />
      <div className="skeleton h-8 w-24 rounded-button" />
    </div>
  </div>
);

export const SkeletonOutletCard = () => (
  <div className="bg-white border border-surface-border rounded-card overflow-hidden flex-shrink-0 w-64">
    <div className="skeleton h-36 w-full" />
    <div className="p-3 flex flex-col gap-2">
      <div className="skeleton h-5 w-3/4 rounded" />
      <div className="skeleton h-4 w-1/2 rounded" />
      <div className="skeleton h-4 w-2/3 rounded" />
    </div>
  </div>
);

export const SkeletonOrderCard = () => (
  <div className="bg-white border border-surface-border rounded-card p-4 flex flex-col gap-3">
    <div className="flex justify-between items-start">
      <div className="flex flex-col gap-2">
        <div className="skeleton h-5 w-40 rounded" />
        <div className="skeleton h-4 w-28 rounded" />
      </div>
      <div className="skeleton h-6 w-20 rounded-chip" />
    </div>
    <div className="skeleton h-4 w-full rounded" />
    <div className="flex justify-between">
      <div className="skeleton h-4 w-24 rounded" />
      <div className="skeleton h-5 w-16 rounded" />
    </div>
  </div>
);

export const SkeletonList = ({ count = 3, type = 'card' }) => (
  <div className="flex flex-col gap-4">
    {Array.from({ length: count }).map((_, i) => (
      type === 'card' ? <SkeletonCard key={i} /> :
      type === 'outlet' ? <SkeletonOutletCard key={i} /> :
      <SkeletonOrderCard key={i} />
    ))}
  </div>
);

export default SkeletonList;
