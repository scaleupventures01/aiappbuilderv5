// Updated Cost Reporter with New Model Pricing
const ConfigurationManager = require('./config/ConfigurationManager');
const Logger = require('./utils/Logger');

class CostReporter {
    constructor() {
        this.configManager = ConfigurationManager.getInstance();
        this.logger = new Logger().child({ component: 'CostReporter' });
        
        this.agentCosts = new Map();
        this.modelCosts = new Map();
        this.optimizedVsFallback = {
            optimized: { cost: 0, tokens: 0, calls: 0 },
            fallback: { cost: 0, tokens: 0, calls: 0 }
        };
        
        this.initialize();
    }
    
    /**
     * Initialize the cost reporter
     */
    async initialize() {
        try {
            await this.configManager.loadAllConfigs();
            this.logger.info('CostReporter initialized');
        } catch (error) {
            this.logger.error('Failed to initialize CostReporter', error);
            throw error;
        }
    }
    
    /**
     * Track token usage for an agent
     */
    trackUsage(agentId, model, tokenUsage, usedFallback = false) {
        // Get pricing for the model
        const modelConfig = this.configManager.getModelConfig(model);
        if (!modelConfig) {
            this.logger.warn(`Unknown model: ${model}`);
            return;
        }
        
        // Calculate costs
        const inputCost = (tokenUsage.input_tokens / 1000000) * modelConfig.costPerMillion.input;
        const outputCost = (tokenUsage.output_tokens / 1000000) * modelConfig.costPerMillion.output;
        const totalCost = inputCost + outputCost;
        const totalTokens = tokenUsage.input_tokens + tokenUsage.output_tokens;
        
        // Update agent costs
        if (!this.agentCosts.has(agentId)) {
            this.agentCosts.set(agentId, {
                totalCost: 0,
                inputCost: 0,
                outputCost: 0,
                calls: 0,
                inputTokens: 0,
                outputTokens: 0,
                optimizedCalls: 0,
                fallbackCalls: 0
            });
        }
        
        const agentStats = this.agentCosts.get(agentId);
        agentStats.totalCost += totalCost;
        agentStats.inputCost += inputCost;
        agentStats.outputCost += outputCost;
        agentStats.calls += 1;
        agentStats.inputTokens += tokenUsage.input_tokens || 0;
        agentStats.outputTokens += tokenUsage.output_tokens || 0;
        
        if (usedFallback) {
            agentStats.fallbackCalls += 1;
        } else {
            agentStats.optimizedCalls += 1;
        }
        
        // Update model costs
        if (!this.modelCosts.has(model)) {
            this.modelCosts.set(model, {
                totalCost: 0,
                inputCost: 0,
                outputCost: 0,
                calls: 0,
                inputTokens: 0,
                outputTokens: 0
            });
        }
        
        const modelStats = this.modelCosts.get(model);
        modelStats.totalCost += totalCost;
        modelStats.inputCost += inputCost;
        modelStats.outputCost += outputCost;
        modelStats.calls += 1;
        modelStats.inputTokens += tokenUsage.input_tokens || 0;
        modelStats.outputTokens += tokenUsage.output_tokens || 0;
        
        // Track optimized vs fallback
        if (usedFallback) {
            this.optimizedVsFallback.fallback.cost += totalCost;
            this.optimizedVsFallback.fallback.tokens += totalTokens;
            this.optimizedVsFallback.fallback.calls += 1;
        } else {
            this.optimizedVsFallback.optimized.cost += totalCost;
            this.optimizedVsFallback.optimized.tokens += totalTokens;
            this.optimizedVsFallback.optimized.calls += 1;
        }
    }
    
    /**
     * Generate comprehensive cost report
     */
    generateReport() {
        const report = {
            summary: this.generateSummary(),
            byAgent: this.generateAgentReport(),
            byModel: this.generateModelReport(),
            optimizationMetrics: this.generateOptimizationMetrics(),
            projections: this.generateProjections(),
            recommendations: this.generateRecommendations()
        };
        
        return this.formatReport(report);
    }
    
