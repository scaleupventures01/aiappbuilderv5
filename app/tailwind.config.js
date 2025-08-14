/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Trading-specific colors
        trading: {
          green: "hsl(var(--trading-green))",
          red: "hsl(var(--trading-red))",
          neutral: "hsl(var(--trading-neutral))",
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      // Desktop-first breakpoints
      screens: {
        'desktop': '1200px',
        'desktop-lg': '1600px',
        'desktop-xl': '1920px',
      },
      // Desktop-optimized spacing
      spacing: {
        'sidebar': 'var(--sidebar-width)',
        'header': 'var(--header-height)',
        'chat-panel': 'var(--chat-panel-width)',
      },
      // Desktop layout grid
      gridTemplateColumns: {
        'desktop': 'var(--sidebar-width) 1fr var(--chat-panel-width)',
      },
      gridTemplateRows: {
        'desktop': 'var(--header-height) 1fr',
      },
      // Typography optimized for desktop reading
      fontSize: {
        'desktop-sm': ['13px', '1.4'],
        'desktop-base': ['14px', '1.5'],
        'desktop-lg': ['16px', '1.6'],
      },
      // Keyboard navigation support
      outline: {
        'focus': ['2px solid hsl(var(--ring))', '2px'],
      },
    },
  },
  plugins: [],
  // Desktop-first approach
  future: {
    hoverOnlyWhenSupported: true,
  },
}