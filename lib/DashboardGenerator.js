// enhanced_dashboard_generator.js - Real-Time Dashboard with Smart Updates

/**
 * Enhanced Dashboard Generator for Team Leader System v4.0
 * Features intelligent updates without full page reloads
 */

class EnhancedDashboardGenerator {
    constructor(projectName) {
        this.projectName = projectName;
        this.dashboardPath = `${projectName}/project-status.html`;
        this.dataPath = `${projectName}/.teamleader/dashboard-data.json`;
        this.updateInterval = 5000; // 5 seconds for real-time feel
        this.version = '4.0';
    }
    
    /**
     * Initialize dashboard with enhanced features
     */
    async initializeDashboard(projectConfig) {
        const initialData = {
            projectName: this.projectName,
            version: this.version,
            startTime: new Date().toISOString(),
            lastUpdate: new Date().toISOString(),
            lastDataHash: '',
            config: projectConfig,
            
            // Core metrics
            progress: {
                overall: 0,
                byPhase: {
                    requirements: 0,
                    architecture: 0,
                    design: 0,
                    development: 0,
                    testing: 0
                }
            },
            
            // Team status
            teams: {},
            activeAgents: 0,
            
            // Pending items that need attention
            pendingItems: {
                approvals: [],
                handoffs: [],
                escalations: [],
                decisions: []
            },
            
            // Quality metrics
            quality: {
                testCoverage: null,
                securityScore: null,
                performance: null,
                efficiency: {
                    tokenRatio: 0,
                    costPerHour: 0,
                    estimatedSavings: 0
                }
            },
            
            // Notifications
            notifications: [],
            
            // Real-time indicators
            realtime: {
                lastActivity: new Date().toISOString(),
                activeProcesses: [],
                systemHealth: 'healthy'
            }
        };
        
        // Save initial data
        await this.saveData(initialData);
        
        // Generate enhanced dashboard
        await this.generateEnhancedDashboard();
        
        return initialData;
    }
    
    /**
     * Generate the enhanced HTML dashboard
     */
    async generateEnhancedDashboard() {
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.projectName} - Team Leader Dashboard v${this.version}</title>
    <style>
        ${this.generateEnhancedStyles()}
    </style>
</head>
<body>
    <div id="dashboard-container">
        <!-- Notification Area -->
        <div id="notification-area"></div>
        
        <!-- Header -->
        <header>
            <div class="header-content">
                <h1>${this.projectName}</h1>
                <div class="header-stats">
                    <div class="stat">
                        <span class="stat-label">Status</span>
                        <span id="system-status" class="stat-value status-healthy">Active</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Agents</span>
                        <span id="active-agents" class="stat-value">0</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Last Update</span>
                        <span id="last-update" class="stat-value">Just now</span>
                    </div>
                </div>
            </div>
        </header>
        
        <!-- Pending Items Alert -->
        <div id="pending-alert" class="pending-alert hidden">
            <div class="alert-content">
                <span class="alert-icon">🔔</span>
                <span id="pending-count">0</span> items need your attention
                <button onclick="showPendingItems()">View All</button>
            </div>
        </div>
        
        <!-- Main Grid -->
        <div class="main-grid">
            <!-- Progress Section -->
            <section class="card" id="progress-section">
                <h2>Progress Overview</h2>
                <div class="overall-progress">
                    <div class="progress-bar large">
                        <div id="overall-progress-fill" class="progress-fill" style="width: 0%">
                            <span class="progress-text">0%</span>
                        </div>
                    </div>
                </div>
                <div id="phase-progress" class="phase-progress"></div>
            </section>
            
            <!-- Pending Items -->
            <section class="card" id="pending-items">
                <h2>Pending Items <span id="pending-badge" class="badge">0</span></h2>
                <div id="pending-list" class="pending-list">
                    <p class="empty-state">No pending items</p>
                </div>
            </section>
            
