/**
 * components.js
 * Shared UI components for Team Leader System dashboards
 * Provides reusable dashboard components and widgets
 */

const CommonUtils = require('../../utils/CommonUtils');

class DashboardComponents {
    /**
     * Generate a metric card
     */
    static generateMetricCard(title, value, unit = '', icon = '📊', color = '#667eea', trend = null) {
        const trendHtml = trend ? `
            <div class="metric-trend ${trend > 0 ? 'positive' : 'negative'}">
                ${trend > 0 ? '↗' : '↘'} ${Math.abs(trend).toFixed(1)}%
            </div>
        ` : '';
        
        return `
            <div class="metric" style="border-left: 4px solid ${color}">
                <div class="metric-header">
                    <span class="metric-icon">${icon}</span>
                    <span class="metric-title">${title}</span>
                </div>
                <div class="metric-value">${value}${unit}</div>
                ${trendHtml}
            </div>
        `;
    }
    
    /**
     * Generate a progress bar
     */
    static generateProgressBar(percentage, label = '', color = '#4CAF50') {
        return `
            <div class="progress-item">
                <div class="progress-label">${label}</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${percentage}%; background: ${color}"></div>
                </div>
                <div class="progress-text">${percentage.toFixed(1)}%</div>
            </div>
        `;
    }
    
    /**
     * Generate a status indicator
     */
    static generateStatusIndicator(status, label = '') {
        const statusClasses = {
            healthy: 'status-healthy',
            warning: 'status-warning', 
            critical: 'status-critical',
            offline: 'status-offline',
            active: 'status-active',
            idle: 'status-idle',
            busy: 'status-busy',
            error: 'status-error'
        };
        
        const statusText = {
            healthy: 'Healthy',
            warning: 'Warning',
            critical: 'Critical', 
            offline: 'Offline',
            active: 'Active',
            idle: 'Idle',
            busy: 'Busy',
            error: 'Error'
        };
        
        const className = statusClasses[status] || 'status-offline';
        const text = statusText[status] || 'Unknown';
        
        return `
            <div class="status-indicator ${className}">
                <span class="status-dot"></span>
                <span class="status-text">${text}</span>
                ${label ? `<span class="status-label">${label}</span>` : ''}
            </div>
        `;
    }
    
    /**
     * Generate a notification item
     */
    static generateNotification(notification) {
        const typeClasses = {
            info: 'notification-info',
            success: 'notification-success',
            warning: 'notification-warning',
            error: 'notification-error'
        };
        
        const icons = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌'
        };
        
        const className = typeClasses[notification.type] || 'notification-info';
        const icon = icons[notification.type] || 'ℹ️';
        const time = new Date(notification.timestamp).toLocaleTimeString();
        
