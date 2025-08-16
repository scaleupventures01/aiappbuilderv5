/**
 * AI Pattern Recognition and Memory System
 * Provides intelligent pattern recognition and coaching evolution capabilities
 */

import { Op } from 'sequelize';
import { tradingModels } from '../lib/trading-models.mjs';
import { logger } from '../lib/logger.mjs';

const { Trade, CoachingSession, PsychologyPattern, Conversation } = tradingModels;

export class AIPatternRecognition {

  /**
   * Analyze trading behavior and identify psychology patterns using AI
   */
  async analyzeAndUpdatePatterns(userId, options = {}) {
    try {
      const {
        analysisWindow = 30, // days
        minFrequency = 2,
        includeCoachingFeedback = true,
        forcedPatternTypes = null
      } = options;

      // Gather comprehensive data for analysis
      const analysisData = await this.gatherAnalysisData(userId, analysisWindow);
      
      if (analysisData.trades.length < 3) {
        logger.info('Insufficient data for pattern analysis', { userId, tradeCount: analysisData.trades.length });
        return { patternsUpdated: 0, newPatterns: 0, message: 'Insufficient data for analysis' };
      }

      // Run AI pattern analysis
      const identifiedPatterns = await this.runPatternAnalysis(analysisData, {
        minFrequency,
        forcedPatternTypes,
        includeCoachingFeedback
      });

      // Update or create patterns in database
      const updateResults = await this.updatePatternDatabase(userId, identifiedPatterns);

      // Generate coaching insights from pattern evolution
      const coachingInsights = await this.generateCoachingInsights(userId, identifiedPatterns, updateResults);

      logger.info('Pattern analysis completed', {
        userId,
        tradesAnalyzed: analysisData.trades.length,
        patternsIdentified: identifiedPatterns.length,
        patternsUpdated: updateResults.updated,
        newPatterns: updateResults.created
      });

      return {
        patternsIdentified: identifiedPatterns,
        patternsUpdated: updateResults.updated,
        newPatterns: updateResults.created,
        coachingInsights,
        analysisData: {
          tradesAnalyzed: analysisData.trades.length,
          sessionsAnalyzed: analysisData.coachingSessions.length,
          timeframe: `${analysisWindow} days`
        }
      };

    } catch (error) {
      logger.error('Failed to analyze patterns', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Gather comprehensive data for pattern analysis
   */
  async gatherAnalysisData(userId, days) {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    const [trades, coachingSessions, existingPatterns, conversations] = await Promise.all([
      // Get trades with psychological context
      Trade.findAll({
        where: {
          userId,
          entryTime: { [Op.gte]: sinceDate }
        },
        order: [['entryTime', 'ASC']],
        limit: 100
      }),

      // Get coaching sessions for context
      CoachingSession.findAll({
        where: {
          userId,
          createdAt: { [Op.gte]: sinceDate }
        },
        order: [['createdAt', 'ASC']],
        limit: 50
      }),

      // Get existing patterns to track evolution
      PsychologyPattern.findAll({
        where: { userId },
        order: [['lastObserved', 'DESC']]
      }),

      // Get conversations for additional context
      Conversation.findAll({
        where: {
          userId,
          createdAt: { [Op.gte]: sinceDate },
          mode: { [Op.in]: ['Psychology-Coaching', 'Trade-Analysis'] }
        },
        order: [['createdAt', 'ASC']],
        limit: 30
      })
    ]);

    return {
      trades,
      coachingSessions,
      existingPatterns,
      conversations,
      analysisWindow: days
    };
  }

  /**
   * Run AI-powered pattern analysis on trading data
   */
  async runPatternAnalysis(analysisData, options) {
    const {
      minFrequency,
      forcedPatternTypes,
      includeCoachingFeedback
    } = options;

    const patterns = [];

    // Analyze different pattern categories
    patterns.push(...await this.analyzeEmotionalPatterns(analysisData, minFrequency));
    patterns.push(...await this.analyzeRiskManagementPatterns(analysisData, minFrequency));
    patterns.push(...await this.analyzeDisciplinePatterns(analysisData, minFrequency));
    patterns.push(...await this.analyzePerformancePatterns(analysisData, minFrequency));
    patterns.push(...await this.analyzeTimingPatterns(analysisData, minFrequency));
    patterns.push(...await this.analyzeMarketConditionPatterns(analysisData, minFrequency));

    if (includeCoachingFeedback) {
      patterns.push(...await this.analyzeCoachingResponsePatterns(analysisData, minFrequency));
    }

    // Filter by forced pattern types if specified
    if (forcedPatternTypes) {
      return patterns.filter(pattern => forcedPatternTypes.includes(pattern.patternType));
    }

    // Remove duplicate patterns and rank by significance
    return this.deduplicateAndRankPatterns(patterns);
  }

  /**
   * Analyze emotional state patterns
   */
  async analyzeEmotionalPatterns(analysisData, minFrequency) {
    const patterns = [];
    const { trades, coachingSessions } = analysisData;

    // Group trades by emotional state
    const emotionalStateData = {};
    trades.filter(t => t.emotionalState).forEach(trade => {
      const state = trade.emotionalState;
      if (!emotionalStateData[state]) {
        emotionalStateData[state] = {
          trades: [],
          totalPnl: 0,
          winRate: 0,
          frequency: 0
        };
      }
      emotionalStateData[state].trades.push(trade);
      emotionalStateData[state].totalPnl += trade.pnlDollars || 0;
      emotionalStateData[state].frequency++;
    });

    // Analyze each emotional state for patterns
    Object.entries(emotionalStateData).forEach(([state, data]) => {
      if (data.frequency >= minFrequency) {
        const closedTrades = data.trades.filter(t => t.status === 'Closed');
        const winners = closedTrades.filter(t => t.pnlDollars > 0);
        const winRate = closedTrades.length > 0 ? (winners.length / closedTrades.length) * 100 : 0;
        const avgPnl = closedTrades.length > 0 ? data.totalPnl / closedTrades.length : 0;

        // Identify if this emotional state is problematic
        const isProblematic = winRate < 50 || avgPnl < -50;
        
        if (isProblematic) {
          patterns.push({
            patternType: 'Emotional-Trigger',
            patternName: `${state} Trading Pattern`,
            description: `Trading performance degrades when in ${state} emotional state. Win rate: ${winRate.toFixed(1)}%, Avg P&L: $${avgPnl.toFixed(2)}`,
            frequency: data.frequency,
            severity: avgPnl < -100 ? 'High' : 'Medium',
            impactOnPerformance: data.totalPnl,
            triggerConditions: [state],
            tradingContext: {
              emotionalState: state,
              affectedTrades: data.trades.length,
              avgPerformance: avgPnl
            },
            coachingRecommendations: this.generateEmotionalCoachingRecommendations(state, winRate, avgPnl),
            evidenceStrength: this.calculateEvidenceStrength(data.frequency, data.trades.length, Math.abs(avgPnl))
          });
        }
      }
    });

    return patterns;
  }

  /**
   * Analyze risk management patterns
   */
  async analyzeRiskManagementPatterns(analysisData, minFrequency) {
    const patterns = [];
    const { trades } = analysisData;

    // Analyze stop loss adherence
    const stopLossData = {
      withStops: trades.filter(t => t.stopLoss),
      withoutStops: trades.filter(t => !t.stopLoss),
      stoppedOut: trades.filter(t => t.exitPrice === t.stopLoss),
      movedStops: trades.filter(t => t.deviationReasons?.includes('moved-stop-loss'))
    };

    // Pattern: Trading without stops
    if (stopLossData.withoutStops.length >= minFrequency) {
      const noStopTrades = stopLossData.withoutStops.filter(t => t.status === 'Closed');
      const avgPnl = noStopTrades.length > 0 ? 
        noStopTrades.reduce((sum, t) => sum + (t.pnlDollars || 0), 0) / noStopTrades.length : 0;
      const bigLosses = noStopTrades.filter(t => t.pnlDollars < -200);

      if (bigLosses.length > 0 || avgPnl < -50) {
        patterns.push({
          patternType: 'Risk-Management',
          patternName: 'No Stop Loss Pattern',
          description: `Frequently trading without stop losses leading to larger losses. ${bigLosses.length} trades with losses >$200`,
          frequency: stopLossData.withoutStops.length,
          severity: bigLosses.length > 0 ? 'Critical' : 'High',
          impactOnPerformance: avgPnl * noStopTrades.length,
          triggerConditions: ['no-stop-loss'],
          tradingContext: {
            tradesWithoutStops: stopLossData.withoutStops.length,
            bigLosses: bigLosses.length,
            avgPnlWithoutStops: avgPnl
          },
          coachingRecommendations: [
            'Mandatory stop loss placement for all trades',
            'Risk management education on position sizing',
            'Pre-trade risk assessment protocol'
          ],
          evidenceStrength: this.calculateEvidenceStrength(stopLossData.withoutStops.length, bigLosses.length, Math.abs(avgPnl))
        });
      }
    }

    // Pattern: Moving stop losses
    if (stopLossData.movedStops.length >= minFrequency) {
      const movedStopTrades = stopLossData.movedStops.filter(t => t.status === 'Closed');
      const avgPnl = movedStopTrades.length > 0 ? 
        movedStopTrades.reduce((sum, t) => sum + (t.pnlDollars || 0), 0) / movedStopTrades.length : 0;

      if (avgPnl < -25) {
        patterns.push({
          patternType: 'Risk-Management',
          patternName: 'Stop Loss Movement Pattern',
          description: `Tendency to move stop losses resulting in larger losses. Average P&L when moving stops: $${avgPnl.toFixed(2)}`,
          frequency: stopLossData.movedStops.length,
          severity: avgPnl < -100 ? 'High' : 'Medium',
          impactOnPerformance: avgPnl * movedStopTrades.length,
          triggerConditions: ['losing-trade', 'hope-for-recovery'],
          tradingContext: {
            movedStopTrades: stopLossData.movedStops.length,
            avgPnlWhenMoved: avgPnl
          },
          coachingRecommendations: [
            'Strict stop loss discipline training',
            'Understanding the psychology of hope in trading',
            'Position sizing to make stops more acceptable'
          ],
          evidenceStrength: this.calculateEvidenceStrength(stopLossData.movedStops.length, movedStopTrades.length, Math.abs(avgPnl))
        });
      }
    }

    return patterns;
  }

  /**
   * Analyze discipline and plan adherence patterns
   */
  async analyzeDisciplinePatterns(analysisData, minFrequency) {
    const patterns = [];
    const { trades } = analysisData;

    // Analyze plan adherence
    const planData = {
      withPlans: trades.filter(t => t.tradePlanId),
      withoutPlans: trades.filter(t => !t.tradePlanId),
      lowAdherence: trades.filter(t => t.planAdherence < 0.7),
      deviations: trades.filter(t => t.deviationReasons?.length > 0)
    };

    // Pattern: Trading without plans
    if (planData.withoutPlans.length >= minFrequency) {
      const noPlanTrades = planData.withoutPlans.filter(t => t.status === 'Closed');
      const avgPnl = noPlanTrades.length > 0 ? 
        noPlanTrades.reduce((sum, t) => sum + (t.pnlDollars || 0), 0) / noPlanTrades.length : 0;
      
      const plannedTrades = planData.withPlans.filter(t => t.status === 'Closed');
      const plannedAvgPnl = plannedTrades.length > 0 ? 
        plannedTrades.reduce((sum, t) => sum + (t.pnlDollars || 0), 0) / plannedTrades.length : 0;

      if (plannedAvgPnl > avgPnl + 25) { // Plans perform significantly better
        patterns.push({
          patternType: 'Discipline-Issue',
          patternName: 'Impulsive Trading Pattern',
          description: `Better performance with planned trades ($${plannedAvgPnl.toFixed(2)} vs $${avgPnl.toFixed(2)}). Impulsive trades underperform by $${(plannedAvgPnl - avgPnl).toFixed(2)}`,
          frequency: planData.withoutPlans.length,
          severity: 'Medium',
          impactOnPerformance: (avgPnl - plannedAvgPnl) * noPlanTrades.length,
          triggerConditions: ['market-opportunity', 'FOMO', 'impulse'],
          tradingContext: {
            tradesWithoutPlans: planData.withoutPlans.length,
            performanceGap: plannedAvgPnl - avgPnl
          },
          coachingRecommendations: [
            'Mandatory trade planning for all setups',
            'Impulse control techniques',
            'Plan vs. no-plan performance tracking'
          ],
          evidenceStrength: this.calculateEvidenceStrength(planData.withoutPlans.length, noPlanTrades.length, Math.abs(plannedAvgPnl - avgPnl))
        });
      }
    }

    // Pattern: Low plan adherence
    if (planData.lowAdherence.length >= minFrequency) {
      const lowAdherenceTrades = planData.lowAdherence.filter(t => t.status === 'Closed');
      const avgPnl = lowAdherenceTrades.length > 0 ? 
        lowAdherenceTrades.reduce((sum, t) => sum + (t.pnlDollars || 0), 0) / lowAdherenceTrades.length : 0;

      if (avgPnl < -25) {
        patterns.push({
          patternType: 'Discipline-Issue',
          patternName: 'Plan Deviation Pattern',
          description: `Frequent deviations from trading plans resulting in poor performance. Avg P&L when deviating: $${avgPnl.toFixed(2)}`,
          frequency: planData.lowAdherence.length,
          severity: avgPnl < -75 ? 'High' : 'Medium',
          impactOnPerformance: avgPnl * lowAdherenceTrades.length,
          triggerConditions: ['trade-pressure', 'second-guessing', 'fear-greed'],
          tradingContext: {
            lowAdherenceTrades: planData.lowAdherence.length,
            avgAdherence: planData.lowAdherence.reduce((sum, t) => sum + t.planAdherence, 0) / planData.lowAdherence.length
          },
          coachingRecommendations: [
            'Plan adherence discipline training',
            'Understanding the cost of deviations',
            'Mental rehearsal and preparation techniques'
          ],
          evidenceStrength: this.calculateEvidenceStrength(planData.lowAdherence.length, lowAdherenceTrades.length, Math.abs(avgPnl))
        });
      }
    }

    return patterns;
  }

  /**
   * Analyze performance patterns across different contexts
   */
  async analyzePerformancePatterns(analysisData, minFrequency) {
    const patterns = [];
    const { trades } = analysisData;

    // Analyze performance by time of day
    const timePatterns = this.analyzeTimeOfDayPatterns(trades, minFrequency);
    patterns.push(...timePatterns);

    // Analyze win/loss streaks
    const streakPatterns = this.analyzeStreakPatterns(trades, minFrequency);
    patterns.push(...streakPatterns);

    // Analyze instrument-specific patterns
    const instrumentPatterns = this.analyzeInstrumentPatterns(trades, minFrequency);
    patterns.push(...instrumentPatterns);

    return patterns;
  }

  /**
   * Analyze timing-related patterns
   */
  async analyzeTimingPatterns(analysisData, minFrequency) {
    const patterns = [];
    const { trades } = analysisData;

    // Group trades by hour of entry
    const hourlyData = {};
    trades.filter(t => t.status === 'Closed').forEach(trade => {
      const hour = new Date(trade.entryTime).getHours();
      if (!hourlyData[hour]) {
        hourlyData[hour] = { trades: [], totalPnl: 0 };
      }
      hourlyData[hour].trades.push(trade);
      hourlyData[hour].totalPnl += trade.pnlDollars || 0;
    });

    // Find problematic time periods
    Object.entries(hourlyData).forEach(([hour, data]) => {
      if (data.trades.length >= minFrequency) {
        const avgPnl = data.totalPnl / data.trades.length;
        const winRate = (data.trades.filter(t => t.pnlDollars > 0).length / data.trades.length) * 100;

        if (avgPnl < -50 || winRate < 40) {
          patterns.push({
            patternType: 'Market-Timing',
            patternName: `Poor ${hour}:00 Hour Performance`,
            description: `Underperformance during ${hour}:00 hour. Win rate: ${winRate.toFixed(1)}%, Avg P&L: $${avgPnl.toFixed(2)}`,
            frequency: data.trades.length,
            severity: avgPnl < -100 ? 'Medium' : 'Low',
            impactOnPerformance: data.totalPnl,
            triggerConditions: [`trading-hour-${hour}`],
            tradingContext: {
              timeOfDay: `${hour}:00`,
              avgPerformance: avgPnl,
              winRate
            },
            coachingRecommendations: [
              `Avoid trading during ${hour}:00 hour until performance improves`,
              'Analyze market conditions during this time period',
              'Focus on better setups during this time'
            ],
            evidenceStrength: this.calculateEvidenceStrength(data.trades.length, data.trades.length, Math.abs(avgPnl))
          });
        }
      }
    });

    return patterns;
  }

  /**
   * Analyze market condition-related patterns
   */
  async analyzeMarketConditionPatterns(analysisData, minFrequency) {
    const patterns = [];
    const { trades } = analysisData;

    // Analyze performance by volatility
    const volatilityData = {
      high: trades.filter(t => t.marketConditions?.volatility === 'High'),
      normal: trades.filter(t => t.marketConditions?.volatility === 'Normal'),
      low: trades.filter(t => t.marketConditions?.volatility === 'Low')
    };

    Object.entries(volatilityData).forEach(([volatility, volTrades]) => {
      if (volTrades.length >= minFrequency) {
        const closedTrades = volTrades.filter(t => t.status === 'Closed');
        if (closedTrades.length >= minFrequency) {
          const avgPnl = closedTrades.reduce((sum, t) => sum + (t.pnlDollars || 0), 0) / closedTrades.length;
          const winRate = (closedTrades.filter(t => t.pnlDollars > 0).length / closedTrades.length) * 100;

          if (avgPnl < -50 || winRate < 35) {
            patterns.push({
              patternType: 'Market-Timing',
              patternName: `Poor ${volatility} Volatility Performance`,
              description: `Underperformance in ${volatility.toLowerCase()} volatility conditions. Win rate: ${winRate.toFixed(1)}%, Avg P&L: $${avgPnl.toFixed(2)}`,
              frequency: closedTrades.length,
              severity: avgPnl < -100 ? 'Medium' : 'Low',
              impactOnPerformance: avgPnl * closedTrades.length,
              triggerConditions: [`${volatility.toLowerCase()}-volatility`],
              tradingContext: {
                volatility,
                avgPerformance: avgPnl,
                winRate
              },
              coachingRecommendations: [
                `Adjust strategy for ${volatility.toLowerCase()} volatility conditions`,
                'Study market behavior in these conditions',
                'Consider different position sizing for this volatility'
              ],
              evidenceStrength: this.calculateEvidenceStrength(closedTrades.length, closedTrades.length, Math.abs(avgPnl))
            });
          }
        }
      }
    });

    return patterns;
  }

  /**
   * Analyze coaching response patterns
   */
  async analyzeCoachingResponsePatterns(analysisData, minFrequency) {
    const patterns = [];
    const { coachingSessions, trades } = analysisData;

    // Analyze correlation between coaching topics and subsequent performance
    const coachingTopics = {};
    
    coachingSessions.forEach(session => {
      if (session.emotionalTriggers) {
        session.emotionalTriggers.forEach(trigger => {
          if (!coachingTopics[trigger]) {
            coachingTopics[trigger] = { sessions: [], subsequentTrades: [] };
          }
          coachingTopics[trigger].sessions.push(session);

          // Find trades within 7 days after session
          const sessionDate = new Date(session.createdAt);
          const weekAfter = new Date(sessionDate.getTime() + 7 * 24 * 60 * 60 * 1000);
          
          const subsequentTrades = trades.filter(t => 
            new Date(t.entryTime) > sessionDate && 
            new Date(t.entryTime) <= weekAfter
          );
          
          coachingTopics[trigger].subsequentTrades.push(...subsequentTrades);
        });
      }
    });

    // Analyze if coaching on specific topics improves performance
    Object.entries(coachingTopics).forEach(([topic, data]) => {
      if (data.sessions.length >= minFrequency && data.subsequentTrades.length >= minFrequency) {
        const closedSubsequentTrades = data.subsequentTrades.filter(t => t.status === 'Closed');
        
        if (closedSubsequentTrades.length > 0) {
          const avgPnl = closedSubsequentTrades.reduce((sum, t) => sum + (t.pnlDollars || 0), 0) / closedSubsequentTrades.length;
          const winRate = (closedSubsequentTrades.filter(t => t.pnlDollars > 0).length / closedSubsequentTrades.length) * 100;

          // Compare to overall performance to see if coaching helped
          const overallAvgPnl = trades.filter(t => t.status === 'Closed').reduce((sum, t) => sum + (t.pnlDollars || 0), 0) / trades.filter(t => t.status === 'Closed').length;
          
          const improvement = avgPnl - overallAvgPnl;
          
          if (Math.abs(improvement) > 25) { // Significant difference
            patterns.push({
              patternType: 'Performance-Pattern',
              patternName: `${topic} Coaching Response Pattern`,
              description: `Coaching on ${topic} ${improvement > 0 ? 'improves' : 'correlates with worse'} subsequent performance by $${Math.abs(improvement).toFixed(2)}`,
              frequency: data.sessions.length,
              severity: 'Low',
              impactOnPerformance: improvement * closedSubsequentTrades.length,
              triggerConditions: [topic],
              tradingContext: {
                coachingTopic: topic,
                subsequentPerformance: avgPnl,
                improvementVsBaseline: improvement
              },
              coachingRecommendations: improvement > 0 ? [
                `Continue focusing on ${topic} in coaching sessions`,
                'Reinforce successful patterns from recent coaching'
              ] : [
                `Reassess coaching approach for ${topic}`,
                'May need different intervention strategy'
              ],
              evidenceStrength: this.calculateEvidenceStrength(data.sessions.length, closedSubsequentTrades.length, Math.abs(improvement))
            });
          }
        }
      }
    });

    return patterns;
  }

  /**
   * Remove duplicate patterns and rank by significance
   */
  deduplicateAndRankPatterns(patterns) {
    // Remove duplicates based on pattern name and type
    const uniquePatterns = patterns.filter((pattern, index, self) => 
      index === self.findIndex(p => p.patternName === pattern.patternName && p.patternType === pattern.patternType)
    );

    // Rank by severity, impact, and evidence strength
    return uniquePatterns.sort((a, b) => {
      const severityWeight = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
      const aScore = (severityWeight[a.severity] || 1) * a.evidenceStrength * Math.abs(a.impactOnPerformance || 0);
      const bScore = (severityWeight[b.severity] || 1) * b.evidenceStrength * Math.abs(b.impactOnPerformance || 0);
      return bScore - aScore;
    });
  }

  /**
   * Calculate evidence strength for a pattern
   */
  calculateEvidenceStrength(frequency, sampleSize, impactMagnitude) {
    // Evidence strength based on frequency, sample size, and impact magnitude
    const frequencyScore = Math.min(frequency / 10, 1); // Max score at 10+ occurrences
    const sampleScore = Math.min(sampleSize / 20, 1); // Max score at 20+ samples
    const impactScore = Math.min(impactMagnitude / 100, 1); // Max score at $100+ impact
    
    return Math.round(((frequencyScore + sampleScore + impactScore) / 3) * 100) / 100;
  }

  /**
   * Update pattern database with identified patterns
   */
  async updatePatternDatabase(userId, identifiedPatterns) {
    const results = { created: 0, updated: 0, deactivated: 0 };
    const transaction = await database.sequelize.transaction();

    try {
      // Get existing patterns
      const existingPatterns = await PsychologyPattern.findAll({
        where: { userId },
        transaction
      });

      for (const identifiedPattern of identifiedPatterns) {
        // Check if pattern already exists
        const existingPattern = existingPatterns.find(ep => 
          ep.patternName === identifiedPattern.patternName && 
          ep.patternType === identifiedPattern.patternType
        );

        if (existingPattern) {
          // Update existing pattern
          await existingPattern.update({
            description: identifiedPattern.description,
            frequency: identifiedPattern.frequency,
            severity: identifiedPattern.severity,
            impactOnPerformance: identifiedPattern.impactOnPerformance,
            lastObserved: new Date(),
            triggerConditions: identifiedPattern.triggerConditions,
            tradingContext: identifiedPattern.tradingContext,
            coachingInterventions: [
              ...(existingPattern.coachingInterventions || []),
              {
                date: new Date(),
                recommendations: identifiedPattern.coachingRecommendations,
                evidenceStrength: identifiedPattern.evidenceStrength
              }
            ]
          }, { transaction });
          results.updated++;
        } else {
          // Create new pattern
          await PsychologyPattern.create({
            userId,
            patternType: identifiedPattern.patternType,
            patternName: identifiedPattern.patternName,
            description: identifiedPattern.description,
            frequency: identifiedPattern.frequency,
            severity: identifiedPattern.severity,
            impactOnPerformance: identifiedPattern.impactOnPerformance,
            firstObserved: new Date(),
            lastObserved: new Date(),
            triggerConditions: identifiedPattern.triggerConditions,
            tradingContext: identifiedPattern.tradingContext,
            coachingInterventions: [{
              date: new Date(),
              recommendations: identifiedPattern.coachingRecommendations,
              evidenceStrength: identifiedPattern.evidenceStrength
            }],
            isActive: true
          }, { transaction });
          results.created++;
        }
      }

      // Deactivate patterns that haven't been observed recently
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const patternsToDeactivate = existingPatterns.filter(ep => 
        !identifiedPatterns.some(ip => ip.patternName === ep.patternName && ip.patternType === ep.patternType) &&
        new Date(ep.lastObserved) < thirtyDaysAgo &&
        ep.isActive
      );

      for (const pattern of patternsToDeactivate) {
        await pattern.update({ isActive: false }, { transaction });
        results.deactivated++;
      }

      await transaction.commit();
      return results;

    } catch (error) {
      await transaction.rollback();
      logger.error('Failed to update pattern database', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Generate coaching insights from pattern evolution
   */
  async generateCoachingInsights(userId, identifiedPatterns, updateResults) {
    const insights = {
      summary: '',
      priorityPatterns: [],
      improvementAreas: [],
      coachingFocus: [],
      progressNotes: []
    };

    // Identify top priority patterns
    insights.priorityPatterns = identifiedPatterns
      .filter(p => p.severity === 'Critical' || p.severity === 'High')
      .slice(0, 3)
      .map(p => ({
        name: p.patternName,
        type: p.patternType,
        severity: p.severity,
        impact: p.impactOnPerformance,
        recommendations: p.coachingRecommendations
      }));

    // Generate summary
    if (updateResults.created > 0) {
      insights.summary += `${updateResults.created} new patterns identified. `;
    }
    if (updateResults.updated > 0) {
      insights.summary += `${updateResults.updated} existing patterns updated. `;
    }
    if (insights.priorityPatterns.length > 0) {
      insights.summary += `${insights.priorityPatterns.length} high-priority patterns require immediate attention.`;
    }

    // Identify improvement areas
    const patternTypes = [...new Set(identifiedPatterns.map(p => p.patternType))];
    insights.improvementAreas = patternTypes.map(type => {
      const typePatterns = identifiedPatterns.filter(p => p.patternType === type);
      const totalImpact = typePatterns.reduce((sum, p) => sum + Math.abs(p.impactOnPerformance || 0), 0);
      return {
        area: type,
        patternCount: typePatterns.length,
        totalImpact,
        severity: typePatterns.some(p => p.severity === 'Critical') ? 'Critical' : 
                 typePatterns.some(p => p.severity === 'High') ? 'High' : 'Medium'
      };
    }).sort((a, b) => b.totalImpact - a.totalImpact);

    // Generate coaching focus recommendations
    insights.coachingFocus = insights.priorityPatterns.flatMap(p => p.recommendations).slice(0, 5);

    return insights;
  }

  /**
   * Helper methods for specific pattern analysis
   */
  
  generateEmotionalCoachingRecommendations(emotionalState, winRate, avgPnl) {
    const recommendations = [];
    
    switch (emotionalState.toLowerCase()) {
      case 'fear':
        recommendations.push('Practice exposure therapy with small position sizes');
        recommendations.push('Develop pre-market mental preparation routine');
        break;
      case 'greed':
        recommendations.push('Implement strict profit-taking rules');
        recommendations.push('Practice gratitude and profit satisfaction exercises');
        break;
      case 'revenge':
        recommendations.push('Mandatory break after any loss >$100');
        recommendations.push('Develop loss acceptance and recovery protocols');
        break;
      case 'confident':
        if (winRate < 50) {
          recommendations.push('Check for overconfidence bias in setup selection');
          recommendations.push('Maintain conservative position sizing even when confident');
        }
        break;
      default:
        recommendations.push(`Specific coaching protocols for ${emotionalState} emotional state`);
        recommendations.push('Emotional state awareness and regulation training');
    }
    
    if (avgPnl < -75) {
      recommendations.push('Consider avoiding trading in this emotional state until performance improves');
    }
    
    return recommendations;
  }

  analyzeTimeOfDayPatterns(trades, minFrequency) {
    // Implementation for time-of-day specific pattern analysis
    return [];
  }

  analyzeStreakPatterns(trades, minFrequency) {
    // Implementation for win/loss streak pattern analysis
    return [];
  }

  analyzeInstrumentPatterns(trades, minFrequency) {
    // Implementation for instrument-specific pattern analysis
    return [];
  }
}

export default AIPatternRecognition;