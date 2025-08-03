// Automated Quality Gates
// Automatic quality checks and approvals

const QualityAssurance = require('./QualityAssurance');
const CostReporter = require('./CostReporter');

class AutomatedQualityGates {
    constructor() {
        this.qa = new QualityAssurance();
        this.costReporter = new CostReporter();
        this.gates = new Map();
        this.approvals = new Map();
        this.rejections = new Map();
        
        this.qualityThresholds = {
            codeGeneration: {
                syntaxCorrectness: 0.9,
                functionality: 0.85,
                readability: 0.8,
                performance: 0.75
            },
            contentCreation: {
                relevance: 0.9,
                grammar: 0.95,
                creativity: 0.8,
                engagement: 0.75
            },
            analysis: {
                accuracy: 0.9,
                depth: 0.8,
                insight: 0.8,
                actionability: 0.75
            },
            design: {
                aesthetics: 0.8,
                usability: 0.85,
                consistency: 0.9,
                innovation: 0.7
            }
        };
        
        this.initializeQualityGates();
    }
    
    /**
     * Initialize quality gates
     */
    initializeQualityGates() {
        // Code Generation Gate
        this.gates.set('code_generation', {
            name: 'Code Generation Quality Gate',
            description: 'Automated checks for code quality, syntax, and functionality',
            taskType: 'code-generation',
            checks: [
                'syntax_correctness',
                'functionality',
                'readability',
                'performance'
            ],
            thresholds: this.qualityThresholds.codeGeneration,
            autoApprove: true,
            autoReject: true
        });
        
        // Content Creation Gate
        this.gates.set('content_creation', {
            name: 'Content Creation Quality Gate',
            description: 'Automated checks for content relevance, grammar, and engagement',
            taskType: 'content-creation',
            checks: [
                'relevance',
                'grammar',
                'creativity',
                'engagement'
            ],
            thresholds: this.qualityThresholds.contentCreation,
            autoApprove: true,
            autoReject: true
        });
        
        // Analysis Gate
        this.gates.set('analysis', {
            name: 'Analysis Quality Gate',
            description: 'Automated checks for analysis accuracy, depth, and insights',
            taskType: 'analysis',
            checks: [
                'accuracy',
                'depth',
                'insight',
                'actionability'
            ],
            thresholds: this.qualityThresholds.analysis,
            autoApprove: true,
            autoReject: true
        });
        
        // Design Gate
        this.gates.set('design', {
            name: 'Design Quality Gate',
            description: 'Automated checks for design aesthetics, usability, and consistency',
            taskType: 'design',
            checks: [
                'aesthetics',
                'usability',
                'consistency',
                'innovation'
            ],
            thresholds: this.qualityThresholds.design,
            autoApprove: true,
            autoReject: true
        });
        
        // Cost Gate
        this.gates.set('cost_optimization', {
            name: 'Cost Optimization Gate',
            description: 'Automated checks for cost efficiency and optimization',
            taskType: 'cost',
            checks: [
                'cost_per_token',
                'model_efficiency',
                'fallback_rate',
                'optimization_score'
            ],
            thresholds: {
                cost_per_token: 0.0001, // $0.0001 per token
                model_efficiency: 0.8,
                fallback_rate: 0.1, // 10%
                optimization_score: 0.7
            },
            autoApprove: true,
            autoReject: false
        });
        
        // Performance Gate
        this.gates.set('performance', {
            name: 'Performance Quality Gate',
            description: 'Automated checks for response time and performance',
            taskType: 'performance',
            checks: [
                'response_time',
                'throughput',
                'error_rate',
                'availability'
            ],
            thresholds: {
                response_time: 5000, // 5 seconds
                throughput: 10, // requests per minute
                error_rate: 0.05, // 5%
                availability: 0.95 // 95%
            },
            autoApprove: true,
            autoReject: true
        });
    }
    
