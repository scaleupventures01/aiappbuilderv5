import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

const routeLabels: Record<string, string> = {
  '': 'Dashboard',
  'chat': 'Chat',
  'trading': 'Trading View',
  'psychology': 'Psychology Coaching',
  'history': 'Trade History',
  'training': 'Training Trades',
  'settings': 'Settings',
  'profile': 'Profile',
};

export const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', href: '/' },
  ];

  let currentPath = '';
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
    const isLast = index === pathSegments.length - 1;
    
    breadcrumbs.push({
      label,
      href: isLast ? undefined : currentPath,
    });
  });

  // Don't show breadcrumbs on home page
  if (pathSegments.length === 0) {
    return null;
  }

  return (
    <nav className="flex mb-4" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {breadcrumbs.map((breadcrumb, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="h-4 w-4 mx-2 text-gray-400" aria-hidden="true" />
            )}
            {breadcrumb.href ? (
              <Link
                to={breadcrumb.href}
                className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                {index === 0 ? (
                  <Home className="h-4 w-4" aria-label="Home" />
                ) : (
                  breadcrumb.label
                )}
              </Link>
            ) : (
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100" aria-current="page">
                {breadcrumb.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;