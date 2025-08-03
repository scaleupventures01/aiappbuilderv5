// CostReporter.js - Comprehensive Cost Tracking and Budget Management
// Part of Team Leader System v4.0

/**
 * CostReporter - Manages cost tracking, budget monitoring, and financial reporting
 * 
 * Features:
 * - Real-time cost tracking across all agents
 * - Budget management at project/sprint/team levels
 * - Historical cost data storage and analysis
 * - Predictive cost analytics
 * - Automated alerts for budget overruns
 * - Multiple report formats (JSON, CSV, Markdown, HTML)
 */

class CostReporter {
    constructor(teamLeaderSystem) {
        this.system = teamLeaderSystem;
        this.projectPath = teamLeaderSystem.projectName;
        this.fs = window.fs;
        
        // Cost tracking data structures
        this.currentCosts = {
            total: 0,
            byTeam: new Map(),
            byAgent: new Map(),
            bySprint: new Map(),
            byModel: new Map(),
            byHour: new Map()
        };
        
        // Historical data
        this.historicalData = {
            daily: [],
            sprints: [],
            milestones: []
        };
        
        // Budget configuration
        this.budgets = {
            project: {
                total: 0,
                allocated: 0,
                spent: 0,
                remaining: 0
            },
            sprints: new Map(),
            teams: new Map(),
            alerts: {
                warningThreshold: 0.8,  // 80% of budget
                criticalThreshold: 0.95 // 95% of budget
            }
        };
        
        // Cost rates by model (per million tokens)
        this.modelRates = {
            // Claude models
            'claude-3-opus-20240229': { input: 15, output: 75 },
            'claude-opus-4': { input: 15, output: 75 },
            'claude-3-sonnet-20240229': { input: 3, output: 15 },
            'claude-sonnet-4': { input: 3, output: 15 },
            'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
            
            // GPT models
            'gpt-4o': { input: 5, output: 15 },
            'gpt-4o-mini': { input: 0.15, output: 0.6 },
            'o3': { input: 100, output: 400 }, // Premium
            'o4-mini': { input: 0.1, output: 0.4 },
            
            // Gemini models
            'gemini-2.5-pro': { input: 0.50, output: 1.50 },
            'gemini-2.5-flash': { input: 0.075, output: 0.30 }
        };
        
        // Report templates
        this.reportTemplates = {
            summary: this.getSummaryTemplate(),
            detailed: this.getDetailedTemplate(),
            sprint: this.getSprintTemplate()
        };
        
        // Initialize storage
        this.initializeStorage();
        
        console.log("💰 Cost Reporter initialized");
    }
    
    /**
     * Initialize storage directories and load historical data
     */
    async initializeStorage() {
        const dirs = [
            `${this.projectPath}/costs`,
            `${this.projectPath}/costs/reports`,
            `${this.projectPath}/costs/history`,
            `${this.projectPath}/costs/budgets`
        ];
        
        for (const dir of dirs) {
            try {
                await this.fs.mkdir(dir, { recursive: true });
            } catch (error) {
                // Directory might already exist
            }
        }
        
        // Load historical data if exists
        await this.loadHistoricalData();
        await this.loadBudgets();
    }
    
    /**
     * Set project budget
     */
    async setBudget(config) {
        console.log(`\n💰 Setting project budget: $${config.total}`);
        
        this.budgets.project = {
            total: config.total,
            allocated: 0,
            spent: 0,
            remaining: config.total,
            currency: config.currency || 'USD',
            setDate: new Date().toISOString()
        };
        
        // Set sprint budgets if provided
        if (config.sprints) {
            for (const [sprintId, budget] of Object.entries(config.sprints)) {
                this.budgets.sprints.set(sprintId, {
                    total: budget,
                    spent: 0,
                    remaining: budget
                });
                this.budgets.project.allocated += budget;
            }
        }
        
        // Set team budgets if provided
        if (config.teams) {
            for (const [teamName, budget] of Object.entries(config.teams)) {
                this.budgets.teams.set(teamName, {
                    total: budget,
                    spent: 0,
                    remaining: budget
                });
            }
        }
        
        // Set alert thresholds
        if (config.alerts) {
            this.budgets.alerts = { ...this.budgets.alerts, ...config.alerts };
        }
        
        // Save budget configuration
        await this.saveBudgets();
        
        return {
            success: true,
            budget: this.budgets.project,
            message: `Budget set: $${config.total}`
        };
    }
    
