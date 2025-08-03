// Real-time Data Stream
// Live data streaming for dashboard updates

const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');

class RealTimeDataStream extends EventEmitter {
    constructor() {
        super();
        this.clients = new Set();
        this.dataCache = new Map();
        this.updateInterval = 5000; // 5 seconds
        this.isStreaming = false;
        this.streamInterval = null;
        
        this.dataSources = {
            costReporter: null,
            migrationMonitor: null,
            healthMonitor: null,
            qualityAssurance: null
        };
        
        this.initializeDataSources();
    }
    
    /**
     * Initialize data sources
     */
    async initializeDataSources() {
        try {
            this.dataSources.costReporter = require('./CostReporter');
            this.dataSources.migrationMonitor = require('./MigrationMonitor');
            this.dataSources.healthMonitor = require('./AdvancedHealthMonitor');
            this.dataSources.qualityAssurance = require('./QualityAssurance');
        } catch (error) {
            console.warn('Some data sources unavailable:', error.message);
        }
    }
    
    /**
     * Start real-time streaming
     */
    async startStreaming() {
        if (this.isStreaming) {
            console.log('⚠️ Real-time streaming already active');
            return;
        }
        
        console.log('📡 Starting Real-time Data Stream...');
        
        this.isStreaming = true;
        this.streamInterval = setInterval(async () => {
            await this.broadcastUpdate();
        }, this.updateInterval);
        
        console.log('✅ Real-time streaming started');
    }
    
    /**
     * Stop real-time streaming
     */
    stopStreaming() {
        if (this.streamInterval) {
            clearInterval(this.streamInterval);
            this.streamInterval = null;
        }
        
        this.isStreaming = false;
        console.log('⏹️ Real-time streaming stopped');
    }
    
    /**
     * Add client to stream
     */
    addClient(clientId, clientInfo = {}) {
        const client = {
            id: clientId,
            info: clientInfo,
            connectedAt: new Date().toISOString(),
            lastSeen: new Date().toISOString()
        };
        
        this.clients.add(client);
        console.log(`📱 Client ${clientId} connected to data stream`);
        
        // Send initial data
        this.sendInitialData(client);
        
        return client;
    }
    
    /**
     * Remove client from stream
     */
    removeClient(clientId) {
        for (const client of this.clients) {
            if (client.id === clientId) {
                this.clients.delete(client);
                console.log(`📱 Client ${clientId} disconnected from data stream`);
                break;
            }
        }
    }
    
