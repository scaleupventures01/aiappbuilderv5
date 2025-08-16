import React from 'react';
import { VirtualizedMessageList } from './VirtualizedMessageList';
import { Message } from '@/types/chat';

// Example usage of the enhanced VirtualizedMessageList component
export const VirtualizedMessageListExample: React.FC = () => {
  // Sample messages for demonstration
  const sampleMessages: Message[] = Array.from({ length: 100 }, (_, i) => ({
    id: `msg-${i}`,
    conversationId: 'example-conversation',
    userId: i % 2 === 0 ? 'user-1' : 'user-2',
    content: i % 2 === 0 
      ? `User message ${i}: This is a sample user message that demonstrates the dynamic height calculation feature.`
      : `AI response ${i}: This is a longer AI response that shows how the VirtualizedMessageList handles different message lengths and automatically adjusts heights for optimal performance. The enhanced component includes features like progressive auto-scroll, performance monitoring, and mobile optimization.`,
    type: i % 2 === 0 ? 'user' : 'ai',
    status: 'delivered',
    metadata: {
      attachments: i % 10 === 0 ? [
        {
          id: `attachment-${i}`,
          name: `chart-${i}.png`,
          type: 'image',
          url: `/charts/chart-${i}.png`,
          size: 1024 * 50,
          mimeType: 'image/png',
          metadata: { width: 800, height: 600 },
          uploadedAt: new Date().toISOString()
        }
      ] : [],
      reactions: [],
      mentions: [],
      priority: 'normal',
      confidence: i % 2 === 1 ? 0.95 : undefined
    },
    createdAt: new Date(Date.now() - (100 - i) * 60000).toISOString(),
    updatedAt: new Date(Date.now() - (100 - i) * 60000).toISOString()
  }));

  const handleLoadMore = async () => {
    console.log('Loading more messages...');
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  const handlePerformanceUpdate = (metrics: any) => {
    console.log('Performance metrics:', metrics);
  };

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Enhanced VirtualizedMessageList Demo
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Features: Dynamic Heights • Progressive Auto-scroll • Performance Monitoring • Mobile Optimization
          </p>
        </div>
        
        <div className="h-[calc(100%-80px)]">
          <VirtualizedMessageList
            messages={sampleMessages}
            isTyping={false}
            hasMore={true}
            onLoadMore={handleLoadMore}
            containerHeight={600}
            enablePerformanceMonitoring={true}
            enableMobileOptimization={true}
            dynamicHeights={true}
            onPerformanceUpdate={handlePerformanceUpdate}
            className="h-full"
          />
        </div>
      </div>
    </div>
  );
};