    /**
     * Track agent cost in real-time
     */
    async trackAgentCost(agentId, tokenUsage, modelId) {
        const timestamp = new Date();
        const hour = timestamp.toISOString().slice(0, 13); // YYYY-MM-DDTHH
        
        // Calculate cost
        const cost = this.calculateTokenCost(tokenUsage, modelId);
        
        // Update current costs
        this.currentCosts.total += cost;
        
        // By agent
        const agentCost = this.currentCosts.byAgent.get(agentId) || 0;
        this.currentCosts.byAgent.set(agentId, agentCost + cost);
        
        // By team
        const agent = this.system.agents.get(agentId);
        if (agent && agent.team) {
            const teamCost = this.currentCosts.byTeam.get(agent.team) || 0;
            this.currentCosts.byTeam.set(agent.team, teamCost + cost);
            
            // Update team budget
            this.updateTeamBudget(agent.team, cost);
        }
        
        // By sprint
        const sprintId = `sprint-${this.system.currentSprint}`;
        const sprintCost = this.currentCosts.bySprint.get(sprintId) || 0;
        this.currentCosts.bySprint.set(sprintId, sprintCost + cost);
        
        // Update sprint budget
        this.updateSprintBudget(sprintId, cost);
        
        // By model
        const modelCost = this.currentCosts.byModel.get(modelId) || 0;
        this.currentCosts.byModel.set(modelId, modelCost + cost);
        
        // By hour
        const hourCost = this.currentCosts.byHour.get(hour) || 0;
        this.currentCosts.byHour.set(hour, hourCost + cost);
        
        // Update project budget
        this.budgets.project.spent += cost;
        this.budgets.project.remaining = this.budgets.project.total - this.budgets.project.spent;
        
        // Check budget alerts
        await this.checkBudgetAlerts();
        
        // Log the cost
        console.log(`💵 ${agentId}: $${cost.toFixed(4)} (${tokenUsage.input}+${tokenUsage.output} tokens)`);
        
        return {
            cost,
            totalSpent: this.budgets.project.spent,
            remaining: this.budgets.project.remaining,
            percentUsed: (this.budgets.project.spent / this.budgets.project.total) * 100
        };
    }
    
    /**
     * Calculate cost for token usage
     */
    calculateTokenCost(tokenUsage, modelId) {
        const rates = this.modelRates[modelId] || this.modelRates['claude-3-sonnet-20240229'];
        
        const inputCost = (tokenUsage.input / 1000000) * rates.input;
        const outputCost = (tokenUsage.output / 1000000) * rates.output;
        
        return inputCost + outputCost;
    }
    
    /**
     * Update team budget tracking
     */
    updateTeamBudget(teamName, cost) {
        const teamBudget = this.budgets.teams.get(teamName);
        if (teamBudget) {
            teamBudget.spent += cost;
            teamBudget.remaining = teamBudget.total - teamBudget.spent;
        }
    }
    
    /**
     * Update sprint budget tracking
     */
    updateSprintBudget(sprintId, cost) {
        const sprintBudget = this.budgets.sprints.get(sprintId);
        if (sprintBudget) {
            sprintBudget.spent += cost;
            sprintBudget.remaining = sprintBudget.total - sprintBudget.spent;
        }
    }
    
    /**
     * Check and trigger budget alerts
     */
    async checkBudgetAlerts() {
        const percentUsed = this.budgets.project.spent / this.budgets.project.total;
        
        // Critical alert (95%)
        if (percentUsed >= this.budgets.alerts.criticalThreshold) {
            await this.triggerBudgetAlert('critical', percentUsed);
        }
        // Warning alert (80%)
        else if (percentUsed >= this.budgets.alerts.warningThreshold) {
            await this.triggerBudgetAlert('warning', percentUsed);
        }
        
        // Check team budgets
        for (const [teamName, budget] of this.budgets.teams) {
            const teamPercent = budget.spent / budget.total;
            if (teamPercent >= this.budgets.alerts.criticalThreshold) {
                await this.triggerTeamBudgetAlert(teamName, 'critical', teamPercent);
            }
        }
    }
    