    /**
     * Run quality gate for a specific output
     */
    async runQualityGate(gateId, output, metadata = {}) {
        const gate = this.gates.get(gateId);
        if (!gate) {
            throw new Error(`Quality gate not found: ${gateId}`);
        }
        
        console.log(`🔍 Running ${gate.name}...`);
        
        const result = {
            gateId,
            gateName: gate.name,
            timestamp: new Date().toISOString(),
            output: output.substring(0, 200) + '...', // Truncate for logging
            metadata,
            checks: {},
            overallScore: 0,
            passed: false,
            approved: false,
            rejected: false,
            recommendations: []
        };
        
        // Run quality evaluation
        if (gate.taskType !== 'cost' && gate.taskType !== 'performance') {
            const evaluation = await this.qa.evaluateOutput(output, gate.taskType);
            result.checks = evaluation.metrics;
            result.overallScore = evaluation.overall;
        } else {
            // Special handling for cost and performance gates
            result.checks = await this.runSpecializedChecks(gateId, output, metadata);
            result.overallScore = this.calculateOverallScore(result.checks);
        }
        
        // Check against thresholds
        const thresholdResults = this.checkThresholds(gate, result.checks);
        result.passed = thresholdResults.passed;
        result.thresholdResults = thresholdResults;
        
        // Generate recommendations
        result.recommendations = this.generateRecommendations(gate, result.checks, thresholdResults);
        
        // Auto-approve or reject based on gate configuration
        if (gate.autoApprove && result.passed) {
            result.approved = true;
            await this.approveOutput(gateId, result);
        } else if (gate.autoReject && !result.passed) {
            result.rejected = true;
            await this.rejectOutput(gateId, result);
        }
        
        // Store result
        this.storeGateResult(gateId, result);
        
        console.log(`✅ ${gate.name} completed: ${result.passed ? 'PASSED' : 'FAILED'}`);
        
        return result;
    }
    
    /**
     * Run specialized checks for cost and performance gates
     */
    async runSpecializedChecks(gateId, output, metadata) {
        const checks = {};
        
        if (gateId === 'cost_optimization') {
            const costData = this.costReporter.generateSummary();
            const optimizationMetrics = this.costReporter.generateOptimizationMetrics();
            
            checks.cost_per_token = parseFloat(costData.avgCostPerToken) || 0;
            checks.model_efficiency = parseFloat(optimizationMetrics.optimizedUsage.percentage) / 100;
            checks.fallback_rate = parseFloat(optimizationMetrics.fallbackUsage.percentage) / 100;
            checks.optimization_score = this.calculateOptimizationScore(optimizationMetrics);
        }
        
        if (gateId === 'performance') {
            // Simulate performance metrics
            checks.response_time = Math.random() * 3000 + 1000; // 1-4 seconds
            checks.throughput = Math.random() * 20 + 5; // 5-25 requests per minute
            checks.error_rate = Math.random() * 0.1; // 0-10%
            checks.availability = Math.random() * 0.1 + 0.9; // 90-100%
        }
        
        return checks;
    }
    
    /**
     * Calculate optimization score
     */
    calculateOptimizationScore(optimizationMetrics) {
        const optimizedUsage = parseFloat(optimizationMetrics.optimizedUsage.percentage) / 100;
        const fallbackUsage = parseFloat(optimizationMetrics.fallbackUsage.percentage) / 100;
        const savings = parseFloat(optimizationMetrics.savings.percentage) / 100;
        
        return (optimizedUsage * 0.4) + ((1 - fallbackUsage) * 0.3) + (savings * 0.3);
    }
    
    /**
     * Check thresholds
     */
    checkThresholds(gate, checks) {
        const results = {
            passed: true,
            failedChecks: [],
            passedChecks: []
        };
        
        for (const check of gate.checks) {
            const value = checks[check];
            const threshold = gate.thresholds[check];
            
            if (value === undefined || value === null) {
                results.failedChecks.push({
                    check,
                    value: 'undefined',
                    threshold,
                    reason: 'Check value not available'
                });
                results.passed = false;
            } else if (this.compareValue(value, threshold, check)) {
                results.passedChecks.push({
                    check,
                    value,
                    threshold
                });
            } else {
                results.failedChecks.push({
                    check,
                    value,
                    threshold,
                    reason: `Failed threshold check: ${value} vs ${threshold}`
                });
                results.passed = false;
            }
        }
        
        return results;
    }
    
    /**
     * Compare value against threshold
     */
    compareValue(value, threshold, check) {
        // For most metrics, higher is better
        const higherIsBetter = [
            'syntax_correctness', 'functionality', 'readability', 'performance',
            'relevance', 'grammar', 'creativity', 'engagement',
            'accuracy', 'depth', 'insight', 'actionability',
            'aesthetics', 'usability', 'consistency', 'innovation',
            'model_efficiency', 'optimization_score', 'availability'
        ];
        
        // For these metrics, lower is better
        const lowerIsBetter = [
            'cost_per_token', 'fallback_rate', 'response_time', 'error_rate'
        ];
        
        if (higherIsBetter.includes(check)) {
            return value >= threshold;
        } else if (lowerIsBetter.includes(check)) {
            return value <= threshold;
        }
        
        // Default to higher is better
        return value >= threshold;
    }
    
