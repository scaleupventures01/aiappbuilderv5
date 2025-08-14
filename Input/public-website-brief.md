# Trading Coach AI - Public Website Design Brief

## 1. Executive Summary

### Purpose
Create a high-converting public website that establishes Trading Coach AI as the premier AI-powered trading coach platform, targeting traders in "rehab mode" and those seeking consistent profitability through MFE optimization.

### Design Direction
- **Aesthetic**: Mission Control meets Private Trading Floor
- **Style**: Glass-morphism with dimensional depth
- **Tone**: Professional mentor - wise, steady, trustworthy
- **Priority**: Visual momentum → Inspirational touches → Directive elements

## 2. Visual Design System

### 2.1 Color Palette

#### Primary Colors
```css
/* Trust & Growth Theme */
--primary-900: #0F172A  /* Deep space background */
--primary-800: #1E293B  /* Card backgrounds */
--primary-700: #334155  /* Borders, dividers */
--primary-600: #475569  /* Muted text */
--primary-500: #64748B  /* Secondary text */

--blue-600: #2563EB    /* Primary actions */
--blue-500: #3B82F6    /* Hover states */
--blue-400: #60A5FA    /* Active states */

--emerald-500: #10B981  /* Success, profits */
--emerald-400: #34D399  /* Success hover */

--gold-500: #F59E0B     /* Achievements */
--red-500: #EF4444      /* Losses, warnings */
```

#### Glass-morphism Effects
```css
/* Glassmorphic cards */
background: rgba(30, 41, 59, 0.7);
backdrop-filter: blur(12px);
border: 1px solid rgba(255, 255, 255, 0.1);
box-shadow: 
  0 8px 32px rgba(0, 0, 0, 0.37),
  inset 0 1px 0 rgba(255, 255, 255, 0.1);
```

### 2.2 Typography

```css
/* Font Stack */
--font-primary: 'Inter', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', monospace;

/* Scale */
--text-xs: 0.75rem;    /* 12px - Meta labels */
--text-sm: 0.875rem;   /* 14px - Body small */
--text-base: 1rem;     /* 16px - Body default */
--text-lg: 1.125rem;   /* 18px - Lead text */
--text-xl: 1.25rem;    /* 20px - Section heads */
--text-2xl: 1.5rem;    /* 24px - Feature titles */
--text-3xl: 1.875rem;  /* 30px - Page headers */
--text-4xl: 2.25rem;   /* 36px - Hero mobile */
--text-5xl: 3rem;      /* 48px - Hero desktop */
--text-6xl: 3.75rem;   /* 60px - Hero XL */
```

### 2.3 Spacing System
```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */
```

## 3. Page Specifications

### 3.1 Landing Page

#### Hero Section
**Layout**: Full viewport height with animated background
- **Background**: Subtle animated grid pattern suggesting chart lines
- **Content**: 
  - Headline: "Your AI Trading Coach for Consistent Profitability"
  - Subheadline: "Master exit timing with MFE analysis. Build discipline through rehab mode. Trade with confidence."
  - CTA: "Start Your Free Trial" (glassmorphic button with glow)
  - Social Proof: "Trusted by 1,000+ traders improving daily"

**Visual Elements**:
- Floating glassmorphic cards showing live grades (💎/🔥/☠️)
- Subtle particle effects suggesting upward momentum
- Progress rings animating in background

#### Features Section
**Layout**: Alternating left/right with dimensional cards

**Feature 1: AI-Powered Pre-Trade Analysis**
- Visual: Glassmorphic card with verdict display
- Copy: "Get instant analysis before risking capital"
- Micro-animation: Confidence percentage counting up

**Feature 2: MFE Tracking & Optimization**
- Visual: Mini chart showing entry→MFE→exit
- Copy: "Never leave money on the table again"
- Micro-animation: Progress bar filling

**Feature 3: Rehab Mode Progression**
- Visual: Phase badges unlocking
- Copy: "Structured path from recovery to profitability"
- Micro-animation: Levels lighting up sequentially

**Feature 4: Real-Time AI Coaching**
- Visual: Chat interface with mentor messages
- Copy: "Your 24/7 trading mentor in your pocket"
- Micro-animation: Message bubbles appearing

#### Trust Section
**Components**:
- Glassmorphic testimonial cards with trader photos
- Performance improvement statistics
- Security badges (SOC2, SSL, etc.)
- "As seen in" media logos

#### Pricing Section
**Layout**: Three-tier glassmorphic cards

**Tiers**:
1. **Starter**: $97/mo - Essential coaching
2. **Professional**: $197/mo - Full analytics (highlighted)
3. **Fund**: $497/mo - Multi-account, API access