        return `
            <div class="notification ${className}">
                <div class="notification-header">
                    <span class="notification-icon">${icon}</span>
                    <span class="notification-time">${time}</span>
                </div>
                <div class="notification-message">${notification.message}</div>
            </div>
        `;
    }
    
    /**
     * Generate a team status item
     */
    static generateTeamItem(teamId, team) {
        const status = team.status || 'idle';
        const lastUpdate = team.lastUpdate ? 
            new Date(team.lastUpdate).toLocaleTimeString() : 'Unknown';
        
        return `
            <div class="team-item">
                <div class="team-info">
                    <div class="team-name">${team.name || teamId}</div>
                    <div class="team-meta">Last update: ${lastUpdate}</div>
                </div>
                ${this.generateStatusIndicator(status, 'Team')}
            </div>
        `;
    }
    
    /**
     * Generate a pending item
     */
    static generatePendingItem(item) {
        const time = new Date(item.timestamp).toLocaleTimeString();
        
        return `
            <div class="pending-item">
                <div class="pending-header">
                    <span class="pending-type">${item.type || 'Unknown'}</span>
                    <span class="pending-time">${time}</span>
                </div>
                <div class="pending-title">${item.title || 'No title'}</div>
                <div class="pending-description">${item.description || 'No description'}</div>
                <div class="pending-actions">
                    <button class="btn btn-success btn-sm" onclick="approveItem('${item.id}')">Approve</button>
                    <button class="btn btn-danger btn-sm" onclick="rejectItem('${item.id}')">Reject</button>
                </div>
            </div>
        `;
    }
    
    /**
     * Generate a chart container
     */
    static generateChartContainer(chartId, title, type = 'line') {
        return `
            <div class="chart-container">
                <div class="chart-header">
                    <h3 class="chart-title">${title}</h3>
                    <div class="chart-controls">
                        <select class="chart-type-selector" onchange="changeChartType('${chartId}', this.value)">
                            <option value="line" ${type === 'line' ? 'selected' : ''}>Line</option>
                            <option value="bar" ${type === 'bar' ? 'selected' : ''}>Bar</option>
                            <option value="area" ${type === 'area' ? 'selected' : ''}>Area</option>
                        </select>
                    </div>
                </div>
                <div id="${chartId}" class="chart-content">
                    <div class="chart-placeholder">
                        <span class="chart-loading">Loading chart...</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Generate a data table
     */
    static generateDataTable(data, columns, tableId = 'data-table') {
        const headers = columns.map(col => `<th>${col.header}</th>`).join('');
        const rows = data.map(row => {
            const cells = columns.map(col => {
                const value = row[col.key];
                const formatted = col.formatter ? col.formatter(value) : value;
                return `<td>${formatted}</td>`;
            }).join('');
            return `<tr>${cells}</tr>`;
        }).join('');
        
        return `
            <div class="data-table-container">
                <table id="${tableId}" class="data-table">
                    <thead>
                        <tr>${headers}</tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>
        `;
    }
    
    /**
     * Generate an action button
     */
    static generateActionButton(text, action, type = 'primary', size = 'normal') {
        const sizeClass = size === 'small' ? 'btn-sm' : size === 'large' ? 'btn-lg' : '';
        return `
            <button class="btn btn-${type} ${sizeClass}" onclick="${action}">
                ${text}
            </button>
        `;
    }
    
    /**
     * Generate a card with header and content
     */
    static generateCard(id, title, icon = '📊', content = '', actions = []) {
        const actionsHtml = actions.length > 0 ? `
            <div class="card-actions">
                ${actions.map(action => this.generateActionButton(action.text, action.onclick, action.type, action.size)).join('')}
            </div>
        ` : '';
        
        return `
            <section class="card" id="${id}">
                <div class="card-header">
                    <div class="card-icon" style="background: linear-gradient(135deg, #667eea, #764ba2)">
                        ${icon}
                    </div>
                    <h3 class="card-title">${title}</h3>
                </div>
                <div class="card-content">
                    ${content}
                </div>
                ${actionsHtml}
            </section>
        `;
    }
    
    /**
     * Generate a loading spinner
     */
    static generateLoadingSpinner(text = 'Loading...') {
        return `
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <div class="loading-text">${text}</div>
            </div>
        `;
    }
    
    /**
     * Generate an empty state
     */
    static generateEmptyState(icon = '📭', title = 'No Data', message = 'There is no data to display') {
        return `
            <div class="empty-state">
                <div class="empty-icon">${icon}</div>
                <h3 class="empty-title">${title}</h3>
                <p class="empty-message">${message}</p>
            </div>
        `;
    }
    
    /**
     * Generate a tooltip
     */
    static generateTooltip(text, content) {
        return `
            <div class="tooltip-container">
                <span class="tooltip-trigger">${text}</span>
                <div class="tooltip-content">
                    ${content}
                </div>
            </div>
        `;
    }
    
    /**
     * Generate a badge
     */
    static generateBadge(text, type = 'default') {
        const typeClasses = {
            default: 'badge-default',
            success: 'badge-success',
            warning: 'badge-warning',
            error: 'badge-error',
            info: 'badge-info'
        };
        
        const className = typeClasses[type] || 'badge-default';
        
        return `<span class="badge ${className}">${text}</span>`;
    }
    
    /**
     * Generate a timeline item
     */
    static generateTimelineItem(item) {
        const time = new Date(item.timestamp).toLocaleTimeString();
        const date = new Date(item.timestamp).toLocaleDateString();
        
        return `
            <div class="timeline-item">
                <div class="timeline-marker ${item.type || 'info'}"></div>
                <div class="timeline-content">
                    <div class="timeline-header">
                        <span class="timeline-title">${item.title}</span>
                        <span class="timeline-time">${time}</span>
                    </div>
                    <div class="timeline-message">${item.message}</div>
                    <div class="timeline-date">${date}</div>
                </div>
            </div>
        `;
    }
    
    /**
     * Generate a modal dialog
     */
    static generateModal(id, title, content, actions = []) {
        const actionsHtml = actions.map(action => 
            this.generateActionButton(action.text, action.onclick, action.type)
        ).join('');
        
        return `
            <div id="${id}" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 class="modal-title">${title}</h3>
                        <button class="modal-close" onclick="closeModal('${id}')">&times;</button>
                    </div>
                    <div class="modal-body">
                        ${content}
                    </div>
                    <div class="modal-footer">
                        ${actionsHtml}
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Generate a form field
     */
    static generateFormField(type, name, label, value = '', options = {}) {
        const required = options.required ? 'required' : '';
        const placeholder = options.placeholder || '';
        const id = options.id || name;
        
        switch (type) {
            case 'text':
            case 'email':
            case 'number':
                return `
                    <div class="form-field">
                        <label for="${id}">${label}</label>
                        <input type="${type}" id="${id}" name="${name}" value="${value}" 
                               placeholder="${placeholder}" ${required}>
                    </div>
                `;
            case 'textarea':
                return `
                    <div class="form-field">
                        <label for="${id}">${label}</label>
                        <textarea id="${id}" name="${name}" placeholder="${placeholder}" ${required}>${value}</textarea>
                    </div>
                `;
            case 'select':
                const optionsHtml = options.options ? 
                    options.options.map(opt => 
                        `<option value="${opt.value}" ${opt.value === value ? 'selected' : ''}>${opt.label}</option>`
                    ).join('') : '';
                return `
                    <div class="form-field">
                        <label for="${id}">${label}</label>
                        <select id="${id}" name="${name}" ${required}>
                            ${optionsHtml}
                        </select>
                    </div>
                `;
            default:
                return '';
        }
    }
}

module.exports = DashboardComponents; 