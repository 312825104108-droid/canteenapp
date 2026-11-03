// Veg / Non-veg / Vegan indicators
export const VegIcon = ({ type = 'veg', size = 20 }) => {
  if (type === 'nonveg') {
    return (
      <div
        className="flex-shrink-0 flex items-center justify-center"
        style={{
          width: size,
          height: size,
          border: '2px solid #7A1F1F',
          borderRadius: 3,
        }}
        aria-label="Non-vegetarian"
        title="Non-vegetarian"
      >
        <div
          style={{
            width: 0,
            height: 0,
            borderLeft: `${size * 0.22}px solid transparent`,
            borderRight: `${size * 0.22}px solid transparent`,
            borderBottom: `${size * 0.35}px solid #7A1F1F`,
          }}
        />
      </div>
    );
  }

  if (type === 'vegan') {
    return (
      <div
        className="flex-shrink-0 flex items-center justify-center"
        style={{
          width: size,
          height: size,
          border: '2px solid #1B5E20',
          borderRadius: 3,
        }}
        aria-label="Vegan"
        title="Vegan"
      >
        <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 12 12" fill="none">
          <path
            d="M6 10C6 10 2 7 2 4.5C2 3.1 3.1 2 4.5 2C5.2 2 5.7 2.4 6 2.9C6.3 2.4 6.8 2 7.5 2C8.9 2 10 3.1 10 4.5C10 7 6 10 6 10Z"
            fill="#1B5E20"
          />
        </svg>
      </div>
    );
  }

  // Default: veg
  return (
    <div
      className="flex-shrink-0 flex items-center justify-center"
      style={{
        width: size,
        height: size,
        border: '2px solid #2E7D32',
        borderRadius: 3,
      }}
      aria-label="Vegetarian"
      title="Vegetarian"
    >
      <div
        style={{
          width: size * 0.4,
          height: size * 0.4,
          borderRadius: '50%',
          background: '#2E7D32',
        }}
      />
    </div>
  );
};

export default VegIcon;
