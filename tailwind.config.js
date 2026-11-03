/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary accent - Deep Royal Blue
        primary: {
          50: '#E6EFF9',
          100: '#CCE0F3',
          200: '#99C1E7',
          300: '#66A2DB',
          400: '#3383CF',
          500: '#0252A1',
          600: '#024281',
          700: '#013161',
          800: '#012141',
          900: '#001020',
        },
        // Text
        ink: {
          primary: '#111111',
          secondary: '#6B6B6B',
          disabled: '#AAAAAA',
        },
        // Surfaces
        surface: {
          white: '#FFFFFF',
          bg: '#F8F8F8',
          card: '#FFFFFF',
          dark: '#333333',
          border: '#E6E6E6',
        },
        // Status
        veg: {
          DEFAULT: '#2E7D32',
          light: '#E8F5E9',
        },
        nonveg: {
          DEFAULT: '#7A1F1F',
          light: '#FCE4E4',
        },
        vegan: {
          DEFAULT: '#1B5E20',
          light: '#E8F5E9',
        },
        // Action & Link
        blue: {
          link: '#0252A1',
        },
        // Status chips
        success: '#1B7A3E',
        warning: '#B45309',
        error: '#DC2626',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'page-title': ['24px', { lineHeight: '1.2', fontWeight: '600' }],
        'section-heading': ['20px', { lineHeight: '1.3', fontWeight: '600' }],
        'item-name': ['18px', { lineHeight: '1.3', fontWeight: '700' }],
        'body': ['16px', { lineHeight: '1.5' }],
        'small': ['14px', { lineHeight: '1.4' }],
        'tab': ['16px', { lineHeight: '1', fontWeight: '500' }],
      },
      borderRadius: {
        'card': '16px',
        'button': '14px',
        'chip': '999px',
        'image': '12px',
      },
      boxShadow: {
        'card': '0 2px 12px rgba(0,0,0,0.08)',
        'card-hover': '0 4px 20px rgba(0,0,0,0.12)',
        'bottom-bar': '0 -4px 20px rgba(0,0,0,0.12)',
      },
      spacing: {
        'screen-x': '16px',
        'card-gap': '16px',
        'touch': '44px',
      },
      height: {
        'button': '56px',
        'chip': '40px',
        'bottom-bar': '72px',
        'bottom-nav': '64px',
        'item-image': '135px',
      },
      width: {
        'item-image': '135px',
      },
      backgroundImage: {
        'header-gradient': 'linear-gradient(to bottom, #0252A1, #E6EFF9)',
        'primary-gradient': 'linear-gradient(135deg, #0252A1 0%, #3383CF 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.15s ease-out',
        'bounce-in': 'bounceIn 0.3s ease-out',
        'shimmer': 'shimmer 1.5s infinite',
        'spin-slow': 'spin 2s linear infinite',
        'checkmark': 'checkmark 0.5s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        checkmark: {
          '0%': { strokeDashoffset: '100' },
          '100%': { strokeDashoffset: '0' },
        },
      },
    },
  },
  plugins: [],
}