    /**
     * Send initial data to new client
     */
    async sendInitialData(client) {
        try {
            const initialData = await this.collectAllData();
            this.emit('data', {
                type: 'initial',
                clientId: client.id,
                data: initialData,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Failed to send initial data:', error.message);
        }
    }
    
    /**
     * Broadcast update to all clients
     */
    async broadcastUpdate() {
        try {
            const updateData = await this.collectAllData();
            
            // Cache the data
            this.dataCache.set('latest', updateData);
            
            // Broadcast to all clients
            this.emit('data', {
                type: 'update',
                data: updateData,
                timestamp: new Date().toISOString()
            });
            
            // Update client last seen times
            for (const client of this.clients) {
                client.lastSeen = new Date().toISOString();
            }
            
        } catch (error) {
            console.error('Failed to broadcast update:', error.message);
        }
    }
    
    /**
     * Collect all real-time data
     */
    async collectAllData() {
        const data = {
            timestamp: new Date().toISOString(),
            cost: await this.getCostData(),
            migration: await this.getMigrationData(),
            health: await this.getHealthData(),
            quality: await this.getQualityData(),
            providers: await this.getProviderData(),
            system: await this.getSystemData()
        };
        
        return data;
    }
    
    /**
     * Get cost data
     */
    async getCostData() {
        try {
            const CostReporter = this.dataSources.costReporter;
            if (!CostReporter) return null;
            
            const costReporter = new CostReporter();
            
            return {
                summary: costReporter.generateSummary(),
                agentReport: costReporter.generateAgentReport(),
                modelReport: costReporter.generateModelReport(),
                optimizationMetrics: costReporter.generateOptimizationMetrics(),
                projections: costReporter.generateProjections()
            };
        } catch (error) {
            console.warn('Failed to get cost data:', error.message);
            return null;
        }
    }
    
    /**
     * Get migration data
     */
    async getMigrationData() {
        try {
            const MigrationMonitor = this.dataSources.migrationMonitor;
            if (!MigrationMonitor) return null;
            
            const monitor = new MigrationMonitor();
            
            return {
                status: monitor.getStatus(),
                metrics: monitor.getMetrics(),
                alerts: monitor.getAlerts()
            };
        } catch (error) {
            console.warn('Failed to get migration data:', error.message);
            return null;
        }
    }
    
    /**
     * Get health data
     */
    async getHealthData() {
        try {
            const AdvancedHealthMonitor = this.dataSources.healthMonitor;
            if (!AdvancedHealthMonitor) return null;
            
            const monitor = new AdvancedHealthMonitor();
            
            return {
                status: monitor.getHealthStatus(),
                lastReport: await this.getLatestHealthReport()
            };
        } catch (error) {
            console.warn('Failed to get health data:', error.message);
            return null;
        }
    }
    
    /**
     * Get quality data
     */
    async getQualityData() {
        try {
            const QualityAssurance = this.dataSources.qualityAssurance;
            if (!QualityAssurance) return null;
            
            const qa = new QualityAssurance();
            
            return {
                metrics: qa.getQualityMetrics(),
                testResults: qa.getTestResults(),
                benchmarks: qa.getBenchmarks()
            };
        } catch (error) {
            console.warn('Failed to get quality data:', error.message);
            return null;
        }
    }
    
    /**
     * Get provider data
     */
    async getProviderData() {
        try {
            const MultiModelAPIManager = require('./MultiModelAPIManager');
            const apiManager = new MultiModelAPIManager();
            const health = await apiManager.checkProviderHealth();
            
            return {
                health,
                status: this.calculateProviderStatus(health)
            };
        } catch (error) {
            console.warn('Failed to get provider data:', error.message);
            return null;
        }
    }
    
    /**
     * Get system data
     */
    async getSystemData() {
        return {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            clients: this.clients.size,
            streaming: this.isStreaming,
            lastUpdate: new Date().toISOString()
        };
    }
    
    /**
     * Calculate provider status
     */
    calculateProviderStatus(health) {
        const providers = Object.keys(health);
        const available = providers.filter(p => health[p].available).length;
        
        return {
            total: providers.length,
            available,
            unavailable: providers.length - available,
            availability: providers.length > 0 ? (available / providers.length) * 100 : 0
        };
    }
    
    /**
     * Get latest health report
     */
    async getLatestHealthReport() {
        try {
            const reportPath = '.teamleader/health-report.json';
            const data = await fs.readFile(reportPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            return null;
        }
    }
    
    /**
     * Send targeted update to specific client
     */
    sendTargetedUpdate(clientId, dataType, data) {
        this.emit('data', {
            type: 'targeted',
            clientId,
            dataType,
            data,
            timestamp: new Date().toISOString()
        });
    }
    
    /**
     * Get cached data
     */
    getCachedData(key = 'latest') {
        return this.dataCache.get(key);
    }
    
    /**
     * Get client information
     */
    getClientInfo(clientId) {
        for (const client of this.clients) {
            if (client.id === clientId) {
                return client;
            }
        }
        return null;
    }
    
    /**
     * Get all connected clients
     */
    getConnectedClients() {
        return Array.from(this.clients);
    }
    
    /**
     * Clean up inactive clients
     */
    cleanupInactiveClients(maxInactiveTime = 300000) { // 5 minutes
        const now = new Date();
        const inactiveClients = [];
        
        for (const client of this.clients) {
            const lastSeen = new Date(client.lastSeen);
            const inactiveTime = now - lastSeen;
            
            if (inactiveTime > maxInactiveTime) {
                inactiveClients.push(client.id);
            }
        }
        
        for (const clientId of inactiveClients) {
            this.removeClient(clientId);
        }
        
        if (inactiveClients.length > 0) {
            console.log(`🧹 Cleaned up ${inactiveClients.length} inactive clients`);
        }
    }
    
    /**
     * Generate streaming statistics
     */
    getStreamingStats() {
        return {
            isStreaming: this.isStreaming,
            connectedClients: this.clients.size,
            updateInterval: this.updateInterval,
            lastUpdate: this.dataCache.has('latest') ? 
                this.dataCache.get('latest').timestamp : null,
            cacheSize: this.dataCache.size
        };
    }
    
    /**
     * Set update interval
     */
    setUpdateInterval(interval) {
        this.updateInterval = interval;
        
        if (this.isStreaming) {
            // Restart streaming with new interval
            this.stopStreaming();
            this.startStreaming();
        }
    }
    
    /**
     * Subscribe to specific data type
     */
    subscribeToDataType(clientId, dataType) {
        const client = this.getClientInfo(clientId);
        if (client) {
            if (!client.subscriptions) {
                client.subscriptions = new Set();
            }
            client.subscriptions.add(dataType);
            console.log(`📡 Client ${clientId} subscribed to ${dataType}`);
        }
    }
    
    /**
     * Unsubscribe from data type
     */
    unsubscribeFromDataType(clientId, dataType) {
        const client = this.getClientInfo(clientId);
        if (client && client.subscriptions) {
            client.subscriptions.delete(dataType);
            console.log(`📡 Client ${clientId} unsubscribed from ${dataType}`);
        }
    }
    
    /**
     * Send data type specific update
     */
    async sendDataTypeUpdate(dataType) {
        try {
            let data = null;
            
            switch (dataType) {
                case 'cost':
                    data = await this.getCostData();
                    break;
                case 'migration':
                    data = await this.getMigrationData();
                    break;
                case 'health':
                    data = await this.getHealthData();
                    break;
                case 'quality':
                    data = await this.getQualityData();
                    break;
                case 'providers':
                    data = await this.getProviderData();
                    break;
                case 'system':
                    data = await this.getSystemData();
                    break;
                default:
                    console.warn(`Unknown data type: ${dataType}`);
                    return;
            }
            
            // Send to subscribed clients
            for (const client of this.clients) {
                if (client.subscriptions && client.subscriptions.has(dataType)) {
                    this.sendTargetedUpdate(client.id, dataType, data);
                }
            }
            
        } catch (error) {
            console.error(`Failed to send ${dataType} update:`, error.message);
        }
    }
    
    /**
     * Start periodic cleanup
     */
    startCleanup(interval = 60000) { // Every minute
        setInterval(() => {
            this.cleanupInactiveClients();
        }, interval);
    }
}

module.exports = RealTimeDataStream; 