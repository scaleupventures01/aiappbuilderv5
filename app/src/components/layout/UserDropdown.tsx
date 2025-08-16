import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  User, 
  Settings, 
  Moon, 
  Sun, 
  LogOut, 
  ChevronDown,
  UserCircle,
  Shield,
  HelpCircle
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../contexts/ThemeContext';
import { usePerformanceMonitor } from '../../hooks/usePerformanceMonitor';

interface UserDropdownProps {
  className?: string;
}

const UserDropdownComponent: React.FC<UserDropdownProps> = ({ className = '' }) => {
  usePerformanceMonitor('UserDropdown');
  
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { user, logout } = useAuthStore();
  const { theme, isDark, toggleTheme, setTheme } = useTheme();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  const handleToggle = useCallback(() => {
    setIsOpen(!isOpen);
  }, [isOpen]);

  const handleMenuItemClick = useCallback((action: () => void) => {
    action();
    setIsOpen(false);
  }, []);

  const handleThemeToggle = useCallback(() => {
    // Cycle through themes: light -> dark -> system -> light
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  }, [theme, setTheme]);

  const menuItems = useMemo(() => [
    {
      icon: UserCircle,
      label: 'Profile',
      action: () => {
        // TODO: Navigate to profile page
        console.log('Navigate to profile');
      },
      shortcut: null
    },
    {
      icon: Settings,
      label: 'Settings', 
      action: () => {
        // TODO: Navigate to settings page
        console.log('Navigate to settings');
      },
      shortcut: '⌘,'
    },
    {
      icon: isDark ? Sun : Moon,
      label: theme === 'system' ? 'System Theme' : isDark ? 'Light Mode' : 'Dark Mode',
      action: handleThemeToggle,
      shortcut: '⌘D'
    },
    {
      icon: Shield,
      label: 'Privacy & Security',
      action: () => {
        // TODO: Navigate to privacy settings
        console.log('Navigate to privacy settings');
      },
      shortcut: null
    },
    {
      icon: HelpCircle,
      label: 'Help & Support',
      action: () => {
        // TODO: Open help center
        console.log('Open help center');
      },
      shortcut: '?'
    }
  ], [isDark, theme, handleThemeToggle]);

  const separatorIndex = 2; // Add separator after theme toggle

  if (!user) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      {/* User dropdown button */}
      <button
        ref={buttonRef}
        type="button"
        className="flex items-center space-x-2 p-2 text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary rounded-md transition-colors"
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="User menu"
      >
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
            {user.name ? user.name.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {user.name || 'User'}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-32">
              {user.email}
            </div>
          </div>
          <ChevronDown 
            className={`h-4 w-4 transform transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`} 
          />
        </div>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50 focus:outline-none"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="user-menu"
        >
          {/* User info header */}
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium">
                {user.name ? user.name.charAt(0).toUpperCase() : <User className="h-5 w-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {user.name || 'User'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user.email}
                </div>
              </div>
            </div>
          </div>

          {/* Menu items */}
          <div className="py-1">
            {menuItems.map((item, index) => (
              <React.Fragment key={item.label}>
                <button
                  type="button"
                  className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700"
                  role="menuitem"
                  onClick={() => handleMenuItemClick(item.action)}
                >
                  <div className="flex items-center space-x-3">
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.shortcut && (
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {item.shortcut}
                    </span>
                  )}
                </button>
                {index === separatorIndex && (
                  <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Logout section */}
          <div className="border-t border-gray-100 dark:border-gray-700 pt-1">
            <button
              type="button"
              className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors focus:outline-none focus:bg-red-50 dark:focus:bg-red-900/20"
              role="menuitem"
              onClick={() => handleMenuItemClick(logout)}
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Memoize the component for performance
export const UserDropdown = React.memo(UserDropdownComponent);

export default UserDropdown;