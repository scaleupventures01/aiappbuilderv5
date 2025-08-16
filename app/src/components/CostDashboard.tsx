import React, { useState, useEffect } from 'react';
import { cn } from '@/utils/cn';
import { SpeedMode } from './SpeedSelector';

interface SpeedUsageData {
  mode: SpeedMode;
  count: number;
  totalCost: number;
  avgResponseTime: number;
  percentage: number;
}

interface CostTrend {
  date: string;
  cost: number;
  messageCount: number;
  avgSpeed: SpeedMode;
}

interface CostSavings {
  totalSaved: number;
  comparedToAllHighAccuracy: number;
  optimalModeUsage: number;
}

interface DashboardData {
  totalCost: number;
  totalMessages: number;
  avgCostPerMessage: number;
  currentMonthSpend: number;
  monthlyLimit: number;
  speedUsage: SpeedUsageData[];
  costTrends: CostTrend[];
  savings: CostSavings;
}

interface CostDashboardProps {
  className?: string;
  period?: 'week' | 'month' | 'quarter';
  compact?: boolean;
}

const CostDashboard: React.FC<CostDashboardProps> = ({
  className = '',
  period = 'month'
}) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(period);

  useEffect(() => {
    loadDashboardData();
  }, [selectedPeriod]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Mock data for now - replace with actual API call
      const mockData: DashboardData = {
        totalCost: 12.45,
        totalMessages: 156,
        avgCostPerMessage: 0.08,
        currentMonthSpend: 12.45,
        monthlyLimit: 50.00,
        speedUsage: [
          {
            mode: 'super_fast',
            count: 24,
            totalCost: 0.24,
            avgResponseTime: 2.1,
            percentage: 15.4
          },
          {
            mode: 'fast',
            count: 45,
            totalCost: 1.35,
            avgResponseTime: 5.8,
            percentage: 28.8
          },
          {
            mode: 'balanced',
            count: 67,
            totalCost: 3.35,
            avgResponseTime: 12.3,
            percentage: 42.9
          },
          {
            mode: 'high_accuracy',
            count: 20,
            totalCost: 7.51,
            avgResponseTime: 18.7,
            percentage: 12.8
          }
        ],
        costTrends: [
          { date: '2024-01-01', cost: 1.20, messageCount: 15, avgSpeed: 'balanced' },
          { date: '2024-01-02', cost: 2.10, messageCount: 28, avgSpeed: 'balanced' },
          { date: '2024-01-03', cost: 1.80, messageCount: 22, avgSpeed: 'fast' },
          { date: '2024-01-04', cost: 3.20, messageCount: 35, avgSpeed: 'balanced' },
          { date: '2024-01-05', cost: 2.90, messageCount: 31, avgSpeed: 'balanced' },
          { date: '2024-01-06', cost: 1.25, messageCount: 25, avgSpeed: 'fast' }
        ],
        savings: {
          totalSaved: 37.55,
          comparedToAllHighAccuracy: 62.5,
          optimalModeUsage: 85.2
        }
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setData(mockData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSpeedModeColor = (mode: SpeedMode): string => {
    const colors = {
      super_fast: 'bg-red-500',
      fast: 'bg-orange-500',
      balanced: 'bg-blue-500',
      high_accuracy: 'bg-green-500'
    };
    return colors[mode];
  };

  const getSpeedModeName = (mode: SpeedMode): string => {
    const names = {
      super_fast: 'Super Fast',
      fast: 'Fast',
      balanced: 'Balanced',
      high_accuracy: 'High Accuracy'
    };
    return names[mode];
  };

  if (isLoading) {
    return (
      <div className={cn('bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6', className)}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded" />
            ))}
          </div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={cn('bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6', className)}>
        <div className="text-center text-gray-500 dark:text-gray-400">
          Failed to load cost analytics
        </div>
      </div>
    );
  }

  const utilizationPercentage = (data.currentMonthSpend / data.monthlyLimit) * 100;

  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700', className)}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Cost Analytics
          </h2>
          <div className="flex items-center space-x-2">
            {['week', 'month', 'quarter'].map((p) => (
              <button
                key={p}
                onClick={() => setSelectedPeriod(p as any)}
                className={cn(
                  'px-3 py-1 text-sm rounded-lg transition-colors',
                  selectedPeriod === p
                    ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Spend</div>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              ${data.totalCost.toFixed(2)}
            </div>
            <div className="text-xs text-blue-700 dark:text-blue-300">
              {data.totalMessages} messages
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <div className="text-sm text-green-600 dark:text-green-400 font-medium">Avg Cost</div>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">
              ${data.avgCostPerMessage.toFixed(3)}
            </div>
            <div className="text-xs text-green-700 dark:text-green-300">
              per message
            </div>
          </div>

          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
            <div className="text-sm text-orange-600 dark:text-orange-400 font-medium">Monthly Usage</div>
            <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
              {utilizationPercentage.toFixed(1)}%
            </div>
            <div className="text-xs text-orange-700 dark:text-orange-300">
              of ${data.monthlyLimit} limit
            </div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
            <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">Savings</div>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              ${data.savings.totalSaved.toFixed(2)}
            </div>
            <div className="text-xs text-purple-700 dark:text-purple-300">
              vs all high accuracy
            </div>
          </div>
        </div>

        {/* Budget Progress */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Monthly Budget</h3>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              ${data.currentMonthSpend.toFixed(2)} / ${data.monthlyLimit.toFixed(2)}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
            <div
              className={cn(
                'h-3 rounded-full transition-all duration-300',
                utilizationPercentage > 90 ? 'bg-red-500' :
                utilizationPercentage > 70 ? 'bg-yellow-500' : 'bg-green-500'
              )}
              style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
            />
          </div>
          {utilizationPercentage > 80 && (
            <div className="mt-2 text-xs text-yellow-600 dark:text-yellow-400">
              ⚠️ Approaching budget limit
            </div>
          )}
        </div>

        {/* Speed Mode Distribution */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            Speed Mode Usage
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.speedUsage.map((usage) => (
              <div key={usage.mode} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className={cn('w-3 h-3 rounded-full', getSpeedModeColor(usage.mode))} />
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {getSpeedModeName(usage.mode)}
                    </span>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {usage.percentage.toFixed(1)}%
                  </span>
                </div>
                
                <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                  <div className="flex justify-between">
                    <span>Messages:</span>
                    <span>{usage.count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Cost:</span>
                    <span>${usage.totalCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Response:</span>
                    <span>{usage.avgResponseTime.toFixed(1)}s</span>
                  </div>
                </div>
                
                {/* Usage bar */}
                <div className="mt-2 w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div
                    className={cn('h-2 rounded-full', getSpeedModeColor(usage.mode))}
                    style={{ width: `${usage.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cost Trends Chart (simplified) */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            Daily Cost Trends
          </h3>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-end space-x-2 h-32">
              {data.costTrends.map((trend) => (
                <div key={trend.date} className="flex-1 flex flex-col items-center">
                  <div
                    className="bg-blue-500 rounded-t w-full min-h-[4px] transition-all duration-300 hover:bg-blue-600"
                    style={{ 
                      height: `${(trend.cost / Math.max(...data.costTrends.map(t => t.cost))) * 100}%` 
                    }}
                    title={`${trend.date}: $${trend.cost.toFixed(2)}`}
                  />
                  <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                    {new Date(trend.date).getDate()}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-center space-x-4 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded" />
                <span>Daily spend</span>
              </div>
            </div>
          </div>
        </div>

        {/* Optimization Insights */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
            💡 Optimization Insights
          </h3>
          <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <div>• You're using optimal speed modes {data.savings.optimalModeUsage.toFixed(1)}% of the time</div>
            <div>• Consider using "Fast" mode for simple questions to save costs</div>
            <div>• Current trend suggests you'll spend ~${(data.currentMonthSpend * 2).toFixed(2)} this month</div>
            {utilizationPercentage > 70 && (
              <div className="text-yellow-700 dark:text-yellow-300">
                • ⚠️ You're approaching your monthly budget limit
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CostDashboard;