    /**
     * Calculate overall score
     */
    calculateOverallScore(checks) {
        const values = Object.values(checks).filter(v => typeof v === 'number');
        if (values.length === 0) return 0;
        
        return values.reduce((sum, val) => sum + val, 0) / values.length;
    }
    
    /**
     * Generate recommendations
     */
    generateRecommendations(gate, checks, thresholdResults) {
        const recommendations = [];
        
        for (const failedCheck of thresholdResults.failedChecks) {
            const recommendation = this.getRecommendationForCheck(
                failedCheck.check,
                failedCheck.value,
                failedCheck.threshold
            );
            
            if (recommendation) {
                recommendations.push({
                    check: failedCheck.check,
                    priority: 'HIGH',
                    message: recommendation.message,
                    action: recommendation.action
                });
            }
        }
        
        // Add general recommendations
        if (thresholdResults.passed) {
            recommendations.push({
                check: 'overall',
                priority: 'LOW',
                message: 'Quality standards met',
                action: 'Continue with current approach'
            });
        } else {
            recommendations.push({
                check: 'overall',
                priority: 'MEDIUM',
                message: 'Quality improvements needed',
                action: 'Review and address failed checks'
            });
        }
        
        return recommendations;
    }
    
    /**
     * Get recommendation for specific check
     */
    getRecommendationForCheck(check, value, threshold) {
        const recommendations = {
            syntax_correctness: {
                message: 'Code syntax needs improvement',
                action: 'Review and fix syntax errors, use linting tools'
            },
            functionality: {
                message: 'Code functionality is below standard',
                action: 'Add more comprehensive testing, review logic'
            },
            readability: {
                message: 'Code readability needs improvement',
                action: 'Add comments, improve variable names, refactor complex functions'
            },
            performance: {
                message: 'Performance optimization needed',
                action: 'Profile code, optimize algorithms, reduce complexity'
            },
            relevance: {
                message: 'Content relevance is below standard',
                action: 'Review prompt engineering, improve context'
            },
            grammar: {
                message: 'Grammar and spelling issues detected',
                action: 'Use grammar checking tools, review content'
            },
            creativity: {
                message: 'Content creativity needs improvement',
                action: 'Explore different approaches, enhance prompts'
            },
            engagement: {
                message: 'Content engagement is low',
                action: 'Improve storytelling, add interactive elements'
            },
            accuracy: {
                message: 'Analysis accuracy needs improvement',
                action: 'Verify sources, cross-reference data'
            },
            depth: {
                message: 'Analysis depth is insufficient',
                action: 'Expand analysis, consider more factors'
            },
            insight: {
                message: 'Analysis insights are limited',
                action: 'Look for patterns, consider alternative perspectives'
            },
            actionability: {
                message: 'Analysis lacks actionable recommendations',
                action: 'Provide specific next steps and implementation guidance'
            },
            cost_per_token: {
                message: 'Cost per token is too high',
                action: 'Switch to more cost-effective models, optimize prompts'
            },
            fallback_rate: {
                message: 'Fallback rate is too high',
                action: 'Check API keys, improve model selection logic'
            },
            response_time: {
                message: 'Response time is too slow',
                action: 'Switch to faster models, optimize requests'
            },
            error_rate: {
                message: 'Error rate is too high',
                action: 'Check provider health, implement retry logic'
            }
        };
        
        return recommendations[check] || {
            message: `${check} is below threshold`,
            action: 'Review and improve this metric'
        };
    }
    
    /**
     * Approve output
     */
    async approveOutput(gateId, result) {
        const approval = {
            gateId,
            timestamp: new Date().toISOString(),
            result,
            approvedBy: 'Automated Quality Gate',
            notes: 'Auto-approved based on quality thresholds'
        };
        
        this.approvals.set(`${gateId}_${Date.now()}`, approval);
        console.log(`✅ Auto-approved: ${result.gateName}`);
        
        return approval;
    }
    
