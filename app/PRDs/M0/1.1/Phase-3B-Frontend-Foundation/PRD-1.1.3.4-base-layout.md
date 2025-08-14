# PRD: Base Layout Component

## 1. Overview

This PRD defines the base layout component for the Elite Trading Coach AI frontend application, providing the fundamental structure and navigation framework for all application pages.

## 2. Feature Requirements

### 2.1 Functional Requirements
- **FR-1**: Create responsive base layout component with header, sidebar, and main content areas
- **FR-2**: Implement navigation menu with routing integration
- **FR-3**: Add user authentication status display and logout functionality
- **FR-4**: Support mobile-responsive sidebar with hamburger menu
- **FR-5**: Include breadcrumb navigation for page hierarchy

### 2.2 Non-Functional Requirements
- **NFR-1**: Layout renders in < 100ms on all devices
- **NFR-2**: Responsive design works on 320px to 2560px viewports
- **NFR-3**: Accessible navigation with keyboard and screen reader support
- **NFR-4**: Smooth animations for mobile menu transitions

## 3. User Stories

### 3.1 Primary User Stories
- **US-1**: As a user, I want consistent navigation so I can easily move between different sections of the application
- **US-2**: As a mobile user, I want a collapsible sidebar so I can access navigation without losing screen space
- **US-3**: As a user, I want to see my authentication status so I know if I'm logged in

### 3.2 Edge Cases
- **EC-1**: Handling very long navigation menu items
- **EC-2**: Managing layout on extremely narrow viewports
- **EC-3**: Dealing with deep navigation hierarchies

## 4. Technical Specifications

### 4.1 Layout Component Structure
```typescript
// src/components/layout/BaseLayout.tsx
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import Breadcrumbs from './Breadcrumbs';

interface BaseLayoutProps {
  children?: React.ReactNode;
}

export const BaseLayout: React.FC<BaseLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      {/* Main content area */}
      <div className="lg:pl-64">
        {/* Header */}
        <Header onMenuClick={() => setSidebarOpen(true)} />

        {/* Page content */}
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Breadcrumbs />
          <div className="mx-auto max-w-7xl">
            {children || <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
};
```

### 4.2 Header Component
```typescript
// src/components/layout/Header.tsx
import React from 'react';
import { Bell, Menu, Settings, User } from 'lucide-react';
import { useAuthStore } from '@stores/authStore';

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { user, logout } = useAuthStore();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
      <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        {/* Mobile menu button */}
        <button
          type="button"
          className="lg:hidden p-2 text-gray-500 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
          onClick={onMenuClick}
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Logo/Title */}
        <div className="flex items-center">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Elite Trading Coach
          </h1>
        </div>

        {/* Right side actions */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button className="p-2 text-gray-500 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500">
            <Bell className="h-5 w-5" />
          </button>

          {/* User menu */}
          <div className="relative">
            <button className="flex items-center space-x-2 p-2 text-gray-500 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500">
              <User className="h-5 w-5" />
              <span className="hidden sm:block text-sm font-medium">
                {user?.name || 'User'}
              </span>
            </button>
          </div>

          {/* Settings */}
          <button className="p-2 text-gray-500 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500">
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
```

### 4.3 Sidebar Component
```typescript
// src/components/layout/Sidebar.tsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  MessageSquare, 
  TrendingUp, 
  BookOpen, 
  BarChart3, 
  Brain,
  X 
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigation = [
  { name: 'Chat', href: '/chat', icon: MessageSquare },
  { name: 'Trading View', href: '/trading', icon: TrendingUp },
  { name: 'Psychology Coaching', href: '/psychology', icon: Brain },
  { name: 'Trade History', href: '/history', icon: BarChart3 },
  { name: 'Training Trades', href: '/training', icon: BookOpen },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  return (
    <div className={`
      fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
      dark:bg-gray-800 lg:translate-x-0 lg:static lg:inset-0
      ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}>
      {/* Sidebar header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Navigation
        </h2>
        <button
          className="lg:hidden p-2 text-gray-500 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation menu */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              }`
            }
            onClick={onClose}
          >
            <item.icon className="mr-3 h-5 w-5" />
            {item.name}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};
```

## 5. Acceptance Criteria

### 5.1 Definition of Done
- [ ] Base layout component created with responsive design
- [ ] Header with logo, user info, and actions implemented
- [ ] Sidebar with navigation menu working
- [ ] Mobile responsive with hamburger menu
- [ ] Breadcrumb navigation functional
- [ ] Dark mode support throughout layout
- [ ] Accessibility features implemented

### 5.2 Testing Requirements
- [ ] Layout renders correctly on all screen sizes
- [ ] Navigation works across all routes
- [ ] Mobile menu opens/closes properly
- [ ] Keyboard navigation functional
- [ ] Screen reader compatibility verified

## 6. Dependencies

### 6.1 Technical Dependencies
- React Router for navigation
- TailwindCSS setup (PRD-1.1.3.3)
- TypeScript configuration (PRD-1.1.3.2)
- Lucide React for icons
- Auth store for user state

### 6.2 Business Dependencies
- Application navigation structure
- User authentication requirements
- Brand design guidelines

## 7. Risks and Mitigations

### 7.1 Technical Risks
- **Risk**: Layout performance issues on mobile devices
  - **Mitigation**: Optimize animations and use CSS transforms
- **Risk**: Navigation complexity affecting UX
  - **Mitigation**: Keep navigation simple and intuitive

### 7.2 Business Risks
- **Risk**: Poor navigation UX affecting user engagement
  - **Mitigation**: User testing and iterative improvements

## 8. Success Metrics

### 8.1 Technical Metrics
- Layout renders in < 100ms
- Responsive design works 320px-2560px
- 100% accessibility compliance
- Smooth 60fps animations

### 8.2 Business Metrics
- Intuitive navigation experience
- Fast page transitions
- Mobile-friendly interface

## 9. Implementation Timeline

### 9.1 Development Phases
- **Phase 1**: Basic layout structure (4 hours)
- **Phase 2**: Header and sidebar components (6 hours)
- **Phase 3**: Mobile responsiveness (4 hours)
- **Phase 4**: Accessibility and testing (4 hours)

### 9.2 Milestones
- **M1**: Basic layout structure working (Day 1)
- **M2**: Navigation components complete (Day 2)
- **M3**: Mobile responsive design done (Day 2)
- **M4**: Accessibility and testing completed (Day 3)

## 10. Appendices

### 10.1 Responsive Breakpoints
```typescript
// Layout responsive behavior
const layoutBreakpoints = {
  mobile: '< 768px - Sidebar hidden, hamburger menu visible',
  tablet: '768px - 1024px - Sidebar overlay on demand',
  desktop: '> 1024px - Sidebar always visible, full layout'
};
```

### 10.2 Accessibility Features
- ARIA labels for navigation elements
- Keyboard navigation support (Tab, Enter, Escape)
- Screen reader announcements for route changes
- Focus management for mobile menu
- High contrast mode support

### 10.3 Animation Configuration
```typescript
// Sidebar animation classes
const animations = {
  slideIn: 'transform translate-x-0 transition-transform duration-300 ease-in-out',
  slideOut: 'transform -translate-x-full transition-transform duration-300 ease-in-out',
  fadeIn: 'opacity-100 transition-opacity duration-300',
  fadeOut: 'opacity-0 transition-opacity duration-300'
};
```