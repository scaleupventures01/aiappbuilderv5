import React, { useState, useCallback } from 'react';
import { Bell, Menu, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import UserDropdown from './UserDropdown';
import { usePerformanceMonitor } from '../../hooks/usePerformanceMonitor';

interface HeaderProps {
  onMenuClick: () => void;
}

const HeaderComponent: React.FC<HeaderProps> = ({ onMenuClick }) => {
  usePerformanceMonitor('Header');
  
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const handleNotificationClick = useCallback(() => {
    setNotificationsOpen(!notificationsOpen);
    // TODO: Implement notifications panel
  }, [notificationsOpen]);

  const handleSettingsClick = useCallback(() => {
    navigate('/settings');
  }, [navigate]);

  return (
    <header 
      className="bg-white shadow-sm border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700"
      role="banner"
      aria-label="Site header"
    >
      <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        {/* Mobile menu button with animation */}
        <button
          type="button"
          className="lg:hidden p-2 text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary rounded-md transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-95"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          aria-expanded={false}
          aria-controls="navigation"
        >
          <Menu className="h-6 w-6 transition-transform duration-200 hover:scale-110" aria-hidden="true" />
        </button>

        {/* Logo/Title */}
        <div className="flex items-center">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            <span className="sr-only">Elite Trading Coach AI - </span>
            Elite Trading Coach
          </h1>
        </div>

        {/* Right side actions */}
        <nav className="flex items-center space-x-2" aria-label="User actions">
          {/* Notifications */}
          <button 
            onClick={handleNotificationClick}
            className={`p-2 text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary rounded-md transition-colors ${
              notificationsOpen ? 'bg-gray-100 dark:bg-gray-700' : ''
            }`}
            aria-label="View notifications"
            aria-expanded={notificationsOpen}
            aria-describedby="notifications-desc"
            type="button"
          >
            <Bell className="h-5 w-5" aria-hidden="true" />
            <span id="notifications-desc" className="sr-only">
              {notificationsOpen ? 'Close notifications panel' : 'Open notifications panel'}
            </span>
            {/* TODO: Add notification badge for unread count */}
          </button>

          {/* Settings */}
          <button 
            onClick={handleSettingsClick}
            className="p-2 text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary rounded-md transition-colors"
            aria-label="Open settings"
            type="button"
          >
            <Settings className="h-5 w-5" aria-hidden="true" />
          </button>

          {/* User dropdown */}
          <UserDropdown />
        </nav>
      </div>
    </header>
  );
};

// Memoize the component for performance
export const Header = React.memo(HeaderComponent);

export default Header;