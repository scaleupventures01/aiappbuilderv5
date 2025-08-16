import React, { useCallback, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  MessageSquare, 
  TrendingUp, 
  BookOpen, 
  BarChart3, 
  Brain,
  X,
  Home
} from 'lucide-react';
import { usePerformanceMonitor } from '../../hooks/usePerformanceMonitor';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Chat', href: '/chat', icon: MessageSquare },
  { name: 'Trading View', href: '/trading', icon: TrendingUp },
  { name: 'Psychology Coaching', href: '/psychology', icon: Brain },
  { name: 'Trade History', href: '/history', icon: BarChart3 },
  { name: 'Training Trades', href: '/training', icon: BookOpen },
];

const SidebarComponent: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  usePerformanceMonitor('Sidebar');

  const handleBackdropClick = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleCloseClick = useCallback(() => {
    onClose();
  }, [onClose]);

  // Memoize navigation items to prevent recreation on each render
  const navigationItems = useMemo(() => navigation.map((item, index) => (
    <NavLink
      key={item.name}
      to={item.href}
      className={({ isActive }) =>
        `flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 transform hover:translate-x-1 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
          isActive
            ? 'bg-primary text-primary-foreground shadow-md scale-105'
            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:shadow-sm dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100'
        }`
      }
      onClick={onClose}
      role="menuitem"
      aria-current={({ isActive }) => isActive ? 'page' : undefined}
      aria-describedby={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}-desc`}
      style={{
        animationDelay: `${index * 50}ms`
      }}
    >
      <item.icon 
        className="mr-3 h-5 w-5 transition-transform duration-200" 
        aria-hidden="true" 
      />
      <span className="transition-all duration-200">{item.name}</span>
      <span 
        id={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}-desc`}
        className="sr-only"
      >
        Navigate to {item.name}
      </span>
    </NavLink>
  )), [onClose]);

  return (
    <>
      {/* Mobile overlay backdrop */}
      <div 
        className={`fixed inset-0 bg-black transition-opacity duration-300 ease-in-out lg:hidden z-40 ${
          isOpen ? 'opacity-50' : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleBackdropClick}
        aria-hidden="true"
      />
      
      {/* Sidebar */}
      <aside 
        id="navigation"
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-all duration-300 ease-in-out
          dark:bg-gray-800 lg:translate-x-0 lg:static lg:inset-0 lg:shadow-none
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        role="navigation"
        aria-label="Main navigation"
        aria-hidden={!isOpen && typeof window !== 'undefined' && window.innerWidth < 1024}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 id="navigation-heading" className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Navigation
          </h2>
          <button
            className="lg:hidden p-2 text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary rounded-md transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={handleCloseClick}
            aria-label="Close navigation menu"
            aria-expanded={isOpen}
          >
            <X className="h-5 w-5 transform transition-transform duration-200" aria-hidden="true" />
          </button>
        </div>

        {/* Navigation menu */}
        <nav 
          className="flex-1 px-4 py-6 space-y-1" 
          role="menubar"
          aria-labelledby="navigation-heading"
        >
          {navigationItems}
        </nav>

        {/* Sidebar footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700" role="contentinfo">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            © 2025 Elite Trading Coach AI
          </p>
        </div>
      </aside>
    </>
  );
};

// Memoize the component for performance
export const Sidebar = React.memo(SidebarComponent);

export default Sidebar;