    /**
     * Trigger budget alert
     */
    async triggerBudgetAlert(level, percentUsed) {
        const alert = {
            level,
            type: 'project_budget',
            percentUsed: Math.round(percentUsed * 100),
            spent: this.budgets.project.spent,
            total: this.budgets.project.total,
            remaining: this.budgets.project.remaining,
            timestamp: new Date().toISOString(),
            message: level === 'critical' 
                ? `🚨 CRITICAL: Project budget at ${Math.round(percentUsed * 100)}% - Only $${this.budgets.project.remaining.toFixed(2)} remaining!`
                : `⚠️ WARNING: Project budget at ${Math.round(percentUsed * 100)}% - Consider cost optimization`
        };
        
        // Save alert
        const alertPath = `${this.projectPath}/costs/alerts/${this.getTimestamp()}_${level}_alert.json`;
        await this.fs.writeFile(alertPath, JSON.stringify(alert, null, 2));
        
        // Log to console
        console.log(`\n${alert.message}\n`);
        
        // Create escalation if critical
        if (level === 'critical') {
            await this.createBudgetEscalation(alert);
        }
        
        return alert;
    }
    
    /**
     * Generate cost report
     */
    async generateReport(type = 'summary', options = {}) {
        console.log(`\n📊 Generating ${type} cost report...`);
        
        let report;
        
        switch (type) {
            case 'summary':
                report = await this.generateSummaryReport(options);
                break;
            case 'detailed':
                report = await this.generateDetailedReport(options);
                break;
            case 'sprint':
                report = await this.generateSprintReport(options);
                break;
            case 'daily':
                report = await this.generateDailyReport(options);
                break;
            default:
                report = await this.generateSummaryReport(options);
        }
        
        // Save report
        const filename = `${type}_report_${this.getTimestamp()}`;
        
        // Save in multiple formats
        if (options.format === 'all' || !options.format) {
            await this.saveReportAsJSON(filename, report);
            await this.saveReportAsMarkdown(filename, report);
            await this.saveReportAsHTML(filename, report);
            await this.saveReportAsCSV(filename, report);
        } else {
            switch (options.format) {
                case 'json':
                    await this.saveReportAsJSON(filename, report);
                    break;
                case 'markdown':
                    await this.saveReportAsMarkdown(filename, report);
                    break;
                case 'html':
                    await this.saveReportAsHTML(filename, report);
                    break;
                case 'csv':
                    await this.saveReportAsCSV(filename, report);
                    break;
            }
        }
        
        console.log(`✅ Report generated: ${filename}`);
        
        return report;
    }
    
    /**
     * Generate summary report
     */
    async generateSummaryReport(options) {
        const report = {
            type: 'summary',
            generatedAt: new Date().toISOString(),
            project: this.system.projectName,
            currentSprint: this.system.currentSprint,
            
            budget: {
                total: this.budgets.project.total,
                spent: this.budgets.project.spent,
                remaining: this.budgets.project.remaining,
                percentUsed: (this.budgets.project.spent / this.budgets.project.total * 100).toFixed(1)
            },
            
            costs: {
                total: this.currentCosts.total,
                byTeam: this.getTopCosts(this.currentCosts.byTeam, 5),
                byAgent: this.getTopCosts(this.currentCosts.byAgent, 10),
                byModel: this.getModelCostBreakdown()
            },
            
            efficiency: {
                costPerSprint: this.calculateAverageCostPerSprint(),
                costPerDay: this.calculateAverageCostPerDay(),
                costPerToken: this.calculateCostPerToken(),
                projectedTotal: this.projectTotalCost()
            },
            
            alerts: await this.getRecentAlerts(),
            
            recommendations: this.generateCostRecommendations()
        };
        
        return report;
    }
    