    /**
     * Reject output
     */
    async rejectOutput(gateId, result) {
        const rejection = {
            gateId,
            timestamp: new Date().toISOString(),
            result,
            rejectedBy: 'Automated Quality Gate',
            notes: 'Auto-rejected based on quality thresholds',
            recommendations: result.recommendations
        };
        
        this.rejections.set(`${gateId}_${Date.now()}`, rejection);
        console.log(`❌ Auto-rejected: ${result.gateName}`);
        
        return rejection;
    }
    
    /**
     * Store gate result
     */
    storeGateResult(gateId, result) {
        const key = `${gateId}_${Date.now()}`;
        // In a real implementation, this would store to database or file
        console.log(`📊 Stored quality gate result: ${key}`);
    }
    
    /**
     * Get quality gate information
     */
    getQualityGate(gateId) {
        return this.gates.get(gateId);
    }
    
    /**
     * Get all quality gates
     */
    getAllQualityGates() {
        return Array.from(this.gates.values());
    }
    
    /**
     * Update quality thresholds
     */
    updateQualityThresholds(gateId, thresholds) {
        const gate = this.gates.get(gateId);
        if (gate) {
            gate.thresholds = { ...gate.thresholds, ...thresholds };
            console.log(`⚙️ Updated thresholds for ${gate.name}`);
        }
    }
    
    /**
     * Enable/disable auto-approval
     */
    setAutoApproval(gateId, enabled) {
        const gate = this.gates.get(gateId);
        if (gate) {
            gate.autoApprove = enabled;
            console.log(`${enabled ? '✅' : '❌'} Auto-approval ${enabled ? 'enabled' : 'disabled'} for ${gate.name}`);
        }
    }
    
    /**
     * Enable/disable auto-rejection
     */
    setAutoRejection(gateId, enabled) {
        const gate = this.gates.get(gateId);
        if (gate) {
            gate.autoReject = enabled;
            console.log(`${enabled ? '✅' : '❌'} Auto-rejection ${enabled ? 'enabled' : 'disabled'} for ${gate.name}`);
        }
    }
    
    /**
     * Get approval statistics
     */
    getApprovalStats() {
        const totalApprovals = this.approvals.size;
        const totalRejections = this.rejections.size;
        const totalDecisions = totalApprovals + totalRejections;
        
        return {
            totalApprovals,
            totalRejections,
            totalDecisions,
            approvalRate: totalDecisions > 0 ? (totalApprovals / totalDecisions * 100).toFixed(1) : 0,
            rejectionRate: totalDecisions > 0 ? (totalRejections / totalDecisions * 100).toFixed(1) : 0
        };
    }
    
    /**
     * Get recent approvals
     */
    getRecentApprovals(limit = 10) {
        return Array.from(this.approvals.values())
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit);
    }
    
    /**
     * Get recent rejections
     */
    getRecentRejections(limit = 10) {
        return Array.from(this.rejections.values())
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit);
    }
    
    /**
     * Generate quality report
     */
    generateQualityReport() {
        const stats = this.getApprovalStats();
        const recentApprovals = this.getRecentApprovals(5);
        const recentRejections = this.getRecentRejections(5);
        
        return {
            summary: {
                totalGates: this.gates.size,
                activeGates: Array.from(this.gates.values()).filter(g => g.autoApprove || g.autoReject).length,
                ...stats
            },
            gates: this.getAllQualityGates(),
            recentActivity: {
                approvals: recentApprovals,
                rejections: recentRejections
            },
            recommendations: this.generateSystemRecommendations()
        };
    }
    
    /**
     * Generate system recommendations
     */
    generateSystemRecommendations() {
        const recommendations = [];
        const stats = this.getApprovalStats();
        
        if (parseFloat(stats.approvalRate) < 70) {
            recommendations.push({
                priority: 'HIGH',
                message: 'Low approval rate detected',
                action: 'Review quality thresholds and improve output quality'
            });
        }
        
        if (parseFloat(stats.rejectionRate) > 30) {
            recommendations.push({
                priority: 'MEDIUM',
                message: 'High rejection rate detected',
                action: 'Consider adjusting thresholds or improving model selection'
            });
        }
        
        const inactiveGates = Array.from(this.gates.values()).filter(g => !g.autoApprove && !g.autoReject);
        if (inactiveGates.length > 0) {
            recommendations.push({
                priority: 'LOW',
                message: `${inactiveGates.length} quality gates are inactive`,
                action: 'Consider enabling auto-approval or rejection for better quality control'
            });
        }
        
        return recommendations;
    }
}

module.exports = AutomatedQualityGates; 