    /**
     * Generate summary statistics
     */
    generateSummary() {
        let totalCost = 0;
        let totalTokens = 0;
        let totalCalls = 0;
        
        for (const [_, stats] of this.agentCosts) {
            totalCost += stats.totalCost;
            totalTokens += stats.inputTokens + stats.outputTokens;
            totalCalls += stats.calls;
        }
        
        const targetOptimized = this.modelAssignments.totals.optimized.totalCost;
        const targetFallback = this.modelAssignments.totals.fallback.totalCost;
        
        return {
            totalCost: totalCost.toFixed(2),
            totalTokens: totalTokens.toLocaleString(),
            totalCalls: totalCalls,
            averageCostPerCall: (totalCost / totalCalls).toFixed(4),
            targetOptimizedCost: targetOptimized,
            targetFallbackCost: targetFallback,
            currentSavings: (targetFallback - totalCost).toFixed(2),
            savingsPercentage: ((targetFallback - totalCost) / targetFallback * 100).toFixed(1)
        };
    }
    
    /**
     * Generate agent-specific report
     */
    generateAgentReport() {
        const agentReports = [];
        
        for (const [agentId, stats] of this.agentCosts) {
            // Extract agent type from ID
            const agentType = this.extractAgentType(agentId);
            const assignment = this.modelAssignments.assignments[agentType];
            
            agentReports.push({
                agentId,
                agentType: assignment?.name || agentType,
                totalCost: stats.totalCost.toFixed(2),
                calls: stats.calls,
                optimizedCalls: stats.optimizedCalls,
                fallbackCalls: stats.fallbackCalls,
                fallbackRate: ((stats.fallbackCalls / stats.calls) * 100).toFixed(1) + '%',
                averageCostPerCall: (stats.totalCost / stats.calls).toFixed(4),
                totalTokens: (stats.inputTokens + stats.outputTokens).toLocaleString()
            });
        }
        
        return agentReports.sort((a, b) => parseFloat(b.totalCost) - parseFloat(a.totalCost));
    }
    
    /**
     * Generate model-specific report
     */
    generateModelReport() {
        const modelReports = [];
        
        for (const [modelId, stats] of this.modelCosts) {
            const model = this.modelConfigs.models[modelId];
            
            modelReports.push({
                model: model?.name || modelId,
                provider: model?.provider || 'unknown',
                totalCost: stats.totalCost.toFixed(2),
                calls: stats.calls,
                averageCostPerCall: (stats.totalCost / stats.calls).toFixed(4),
                totalTokens: (stats.inputTokens + stats.outputTokens).toLocaleString(),
                inputCostPerMillion: model?.costPerMillion.input || 0,
                outputCostPerMillion: model?.costPerMillion.output || 0
            });
        }
        
        return modelReports.sort((a, b) => parseFloat(b.totalCost) - parseFloat(a.totalCost));
    }
    
    /**
     * Generate optimization metrics
     */
    generateOptimizationMetrics() {
        const optimized = this.optimizedVsFallback.optimized;
        const fallback = this.optimizedVsFallback.fallback;
        
        const totalCost = optimized.cost + fallback.cost;
        const totalCalls = optimized.calls + fallback.calls;
        
        return {
            optimizedUsage: {
                percentage: ((optimized.calls / totalCalls) * 100).toFixed(1) + '%',
                cost: optimized.cost.toFixed(2),
                calls: optimized.calls,
                averageCost: (optimized.cost / optimized.calls).toFixed(4)
            },
            fallbackUsage: {
                percentage: ((fallback.calls / totalCalls) * 100).toFixed(1) + '%',
                cost: fallback.cost.toFixed(2),
                calls: fallback.calls,
                averageCost: fallback.calls > 0 ? (fallback.cost / fallback.calls).toFixed(4) : '0'
            },
            potentialSavings: {
                ifAllOptimized: ((fallback.cost * 0.7)).toFixed(2), // Assuming 70% savings
                percentage: '70%'
            }
        };
    }
    
    /**
     * Generate cost projections
     */
    generateProjections() {
        const currentRate = this.calculateCurrentRate();
        
        return {
            nextSprint: (currentRate * 14).toFixed(2), // 2 weeks
            nextMonth: (currentRate * 30).toFixed(2),
            withOptimization: {
                nextSprint: (currentRate * 14 * 0.3).toFixed(2), // 70% reduction
                nextMonth: (currentRate * 30 * 0.3).toFixed(2)
            }
        };
    }
    