            <!-- Team Status -->
            <section class="card" id="team-status">
                <h2>Team Status</h2>
                <div id="team-grid" class="team-grid">
                    <p class="empty-state">Loading teams...</p>
                </div>
            </section>
            
            <!-- Quality Metrics -->
            <section class="card" id="quality-metrics">
                <h2>Quality & Efficiency</h2>
                <div class="metrics-grid">
                    <div class="metric">
                        <span class="metric-label">Token Efficiency</span>
                        <span id="token-ratio" class="metric-value">--</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Test Coverage</span>
                        <span id="test-coverage" class="metric-value">--</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Security Score</span>
                        <span id="security-score" class="metric-value">--</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Cost/Hour</span>
                        <span id="cost-per-hour" class="metric-value">--</span>
                    </div>
                </div>
            </section>
        </div>
        
        <!-- Activity Feed -->
        <section class="activity-feed card">
            <h2>Recent Activity</h2>
            <div id="activity-list" class="activity-list">
                <p class="empty-state">No recent activity</p>
            </div>
        </section>
    </div>
    
    <!-- Real-time update script -->
    <script>
        ${this.generateEnhancedClientScript()}
    </script>
</body>
</html>`;
        
        await this.saveDashboard(html);
        return html;
    }
    
    /**
     * Generate enhanced styles with animations
     */
    generateEnhancedStyles() {
        return `
        :root {
            --primary: #667eea;
            --success: #48bb78;
            --warning: #ed8936;
            --danger: #e53e3e;
            --info: #4299e1;
            --bg: #f7fafc;
            --card-bg: #ffffff;
            --text: #2d3748;
            --text-light: #718096;
            --border: #e2e8f0;
            --shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
            --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: var(--bg);
            color: var(--text);
            line-height: 1.6;
            padding: 1rem;
        }
        
