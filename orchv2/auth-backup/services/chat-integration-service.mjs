/**
 * Chat Integration Service
 * Integrates psychology coaching and training trades with the chat system
 */

import { Op } from 'sequelize';
import PsychologyCoachingService from './psychology-coaching-service.mjs';
import TrainingTradeService from './training-trade-service.mjs';
import TradeContextBuilder from './trade-context-builder.mjs';
import { tradingModels } from '../lib/trading-models.mjs';
import { database } from '../lib/database.mjs';
import { logger } from '../lib/logger.mjs';

const { Conversation, Trade, CoachingSession } = tradingModels;

export class ChatIntegrationService {
  constructor() {
    this.psychologyService = new PsychologyCoachingService();
    this.trainingService = new TrainingTradeService();
    this.contextBuilder = new TradeContextBuilder();
  }

  /**
   * Process chat message with trading context
   */
  async processChatMessage(userId, messageData) {
    const transaction = await database.sequelize.transaction();
    
    try {
      const {
        message,
        mode = 'General', // 'Trade-Analysis', 'Psychology-Coaching', 'General', 'Training'
        conversationId = null,
        chartImageUrl = null,
        relatedTradeIds = [],
        sessionType = null,
        marketState = null
      } = messageData;

      // Create or update conversation
      const conversation = await this.getOrCreateConversation(
        userId, 
        conversationId, 
        mode, 
        sessionType,
        marketState,
        transaction
      );

      // Build comprehensive context based on message mode
      const context = await this.buildMessageContext(userId, mode, relatedTradeIds);

      // Generate AI response based on mode and context
      const aiResponse = await this.generateContextualResponse(
        message,
        mode,
        context,
        chartImageUrl
      );

      // Add message to conversation
      const messageObj = {
        id: this.generateMessageId(),
        type: 'user',
        content: message,
        timestamp: new Date(),
        chartImageUrl,
        mode,
        relatedTradeIds
      };

      const responseObj = {
        id: this.generateMessageId(),
        type: 'assistant',
        content: aiResponse.content,
        timestamp: new Date(),
        mode,
        context: aiResponse.contextUsed,
        insights: aiResponse.insights
      };

      // Update conversation with new messages
      const updatedMessages = [...(conversation.messages || []), messageObj, responseObj];
      
      await conversation.update({
        messages: updatedMessages,
        relatedTradeIds: [...new Set([...conversation.relatedTradeIds, ...relatedTradeIds])],
        searchableContent: this.extractSearchableContent(updatedMessages),
        tags: this.extractTags(updatedMessages, mode)
      }, { transaction });

      // Create coaching session if in psychology mode
      let coachingSession = null;
      if (mode === 'Psychology-Coaching') {
        coachingSession = await this.psychologyService.createCoachingSession(userId, {
          sessionType: sessionType || 'Review',
          userMessage: message,
          marketState,
          relatedTradeIds,
          conversationId: conversation.id
        });
      }

      // Handle training trade commands
      let trainingResult = null;
      if (mode === 'Training') {
        trainingResult = await this.handleTrainingCommands(userId, message, conversation.id);
      }

      await transaction.commit();

      logger.info('Chat message processed', {
        userId,
        conversationId: conversation.id,
        mode,
        hasCoaching: !!coachingSession,
        hasTraining: !!trainingResult
      });

      return {
        conversation,
        message: messageObj,
        response: responseObj,
        coachingSession,
        trainingResult,
        context: context.summary
      };

    } catch (error) {
      await transaction.rollback();
      logger.error('Failed to process chat message', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Search conversations with advanced filtering
   */
  async searchConversations(userId, searchOptions) {
    try {
      const {
        query,
        mode,
        sessionType,
        tags,
        dateFrom,
        dateTo,
        hasTradeContext = false,
        limit = 20,
        offset = 0
      } = searchOptions;

      const whereClause = { userId, isActive: true };
      
      if (mode) {
        whereClause.mode = mode;
      }
      
      if (sessionType) {
        whereClause.sessionType = sessionType;
      }
      
      if (tags && tags.length > 0) {
        whereClause.tags = { [Op.overlap]: tags };
      }
      
      if (hasTradeContext) {
        whereClause.relatedTradeIds = { [Op.not]: [] };
      }
      
      if (dateFrom || dateTo) {
        whereClause.createdAt = {};
        if (dateFrom) whereClause.createdAt[Op.gte] = new Date(dateFrom);
        if (dateTo) whereClause.createdAt[Op.lte] = new Date(dateTo);
      }

      // Text search in searchable content
      if (query) {
        whereClause.searchableContent = {
          [Op.iLike]: `%${query}%`
        };
      }

      const conversations = await Conversation.findAndCountAll({
        where: whereClause,
        order: [['updatedAt', 'DESC']],
        limit,
        offset
      });

      // Enhance results with trade and coaching context
      const enhancedRows = await Promise.all(
        conversations.rows.map(async (conv) => {
          const convData = conv.toJSON();
          
          // Add related trades info
          if (convData.relatedTradeIds.length > 0) {
            const relatedTrades = await Trade.findAll({
              where: { id: { [Op.in]: convData.relatedTradeIds } },
              attributes: ['id', 'instrument', 'direction', 'pnlDollars', 'tradeType', 'entryTime']
            });
            convData.relatedTrades = relatedTrades;
          }
          
          // Add coaching session count
          const coachingCount = await CoachingSession.count({
            where: { conversationId: conv.id }
          });
          convData.coachingSessionsCount = coachingCount;
          
          return convData;
        })
      );

      return {
        conversations: enhancedRows,
        total: conversations.count,
        limit,
        offset
      };

    } catch (error) {
      logger.error('Failed to search conversations', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Get conversation analytics
   */
  async getConversationAnalytics(userId, days = 30) {
    try {
      const sinceDate = new Date();
      sinceDate.setDate(sinceDate.getDate() - days);

      const conversations = await Conversation.findAll({
        where: {
          userId,
          createdAt: { [Op.gte]: sinceDate },
          isActive: true
        }
      });

      // Mode breakdown
      const modeBreakdown = {};
      conversations.forEach(conv => {
        modeBreakdown[conv.mode] = (modeBreakdown[conv.mode] || 0) + 1;
      });

      // Daily activity
      const dailyActivity = {};
      conversations.forEach(conv => {
        const date = conv.createdAt.toDateString();
        dailyActivity[date] = (dailyActivity[date] || 0) + 1;
      });

      // Message count
      const totalMessages = conversations.reduce(
        (sum, conv) => sum + (conv.messages?.length || 0), 0
      );

      // Tag analysis
      const tagFrequency = {};
      conversations.forEach(conv => {
        if (conv.tags) {
          conv.tags.forEach(tag => {
            tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
          });
        }
      });

      // Trade-related conversations
      const tradeRelatedConversations = conversations.filter(
        conv => conv.relatedTradeIds.length > 0
      ).length;

      return {
        period: `${days} days`,
        totalConversations: conversations.length,
        totalMessages,
        avgMessagesPerConversation: conversations.length > 0 ? 
          Math.round(totalMessages / conversations.length) : 0,
        modeBreakdown,
        dailyActivity: Object.entries(dailyActivity)
          .sort((a, b) => new Date(a[0]) - new Date(b[0]))
          .map(([date, count]) => ({ date, count })),
        topTags: Object.entries(tagFrequency)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([tag, count]) => ({ tag, count })),
        tradeRelatedConversations,
        tradeRelatedPercentage: conversations.length > 0 ? 
          Math.round((tradeRelatedConversations / conversations.length) * 100) : 0
      };

    } catch (error) {
      logger.error('Failed to get conversation analytics', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Export conversation data
   */
  async exportConversationData(userId, exportOptions = {}) {
    try {
      const {
        format = 'json', // 'json', 'csv', 'md'
        mode,
        dateFrom,
        dateTo,
        includeCoachingSessions = false,
        includeTrades = false
      } = exportOptions;

      const whereClause = { userId, isActive: true };
      
      if (mode) whereClause.mode = mode;
      if (dateFrom || dateTo) {
        whereClause.createdAt = {};
        if (dateFrom) whereClause.createdAt[Op.gte] = new Date(dateFrom);
        if (dateTo) whereClause.createdAt[Op.lte] = new Date(dateTo);
      }

      const conversations = await Conversation.findAll({
        where: whereClause,
        order: [['createdAt', 'DESC']]
      });

      let exportData = conversations.map(conv => conv.toJSON());

      // Include related data if requested
      if (includeCoachingSessions || includeTrades) {
        exportData = await Promise.all(
          exportData.map(async (conv) => {
            if (includeCoachingSessions) {
              const sessions = await CoachingSession.findAll({
                where: { conversationId: conv.id }
              });
              conv.coachingSessions = sessions;
            }
            
            if (includeTrades && conv.relatedTradeIds.length > 0) {
              const trades = await Trade.findAll({
                where: { id: { [Op.in]: conv.relatedTradeIds } }
              });
              conv.relatedTrades = trades;
            }
            
            return conv;
          })
        );
      }

      // Format data based on requested format
      switch (format) {
        case 'csv':
          return this.formatAsCSV(exportData);
        case 'md':
          return this.formatAsMarkdown(exportData);
        default:
          return JSON.stringify(exportData, null, 2);
      }

    } catch (error) {
      logger.error('Failed to export conversation data', { userId, error: error.message });
      throw error;
    }
  }

  // Private helper methods

  async getOrCreateConversation(userId, conversationId, mode, sessionType, marketState, transaction) {
    if (conversationId) {
      const existing = await Conversation.findOne({
        where: { id: conversationId, userId },
        transaction
      });
      
      if (existing) {
        // Update mode and session context if needed
        await existing.update({
          mode: mode || existing.mode,
          sessionType: sessionType || existing.sessionType,
          marketState: marketState || existing.marketState
        }, { transaction });
        
        return existing;
      }
    }

    // Create new conversation
    return await Conversation.create({
      userId,
      mode,
      sessionType,
      marketState,
      messages: [],
      relatedTradeIds: [],
      tags: [],
      searchableContent: '',
      isActive: true
    }, { transaction });
  }

  async buildMessageContext(userId, mode, relatedTradeIds = []) {
    const contextOptions = {
      includeTradeHistory: true,
      includeCoachingHistory: mode === 'Psychology-Coaching',
      includePsychologyPatterns: mode === 'Psychology-Coaching',
      includePerformanceMetrics: mode !== 'General',
      includePlanAdherence: mode === 'Psychology-Coaching',
      includeMarketContext: mode !== 'Training',
      tradeHistoryDays: mode === 'Training' ? 7 : 30,
      maxTrades: mode === 'Training' ? 20 : 50
    };

    return await this.contextBuilder.buildComprehensiveContext(userId, contextOptions);
  }

  async generateContextualResponse(message, mode, context, chartImageUrl = null) {
    // This is where you'd integrate with your AI service (OpenAI, etc.)
    // For now, return a structured response based on mode
    
    const response = {
      content: '',
      contextUsed: context.summary,
      insights: []
    };

    switch (mode) {
      case 'Psychology-Coaching':
        response.content = this.generatePsychologyResponse(message, context);
        response.insights = this.extractPsychologyInsights(message, context);
        break;
        
      case 'Trade-Analysis':
        response.content = this.generateTradeAnalysisResponse(message, context, chartImageUrl);
        response.insights = this.extractTradeInsights(message, context);
        break;
        
      case 'Training':
        response.content = this.generateTrainingResponse(message, context);
        response.insights = this.extractTrainingInsights(message, context);
        break;
        
      default:
        response.content = this.generateGeneralResponse(message, context);
    }

    return response;
  }

  generatePsychologyResponse(message, context) {
    // Psychology coaching response generation
    return `Based on your recent trading performance and patterns, here's my coaching response to "${message}":\n\n[This would be generated by your AI service with full context]\n\nContext used: ${context.summary}`;
  }

  generateTradeAnalysisResponse(message, context, chartImageUrl) {
    // Trade analysis response generation
    return `Analyzing your trade setup:\n\n[AI analysis would be generated here using chart image and trading context]\n\nYour recent performance context: ${context.summary}`;
  }

  generateTrainingResponse(message, context) {
    // Training scenario response generation
    return `Training guidance: [AI would provide training-specific coaching here]\n\nYour training progress: ${context.summary}`;
  }

  generateGeneralResponse(message, context) {
    // General response generation
    return `I understand you're asking about: "${message}"\n\n[General AI response would be generated here]`;
  }

  extractPsychologyInsights(message, context) {
    // Extract psychology-specific insights
    return ['Emotional state analysis', 'Pattern recognition', 'Risk management advice'];
  }

  extractTradeInsights(message, context) {
    // Extract trade-specific insights
    return ['Technical analysis', 'Risk/reward assessment', 'Market conditions'];
  }

  extractTrainingInsights(message, context) {
    // Extract training-specific insights
    return ['Skill development', 'Performance tracking', 'Learning objectives'];
  }

  async handleTrainingCommands(userId, message, conversationId) {
    // Handle specific training commands like starting scenarios, executing trades, etc.
    const command = this.parseTrainingCommand(message);
    
    if (command) {
      switch (command.action) {
        case 'start_scenario':
          return await this.trainingService.startTrainingScenario(userId, command.scenarioId);
        case 'execute_trade':
          return await this.trainingService.executeTrainingTrade(userId, {
            ...command.tradeData,
            conversationId
          });
        // Add more command handlers as needed
      }
    }
    
    return null;
  }

  parseTrainingCommand(message) {
    // Parse training-specific commands from messages
    // This is a simplified example - you'd want more sophisticated parsing
    if (message.includes('start scenario')) {
      // Extract scenario ID from message
      return { action: 'start_scenario', scenarioId: 'extracted-id' };
    }
    
    return null;
  }

  extractSearchableContent(messages) {
    return messages.map(msg => msg.content).join(' ').toLowerCase();
  }

  extractTags(messages, mode) {
    const tags = [mode];
    
    // Extract additional tags based on message content
    const content = messages.map(msg => msg.content).join(' ').toLowerCase();
    
    if (content.includes('psychology') || content.includes('emotion')) tags.push('psychology');
    if (content.includes('plan') || content.includes('planning')) tags.push('planning');
    if (content.includes('risk') || content.includes('stop')) tags.push('risk-management');
    if (content.includes('entry') || content.includes('exit')) tags.push('execution');
    if (content.includes('review') || content.includes('analysis')) tags.push('review');
    
    return [...new Set(tags)];
  }

  generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  formatAsCSV(data) {
    // Convert conversation data to CSV format
    const header = ['id', 'mode', 'sessionType', 'messageCount', 'createdAt', 'tags'];
    const rows = data.map(conv => [
      conv.id,
      conv.mode,
      conv.sessionType || '',
      conv.messages?.length || 0,
      conv.createdAt,
      conv.tags?.join(';') || ''
    ]);
    
    return [header, ...rows].map(row => row.join(',')).join('\n');
  }

  formatAsMarkdown(data) {
    // Convert conversation data to Markdown format
    let markdown = '# Conversation Export\n\n';
    
    data.forEach(conv => {
      markdown += `## Conversation: ${conv.mode}\n`;
      markdown += `- **Created:** ${conv.createdAt}\n`;
      markdown += `- **Messages:** ${conv.messages?.length || 0}\n`;
      markdown += `- **Tags:** ${conv.tags?.join(', ') || 'None'}\n\n`;
      
      if (conv.messages) {
        conv.messages.forEach(msg => {
          markdown += `### ${msg.type === 'user' ? 'User' : 'Assistant'}\n`;
          markdown += `${msg.content}\n\n`;
        });
      }
      
      markdown += '---\n\n';
    });
    
    return markdown;
  }
}

export default ChatIntegrationService;