/**
 * styles.js
 * Shared CSS styles for Team Leader System dashboards
 * Extracted from DashboardGenerator.js to reduce duplication
 */

class DashboardStyles {
    /**
     * Get base styles
     */
    static getBaseStyles() {
        return `
            * {
                box-sizing: border-box;
            }
            
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                margin: 0;
                padding: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                color: #333;
                line-height: 1.6;
            }
            
            .dashboard-container {
                max-width: 1400px;
                margin: 0 auto;
                padding: 20px;
            }
            
            .dashboard-header {
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(10px);
                border-radius: 15px;
                padding: 25px;
                margin-bottom: 25px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
            }
            
            .dashboard-title {
                margin: 0 0 10px 0;
                font-size: 2.5em;
                font-weight: 700;
                background: linear-gradient(135deg, #667eea, #764ba2);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }
            
            .dashboard-subtitle {
                margin: 0;
                color: #666;
                font-size: 1.1em;
                font-weight: 400;
            }
            
            .main-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
                gap: 25px;
                margin-bottom: 25px;
            }
            
            .card {
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(10px);
                border-radius: 15px;
                padding: 25px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                transition: all 0.3s ease;
            }
            
            .card:hover {
                transform: translateY(-5px);
                box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
            }
            
            .card-header {
                display: flex;
                align-items: center;
                margin-bottom: 20px;
                padding-bottom: 15px;
                border-bottom: 2px solid #f0f0f0;
            }
            
            .card-icon {
                width: 40px;
                height: 40px;
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 15px;
                font-size: 1.2em;
                color: white;
            }
            
            .card-title {
                margin: 0;
                font-size: 1.3em;
                font-weight: 600;
                color: #333;
            }
            
            .metric-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                gap: 15px;
            }
            
            .metric {
                text-align: center;
                padding: 15px;
                background: rgba(255, 255, 255, 0.7);
                border-radius: 10px;
                border: 1px solid rgba(255, 255, 255, 0.3);
            }
            
            .metric-value {
                font-size: 1.8em;
                font-weight: 700;
                margin-bottom: 5px;
                color: #333;
            }
            
            .metric-label {
                font-size: 0.9em;
                color: #666;
                font-weight: 500;
            }
            
            .progress-bar {
                width: 100%;
                height: 8px;
                background: rgba(0, 0, 0, 0.1);
                border-radius: 4px;
                overflow: hidden;
                margin: 10px 0;
            }
            
            .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #4CAF50, #45a049);
                border-radius: 4px;
                transition: width 0.3s ease;
            }
            
            .status-indicator {
                display: inline-block;
                width: 12px;
                height: 12px;
                border-radius: 50%;
                margin-right: 8px;
            }
            
            .status-healthy { background: #4CAF50; }
            .status-warning { background: #FF9800; }
            .status-critical { background: #f44336; }
            .status-offline { background: #9e9e9e; }
            
            .notification {
                padding: 12px 15px;
                margin: 8px 0;
                border-radius: 8px;
                border-left: 4px solid;
                background: rgba(255, 255, 255, 0.9);
            }
            
            .notification-info {
                border-left-color: #2196F3;
                background: rgba(33, 150, 243, 0.1);
            }
            
            .notification-success {
                border-left-color: #4CAF50;
                background: rgba(76, 175, 80, 0.1);
            }
            
            .notification-warning {
                border-left-color: #FF9800;
                background: rgba(255, 152, 0, 0.1);
            }
            
            .notification-error {
                border-left-color: #f44336;
                background: rgba(244, 67, 54, 0.1);
            }
            
            .team-list {
                list-style: none;
                padding: 0;
                margin: 0;
            }
            
            .team-item {
                display: flex;
                align-items: center;
                padding: 12px;
                margin: 8px 0;
                background: rgba(255, 255, 255, 0.7);
                border-radius: 8px;
                border: 1px solid rgba(255, 255, 255, 0.3);
            }
            
            .team-name {
                flex: 1;
                font-weight: 500;
            }
            
            .team-status {
                font-size: 0.9em;
                padding: 4px 8px;
                border-radius: 4px;
                font-weight: 500;
            }
            
            .status-active {
                background: rgba(76, 175, 80, 0.2);
                color: #2e7d32;
            }
            
            .status-idle {
                background: rgba(255, 152, 0, 0.2);
                color: #ef6c00;
            }
            
            .status-busy {
                background: rgba(33, 150, 243, 0.2);
                color: #1565c0;
            }
            
            .status-error {
                background: rgba(244, 67, 54, 0.2);
                color: #c62828;
            }
            
            .pending-list {
                list-style: none;
                padding: 0;
                margin: 0;
            }
            
            .pending-item {
                padding: 12px;
                margin: 8px 0;
                background: rgba(255, 255, 255, 0.8);
                border-radius: 8px;
                border: 1px solid rgba(255, 255, 255, 0.4);
                border-left: 4px solid #FF9800;
            }
            
            .pending-title {
                font-weight: 600;
                margin-bottom: 5px;
                color: #333;
            }
            
            .pending-description {
                font-size: 0.9em;
                color: #666;
                margin-bottom: 8px;
            }
            
            .pending-meta {
                font-size: 0.8em;
                color: #999;
            }
            
            .chart-container {
                height: 200px;
                margin: 15px 0;
                background: rgba(255, 255, 255, 0.5);
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #666;
                font-style: italic;
            }
            
            .action-buttons {
                display: flex;
                gap: 10px;
                margin-top: 15px;
            }
            
            .btn {
                padding: 8px 16px;
                border: none;
                border-radius: 6px;
                font-size: 0.9em;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                text-decoration: none;
                display: inline-block;
            }
            
            .btn-primary {
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
            }
            
            .btn-primary:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
            }
            
            .btn-secondary {
                background: rgba(255, 255, 255, 0.8);
                color: #333;
                border: 1px solid rgba(0, 0, 0, 0.1);
            }
            
            .btn-secondary:hover {
                background: rgba(255, 255, 255, 1);
                transform: translateY(-1px);
            }
            
            .btn-success {
                background: #4CAF50;
                color: white;
            }
            
            .btn-warning {
                background: #FF9800;
                color: white;
            }
            
            .btn-danger {
                background: #f44336;
                color: white;
            }
            
            .loading {
                display: inline-block;
                width: 20px;
                height: 20px;
                border: 3px solid rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                border-top-color: #fff;
                animation: spin 1s ease-in-out infinite;
            }
            
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            
            .fade-in {
                animation: fadeIn 0.5s ease-in;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            .pulse {
                animation: pulse 2s infinite;
            }
            
            @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.7; }
                100% { opacity: 1; }
            }
            
            /* Responsive design */
            @media (max-width: 768px) {
                .dashboard-container {
                    padding: 15px;
                }
                
                .main-grid {
                    grid-template-columns: 1fr;
                    gap: 20px;
                }
                
                .card {
                    padding: 20px;
                }
                
                .metric-grid {
                    grid-template-columns: repeat(2, 1fr);
                }
                
                .dashboard-title {
                    font-size: 2em;
                }
            }
            
            @media (max-width: 480px) {
                .metric-grid {
                    grid-template-columns: 1fr;
                }
                
                .action-buttons {
                    flex-direction: column;
                }
                
                .btn {
                    width: 100%;
                    text-align: center;
                }
            }
        `;
    }
    
