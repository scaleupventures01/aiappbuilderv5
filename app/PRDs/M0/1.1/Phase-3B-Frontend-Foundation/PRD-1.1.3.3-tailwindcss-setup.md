# PRD: TailwindCSS Setup

## 1. Overview

This PRD defines the TailwindCSS configuration and setup for the Elite Trading Coach AI frontend application, providing a utility-first CSS framework for rapid UI development with consistent design.

## 2. Feature Requirements

### 2.1 Functional Requirements
- **FR-1**: Install and configure TailwindCSS with Vite
- **FR-2**: Set up custom design tokens (colors, fonts, spacing)
- **FR-3**: Configure responsive breakpoints for mobile-first design
- **FR-4**: Implement dark mode support
- **FR-5**: Create component utility classes for common patterns

### 2.2 Non-Functional Requirements
- **NFR-1**: CSS bundle size < 50KB after purging
- **NFR-2**: Build time impact < 2 seconds
- **NFR-3**: Support for all modern browsers
- **NFR-4**: Consistent visual design across all components

## 3. User Stories

### 3.1 Primary User Stories
- **US-1**: As a developer, I want utility-first CSS so I can build UI components rapidly without writing custom CSS
- **US-2**: As a designer, I want consistent design tokens so the application has a cohesive visual identity
- **US-3**: As a user, I want responsive design so the application works well on all device sizes

### 3.2 Edge Cases
- **EC-1**: Handling custom CSS requirements beyond Tailwind utilities
- **EC-2**: Managing large CSS bundles without proper purging
- **EC-3**: Ensuring accessibility with utility classes

## 4. Technical Specifications

### 4.1 TailwindCSS Configuration
```javascript
// tailwind.config.js
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
        }
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
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'glow': '0 0 20px rgba(59, 130, 246, 0.5)',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
```

### 4.2 CSS Entry Point
```css
/* src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom base styles */
@layer base {
  html {
    @apply antialiased;
  }
  
  body {
    @apply bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100;
  }
  
  * {
    @apply border-gray-200 dark:border-gray-700;
  }
}

/* Custom component classes */
@layer components {
  .btn {
    @apply inline-flex items-center justify-center px-4 py-2 text-sm font-medium 
           rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2;
  }
  
  .btn-primary {
    @apply btn bg-primary-600 text-white hover:bg-primary-700 
           focus:ring-primary-500 dark:bg-primary-500 dark:hover:bg-primary-600;
  }
  
  .btn-secondary {
    @apply btn bg-gray-100 text-gray-900 hover:bg-gray-200 
           focus:ring-gray-500 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700;
  }
  
  .input {
    @apply block w-full px-3 py-2 border border-gray-300 rounded-lg 
           focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
           dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100;
  }
  
  .card {
    @apply bg-white rounded-xl shadow-soft border border-gray-200
           dark:bg-gray-800 dark:border-gray-700;
  }
  
  .message-bubble {
    @apply max-w-xs lg:max-w-md px-4 py-2 rounded-2xl text-sm;
  }
  
  .message-user {
    @apply message-bubble bg-primary-600 text-white ml-auto;
  }
  
  .message-ai {
    @apply message-bubble bg-gray-100 text-gray-900 
           dark:bg-gray-700 dark:text-gray-100;
  }
}

/* Custom utilities */
@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
  
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
}
```

### 4.3 PostCSS Configuration
```javascript
// postcss.config.js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

## 5. Acceptance Criteria

### 5.1 Definition of Done
- [ ] TailwindCSS installed and configured with Vite
- [ ] Custom design tokens implemented
- [ ] Responsive breakpoints configured
- [ ] Dark mode support enabled
- [ ] Component utility classes created
- [ ] CSS purging working for production builds
- [ ] Documentation for custom classes

### 5.2 Testing Requirements
- [ ] CSS builds without errors
- [ ] Responsive design works across breakpoints
- [ ] Dark mode toggles correctly
- [ ] Custom components render properly
- [ ] Production bundle size optimized

## 6. Dependencies

### 6.1 Technical Dependencies
- React Vite setup (PRD-1.1.3.1)
- PostCSS configuration
- TailwindCSS plugins (@tailwindcss/forms, @tailwindcss/typography)

### 6.2 Business Dependencies
- Design system requirements
- Brand colors and typography
- Responsive design specifications

## 7. Risks and Mitigations

### 7.1 Technical Risks
- **Risk**: Large CSS bundle size affecting performance
  - **Mitigation**: Configure proper purging and only import needed utilities
- **Risk**: Inconsistent design without proper token usage
  - **Mitigation**: Create comprehensive design token documentation

### 7.2 Business Risks
- **Risk**: Design inconsistency affecting brand perception
  - **Mitigation**: Implement strict design token usage guidelines

## 8. Success Metrics

### 8.1 Technical Metrics
- CSS bundle size < 50KB after purging
- Build time increase < 2 seconds
- 100% responsive design coverage
- Dark mode working across all components

### 8.2 Business Metrics
- Consistent visual design across application
- Faster UI development iteration
- Improved user experience with responsive design

## 9. Implementation Timeline

### 9.1 Development Phases
- **Phase 1**: TailwindCSS installation and basic config (2 hours)
- **Phase 2**: Custom design tokens and theme setup (3 hours)
- **Phase 3**: Component utility classes (2 hours)
- **Phase 4**: Dark mode and responsive testing (3 hours)

### 9.2 Milestones
- **M1**: TailwindCSS working with basic styles (Day 1)
- **M2**: Custom design tokens implemented (Day 1)
- **M3**: Component classes created (Day 1)
- **M4**: Dark mode and responsive design verified (Day 2)

## 10. Appendices

### 10.1 Design Token Reference
```javascript
// Design token usage examples
const colorTokens = {
  primary: 'Use for main actions, links, and brand elements',
  secondary: 'Use for secondary actions and neutral elements',
  success: 'Use for positive feedback and success states',
  warning: 'Use for caution and warning states',
  error: 'Use for errors and destructive actions'
};

const spacingTokens = {
  'xs (0.5rem)': 'Minimal spacing between related elements',
  'sm (0.75rem)': 'Small spacing for compact layouts',
  'md (1rem)': 'Default spacing for most use cases',
  'lg (1.5rem)': 'Large spacing for section separation',
  'xl (3rem)': 'Extra large spacing for major sections'
};
```

### 10.2 Responsive Breakpoints
```javascript
// Tailwind responsive breakpoints
const breakpoints = {
  sm: '640px',   // Mobile landscape
  md: '768px',   // Tablet
  lg: '1024px',  // Desktop
  xl: '1280px',  // Large desktop
  '2xl': '1536px' // Extra large desktop
};
```

### 10.3 Dark Mode Implementation
```typescript
// Dark mode toggle utility
export const useDarkMode = () => {
  const [isDark, setIsDark] = useState(() => 
    localStorage.getItem('theme') === 'dark'
  );
  
  const toggleDark = () => {
    const newTheme = isDark ? 'light' : 'dark';
    setIsDark(!isDark);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', !isDark);
  };
  
  return { isDark, toggleDark };
};
```