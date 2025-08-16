/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a',
        },
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          900: '#0f172a',
        },
        success: {
          50: '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        warning: {
          50: '#fffbeb',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        error: {
          50: '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },
        // Keep existing trading-specific colors
        trading: {
          green: 'hsl(var(--trading-green, 142 71% 45%))',
          red: 'hsl(var(--trading-red, 0 84% 60%))',
          neutral: 'hsl(var(--trading-neutral, 217 19% 27%))',
        },
        // Keep existing HSL-based colors for compatibility
        border: 'hsl(var(--border, 214 32% 91%))',
        input: 'hsl(var(--input, 214 32% 91%))',
        ring: 'hsl(var(--ring, 217 91% 60%))',
        background: 'hsl(var(--background, 0 0% 100%))',
        foreground: 'hsl(var(--foreground, 222 47% 11%))',
        muted: {
          DEFAULT: 'hsl(var(--muted, 210 40% 96%))',
          foreground: 'hsl(var(--muted-foreground, 215 16% 47%))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent, 210 40% 96%))',
          foreground: 'hsl(var(--accent-foreground, 222 47% 11%))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover, 0 0% 100%))',
          foreground: 'hsl(var(--popover-foreground, 222 47% 11%))',
        },
        card: {
          DEFAULT: 'hsl(var(--card, 0 0% 100%))',
          foreground: 'hsl(var(--card-foreground, 222 47% 11%))',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        // Keep desktop-optimized sizes
        'desktop-sm': ['13px', '1.4'],
        'desktop-base': ['14px', '1.5'],
        'desktop-lg': ['16px', '1.6'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
        // Keep existing desktop-specific spacing
        'sidebar': 'var(--sidebar-width, 240px)',
        'header': 'var(--header-height, 64px)',
        'chat-panel': 'var(--chat-panel-width, 320px)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        // Keep existing radius variables
        lg: 'var(--radius, 0.5rem)',
        md: 'calc(var(--radius, 0.5rem) - 2px)',
        sm: 'calc(var(--radius, 0.5rem) - 4px)',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'glow': '0 0 20px rgba(59, 130, 246, 0.5)',
      },
      // Responsive breakpoints (mobile-first + desktop)
      screens: {
        'sm': '640px',   // Mobile landscape
        'md': '768px',   // Tablet
        'lg': '1024px',  // Desktop
        'xl': '1280px',  // Large desktop
        '2xl': '1536px', // Extra large desktop
        // Keep desktop-specific breakpoints
        'desktop': '1200px',
        'desktop-lg': '1600px',
        'desktop-xl': '1920px',
      },
      // Desktop layout grid
      gridTemplateColumns: {
        'desktop': 'var(--sidebar-width, 240px) 1fr var(--chat-panel-width, 320px)',
      },
      gridTemplateRows: {
        'desktop': 'var(--header-height, 64px) 1fr',
      },
      // Keyboard navigation support
      outline: {
        'focus': ['2px solid hsl(var(--ring, 217 91% 60%))', '2px'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
  // Desktop-first approach
  future: {
    hoverOnlyWhenSupported: true,
  },
}