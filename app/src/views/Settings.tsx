import React, { useState, useEffect, useCallback } from 'react';
import { SpeedSelector, SpeedMode } from '../components/SpeedSelector';
import { cn } from '@/utils/cn';
import { useToast } from '../components/ui/ToastNotification';

interface SpeedPreferences {
  defaultSpeed: SpeedMode;
  autoAdjust: boolean;
  costLimit: number;
  timeLimit: number;
}

interface UserSettings {
  speedPreferences: SpeedPreferences;
  notifications: {
    speedChanges: boolean;
    costAlerts: boolean;
    performanceReports: boolean;
  };
  analytics: {
    trackUsage: boolean;
    shareMetrics: boolean;
  };
}

const Settings: React.FC = () => {
  const { addToast } = useToast();
  const [settings, setSettings] = useState<UserSettings>({
    speedPreferences: {
      defaultSpeed: 'balanced',
      autoAdjust: false,
      costLimit: 50, // dollars per month
      timeLimit: 30 // max seconds per response
    },
    notifications: {
      speedChanges: true,
      costAlerts: true,
      performanceReports: false
    },
    analytics: {
      trackUsage: true,
      shareMetrics: false
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/users/speed-preference', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setSettings(prevSettings => ({
            ...prevSettings,
            speedPreferences: {
              ...prevSettings.speedPreferences,
              defaultSpeed: data.data.speedMode || 'balanced'
            }
          }));
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      addToast({
        type: 'error',
        title: 'Failed to load settings',
        message: 'Using default settings. Please try refreshing the page.'
      });
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  // Load settings from API
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const saveSettings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/users/speed-preference', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          speedMode: settings.speedPreferences.defaultSpeed,
          autoAdjust: settings.speedPreferences.autoAdjust,
          costLimit: settings.speedPreferences.costLimit,
          timeLimit: settings.speedPreferences.timeLimit
        })
      });

      if (response.ok) {
        setHasChanges(false);
        addToast({
          type: 'success',
          title: 'Settings saved',
          message: 'Your preferences have been updated successfully.'
        });
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      addToast({
        type: 'error',
        title: 'Failed to save settings',
        message: 'Please try again later.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateSpeedPreferences = (updates: Partial<SpeedPreferences>) => {
    setSettings(prev => ({
      ...prev,
      speedPreferences: { ...prev.speedPreferences, ...updates }
    }));
    setHasChanges(true);
  };

  const updateNotifications = (key: keyof UserSettings['notifications'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: value }
    }));
    setHasChanges(true);
  };

  const updateAnalytics = (key: keyof UserSettings['analytics'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      analytics: { ...prev.analytics, [key]: value }
    }));
    setHasChanges(true);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Customize your AI trading coach experience
        </p>
      </div>

      {/* Speed Preferences Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Speed Preferences
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Configure how fast you want AI responses and manage costs
        </p>

        <div className="space-y-6">
          {/* Default Speed Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Default Speed Mode
            </label>
            <SpeedSelector
              selected={settings.speedPreferences.defaultSpeed}
              onSelect={(speed) => updateSpeedPreferences({ defaultSpeed: speed })}
              showDetails={true}
              disabled={isLoading}
            />
          </div>

          {/* Auto-adjust toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Auto-adjust Speed
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Automatically adjust speed based on message complexity
              </p>
            </div>
            <button
              onClick={() => updateSpeedPreferences({ autoAdjust: !settings.speedPreferences.autoAdjust })}
              disabled={isLoading}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                settings.speedPreferences.autoAdjust ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 rounded-full bg-white transition-transform',
                  settings.speedPreferences.autoAdjust ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>

          {/* Cost and Time Limits */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Monthly Cost Limit ($)
              </label>
              <input
                type="number"
                min="0"
                max="1000"
                step="5"
                value={settings.speedPreferences.costLimit}
                onChange={(e) => updateSpeedPreferences({ costLimit: Number(e.target.value) })}
                disabled={isLoading}
                className={cn(
                  'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg',
                  'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
                  'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Max Response Time (seconds)
              </label>
              <input
                type="number"
                min="5"
                max="120"
                step="5"
                value={settings.speedPreferences.timeLimit}
                onChange={(e) => updateSpeedPreferences({ timeLimit: Number(e.target.value) })}
                disabled={isLoading}
                className={cn(
                  'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg',
                  'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
                  'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Notifications Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Notifications
        </h2>
        <div className="space-y-4">
          {[
            {
              key: 'speedChanges' as const,
              title: 'Speed Changes',
              description: 'Notify when auto-adjust changes speed mode'
            },
            {
              key: 'costAlerts' as const,
              title: 'Cost Alerts',
              description: 'Alert when approaching cost limits'
            },
            {
              key: 'performanceReports' as const,
              title: 'Performance Reports',
              description: 'Weekly summaries of speed and cost metrics'
            }
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {item.description}
                </p>
              </div>
              <button
                onClick={() => updateNotifications(item.key, !settings.notifications[item.key])}
                disabled={isLoading}
                className={cn(
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  settings.notifications[item.key] ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                )}
              >
                <span
                  className={cn(
                    'inline-block h-4 w-4 rounded-full bg-white transition-transform',
                    settings.notifications[item.key] ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Analytics Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Analytics & Privacy
        </h2>
        <div className="space-y-4">
          {[
            {
              key: 'trackUsage' as const,
              title: 'Track Usage',
              description: 'Allow tracking for personalized insights'
            },
            {
              key: 'shareMetrics' as const,
              title: 'Share Metrics',
              description: 'Help improve AI by sharing anonymous usage data'
            }
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {item.description}
                </p>
              </div>
              <button
                onClick={() => updateAnalytics(item.key, !settings.analytics[item.key])}
                disabled={isLoading}
                className={cn(
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  settings.analytics[item.key] ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                )}
              >
                <span
                  className={cn(
                    'inline-block h-4 w-4 rounded-full bg-white transition-transform',
                    settings.analytics[item.key] ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      {hasChanges && (
        <div className="sticky bottom-6 flex justify-center">
          <button
            onClick={saveSettings}
            disabled={isLoading}
            className={cn(
              'px-6 py-3 bg-blue-600 text-white rounded-lg font-medium',
              'hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'shadow-lg transition-all duration-200'
            )}
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </div>
            ) : (
              'Save Settings'
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default Settings;