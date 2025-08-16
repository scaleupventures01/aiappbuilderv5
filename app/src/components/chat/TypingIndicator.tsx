import React from 'react';

export const TypingIndicator: React.FC = () => {
  return (
    <div className="flex items-center space-x-2">
      <div className="bg-gray-200 dark:bg-gray-700 rounded-2xl px-4 py-3 max-w-xs">
        <div className="flex space-x-1">
          <div 
            className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce" 
            style={{ animationDelay: '0ms', animationDuration: '1.4s' }} 
          />
          <div 
            className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce" 
            style={{ animationDelay: '160ms', animationDuration: '1.4s' }} 
          />
          <div 
            className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce" 
            style={{ animationDelay: '320ms', animationDuration: '1.4s' }} 
          />
        </div>
      </div>
      <span className="text-xs text-gray-500 dark:text-gray-400">
        AI Trading Coach is thinking...
      </span>
    </div>
  );
};