    /**
     * Generate detailed report
     */
    async generateDetailedReport(options) {
        const report = {
            type: 'detailed',
            generatedAt: new Date().toISOString(),
            project: this.system.projectName,
            
            // Include everything from summary
            ...await this.generateSummaryReport(options),
            
            // Add detailed breakdowns
            detailedCosts: {
                byAgent: this.getDetailedAgentCosts(),
                byTeam: this.getDetailedTeamCosts(),
                bySprint: this.getDetailedSprintCosts(),
                byHour: this.getHourlyCosts(),
                byTask: await this.getTaskCosts()
            },
            
            trends: {
                daily: this.getDailyTrends(),
                weekly: this.getWeeklyTrends(),
                burnRate: this.calculateBurnRate()
            },
            
            projections: {
                completionCost: this.projectCompletionCost(),
                budgetRunway: this.calculateBudgetRunway(),
                optimizedCost: this.calculateOptimizedCost()
            }
        };
        
        return report;
    }
    
    /**
     * Calculate cost optimization recommendations
     */
    generateCostRecommendations() {
        const recommendations = [];
        
        // Analyze model usage
        const modelCosts = this.getModelCostBreakdown();
        const expensiveModels = modelCosts.filter(m => m.costPerMillion > 10);
        
        if (expensiveModels.length > 0) {
            recommendations.push({
                priority: 'high',
                category: 'model_optimization',
                recommendation: 'Consider using cheaper models for simple tasks',
                impact: 'Could save 30-70% on junior agent tasks',
                details: `High-cost models in use: ${expensiveModels.map(m => m.model).join(', ')}`
            });
        }
        
        // Analyze team efficiency
        const teamEfficiency = this.analyzeTeamEfficiency();
        const inefficientTeams = teamEfficiency.filter(t => t.efficiency < 2.0);
        
        if (inefficientTeams.length > 0) {
            recommendations.push({
                priority: 'medium',
                category: 'efficiency',
                recommendation: 'Improve token efficiency for underperforming teams',
                impact: 'Could reduce token usage by 20-40%',
                details: `Teams below 2:1 efficiency: ${inefficientTeams.map(t => t.team).join(', ')}`
            });
        }
        
        // Check for cost spikes
        const spikes = this.detectCostSpikes();
        if (spikes.length > 0) {
            recommendations.push({
                priority: 'high',
                category: 'anomaly',
                recommendation: 'Investigate recent cost spikes',
                impact: 'Prevent budget overruns',
                details: `Unusual activity detected: ${spikes[0].description}`
            });
        }
        
        // Parallel processing optimization
        const parallelization = this.analyzeParallelization();
        if (parallelization.potential > 20) {
            recommendations.push({
                priority: 'medium',
                category: 'optimization',
                recommendation: 'Increase parallel agent execution',
                impact: `Could reduce timeline by ${parallelization.potential}%`,
                details: 'More agents can work simultaneously'
            });
        }
        
        return recommendations;
    }
    
    /**
     * Project total cost based on current burn rate
     */
    projectTotalCost() {
        const burnRate = this.calculateBurnRate();
        const remainingSprints = 6 - this.system.currentSprint;
        
        return {
            current: this.currentCosts.total,
            projected: this.currentCosts.total + (burnRate.perSprint * remainingSprints),
            confidence: this.calculateProjectionConfidence(),
            basedOn: `${burnRate.dataPoints} data points`
        };
    }
    
    /**
     * Calculate burn rate
     */
    calculateBurnRate() {
        const hourlyData = Array.from(this.currentCosts.byHour.entries());
        const dailyTotals = new Map();
        
        // Aggregate by day
        hourlyData.forEach(([hour, cost]) => {
            const day = hour.slice(0, 10);
            const current = dailyTotals.get(day) || 0;
            dailyTotals.set(day, current + cost);
        });
        
        const days = Array.from(dailyTotals.values());
        const avgPerDay = days.length > 0 ? days.reduce((a, b) => a + b, 0) / days.length : 0;
        
        return {
            perHour: this.currentCosts.total / hourlyData.length,
            perDay: avgPerDay,
            perSprint: avgPerDay * 3, // 3-day sprints
            dataPoints: hourlyData.length
        };
    }
    