        #dashboard-container {
            max-width: 1400px;
            margin: 0 auto;
        }
        
        /* Notification Area */
        #notification-area {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            max-width: 400px;
        }
        
        .notification {
            background: var(--card-bg);
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 0.5rem;
            box-shadow: var(--shadow-lg);
            border-left: 4px solid var(--info);
            animation: slideIn 0.3s ease-out;
            cursor: pointer;
            transition: transform 0.2s, opacity 0.2s;
        }
        
        .notification:hover {
            transform: translateX(-5px);
        }
        
        .notification.success { border-left-color: var(--success); }
        .notification.warning { border-left-color: var(--warning); }
        .notification.danger { border-left-color: var(--danger); }
        
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        /* Header */
        header {
            background: var(--card-bg);
            border-radius: 12px;
            padding: 2rem;
            margin-bottom: 2rem;
            box-shadow: var(--shadow);
        }
        
        .header-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 2rem;
        }
        
        h1 {
            color: var(--primary);
            font-size: 2.5rem;
            font-weight: 700;
        }
        
        .header-stats {
            display: flex;
            gap: 2rem;
        }
        
        .stat {
            text-align: center;
        }
        
        .stat-label {
            display: block;
            font-size: 0.875rem;
            color: var(--text-light);
            margin-bottom: 0.25rem;
        }
        
        .stat-value {
            display: block;
            font-size: 1.5rem;
            font-weight: 600;
        }
        
        .status-healthy { color: var(--success); }
        .status-warning { color: var(--warning); }
        .status-error { color: var(--danger); }
        
        /* Pending Alert */
        .pending-alert {
            background: var(--warning);
            color: white;
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 2rem;
            animation: pulse 2s infinite;
        }
        
        .pending-alert.hidden {
            display: none;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.9; }
        }
        
        .alert-content {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 1rem;
        }
        
        .alert-icon {
            font-size: 1.5rem;
            animation: ring 1s ease-in-out infinite;
        }
        
        @keyframes ring {
            0%, 100% { transform: rotate(0deg); }
            25% { transform: rotate(10deg); }
            75% { transform: rotate(-10deg); }
        }
        
        /* Cards */
        .card {
            background: var(--card-bg);
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: var(--shadow);
            transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .card:hover {
            transform: translateY(-2px);
            box-shadow: var(--shadow-lg);
        }
        
        .card h2 {
            color: var(--text);
            font-size: 1.25rem;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        
        /* Badge */
        .badge {
            background: var(--danger);
            color: white;
            font-size: 0.75rem;
            padding: 0.25rem 0.5rem;
            border-radius: 12px;
            font-weight: 600;
            min-width: 1.5rem;
            text-align: center;
        }
        
        .badge.empty {
            background: var(--text-light);
        }
        
        /* Grid Layout */
        .main-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }
        
        /* Progress Bars */
        .progress-bar {
            background: var(--border);
            border-radius: 8px;
            height: 8px;
            overflow: hidden;
            margin: 0.5rem 0;
        }
        
        .progress-bar.large {
            height: 24px;
            margin: 1rem 0;
        }
        
        .progress-fill {
            background: linear-gradient(90deg, var(--primary), var(--success));
            height: 100%;
            border-radius: 8px;
            transition: width 0.5s ease-out;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .progress-text {
            color: white;
            font-weight: 600;
            font-size: 0.875rem;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }
        
        .phase-progress {
            margin-top: 1rem;
        }
        
        .phase-item {
            margin-bottom: 0.75rem;
        }
        
        .phase-label {
            display: flex;
            justify-content: space-between;
            font-size: 0.875rem;
            color: var(--text-light);
            margin-bottom: 0.25rem;
        }
        
        /* Pending Items */
        .pending-list {
            max-height: 300px;
            overflow-y: auto;
        }
        
        .pending-item {
            padding: 1rem;
            border: 1px solid var(--border);
            border-radius: 8px;
            margin-bottom: 0.75rem;
            cursor: pointer;
            transition: all 0.2s;
            animation: fadeIn 0.3s ease-out;
        }
        
        .pending-item:hover {
            border-color: var(--primary);
            background: rgba(102, 126, 234, 0.05);
        }
        
        .pending-item.new {
            border-color: var(--warning);
            background: rgba(237, 137, 54, 0.05);
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .pending-type {
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            color: var(--text-light);
            margin-bottom: 0.25rem;
        }
        
        .pending-title {
            font-weight: 600;
            margin-bottom: 0.25rem;
        }
        
        .pending-meta {
            font-size: 0.875rem;
            color: var(--text-light);
        }
        
        /* Team Grid */
        .team-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 1rem;
        }
        
        .team-card {
            padding: 1rem;
            border: 2px solid var(--border);
            border-radius: 8px;
            text-align: center;
            transition: all 0.2s;
        }
        
        .team-card.active {
            border-color: var(--success);
            background: rgba(72, 187, 120, 0.05);
        }
        
        .team-card.blocked {
            border-color: var(--danger);
            background: rgba(229, 62, 62, 0.05);
        }
        
        .team-name {
            font-weight: 600;
            font-size: 0.875rem;
            margin-bottom: 0.25rem;
        }
        
        .team-status {
            font-size: 0.75rem;
            color: var(--text-light);
        }
        
        /* Metrics */
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
        }
        
        .metric {
            text-align: center;
            padding: 1rem;
            border: 1px solid var(--border);
            border-radius: 8px;
            transition: all 0.2s;
        }
        
        .metric.updated {
            animation: highlight 1s ease-out;
        }
        
        @keyframes highlight {
            0% { background: rgba(102, 126, 234, 0.2); }
            100% { background: transparent; }
        }
        
        .metric-label {
            display: block;
            font-size: 0.875rem;
            color: var(--text-light);
            margin-bottom: 0.5rem;
        }
        
        .metric-value {
            display: block;
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--primary);
        }
        
        /* Activity Feed */
        .activity-feed {
            max-width: 100%;
        }
        
        .activity-list {
            max-height: 200px;
            overflow-y: auto;
        }
        
        .activity-item {
            padding: 0.75rem;
            border-left: 3px solid var(--border);
            margin-bottom: 0.5rem;
            font-size: 0.875rem;
            animation: slideInLeft 0.3s ease-out;
        }
        
        @keyframes slideInLeft {
            from { transform: translateX(-20px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        .activity-time {
            font-size: 0.75rem;
            color: var(--text-light);
        }
        
        /* Empty States */
        .empty-state {
            text-align: center;
            color: var(--text-light);
            padding: 2rem;
            font-style: italic;
        }
        
        /* Buttons */
        button {
            background: var(--primary);
            color: white;
            border: none;
            border-radius: 6px;
            padding: 0.5rem 1rem;
            font-size: 0.875rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        button:hover {
            background: var(--primary);
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            .header-content {
                flex-direction: column;
                text-align: center;
            }
            
            .header-stats {
                width: 100%;
                justify-content: space-around;
            }
            
            .main-grid {
                grid-template-columns: 1fr;
            }
        }
        `;
    }
    
    /**
     * Generate enhanced client-side script
     */
    generateEnhancedClientScript() {
        return `
        // Dashboard state
        let lastDataHash = '';
        let pendingCount = 0;
        let notifications = [];
        let updateErrors = 0;
        
        // Update functions
        async function fetchDashboardData() {
            try {
                const response = await fetch('.teamleader/dashboard-data.json?t=' + Date.now());
                if (!response.ok) throw new Error('Failed to fetch data');
                
                const data = await response.json();
                
                // Check if data has changed
                const dataString = JSON.stringify(data);
                const dataHash = btoa(dataString).substring(0, 10);
                
                if (dataHash !== lastDataHash) {
                    lastDataHash = dataHash;
                    updateDashboard(data);
                }
                
                updateErrors = 0;
                updateLastRefresh();
                
            } catch (error) {
                updateErrors++;
                if (updateErrors > 3) {
                    updateSystemStatus('error', 'Connection Lost');
                }
                console.error('Dashboard update error:', error);
            }
        }
        
        function updateDashboard(data) {
            // Update progress
            updateProgress(data.progress);
            
            // Update pending items
            updatePendingItems(data.pendingItems);
            
            // Update teams
            updateTeams(data.teams);
            
            // Update quality metrics
            updateMetrics(data.quality);
            
            // Update activity feed
            if (data.realtime && data.realtime.activeProcesses) {
                updateActivityFeed(data.realtime.activeProcesses);
            }
            
            // Check for new notifications
            checkForNotifications(data);
        }
        
        function updateProgress(progress) {
            // Overall progress
            const overallFill = document.getElementById('overall-progress-fill');
            const currentWidth = parseFloat(overallFill.style.width) || 0;
            const newWidth = progress.overall || 0;
            
            if (Math.abs(currentWidth - newWidth) > 0.1) {
                overallFill.style.width = newWidth + '%';
                overallFill.querySelector('.progress-text').textContent = newWidth + '%';
                
                if (newWidth > currentWidth && newWidth > 0) {
                    showNotification('Progress Update', \`Project is now \${newWidth}% complete\`, 'success');
                }
            }
            
            // Phase progress
            const phaseContainer = document.getElementById('phase-progress');
            phaseContainer.innerHTML = '';
            
            for (const [phase, value] of Object.entries(progress.byPhase || {})) {
                phaseContainer.innerHTML += \`
                    <div class="phase-item">
                        <div class="phase-label">
                            <span>\${capitalize(phase)}</span>
                            <span>\${value}%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: \${value}%"></div>
                        </div>
                    </div>
                \`;
            }
        }
        
        function updatePendingItems(pendingItems) {
            const allPending = [
                ...(pendingItems.approvals || []).map(item => ({...item, type: 'approval'})),
                ...(pendingItems.handoffs || []).map(item => ({...item, type: 'handoff'})),
                ...(pendingItems.escalations || []).map(item => ({...item, type: 'escalation'})),
                ...(pendingItems.decisions || []).map(item => ({...item, type: 'decision'}))
            ];
            
            const newPendingCount = allPending.length;
            
            // Update badge
            const badge = document.getElementById('pending-badge');
            badge.textContent = newPendingCount;
            badge.className = newPendingCount > 0 ? 'badge' : 'badge empty';
            
            // Update alert
            const alert = document.getElementById('pending-alert');
            if (newPendingCount > 0) {
                alert.classList.remove('hidden');
                document.getElementById('pending-count').textContent = newPendingCount;
                
                // Show notification for new items
                if (newPendingCount > pendingCount) {
                    showNotification(
                        'New Pending Items',
                        \`\${newPendingCount - pendingCount} new item(s) need your attention\`,
                        'warning'
                    );
                }
            } else {
                alert.classList.add('hidden');
            }
            
            pendingCount = newPendingCount;
            
            // Update list
            const list = document.getElementById('pending-list');
            if (allPending.length === 0) {
                list.innerHTML = '<p class="empty-state">No pending items</p>';
            } else {
                list.innerHTML = allPending.map(item => \`
                    <div class="pending-item \${item.isNew ? 'new' : ''}" onclick="handlePendingItem('\${item.id}', '\${item.type}')">
                        <div class="pending-type">\${item.type}</div>
                        <div class="pending-title">\${item.title || item.name || 'Untitled'}</div>
                        <div class="pending-meta">
                            From: \${item.from || 'System'} • \${formatTime(item.timestamp)}
                        </div>
                    </div>
                \`).join('');
            }
        }
        
        function updateTeams(teams) {
            const grid = document.getElementById('team-grid');
            
            if (!teams || Object.keys(teams).length === 0) {
                grid.innerHTML = '<p class="empty-state">No active teams</p>';
                return;
            }
            
            grid.innerHTML = Object.entries(teams).map(([id, team]) => \`
                <div class="team-card \${team.status || ''}">
                    <div class="team-name">\${team.name || id}</div>
                    <div class="team-status">\${team.status || 'inactive'}</div>
                </div>
            \`).join('');
            
            // Update active agents count
            const activeCount = Object.values(teams).filter(t => t.status === 'active').length;
            document.getElementById('active-agents').textContent = activeCount;
        }
        
        function updateMetrics(quality) {
            if (!quality) return;
            
            // Token efficiency
            if (quality.efficiency) {
                updateMetricValue('token-ratio', quality.efficiency.tokenRatio + ':1');
                updateMetricValue('cost-per-hour', '$' + (quality.efficiency.costPerHour || 0).toFixed(2));
            }
            
            // Quality gates
            updateMetricValue('test-coverage', quality.testCoverage !== null ? quality.testCoverage + '%' : '--');
            updateMetricValue('security-score', quality.securityScore !== null ? quality.securityScore : '--');
        }
        
        function updateMetricValue(id, value) {
            const element = document.getElementById(id);
            if (element && element.textContent !== value) {
                element.textContent = value;
                element.parentElement.classList.add('updated');
                setTimeout(() => element.parentElement.classList.remove('updated'), 1000);
            }
        }
        
        function updateActivityFeed(activities) {
            const list = document.getElementById('activity-list');
            
            if (!activities || activities.length === 0) {
                list.innerHTML = '<p class="empty-state">No recent activity</p>';
                return;
            }
            
            // Show last 10 activities
            const recent = activities.slice(-10).reverse();
            list.innerHTML = recent.map(activity => \`
                <div class="activity-item">
                    <div>\${activity.message}</div>
                    <div class="activity-time">\${formatTime(activity.timestamp)}</div>
                </div>
            \`).join('');
        }
        
        function showNotification(title, message, type = 'info') {
            const area = document.getElementById('notification-area');
            const id = 'notif-' + Date.now();
            
            const notif = document.createElement('div');
            notif.id = id;
            notif.className = 'notification ' + type;
            notif.innerHTML = \`
                <strong>\${title}</strong><br>
                <span>\${message}</span>
            \`;
            
            notif.onclick = () => removeNotification(id);
            
            area.appendChild(notif);
            
            // Auto-remove after 5 seconds
            setTimeout(() => removeNotification(id), 5000);
        }
        
        function removeNotification(id) {
            const notif = document.getElementById(id);
            if (notif) {
                notif.style.opacity = '0';
                setTimeout(() => notif.remove(), 300);
            }
        }
        
        function checkForNotifications(data) {
            if (!data.notifications) return;
            
            // Show new notifications
            data.notifications.forEach(notif => {
                if (!notifications.find(n => n.id === notif.id)) {
                    showNotification(notif.title, notif.message, notif.type);
                    notifications.push(notif);
                }
            });
        }
        
        function updateSystemStatus(status, text) {
            const element = document.getElementById('system-status');
            element.textContent = text || status;
            element.className = 'stat-value status-' + status;
        }
        
        function updateLastRefresh() {
            const now = new Date();
            const element = document.getElementById('last-update');
            element.textContent = 'Just now';
            
            // Update to relative time after 1 minute
            setTimeout(() => {
                const mins = Math.floor((Date.now() - now) / 60000);
                if (mins > 0) {
                    element.textContent = mins + ' min ago';
                }
            }, 60000);
        }
        
        // Helper functions
        function capitalize(str) {
            return str.charAt(0).toUpperCase() + str.slice(1);
        }
        
        function formatTime(timestamp) {
            if (!timestamp) return 'Unknown';
            
            const date = new Date(timestamp);
            const now = new Date();
            const diff = now - date;
            
            if (diff < 60000) return 'Just now';
            if (diff < 3600000) return Math.floor(diff / 60000) + ' min ago';
            if (diff < 86400000) return Math.floor(diff / 3600000) + ' hours ago';
            
            return date.toLocaleDateString();
        }
        
        // Handle pending item clicks
        window.handlePendingItem = function(id, type) {
            // In real implementation, this would open a modal or navigate
            console.log('Handle pending item:', id, type);
            alert(\`Opening \${type} item: \${id}\\n\\nIn production, this would show details and actions.\`);
        };
        
        window.showPendingItems = function() {
            // Scroll to pending items section
            document.getElementById('pending-items').scrollIntoView({ behavior: 'smooth' });
        };
        
        // Start real-time updates
        setInterval(fetchDashboardData, ${this.updateInterval});
        
        // Initial load
        fetchDashboardData();
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'r' && e.ctrlKey) {
                e.preventDefault();
                fetchDashboardData();
                showNotification('Dashboard Refreshed', 'Data updated successfully', 'success');
            }
        });
        
        // Page visibility handling
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                fetchDashboardData();
            }
        });
        
        console.log('Dashboard v${this.version} initialized with real-time updates');
        `;
    }
    
    /**
     * Save dashboard HTML
     */
    async saveDashboard(html) {
        try {
            await window.fs.writeFile(this.dashboardPath, html);
            console.log(`✅ Dashboard saved to ${this.dashboardPath}`);
        } catch (error) {
            console.error('Failed to save dashboard:', error);
        }
    }
    
    /**
     * Save dashboard data
     */
    async saveData(data) {
        try {
            await window.fs.writeFile(this.dataPath, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error('Failed to save dashboard data:', error);
        }
    }
    
    /**
     * Update dashboard data (called by Junior Team Leader)
     */
    async updateData(updates) {
        try {
            // Load current data
            const currentData = await this.loadData();
            
            // Merge updates
            const updatedData = this.deepMerge(currentData, updates);
            
            // Update timestamp
            updatedData.lastUpdate = new Date().toISOString();
            
            // Save updated data
            await this.saveData(updatedData);
            
            return updatedData;
        } catch (error) {
            console.error('Failed to update dashboard data:', error);
            return null;
        }
    }
    
    /**
     * Load dashboard data
     */
    async loadData() {
        try {
            const data = await window.fs.readFile(this.dataPath, { encoding: 'utf8' });
            return JSON.parse(data);
        } catch (error) {
            return {};
        }
    }
    
    /**
     * Deep merge helper
     */
    deepMerge(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(result[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        
        return result;
    }
    
    /**
     * Add pending item
     */
    async addPendingItem(type, item) {
        const updates = {
            pendingItems: {
                [type]: []
            }
        };
        
        // Load current data to get existing items
        const currentData = await this.loadData();
        const currentItems = currentData.pendingItems?.[type] || [];
        
        // Add new item with metadata
        updates.pendingItems[type] = [
            ...currentItems,
            {
                ...item,
                id: item.id || `${type}-${Date.now()}`,
                timestamp: new Date().toISOString(),
                isNew: true
            }
        ];
        
        // Add notification
        updates.notifications = [
            {
                id: `notif-${Date.now()}`,
                title: `New ${capitalize(type)}`,
                message: item.title || item.name || 'New item requires attention',
                type: 'warning',
                timestamp: new Date().toISOString()
            }
        ];
        
        return await this.updateData(updates);
    }
    
    /**
     * Remove pending item
     */
    async removePendingItem(type, itemId) {
        const currentData = await this.loadData();
        const items = currentData.pendingItems?.[type] || [];
        
        const updates = {
            pendingItems: {
                [type]: items.filter(item => item.id !== itemId)
            }
        };
        
        return await this.updateData(updates);
    }
    
    /**
     * Update team status
     */
    async updateTeamStatus(teamId, status, name) {
        const updates = {
            teams: {
                [teamId]: {
                    id: teamId,
                    name: name || teamId,
                    status: status,
                    lastUpdate: new Date().toISOString()
                }
            }
        };
        
        return await this.updateData(updates);
    }
    
    /**
     * Update progress
     */
    async updateProgress(phase, value) {
        const updates = {
            progress: {
                byPhase: {
                    [phase]: value
                }
            }
        };
        
        // Recalculate overall progress
        const currentData = await this.loadData();
        const phases = { ...currentData.progress?.byPhase, [phase]: value };
        const values = Object.values(phases);
        updates.progress.overall = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
        
        return await this.updateData(updates);
    }
    
    /**
     * Add activity
     */
    async addActivity(message) {
        const currentData = await this.loadData();
        const activities = currentData.realtime?.activeProcesses || [];
        
        const updates = {
            realtime: {
                lastActivity: new Date().toISOString(),
                activeProcesses: [
                    ...activities.slice(-19), // Keep last 19
                    {
                        id: `activity-${Date.now()}`,
                        message: message,
                        timestamp: new Date().toISOString()
                    }
                ]
            }
        };
        
        return await this.updateData(updates);
    }
}

// Helper function to capitalize strings
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Export for use in Team Leader System
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnhancedDashboardGenerator;
}

// Make available globally in browser/Claude Code
if (typeof window !== 'undefined') {
    window.EnhancedDashboardGenerator = EnhancedDashboardGenerator;
}

// Usage example
console.log("Enhanced Dashboard Generator loaded!");
console.log("\nFeatures:");
console.log("- Real-time updates without page reload");
console.log("- Smart notifications for new items");
console.log("- Visual indicators for changes");
console.log("- Responsive design with animations");
console.log("\nUsage:");
console.log("const dashboard = new EnhancedDashboardGenerator('my-project');");
console.log("await dashboard.initializeDashboard(config);");
console.log("\nTo update data (from Junior Team Leader):");
console.log("await dashboard.addPendingItem('approval', { title: 'Review wireframes' });");
console.log("await dashboard.updateProgress('design', 75);");
