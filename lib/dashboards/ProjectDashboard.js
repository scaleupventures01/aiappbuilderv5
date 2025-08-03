/**
 * ProjectDashboard.js
 * Project-specific dashboard for Team Leader System v4.0
 * Extends BaseDashboard with project-specific functionality
 */

const BaseDashboard = require('./BaseDashboard');
const DashboardComponents = require('./shared/components');
const DashboardUtils = require('./shared/utils');
const DashboardStyles = require('./shared/styles');

class ProjectDashboard extends BaseDashboard {
    constructor(projectName, options = {}) {
        super(projectName, options);
        
        // Project-specific options
        this.showCosts = options.showCosts !== false;
        this.showPerformance = options.showPerformance !== false;
        this.showQuality = options.showQuality !== false;
        this.showTeams = options.showTeams !== false;
        
        // Project-specific data
        this.projectMetrics = {
            totalTasks: 0,
            completedTasks: 0,
            activeAgents: 0,
            totalCost: 0,
            averageResponseTime: 0,
            qualityScore: 0
        };
    }
    
    /**
     * Generate the project dashboard HTML
     */
    generateHTML() {
        const styles = DashboardStyles.getBaseStyles();
        const components = DashboardStyles.getIconStyles() + DashboardStyles.getAnimationStyles();
        
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.projectName} - Project Dashboard v${this.version}</title>
    <style>
        ${styles}
        ${components}
        ${this.generateProjectStyles()}
    </style>
</head>
<body>
    <div class="dashboard-container">
        ${this.generateHeader()}
        ${this.generateMainGrid()}
        ${this.generateFooter()}
    </div>
    <script>
        ${this.generateClientScript()}
    </script>
</body>
</html>`;
    }
    
    /**
     * Generate project-specific styles
     */
    generateProjectStyles() {
        return `
            .project-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
            }
            
            .project-info {
                display: flex;
                align-items: center;
                gap: 15px;
            }
            
            .project-avatar {
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: linear-gradient(135deg, #667eea, #764ba2);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
                color: white;
                font-weight: bold;
            }
            
            .project-details h1 {
                margin: 0;
                font-size: 2em;
                color: #333;
            }
            
            .project-details p {
                margin: 5px 0 0 0;
                color: #666;
                font-size: 1.1em;
            }
            
            .project-actions {
                display: flex;
                gap: 10px;
            }
            
            .metric-trend {
                font-size: 0.8em;
                font-weight: 500;
                margin-top: 5px;
            }
            
            .metric-trend.positive {
                color: #4CAF50;
            }
            
            .metric-trend.negative {
                color: #f44336;
            }
            
            .progress-item {
                margin: 15px 0;
            }
            
            .progress-label {
                font-weight: 500;
                margin-bottom: 5px;
                color: #333;
            }
            
            .progress-text {
                font-size: 0.9em;
                color: #666;
                margin-top: 5px;
            }
            
            .chart-placeholder {
                height: 200px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(255, 255, 255, 0.5);
                border-radius: 8px;
                color: #666;
                font-style: italic;
            }
            
            .data-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 15px;
            }
            
            .data-table th,
            .data-table td {
                padding: 12px;
                text-align: left;
                border-bottom: 1px solid #eee;
            }
            
            .data-table th {
                background: rgba(255, 255, 255, 0.7);
                font-weight: 600;
                color: #333;
            }
            
            .data-table tr:hover {
                background: rgba(255, 255, 255, 0.3);
            }
            
            .badge {
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 0.8em;
                font-weight: 500;
            }
            
            .badge-default { background: rgba(0, 0, 0, 0.1); color: #333; }
            .badge-success { background: rgba(76, 175, 80, 0.2); color: #2e7d32; }
            .badge-warning { background: rgba(255, 152, 0, 0.2); color: #ef6c00; }
            .badge-error { background: rgba(244, 67, 54, 0.2); color: #c62828; }
            .badge-info { background: rgba(33, 150, 243, 0.2); color: #1565c0; }
            
            .timeline {
                list-style: none;
                padding: 0;
                margin: 0;
            }
            
            .timeline-item {
                display: flex;
                margin: 20px 0;
                position: relative;
            }
            
            .timeline-marker {
                width: 12px;
                height: 12px;
                border-radius: 50%;
                margin-right: 15px;
                margin-top: 5px;
                flex-shrink: 0;
            }
            
            .timeline-marker.info { background: #2196F3; }
            .timeline-marker.success { background: #4CAF50; }
            .timeline-marker.warning { background: #FF9800; }
            .timeline-marker.error { background: #f44336; }
            
            .timeline-content {
                flex: 1;
                background: rgba(255, 255, 255, 0.7);
                padding: 15px;
                border-radius: 8px;
                border: 1px solid rgba(255, 255, 255, 0.3);
            }
            
            .timeline-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
            }
            
            .timeline-title {
                font-weight: 600;
                color: #333;
            }
            
            .timeline-time {
                font-size: 0.9em;
                color: #666;
            }
            
            .timeline-message {
                color: #555;
                margin-bottom: 5px;
            }
            
            .timeline-date {
                font-size: 0.8em;
                color: #999;
            }
        `;
    }
    
    /**
     * Generate dashboard header
     */
    generateHeader() {
        const projectInitial = this.projectName.charAt(0).toUpperCase();
        
        return `
            <div class="dashboard-header">
                <div class="project-header">
                    <div class="project-info">
                        <div class="project-avatar">${projectInitial}</div>
                        <div class="project-details">
                            <h1>${this.projectName}</h1>
                            <p>Project Dashboard • Version ${this.version}</p>
                        </div>
                    </div>
                    <div class="project-actions">
                        <button class="btn btn-primary" onclick="refreshDashboard()">Refresh</button>
                        <button class="btn btn-secondary" onclick="exportData()">Export</button>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Generate main dashboard grid
     */
    generateMainGrid() {
        return `
            <div class="main-grid">
                ${this.generateOverviewCard()}
                ${this.generateProgressCard()}
                ${this.generateTeamsCard()}
                ${this.generatePendingCard()}
                ${this.showCosts ? this.generateCostsCard() : ''}
                ${this.showPerformance ? this.generatePerformanceCard() : ''}
                ${this.showQuality ? this.generateQualityCard() : ''}
                ${this.generateActivityCard()}
            </div>
        `;
    }
    
    /**
     * Generate overview metrics card
     */
    generateOverviewCard() {
        const metrics = [
            DashboardComponents.generateMetricCard(
                'Total Tasks',
                this.projectMetrics.totalTasks,
                '',
                '📋',
                '#667eea'
            ),
            DashboardComponents.generateMetricCard(
                'Completed',
                this.projectMetrics.completedTasks,
                '',
                '✅',
                '#4CAF50'
            ),
            DashboardComponents.generateMetricCard(
                'Active Agents',
                this.projectMetrics.activeAgents,
                '',
                '🤖',
                '#FF9800'
            ),
            DashboardComponents.generateMetricCard(
                'Quality Score',
                this.projectMetrics.qualityScore,
                '%',
                '⭐',
                '#9C27B0'
            )
        ].join('');
        
        return DashboardComponents.generateCard(
            'overview',
            'Project Overview',
            '📊',
            `<div class="metric-grid">${metrics}</div>`
        );
    }
    
    /**
     * Generate progress tracking card
     */
    generateProgressCard() {
        const progressData = this.getProgressData();
        const progressBars = progressData.map(phase => 
            DashboardComponents.generateProgressBar(
                phase.progress,
                phase.name,
                phase.color
            )
        ).join('');
        
        return DashboardComponents.generateCard(
            'progress',
            'Project Progress',
            '📈',
            `<div class="progress-container">${progressBars}</div>`
        );
    }
    
    /**
     * Generate teams status card
     */
    generateTeamsCard() {
        const teamsData = this.getTeamsData();
        
        if (teamsData.length === 0) {
            return DashboardComponents.generateCard(
                'teams',
                'Team Status',
                '👥',
                DashboardComponents.generateEmptyState('👥', 'No Teams', 'No teams are currently active')
            );
        }
        
        const teamsList = teamsData.map(team => 
            DashboardComponents.generateTeamItem(team.id, team)
        ).join('');
        
        return DashboardComponents.generateCard(
            'teams',
            'Team Status',
            '👥',
            `<ul class="team-list">${teamsList}</ul>`
        );
    }
    
    /**
     * Generate pending items card
     */
    generatePendingCard() {
        const pendingData = this.getPendingData();
        
        if (pendingData.length === 0) {
            return DashboardComponents.generateCard(
                'pending',
                'Pending Items',
                '⏳',
                DashboardComponents.generateEmptyState('⏳', 'No Pending Items', 'All items have been processed')
            );
        }
        
        const pendingList = pendingData.map(item => 
            DashboardComponents.generatePendingItem(item)
        ).join('');
        
        return DashboardComponents.generateCard(
            'pending',
            'Pending Items',
            '⏳',
            `<div class="pending-list">${pendingList}</div>`
        );
    }
    
    /**
     * Generate costs card
     */
    generateCostsCard() {
        const costsData = this.getCostsData();
        const totalCost = DashboardUtils.formatCurrency(costsData.total);
        const averageCost = DashboardUtils.formatCurrency(costsData.average);
        
        const costsContent = `
            <div class="metric-grid">
                ${DashboardComponents.generateMetricCard('Total Cost', totalCost, '', '💰', '#FF9800')}
                ${DashboardComponents.generateMetricCard('Average Cost', averageCost, '', '📊', '#2196F3')}
                ${DashboardComponents.generateMetricCard('Cost Trend', costsData.trend, '%', '📈', '#4CAF50')}
            </div>
            ${DashboardComponents.generateChartContainer('costs-chart', 'Cost Over Time', 'line')}
        `;
        
        return DashboardComponents.generateCard(
            'costs',
            'Cost Analysis',
            '💰',
            costsContent
        );
    }
    
    /**
     * Generate performance card
     */
    generatePerformanceCard() {
        const perfData = this.getPerformanceData();
        const avgResponse = DashboardUtils.formatDuration(perfData.averageResponseTime);
        const throughput = perfData.throughput.toFixed(1);
        
        const perfContent = `
            <div class="metric-grid">
                ${DashboardComponents.generateMetricCard('Avg Response', avgResponse, '', '⚡', '#4CAF50')}
                ${DashboardComponents.generateMetricCard('Throughput', throughput, 'req/min', '🚀', '#2196F3')}
                ${DashboardComponents.generateMetricCard('Error Rate', perfData.errorRate, '%', '⚠️', '#FF9800')}
            </div>
            ${DashboardComponents.generateChartContainer('performance-chart', 'Performance Metrics', 'line')}
        `;
        
        return DashboardComponents.generateCard(
            'performance',
            'Performance Metrics',
            '⚡',
            perfContent
        );
    }
    
    /**
     * Generate quality card
     */
    generateQualityCard() {
        const qualityData = this.getQualityData();
        
        const qualityContent = `
            <div class="metric-grid">
                ${DashboardComponents.generateMetricCard('Overall Score', qualityData.score, '%', '⭐', '#9C27B0')}
                ${DashboardComponents.generateMetricCard('Test Coverage', qualityData.testCoverage, '%', '🧪', '#4CAF50')}
                ${DashboardComponents.generateMetricCard('Security Score', qualityData.securityScore, '%', '🔒', '#FF9800')}
            </div>
            ${DashboardComponents.generateChartContainer('quality-chart', 'Quality Metrics', 'bar')}
        `;
        
        return DashboardComponents.generateCard(
            'quality',
            'Quality Metrics',
            '⭐',
            qualityContent
        );
    }
    
    /**
     * Generate activity timeline card
     */
    generateActivityCard() {
        const activityData = this.getActivityData();
        
        if (activityData.length === 0) {
            return DashboardComponents.generateCard(
                'activity',
                'Recent Activity',
                '📝',
                DashboardComponents.generateEmptyState('📝', 'No Activity', 'No recent activity to display')
            );
        }
        
        const timelineItems = activityData.map(item => 
            DashboardComponents.generateTimelineItem(item)
        ).join('');
        
        return DashboardComponents.generateCard(
            'activity',
            'Recent Activity',
            '📝',
            `<div class="timeline">${timelineItems}</div>`
        );
    }
    
    /**
     * Generate dashboard footer
     */
    generateFooter() {
        return `
            <div class="dashboard-footer">
                <p>Last updated: <span id="last-update">${new Date().toLocaleString()}</span></p>
                <p>Team Leader System v${this.version}</p>
            </div>
        `;
    }
    
    /**
     * Generate client-side JavaScript
     */
    generateClientScript() {
        return `
            // Dashboard update functions
            async function refreshDashboard() {
                try {
                    const response = await fetch('/api/dashboard/refresh');
                    if (response.ok) {
                        location.reload();
                    }
                } catch (error) {
                    console.error('Failed to refresh dashboard:', error);
                }
            }
            
            async function exportData() {
                try {
                    const response = await fetch('/api/dashboard/export');
                    if (response.ok) {
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = '${this.projectName}-dashboard-export.json';
                        a.click();
                        window.URL.revokeObjectURL(url);
                    }
                } catch (error) {
                    console.error('Failed to export data:', error);
                }
            }
            
            async function approveItem(itemId) {
                try {
                    const response = await fetch('/api/pending/approve', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ itemId })
                    });
                    if (response.ok) {
                        location.reload();
                    }
                } catch (error) {
                    console.error('Failed to approve item:', error);
                }
            }
            
            async function rejectItem(itemId) {
                try {
                    const response = await fetch('/api/pending/reject', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ itemId })
                    });
                    if (response.ok) {
                        location.reload();
                    }
                } catch (error) {
                    console.error('Failed to reject item:', error);
                }
            }
            
            // Auto-refresh every 30 seconds
            setInterval(() => {
                document.getElementById('last-update').textContent = new Date().toLocaleString();
            }, 30000);
            
            // Add fade-in animation to cards
            document.addEventListener('DOMContentLoaded', () => {
                const cards = document.querySelectorAll('.card');
                cards.forEach((card, index) => {
                    card.style.animationDelay = \`\${index * 0.1}s\`;
                    card.classList.add('fade-in');
                });
            });
        `;
    }
    
    /**
     * Get progress data for the project
     */
    getProgressData() {
        const data = this.currentData?.progress?.byPhase || {};
        const phases = [
            { key: 'requirements', name: 'Requirements', color: '#667eea' },
            { key: 'architecture', name: 'Architecture', color: '#764ba2' },
            { key: 'design', name: 'Design', color: '#f093fb' },
            { key: 'development', name: 'Development', color: '#4CAF50' },
            { key: 'testing', name: 'Testing', color: '#FF9800' }
        ];
        
        return phases.map(phase => ({
            name: phase.name,
            progress: data[phase.key] || 0,
            color: phase.color
        }));
    }
    
    /**
     * Get teams data
     */
    getTeamsData() {
        const teams = this.currentData?.teams || {};
        return Object.entries(teams).map(([id, team]) => ({
            id,
            ...team
        }));
    }
    
    /**
     * Get pending items data
     */
    getPendingData() {
        const pending = this.currentData?.pendingItems || {};
        const allItems = [];
        
        Object.entries(pending).forEach(([type, items]) => {
            items.forEach(item => {
                allItems.push({ ...item, type });
            });
        });
        
        return allItems.slice(0, 5); // Show only first 5 items
    }
    
    /**
     * Get costs data
     */
    getCostsData() {
        return {
            total: this.projectMetrics.totalCost,
            average: this.projectMetrics.totalCost / Math.max(this.projectMetrics.totalTasks, 1),
            trend: 5.2 // Mock trend data
        };
    }
    
    /**
     * Get performance data
     */
    getPerformanceData() {
        return {
            averageResponseTime: this.projectMetrics.averageResponseTime,
            throughput: 45.2, // Mock data
            errorRate: 2.1 // Mock data
        };
    }
    
    /**
     * Get quality data
     */
    getQualityData() {
        return {
            score: this.projectMetrics.qualityScore,
            testCoverage: 85.3, // Mock data
            securityScore: 92.1 // Mock data
        };
    }
    
    /**
     * Get activity data
     */
    getActivityData() {
        const notifications = this.currentData?.notifications || [];
        return notifications.slice(0, 10).map(notification => ({
            title: notification.type,
            message: notification.message,
            timestamp: notification.timestamp,
            type: notification.type
        }));
    }
    
    /**
     * Update project metrics
     */
    async updateProjectMetrics(metrics) {
        this.projectMetrics = { ...this.projectMetrics, ...metrics };
        await this.updateData({ projectMetrics: this.projectMetrics });
    }
}

module.exports = ProjectDashboard; 