    /**
     * Save report as JSON
     */
    async saveReportAsJSON(filename, report) {
        const path = `${this.projectPath}/costs/reports/${filename}.json`;
        await this.fs.writeFile(path, JSON.stringify(report, null, 2));
        console.log(`📄 JSON report saved: ${path}`);
    }
    
    /**
     * Save report as Markdown
     */
    async saveReportAsMarkdown(filename, report) {
        let markdown = `# Cost Report - ${report.type.toUpperCase()}\n\n`;
        markdown += `**Generated**: ${new Date(report.generatedAt).toLocaleString()}\n`;
        markdown += `**Project**: ${report.project}\n`;
        markdown += `**Sprint**: ${report.currentSprint}\n\n`;
        
        // Budget Summary
        markdown += `## 💰 Budget Summary\n\n`;
        markdown += `| Metric | Value |\n`;
        markdown += `|--------|-------|\n`;
        markdown += `| Total Budget | $${report.budget.total.toFixed(2)} |\n`;
        markdown += `| Spent | $${report.budget.spent.toFixed(2)} |\n`;
        markdown += `| Remaining | $${report.budget.remaining.toFixed(2)} |\n`;
        markdown += `| Used | ${report.budget.percentUsed}% |\n\n`;
        
        // Cost Breakdown
        markdown += `## 📊 Cost Breakdown\n\n`;
        markdown += `### By Team\n`;
        report.costs.byTeam.forEach(({ key, value }) => {
            markdown += `- **${key}**: $${value.toFixed(2)}\n`;
        });
        
        markdown += `\n### By Model\n`;
        report.costs.byModel.forEach(({ model, totalCost, usage }) => {
            markdown += `- **${model}**: $${totalCost.toFixed(2)} (${usage} tokens)\n`;
        });
        
        // Efficiency Metrics
        markdown += `\n## 📈 Efficiency Metrics\n\n`;
        markdown += `- **Cost per Sprint**: $${report.efficiency.costPerSprint.toFixed(2)}\n`;
        markdown += `- **Cost per Day**: $${report.efficiency.costPerDay.toFixed(2)}\n`;
        markdown += `- **Projected Total**: $${report.efficiency.projectedTotal.projected.toFixed(2)}\n`;
        
        // Recommendations
        if (report.recommendations.length > 0) {
            markdown += `\n## 💡 Recommendations\n\n`;
            report.recommendations.forEach(rec => {
                markdown += `### ${rec.priority.toUpperCase()}: ${rec.recommendation}\n`;
                markdown += `- **Impact**: ${rec.impact}\n`;
                markdown += `- **Details**: ${rec.details}\n\n`;
            });
        }
        
        const path = `${this.projectPath}/costs/reports/${filename}.md`;
        await this.fs.writeFile(path, markdown);
        console.log(`📄 Markdown report saved: ${path}`);
    }
    