**Visual Treatment**:
- Professional tier: Subtle glow effect
- All cards: Hover animation (slight lift + glow)
- Feature comparison table below

### 3.2 Features Page

**Hero**: Condensed with feature navigation tabs
**Sections**: Deep-dive into each core feature
- Pre-Trade Analysis (with interactive demo)
- MFE Analytics (animated examples)
- Rehab Mode (progression visualization)
- AI Coaching (sample conversations)

### 3.3 About Page

**Story Structure**:
1. The Problem (why traders fail)
2. The Journey (founder's trading struggles)
3. The Solution (birth of Trading Coach AI)
4. The Mission (democratize professional coaching)

**Visual Elements**:
- Timeline with glassmorphic milestone cards
- Team photos with glass-morphism overlays
- Trading floor background imagery

### 3.4 Blog/Education

**Layout**: Glassmorphic article cards in grid
**Categories**: Strategy, Psychology, MFE Mastery, Success Stories
**Visual**: Each article has hero image with glass overlay

## 4. Component Library

### 4.1 Navigation
```css
/* Glassmorphic navbar */
.navbar {
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  position: fixed;
  z-index: 50;
}
```

### 4.2 Buttons
```css
/* Primary CTA */
.btn-primary {
  background: linear-gradient(135deg, #2563EB, #3B82F6);
  box-shadow: 
    0 4px 15px rgba(37, 99, 235, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 8px 25px rgba(37, 99, 235, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}
```

### 4.3 Cards
```css
.glass-card {
  background: rgba(30, 41, 59, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
}
```

### 4.4 Form Elements
```css
.input-field {
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);
}

.input-field:focus {
  border-color: #3B82F6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
```

## 5. Animations & Interactions

### 5.1 Micro-animations
- **Hover**: Cards lift 4px with shadow expansion
- **Click**: Scale 0.98 with quick bounce back
- **Loading**: Pulse opacity 0.5 to 1
- **Success**: Emerald glow burst
- **Scroll**: Parallax on hero elements

### 5.2 Page Transitions
- **Entry**: Fade in + slide up (staggered for elements)
- **Exit**: Fade out
- **Route Change**: Smooth scroll to top

### 5.3 Interactive Elements
- **Progress Rings**: Animate on scroll into view
- **Counters**: Count up when visible
- **Charts**: Draw from left to right
- **Grades**: Stamp effect on reveal

## 6. Mobile Responsive Design

### 6.1 Breakpoints
```css
--mobile: 375px;
--tablet: 768px;
--desktop: 1024px;
--wide: 1440px;
```

### 6.2 Mobile Optimizations
- **Navigation**: Hamburger menu with full-screen glass overlay
- **Cards**: Stack vertically with full width
- **Typography**: Scale down 20% on mobile
- **Touch Targets**: Minimum 44px height
- **Spacing**: Reduce by 25% on mobile

### 6.3 Mobile-First Features
- **Swipe**: Between testimonials
- **Tap**: Expand feature details
- **Pull**: Refresh pricing

## 7. Performance Guidelines

### 7.1 Loading Strategy
- Critical CSS inline
- Lazy load images below fold
- Preload hero imagery
- Font subsetting for performance

### 7.2 Animation Performance
- Use CSS transforms only
- Will-change on animated elements
- RequestAnimationFrame for JS animations
- Reduce motion for accessibility

## 8. Conversion Optimization

### 8.1 CTA Placement
- Above fold: Primary CTA
- After each feature section
- Floating mobile CTA bar
- Exit intent popup

### 8.2 Trust Signals
- SSL badge in footer
- Testimonials with real photos
- Live trade counter
- Money-back guarantee badge

### 8.3 Social Proof
- "X traders online now"
- Recent sign-up notifications
- Success story carousel
- Media mentions bar

## 9. SEO & Meta

### 9.1 Meta Tags
```html
<meta name="description" content="AI-powered trading coach for consistent profitability. Master MFE analysis, build discipline through rehab mode.">
<meta property="og:image" content="trading-coach-ai-hero.jpg">
```

### 9.2 Schema Markup
- Organization
- Product
- Reviews
- FAQ

## 10. Launch Checklist

### Pre-Launch
- [ ] Cross-browser testing (Chrome, Safari, Firefox, Edge)
- [ ] Mobile device testing (iOS, Android)
- [ ] Performance audit (< 3s load time)
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] SEO audit
- [ ] Analytics setup (GA4, Hotjar)
- [ ] A/B test setup

### Post-Launch
- [ ] Monitor conversion rates
- [ ] Heatmap analysis
- [ ] User session recordings
- [ ] Performance monitoring
- [ ] Error tracking