    /**
     * Get specific color schemes
     */
    static getColorScheme(scheme = 'default') {
        const schemes = {
            default: {
                primary: '#667eea',
                secondary: '#764ba2',
                success: '#4CAF50',
                warning: '#FF9800',
                error: '#f44336',
                info: '#2196F3'
            },
            dark: {
                primary: '#2c3e50',
                secondary: '#34495e',
                success: '#27ae60',
                warning: '#f39c12',
                error: '#e74c3c',
                info: '#3498db'
            },
            light: {
                primary: '#ecf0f1',
                secondary: '#bdc3c7',
                success: '#2ecc71',
                warning: '#f1c40f',
                error: '#e74c3c',
                info: '#3498db'
            }
        };
        
        return schemes[scheme] || schemes.default;
    }
    
    /**
     * Get icon styles
     */
    static getIconStyles() {
        return `
            .icon {
                display: inline-block;
                width: 1em;
                height: 1em;
                vertical-align: middle;
                fill: currentColor;
            }
            
            .icon-sm { width: 0.875em; height: 0.875em; }
            .icon-lg { width: 1.33em; height: 1.33em; }
            .icon-xl { width: 1.5em; height: 1.5em; }
            
            .icon-spin {
                animation: spin 1s linear infinite;
            }
        `;
    }
    
    /**
     * Get animation styles
     */
    static getAnimationStyles() {
        return `
            .slide-in {
                animation: slideIn 0.3s ease-out;
            }
            
            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateX(-20px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            
            .bounce-in {
                animation: bounceIn 0.6s ease-out;
            }
            
            @keyframes bounceIn {
                0% {
                    opacity: 0;
                    transform: scale(0.3);
                }
                50% {
                    opacity: 1;
                    transform: scale(1.05);
                }
                70% {
                    transform: scale(0.9);
                }
                100% {
                    opacity: 1;
                    transform: scale(1);
                }
            }
            
            .fade-out {
                animation: fadeOut 0.3s ease-in;
            }
            
            @keyframes fadeOut {
                from {
                    opacity: 1;
                    transform: translateY(0);
                }
                to {
                    opacity: 0;
                    transform: translateY(-20px);
                }
            }
        `;
    }
}

module.exports = DashboardStyles; 