    /**
     * Save report as HTML
     */
    async saveReportAsHTML(filename, report) {
        const html = `<!DOCTYPE html>
<html>
<head>
    <title>Cost Report - ${report.type.toUpperCase()}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        h1, h2, h3 { color: #333; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f4f4f4; }
        .metric { display: inline-block; margin: 10px 20px; }
        .warning { color: #ff9800; }
        .critical { color: #f44336; }
        .good { color: #4caf50; }
        .chart { margin: 20px 0; }
    </style>
</head>
<body>
    <h1>Cost Report - ${report.type.toUpperCase()}</h1>
    <div class="metadata">
        <p><strong>Generated:</strong> ${new Date(report.generatedAt).toLocaleString()}</p>
        <p><strong>Project:</strong> ${report.project}</p>
        <p><strong>Sprint:</strong> ${report.currentSprint}</p>
    </div>
    
    <h2>Budget Summary</h2>
    <div class="metrics">
        <div class="metric">
            <strong>Total Budget:</strong> $${report.budget.total.toFixed(2)}
        </div>
        <div class="metric">
            <strong>Spent:</strong> $${report.budget.spent.toFixed(2)}
        </div>
        <div class="metric">
            <strong>Remaining:</strong> $${report.budget.remaining.toFixed(2)}
        </div>
        <div class="metric">
            <strong>Used:</strong> <span class="${report.budget.percentUsed > 80 ? 'warning' : 'good'}">${report.budget.percentUsed}%</span>
        </div>
    </div>
    
    <h2>Cost Breakdown</h2>
    <table>
        <tr>
            <th>Team</th>
            <th>Cost</th>
            <th>Percentage</th>
        </tr>
        ${report.costs.byTeam.map(({ key, value }) => `
        <tr>
            <td>${key}</td>
            <td>$${value.toFixed(2)}</td>
            <td>${((value / report.costs.total) * 100).toFixed(1)}%</td>
        </tr>
        `).join('')}
    </table>
    
    ${report.recommendations.length > 0 ? `
    <h2>Recommendations</h2>
    ${report.recommendations.map(rec => `
    <div class="recommendation ${rec.priority}">
        <h3>${rec.recommendation}</h3>
        <p><strong>Priority:</strong> ${rec.priority}</p>
        <p><strong>Impact:</strong> ${rec.impact}</p>
        <p><strong>Details:</strong> ${rec.details}</p>
    </div>
    `).join('')}
    ` : ''}
</body>
</html>`;
        
        const path = `${this.projectPath}/costs/reports/${filename}.html`;
        await this.fs.writeFile(path, html);
        console.log(`📄 HTML report saved: ${path}`);
    }
    
    /**
     * Save report as CSV
     */
    async saveReportAsCSV(filename, report) {
        let csv = 'Category,Item,Cost,Percentage\n';
        
        // Add team costs
        report.costs.byTeam.forEach(({ key, value }) => {
            csv += `Team,${key},${value.toFixed(2)},${((value / report.costs.total) * 100).toFixed(1)}%\n`;
        });
        
        // Add model costs
        report.costs.byModel.forEach(({ model, totalCost }) => {
            csv += `Model,${model},${totalCost.toFixed(2)},${((totalCost / report.costs.total) * 100).toFixed(1)}%\n`;
        });
        
        // Add summary
        csv += `\nSummary,Total Budget,${report.budget.total.toFixed(2)},100%\n`;
        csv += `Summary,Spent,${report.budget.spent.toFixed(2)},${report.budget.percentUsed}%\n`;
        csv += `Summary,Remaining,${report.budget.remaining.toFixed(2)},${(100 - parseFloat(report.budget.percentUsed)).toFixed(1)}%\n`;
        
        const path = `${this.projectPath}/costs/reports/${filename}.csv`;
        await this.fs.writeFile(path, csv);
        console.log(`📄 CSV report saved: ${path}`);
    }
    
    /**
     * Get cost trends
     */
    async getCostTrends(period = 'daily') {
        const trends = {
            period,
            data: [],
            average: 0,
            trend: 'stable' // rising, falling, stable
        };
        
        if (period === 'daily') {
            trends.data = this.getDailyTrends();
        } else if (period === 'hourly') {
            trends.data = Array.from(this.currentCosts.byHour.entries()).map(([hour, cost]) => ({
                time: hour,
                cost
            }));
        }
        
        // Calculate average and trend
        if (trends.data.length > 1) {
            const costs = trends.data.map(d => d.cost);
            trends.average = costs.reduce((a, b) => a + b, 0) / costs.length;
            
            // Simple trend detection
            const firstHalf = costs.slice(0, Math.floor(costs.length / 2));
            const secondHalf = costs.slice(Math.floor(costs.length / 2));
            const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
            const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
            
            if (secondAvg > firstAvg * 1.1) trends.trend = 'rising';
            else if (secondAvg < firstAvg * 0.9) trends.trend = 'falling';
        }
        
        return trends;
    }
    
