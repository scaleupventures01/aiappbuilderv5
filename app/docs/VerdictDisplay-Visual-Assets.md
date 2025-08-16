# Verdict Display Component - Visual Design Assets & Specifications

## Table of Contents
1. [Asset Overview](#asset-overview)
2. [Icon Specifications](#icon-specifications)
3. [Color System](#color-system)
4. [Typography Specifications](#typography-specifications)
5. [Layout & Spacing](#layout--spacing)
6. [Component Variations](#component-variations)
7. [Animation Specifications](#animation-specifications)
8. [Export Specifications](#export-specifications)
9. [Implementation Assets](#implementation-assets)

## Asset Overview

### Design System Integration
The Verdict Display Component follows the Elite Trading Coach AI design system principles while introducing specialized visual elements for immediate recognition and emotional clarity.

### Asset Categories
1. **Icon Assets**: Custom SVG icons for each verdict type
2. **Color Tokens**: Complete color system with accessibility variants
3. **Typography**: Font specifications and hierarchy
4. **Layout Components**: Spacing and arrangement specifications
5. **Animation Assets**: Motion design specifications
6. **State Variations**: Interactive state specifications

## Icon Specifications

### Icon Design Principles
- **Recognition**: Immediately identifiable symbols
- **Scalability**: Vector-based for all screen densities
- **Accessibility**: Works with color-blind and screen reader users
- **Brand Consistency**: Aligns with app's professional trading aesthetic

### Diamond Icon (🔸) Specifications

#### Custom SVG Icon
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 2L22 8L12 22L2 8L12 2Z" 
        fill="currentColor" 
        stroke="currentColor" 
        stroke-width="1" 
        stroke-linejoin="round"/>
  <path d="M12 2L22 8L12 14L2 8L12 2Z" 
        fill="rgba(255,255,255,0.3)" 
        stroke="none"/>
</svg>
```

#### Design Details
- **Base Shape**: Geometric diamond with faceted appearance
- **Angle**: 45-degree rotation for dynamic appearance
- **Shading**: Subtle highlight on top facet
- **Stroke**: 1px consistent border
- **Fill**: Solid with highlight overlay

#### Size Variations
```css
.verdict-icon--xs { width: 16px; height: 16px; }
.verdict-icon--sm { width: 20px; height: 20px; }
.verdict-icon--md { width: 24px; height: 24px; }
.verdict-icon--lg { width: 32px; height: 32px; }
.verdict-icon--xl { width: 40px; height: 40px; }
```

### Fire Icon (🔥) Specifications

#### Custom SVG Icon
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 2C12 2 8 6 8 12C8 16.4183 9.79086 18 12 18C14.2091 18 16 16.4183 16 12C16 6 12 2 12 2Z" 
        fill="currentColor"/>
  <path d="M12 6C12 6 10 8 10 11C10 12.6569 10.8954 13 12 13C13.1046 13 14 12.6569 14 11C14 8 12 6 12 6Z" 
        fill="rgba(255,255,255,0.4)"/>
  <path d="M12 18C12 18 15 19 15 21C15 22.1046 14.1046 23 13 23H11C9.89543 23 9 22.1046 9 21C9 19 12 18 12 18Z" 
        fill="currentColor"/>
</svg>
```

#### Design Details
- **Base Shape**: Stylized flame with organic curves
- **Layering**: Multiple flame layers for depth
- **Movement Hint**: Slightly asymmetrical for dynamic feel
- **Gradient**: Subtle internal highlighting
- **Base**: Small flame base for grounding

### Skull Icon (💀) Specifications

#### Custom SVG Icon
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 2C7.58172 2 4 5.58172 4 10V14C4 17.3137 6.68629 20 10 20H14C17.3137 20 20 17.3137 20 14V10C20 5.58172 16.4183 2 12 2Z" 
        fill="currentColor"/>
  <circle cx="9" cy="11" r="2" fill="white"/>
  <circle cx="15" cy="11" r="2" fill="white"/>
  <path d="M8 16L12 18L16 16" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

#### Design Details
- **Base Shape**: Rounded skull silhouette
- **Eye Sockets**: Circular white voids for stark contrast
- **Mouth**: Simple line representation
- **Proportions**: Slightly stylized, less frightening
- **Safety**: Professional warning symbol, not horror imagery

### Icon Implementation

#### CSS Icon Classes
```css
.verdict-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--verdict-color-primary);
  transition: transform 0.2s ease-out;
}

.verdict-icon--diamond {
  color: var(--verdict-diamond-primary);
}

.verdict-icon--fire {
  color: var(--verdict-fire-primary);
}

.verdict-icon--skull {
  color: var(--verdict-skull-primary);
}
```

#### React Icon Components
```jsx
export const DiamondIcon = ({ size = 24, className = '' }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    className={`verdict-icon verdict-icon--diamond ${className}`}
  >
    {/* SVG content */}
  </svg>
);

export const FireIcon = ({ size = 24, className = '' }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    className={`verdict-icon verdict-icon--fire ${className}`}
  >
    {/* SVG content */}
  </svg>
);

export const SkullIcon = ({ size = 24, className = '' }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    className={`verdict-icon verdict-icon--skull ${className}`}
  >
    {/* SVG content */}
  </svg>
);
```

## Color System

### Primary Color Specifications

#### Diamond Color Palette
```css
:root {
  /* Primary Colors */
  --verdict-diamond-50:  #ecfdf5;   /* Lightest background */
  --verdict-diamond-100: #d1fae5;   /* Light background */
  --verdict-diamond-200: #a7f3d0;   /* Subtle accent */
  --verdict-diamond-300: #6ee7b7;   /* Border color */
  --verdict-diamond-400: #34d399;   /* Hover state */
  --verdict-diamond-500: #10b981;   /* Primary brand */
  --verdict-diamond-600: #059669;   /* Active state */
  --verdict-diamond-700: #047857;   /* Dark accent */
  --verdict-diamond-800: #065f46;   /* Text color */
  --verdict-diamond-900: #064e3b;   /* Darkest text */
  
  /* Semantic Mappings */
  --verdict-diamond-primary: var(--verdict-diamond-500);
  --verdict-diamond-background: var(--verdict-diamond-100);
  --verdict-diamond-border: var(--verdict-diamond-300);
  --verdict-diamond-text: var(--verdict-diamond-900);
  --verdict-diamond-hover: var(--verdict-diamond-400);
  --verdict-diamond-active: var(--verdict-diamond-600);
}
```

#### Fire Color Palette
```css
:root {
  /* Primary Colors */
  --verdict-fire-50:  #fffbeb;   /* Lightest background */
  --verdict-fire-100: #fef3c7;   /* Light background */
  --verdict-fire-200: #fde68a;   /* Subtle accent */
  --verdict-fire-300: #fcd34d;   /* Border color */
  --verdict-fire-400: #fbbf24;   /* Hover state */
  --verdict-fire-500: #f59e0b;   /* Primary brand */
  --verdict-fire-600: #d97706;   /* Active state */
  --verdict-fire-700: #b45309;   /* Dark accent */
  --verdict-fire-800: #92400e;   /* Text color */
  --verdict-fire-900: #78350f;   /* Darkest text */
  
  /* Semantic Mappings */
  --verdict-fire-primary: var(--verdict-fire-500);
  --verdict-fire-background: var(--verdict-fire-100);
  --verdict-fire-border: var(--verdict-fire-300);
  --verdict-fire-text: var(--verdict-fire-800);
  --verdict-fire-hover: var(--verdict-fire-400);
  --verdict-fire-active: var(--verdict-fire-600);
}
```

#### Skull Color Palette
```css
:root {
  /* Primary Colors */
  --verdict-skull-50:  #fef2f2;   /* Lightest background */
  --verdict-skull-100: #fee2e2;   /* Light background */
  --verdict-skull-200: #fecaca;   /* Subtle accent */
  --verdict-skull-300: #fca5a5;   /* Border color */
  --verdict-skull-400: #f87171;   /* Hover state */
  --verdict-skull-500: #ef4444;   /* Primary brand */
  --verdict-skull-600: #dc2626;   /* Active state */
  --verdict-skull-700: #b91c1c;   /* Dark accent */
  --verdict-skull-800: #991b1b;   /* Text color */
  --verdict-skull-900: #7f1d1d;   /* Darkest text */
  
  /* Semantic Mappings */
  --verdict-skull-primary: var(--verdict-skull-500);
  --verdict-skull-background: var(--verdict-skull-100);
  --verdict-skull-border: var(--verdict-skull-300);
  --verdict-skull-text: var(--verdict-skull-900);
  --verdict-skull-hover: var(--verdict-skull-400);
  --verdict-skull-active: var(--verdict-skull-600);
}
```

### Accessibility Color Variants

#### High Contrast Mode
```css
@media (prefers-contrast: high) {
  :root {
    --verdict-diamond-primary: #065f46;
    --verdict-diamond-background: #ffffff;
    --verdict-diamond-text: #000000;
    --verdict-diamond-border: #065f46;
    
    --verdict-fire-primary: #92400e;
    --verdict-fire-background: #ffffff;
    --verdict-fire-text: #000000;
    --verdict-fire-border: #92400e;
    
    --verdict-skull-primary: #991b1b;
    --verdict-skull-background: #ffffff;
    --verdict-skull-text: #000000;
    --verdict-skull-border: #991b1b;
  }
}
```

#### Color-Blind Friendly Patterns
```css
.verdict-pattern-diamond {
  background-image: 
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      currentColor 2px,
      currentColor 3px
    );
  opacity: 0.1;
}

.verdict-pattern-fire {
  background-image: 
    repeating-linear-gradient(
      45deg,
      transparent,
      transparent 3px,
      currentColor 3px,
      currentColor 6px
    );
  opacity: 0.15;
}

.verdict-pattern-skull {
  background-image: 
    radial-gradient(
      circle at 25% 25%,
      currentColor 1px,
      transparent 1px
    );
  background-size: 8px 8px;
  opacity: 0.2;
}
```

## Typography Specifications

### Font System

#### Primary Typography
```css
.verdict-typography {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11';
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

#### Text Hierarchy
```css
.verdict-label-primary {
  font-size: 0.875rem;     /* 14px */
  font-weight: 600;        /* Semi-bold */
  line-height: 1.25;       /* 20px */
  letter-spacing: 0.025em; /* 0.35px */
}

.verdict-label-secondary {
  font-size: 0.75rem;      /* 12px */
  font-weight: 500;        /* Medium */
  line-height: 1.33;       /* 16px */
  letter-spacing: 0.025em; /* 0.3px */
  opacity: 0.8;
}

.verdict-description {
  font-size: 0.6875rem;    /* 11px */
  font-weight: 400;        /* Regular */
  line-height: 1.45;       /* 16px */
  letter-spacing: 0.01em;  /* 0.11px */
  opacity: 0.7;
}
```

#### Responsive Typography
```css
/* Mobile */
@media (max-width: 767px) {
  .verdict-label-primary {
    font-size: 0.8125rem;   /* 13px */
  }
  
  .verdict-label-secondary {
    font-size: 0.6875rem;   /* 11px */
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .verdict-label-primary {
    font-size: 0.9375rem;   /* 15px */
  }
  
  .verdict-label-secondary {
    font-size: 0.8125rem;   /* 13px */
  }
}
```

## Layout & Spacing

### Component Dimensions

#### Base Sizing System
```css
:root {
  /* Spacing Scale */
  --verdict-space-0: 0;
  --verdict-space-1: 0.25rem;  /* 4px */
  --verdict-space-2: 0.5rem;   /* 8px */
  --verdict-space-3: 0.75rem;  /* 12px */
  --verdict-space-4: 1rem;     /* 16px */
  --verdict-space-5: 1.25rem;  /* 20px */
  --verdict-space-6: 1.5rem;   /* 24px */
  
  /* Component Specific */
  --verdict-padding-x: var(--verdict-space-4);
  --verdict-padding-y: var(--verdict-space-3);
  --verdict-gap: var(--verdict-space-2);
  --verdict-border-radius: 0.375rem; /* 6px */
  --verdict-border-width: 1px;
}
```

#### Layout Grid
```css
.verdict-display {
  display: flex;
  align-items: center;
  gap: var(--verdict-gap);
  padding: var(--verdict-padding-y) var(--verdict-padding-x);
  border-radius: var(--verdict-border-radius);
  border: var(--verdict-border-width) solid var(--verdict-border-color);
  
  /* Minimum touch target */
  min-height: 44px;
  min-width: 44px;
}

.verdict-icon {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
}

.verdict-content {
  display: flex;
  flex-direction: column;
  gap: var(--verdict-space-1);
  min-width: 0; /* Allow text truncation */
}
```

#### Responsive Layout
```css
/* Compact Mobile */
@media (max-width: 767px) {
  .verdict-display {
    padding: var(--verdict-space-2) var(--verdict-space-3);
    gap: var(--verdict-space-1);
  }
  
  .verdict-icon {
    width: 20px;
    height: 20px;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .verdict-display {
    padding: var(--verdict-space-4) var(--verdict-space-5);
    gap: var(--verdict-space-3);
  }
  
  .verdict-icon {
    width: 28px;
    height: 28px;
  }
}
```

### Component Arrangements

#### Single Verdict Layout
```css
.verdict-single {
  display: inline-flex;
  max-width: fit-content;
}
```

#### Multiple Verdict Layout
```css
.verdict-list {
  display: flex;
  flex-direction: column;
  gap: var(--verdict-space-2);
}

.verdict-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: var(--verdict-space-3);
}

.verdict-inline {
  display: flex;
  flex-wrap: wrap;
  gap: var(--verdict-space-2);
}
```

## Component Variations

### Size Variations

#### Extra Small (xs)
```css
.verdict-display--xs {
  padding: var(--verdict-space-1) var(--verdict-space-2);
  font-size: 0.75rem;
  min-height: 32px;
}

.verdict-display--xs .verdict-icon {
  width: 16px;
  height: 16px;
}
```

#### Small (sm)
```css
.verdict-display--sm {
  padding: var(--verdict-space-2) var(--verdict-space-3);
  font-size: 0.8125rem;
  min-height: 36px;
}

.verdict-display--sm .verdict-icon {
  width: 18px;
  height: 18px;
}
```

#### Medium (md) - Default
```css
.verdict-display--md {
  padding: var(--verdict-space-3) var(--verdict-space-4);
  font-size: 0.875rem;
  min-height: 44px;
}

.verdict-display--md .verdict-icon {
  width: 24px;
  height: 24px;
}
```

#### Large (lg)
```css
.verdict-display--lg {
  padding: var(--verdict-space-4) var(--verdict-space-5);
  font-size: 1rem;
  min-height: 52px;
}

.verdict-display--lg .verdict-icon {
  width: 28px;
  height: 28px;
}
```

#### Extra Large (xl)
```css
.verdict-display--xl {
  padding: var(--verdict-space-5) var(--verdict-space-6);
  font-size: 1.125rem;
  min-height: 60px;
}

.verdict-display--xl .verdict-icon {
  width: 32px;
  height: 32px;
}
```

### Style Variations

#### Solid Style (Default)
```css
.verdict-display--solid {
  background: var(--verdict-background);
  border: var(--verdict-border-width) solid var(--verdict-border-color);
  color: var(--verdict-text-color);
}
```

#### Outline Style
```css
.verdict-display--outline {
  background: transparent;
  border: 2px solid var(--verdict-primary-color);
  color: var(--verdict-primary-color);
}
```

#### Ghost Style
```css
.verdict-display--ghost {
  background: transparent;
  border: none;
  color: var(--verdict-primary-color);
}

.verdict-display--ghost:hover {
  background: var(--verdict-background);
}
```

#### Pill Style
```css
.verdict-display--pill {
  border-radius: 9999px;
  padding-left: var(--verdict-space-4);
  padding-right: var(--verdict-space-4);
}
```

## Animation Specifications

### Core Animations

#### Entrance Animation
```css
@keyframes verdict-enter {
  0% {
    opacity: 0;
    transform: scale(0.95) translateY(8px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.verdict-display.verdict-enter {
  animation: verdict-enter 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

#### Hover Animation
```css
@keyframes verdict-pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
  }
}

.verdict-display:hover {
  animation: verdict-pulse 2s ease-in-out infinite;
}
```

#### Focus Animation
```css
.verdict-display:focus-visible {
  outline: none;
  box-shadow: 
    0 0 0 2px var(--verdict-primary-color),
    0 0 0 4px rgba(255, 255, 255, 0.8);
  transition: box-shadow 0.2s ease-out;
}
```

#### Loading Animation
```css
@keyframes verdict-shimmer {
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
}

.verdict-display--loading {
  background: 
    linear-gradient(
      90deg,
      var(--verdict-background) 0px,
      rgba(255, 255, 255, 0.8) 40px,
      var(--verdict-background) 80px
    );
  background-size: 200px;
  animation: verdict-shimmer 1.5s ease-in-out infinite;
}
```

### Animation Controls

#### Reduced Motion Support
```css
@media (prefers-reduced-motion: reduce) {
  .verdict-display,
  .verdict-display * {
    animation: none !important;
    transition: none !important;
  }
}
```

#### Animation Toggle
```css
.verdict-display.no-animation {
  animation: none;
  transition: none;
}

.verdict-display.no-animation * {
  animation: none;
  transition: none;
}
```

## Export Specifications

### Asset Export Requirements

#### SVG Icons
- **Format**: SVG
- **ViewBox**: 0 0 24 24
- **Stroke**: None (filled icons)
- **Color**: currentColor
- **Optimization**: SVGO optimized

#### PNG Fallbacks
- **Sizes**: 16px, 24px, 32px, 48px, 64px
- **Format**: PNG-24 with transparency
- **Resolution**: @1x, @2x, @3x for each size
- **Optimization**: TinyPNG compressed

#### Icon Font (Optional)
- **Format**: WOFF2, WOFF, TTF
- **Encoding**: Unicode Private Use Area
- **Subsetting**: Only verdict icons included

### Design System Assets

#### Figma Components
```
VerdictDisplay/
├── Core Components/
│   ├── Diamond Verdict
│   ├── Fire Verdict
│   └── Skull Verdict
├── Size Variants/
│   ├── Extra Small (xs)
│   ├── Small (sm)
│   ├── Medium (md)
│   ├── Large (lg)
│   └── Extra Large (xl)
├── Style Variants/
│   ├── Solid
│   ├── Outline
│   ├── Ghost
│   └── Pill
└── State Variants/
    ├── Default
    ├── Hover
    ├── Focus
    ├── Active
    └── Disabled
```

#### CSS Custom Properties
Export complete CSS file with all design tokens:
```css
/* verdict-design-tokens.css */
:root {
  /* All color tokens */
  /* All spacing tokens */
  /* All typography tokens */
  /* All animation tokens */
}
```

## Implementation Assets

### Developer Handoff Package

#### Design Specifications
- Complete color specifications with hex values
- Typography specifications with rem/px values
- Spacing specifications with CSS custom properties
- Animation timing and easing specifications

#### Code Snippets
- React component examples
- CSS class implementations
- SCSS/Sass mixins
- Tailwind CSS utilities

#### Asset Files
- SVG icon files (optimized)
- PNG fallback images (all sizes)
- CSS token files
- JSON design token exports

#### Documentation
- Implementation guidelines
- Accessibility requirements
- Browser support specifications
- Performance considerations

### Quality Assurance

#### Design Review Checklist
- [ ] All color values match specifications
- [ ] Typography renders correctly across browsers
- [ ] Icons display properly at all sizes
- [ ] Animations perform smoothly
- [ ] Accessibility features implemented
- [ ] Responsive behavior verified
- [ ] Cross-browser compatibility confirmed

#### Asset Validation
- [ ] SVG icons are optimized and accessible
- [ ] PNG fallbacks generated correctly
- [ ] CSS tokens implement design specifications
- [ ] Animation performance tested
- [ ] Color contrast ratios verified
- [ ] Touch targets meet minimum requirements

---

**Asset Version**: 1.0  
**Export Date**: August 16, 2025  
**Design Lead**: UI/UX Designer  
**Asset Status**: Production Ready  
**Next Review**: September 16, 2025