    /**
     * Generate recommendations
     */
    generateRecommendations() {
        const recommendations = [];
        
        // Check fallback usage
        const metrics = this.generateOptimizationMetrics();
        if (parseFloat(metrics.fallbackUsage.percentage) > 20) {
            recommendations.push({
                priority: 'HIGH',
                issue: 'High fallback usage detected',
                action: 'Check API keys and rate limits for optimized models',
                impact: `Could save $${metrics.potentialSavings.ifAllOptimized} by reducing fallbacks`
            });
        }
        
        // Check specific expensive agents
        for (const [agentId, stats] of this.agentCosts) {
            const avgCost = stats.totalCost / stats.calls;
            if (avgCost > 0.1) { // $0.10 per call threshold
                recommendations.push({
                    priority: 'MEDIUM',
                    issue: `High cost per call for ${agentId}`,
                    action: 'Review task complexity and consider optimization',
                    impact: `Average cost: $${avgCost.toFixed(4)} per call`
                });
            }
        }
        
        return recommendations;
    }
    
    /**
     * Calculate current cost rate per day
     */
    calculateCurrentRate() {
        let totalCost = 0;
        for (const [_, stats] of this.agentCosts) {
            totalCost += stats.totalCost;
        }
        
        // Assume data is from current session/day
        return totalCost;
    }
    
    /**
     * Extract agent type from agent ID
     */
    extractAgentType(agentId) {
        const typeMap = {
            'requirements': 'requirements',
            'architect': 'architect',
            'database': 'database',
            'security': 'security',
            'content': 'content',
            'ai-ml': 'ai-ml',
            'wireframe': 'wireframe',
            'ux': 'ux',
            'ui-design': 'ui-design',
            'builder': 'builder',
            'validator': 'validator'
        };
        
        for (const [key, type] of Object.entries(typeMap)) {
            if (agentId.includes(key)) {
                return type;
            }
        }
        
        return 'unknown';
    }
    
    /**
     * Format report for display
     */
    formatReport(report) {
        return `
# 💰 Cost Report - ${new Date().toISOString()}

## 📊 Summary
- **Total Cost**: $${report.summary.totalCost}
- **Total Tokens**: ${report.summary.totalTokens}
- **Total API Calls**: ${report.summary.totalCalls}
- **Average Cost per Call**: $${report.summary.averageCostPerCall}
- **Target Optimized Cost**: $${report.summary.targetOptimizedCost}
- **Current Savings**: $${report.summary.currentSavings} (${report.summary.savingsPercentage}%)

## 🤖 Cost by Agent
${report.byAgent.map(agent => `
### ${agent.agentType}
- **Total Cost**: $${agent.totalCost}
- **Calls**: ${agent.calls} (Optimized: ${agent.optimizedCalls}, Fallback: ${agent.fallbackCalls})
- **Fallback Rate**: ${agent.fallbackRate}
- **Avg Cost/Call**: $${agent.averageCostPerCall}
- **Tokens**: ${agent.totalTokens}`).join('\n')}

## 🎯 Cost by Model
${report.byModel.map(model => `
### ${model.model} (${model.provider})
- **Total Cost**: $${model.totalCost}
- **Calls**: ${model.calls}
- **Avg Cost/Call**: $${model.averageCostPerCall}
- **Pricing**: $${model.inputCostPerMillion}/$${model.outputCostPerMillion} per 1M tokens`).join('\n')}

## 📈 Optimization Metrics
### Optimized Models
- **Usage**: ${report.optimizationMetrics.optimizedUsage.percentage}
- **Cost**: $${report.optimizationMetrics.optimizedUsage.cost}
- **Calls**: ${report.optimizationMetrics.optimizedUsage.calls}

### Fallback Models
- **Usage**: ${report.optimizationMetrics.fallbackUsage.percentage}
- **Cost**: $${report.optimizationMetrics.fallbackUsage.cost}
- **Calls**: ${report.optimizationMetrics.fallbackUsage.calls}

### Potential Savings
- **If Fully Optimized**: $${report.optimizationMetrics.potentialSavings.ifAllOptimized}
- **Reduction**: ${report.optimizationMetrics.potentialSavings.percentage}

## 📅 Projections
### Current Rate
- **Next Sprint (2 weeks)**: $${report.projections.nextSprint}
- **Next Month**: $${report.projections.nextMonth}

### With Full Optimization
- **Next Sprint**: $${report.projections.withOptimization.nextSprint}
- **Next Month**: $${report.projections.withOptimization.nextMonth}

## 🎯 Recommendations
${report.recommendations.map(rec => `
### ${rec.priority} Priority
- **Issue**: ${rec.issue}
- **Action**: ${rec.action}
- **Impact**: ${rec.impact}`).join('\n')}

---
Generated by Team Leader Cost Reporter
`;
    }
}

module.exports = CostReporter;
