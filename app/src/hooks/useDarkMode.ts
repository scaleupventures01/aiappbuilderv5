import { useState, useEffect } from 'react';

/**
 * Custom hook for managing dark mode state
 * Persists preference in localStorage and applies class to document
 */
export const useDarkMode = () => {
  const [isDark, setIsDark] = useState<boolean>(() => {
    // Check localStorage first
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    // Check system preference
    if (window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    // Default to light mode
    return false;
  });

  useEffect(() => {
    // Apply dark mode class to document
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleDark = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  const setDarkMode = (dark: boolean) => {
    setIsDark(dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  };

  return {
    isDark,
    toggleDark,
    setDarkMode
  };
};

export default useDarkMode;