    /**
     * Export all cost data
     */
    async exportAllData(format = 'json') {
        const exportData = {
            metadata: {
                project: this.system.projectName,
                exportDate: new Date().toISOString(),
                format
            },
            currentCosts: {
                total: this.currentCosts.total,
                byTeam: Array.from(this.currentCosts.byTeam.entries()),
                byAgent: Array.from(this.currentCosts.byAgent.entries()),
                bySprint: Array.from(this.currentCosts.bySprint.entries()),
                byModel: Array.from(this.currentCosts.byModel.entries()),
                byHour: Array.from(this.currentCosts.byHour.entries())
            },
            budgets: this.budgets,
            historicalData: this.historicalData
        };
        
        const filename = `cost_export_${this.getTimestamp()}.${format}`;
        const path = `${this.projectPath}/costs/exports/${filename}`;
        
        if (format === 'json') {
            await this.fs.writeFile(path, JSON.stringify(exportData, null, 2));
        }
        
        console.log(`📦 Data exported: ${path}`);
        return exportData;
    }
    
    /**
     * Helper: Get top N costs from a Map
     */
    getTopCosts(costMap, limit) {
        return Array.from(costMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([key, value]) => ({ key, value }));
    }
    
    /**
     * Helper: Get model cost breakdown
     */
    getModelCostBreakdown() {
        const breakdown = [];
        
        for (const [modelId, totalCost] of this.currentCosts.byModel) {
            const rate = this.modelRates[modelId];
            breakdown.push({
                model: modelId,
                totalCost,
                costPerMillion: rate ? (rate.input + rate.output) / 2 : 0,
                usage: this.getModelTokenUsage(modelId)
            });
        }
        
        return breakdown.sort((a, b) => b.totalCost - a.totalCost);
    }
    
    /**
     * Helper: Get timestamp for filenames
     */
    getTimestamp() {
        return new Date().toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '-');
    }
    
    /**
     * Helper: Load historical data
     */
    async loadHistoricalData() {
        try {
            const historyPath = `${this.projectPath}/costs/history/historical_data.json`;
            const data = await this.fs.readFile(historyPath, 'utf8');
            this.historicalData = JSON.parse(data);
            console.log("📊 Historical cost data loaded");
        } catch (error) {
            console.log("📊 No historical data found, starting fresh");
        }
    }
    
    /**
     * Helper: Save budgets
     */
    async saveBudgets() {
        const budgetPath = `${this.projectPath}/costs/budgets/current_budgets.json`;
        await this.fs.writeFile(budgetPath, JSON.stringify(this.budgets, null, 2));
    }
    
    /**
     * Helper: Load budgets
     */
    async loadBudgets() {
        try {
            const budgetPath = `${this.projectPath}/costs/budgets/current_budgets.json`;
            const data = await this.fs.readFile(budgetPath, 'utf8');
            this.budgets = JSON.parse(data);
            console.log("💰 Budget configuration loaded");
        } catch (error) {
            console.log("💰 No budget configuration found");
        }
    }
    
    /**
     * Get summary template
     */
    getSummaryTemplate() {
        return {
            sections: ['budget', 'costs', 'efficiency', 'recommendations'],
            format: 'concise'
        };
    }
    
    /**
     * Get detailed template
     */
    getDetailedTemplate() {
        return {
            sections: ['budget', 'costs', 'efficiency', 'trends', 'projections', 'recommendations'],
            format: 'comprehensive'
        };
    }
    
    /**
     * Get sprint template
     */
    getSprintTemplate() {
        return {
            sections: ['sprint_summary', 'team_performance', 'cost_breakdown', 'velocity'],
            format: 'sprint_focused'
        };
    }
}

// Export for use in Team Leader System
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CostReporter;
}

// Make available globally in browser/Claude Code
if (typeof window !== 'undefined') {
    window.CostReporter = CostReporter;
}

// Usage example
console.log("💰 Cost Reporter loaded!");
console.log("\nExample usage:");
console.log("const reporter = new CostReporter(teamLeaderSystem);");
console.log("await reporter.setBudget({ total: 500, sprints: { 'sprint-1': 100 } });");
console.log("await reporter.trackAgentCost('senior-architect', { input: 5000, output: 3000 }, 'claude-opus-4');");
console.log("await reporter.generateReport('summary');");
