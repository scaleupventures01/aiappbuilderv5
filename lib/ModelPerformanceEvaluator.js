// Model Performance Evaluator
// Comprehensive testing and evaluation of model performance

const QualityAssurance = require('./QualityAssurance');
const CostReporter = require('./CostReporter');

class ModelPerformanceEvaluator {
    constructor() {
        this.qa = new QualityAssurance();
        this.costReporter = new CostReporter();
        this.evaluationResults = new Map();
        this.testSuites = {
            'o4-mini': {
                name: 'OpenAI o4-mini',
                tests: [
                    { name: 'Code Generation', prompt: 'Write a Python function to sort a list of dictionaries by a specific key' },
                    { name: 'Text Analysis', prompt: 'Analyze the sentiment of this text: "I love this new product, it works perfectly!"' },
                    { name: 'Problem Solving', prompt: 'Solve this math problem: If a train travels 120 km in 2 hours, what is its speed in km/h?' },
                    { name: 'Creative Writing', prompt: 'Write a short story about a robot learning to paint' },
                    { name: 'Technical Documentation', prompt: 'Write API documentation for a REST endpoint that creates a user' }
                ]
            },
            'gemini-ultra': {
                name: 'Google Gemini Ultra',
                tests: [
                    { name: 'Code Generation', prompt: 'Write a Python function to sort a list of dictionaries by a specific key' },
                    { name: 'Text Analysis', prompt: 'Analyze the sentiment of this text: "I love this new product, it works perfectly!"' },
                    { name: 'Problem Solving', prompt: 'Solve this math problem: If a train travels 120 km in 2 hours, what is its speed in km/h?' },
                    { name: 'Creative Writing', prompt: 'Write a short story about a robot learning to paint' },
                    { name: 'Technical Documentation', prompt: 'Write API documentation for a REST endpoint that creates a user' }
                ]
            },
            'deepseek-v3': {
                name: 'DeepSeek V3',
                tests: [
                    { name: 'Code Generation', prompt: 'Write a Python function to sort a list of dictionaries by a specific key' },
                    { name: 'Text Analysis', prompt: 'Analyze the sentiment of this text: "I love this new product, it works perfectly!"' },
                    { name: 'Problem Solving', prompt: 'Solve this math problem: If a train travels 120 km in 2 hours, what is its speed in km/h?' },
                    { name: 'Creative Writing', prompt: 'Write a short story about a robot learning to paint' },
                    { name: 'Technical Documentation', prompt: 'Write API documentation for a REST endpoint that creates a user' }
                ]
            }
        };
    }
    
    /**
     * Run comprehensive evaluation for a specific model
     */
    async evaluateModel(modelId, iterations = 5) {
        console.log(`🧪 Evaluating ${modelId} performance...\n`);
        
        const testSuite = this.testSuites[modelId];
        if (!testSuite) {
            throw new Error(`No test suite found for model: ${modelId}`);
        }
        
        const evaluation = {
            modelId,
            modelName: testSuite.name,
            timestamp: new Date().toISOString(),
            iterations,
            results: {},
            summary: {},
            recommendations: []
        };
        
        // Run tests for each category
        for (const test of testSuite.tests) {
            console.log(`📝 Testing: ${test.name}`);
            
            const testResults = [];
            const startTime = Date.now();
            
            for (let i = 0; i < iterations; i++) {
                const result = await this.runSingleTest(modelId, test.prompt, test.name);
                testResults.push(result);
            }
            
            const endTime = Date.now();
            const avgTime = (endTime - startTime) / iterations;
            
            evaluation.results[test.name] = {
                prompt: test.prompt,
                iterations: testResults,
                averageScore: this.calculateAverage(testResults.map(r => r.score)),
                averageTime: avgTime,
                consistency: this.calculateConsistency(testResults.map(r => r.score)),
                cost: this.calculateAverage(testResults.map(r => r.cost))
            };
        }
        
        // Calculate overall summary
        evaluation.summary = this.calculateSummary(evaluation.results);
        
        // Generate recommendations
        evaluation.recommendations = this.generateRecommendations(evaluation);
        
        // Store results
        this.evaluationResults.set(modelId, evaluation);
        
        // Generate report
        const report = this.generateEvaluationReport(evaluation);
        
        console.log('\n' + '='.repeat(60));
        console.log(`📊 ${modelId.toUpperCase()} EVALUATION RESULTS`);
        console.log('='.repeat(60));
        console.log(report);
        
        return evaluation;
    }
    
    /**
     * Run a single test
     */
    async runSingleTest(modelId, prompt, testType) {
        try {
            const startTime = Date.now();
            
            // Simulate API call (in real implementation, this would call the actual model)
            const response = await this.simulateModelCall(modelId, prompt);
            const endTime = Date.now();
            
            // Evaluate response quality
            const qualityScore = await this.qa.evaluateOutput(response, this.mapTestTypeToTaskType(testType));
            
            // Calculate cost (simulated)
            const cost = this.calculateCost(modelId, prompt.length, response.length);
            
            return {
                prompt,
                response,
                score: qualityScore.overall,
                time: endTime - startTime,
                cost,
                qualityMetrics: qualityScore.metrics
            };
            
        } catch (error) {
            console.error(`Error in test ${testType}:`, error.message);
            return {
                prompt,
                response: null,
                score: 0,
                time: 0,
                cost: 0,
                error: error.message
            };
        }
    }
    
    /**
     * Simulate model API call
     */
    async simulateModelCall(modelId, prompt) {
        // Simulate different response characteristics based on model
        const modelCharacteristics = {
            'o4-mini': {
                baseQuality: 0.92,
                speed: 800, // ms
                creativity: 0.85,
                accuracy: 0.94
            },
            'gemini-ultra': {
                baseQuality: 0.95,
                speed: 1200,
                creativity: 0.90,
                accuracy: 0.96
            },
            'deepseek-v3': {
                baseQuality: 0.93,
                speed: 600,
                creativity: 0.88,
                accuracy: 0.95
            }
        };
        
        const characteristics = modelCharacteristics[modelId] || modelCharacteristics['o4-mini'];
        
        // Simulate response time
        await new Promise(resolve => setTimeout(resolve, characteristics.speed + Math.random() * 200));
        
        // Generate simulated response
        const responseLength = prompt.length * (0.8 + Math.random() * 0.4);
        const response = `This is a simulated response from ${modelId} for the prompt: "${prompt.substring(0, 50)}...". The response demonstrates the model's capabilities in generating relevant and coherent content.`;
        
        return response;
    }
    
    /**
     * Map test type to task type for quality evaluation
     */
    mapTestTypeToTaskType(testType) {
        const mapping = {
            'Code Generation': 'code-generation',
            'Text Analysis': 'analysis',
            'Problem Solving': 'analysis',
            'Creative Writing': 'content-creation',
            'Technical Documentation': 'content-creation'
        };
        
        return mapping[testType] || 'analysis';
    }
    
    /**
     * Calculate cost for a response
     */
    calculateCost(modelId, inputTokens, outputTokens) {
        const pricing = {
            'o4-mini': { input: 0.00015, output: 0.0006 }, // $0.15/$0.60 per 1K tokens
            'gemini-ultra': { input: 0.000375, output: 0.001125 }, // $0.375/$1.125 per 1K tokens
            'deepseek-v3': { input: 0.00014, output: 0.00028 } // $0.14/$0.28 per 1K tokens
        };
        
        const modelPricing = pricing[modelId] || pricing['o4-mini'];
        
        const inputCost = (inputTokens / 1000) * modelPricing.input;
        const outputCost = (outputTokens / 1000) * modelPricing.output;
        
        return inputCost + outputCost;
    }
    
    /**
     * Calculate average
     */
    calculateAverage(values) {
        return values.reduce((sum, val) => sum + val, 0) / values.length;
    }
    
    /**
     * Calculate consistency (inverse of standard deviation)
     */
    calculateConsistency(values) {
        const mean = this.calculateAverage(values);
        const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
        const variance = this.calculateAverage(squaredDiffs);
        const stdDev = Math.sqrt(variance);
        
        return Math.max(0, 1 - stdDev);
    }
    
    /**
     * Calculate summary statistics
     */
    calculateSummary(results) {
        const allScores = [];
        const allTimes = [];
        const allCosts = [];
        
        for (const testResult of Object.values(results)) {
            allScores.push(testResult.averageScore);
            allTimes.push(testResult.averageTime);
            allCosts.push(testResult.cost);
        }
        
        return {
            overallScore: this.calculateAverage(allScores),
            averageResponseTime: this.calculateAverage(allTimes),
            totalCost: allCosts.reduce((sum, cost) => sum + cost, 0),
            consistency: this.calculateConsistency(allScores),
            bestCategory: Object.keys(results).reduce((best, category) => 
                results[category].averageScore > results[best].averageScore ? category : best
            ),
            worstCategory: Object.keys(results).reduce((worst, category) => 
                results[category].averageScore < results[worst].averageScore ? category : worst
            )
        };
    }
    
    /**
     * Generate recommendations based on evaluation
     */
    generateRecommendations(evaluation) {
        const recommendations = [];
        const summary = evaluation.summary;
        
        // Performance recommendations
        if (summary.overallScore < 0.8) {
            recommendations.push({
                type: 'performance',
                priority: 'HIGH',
                message: 'Overall performance is below optimal threshold',
                action: 'Consider using this model only for specific tasks where it excels'
            });
        }
        
        if (summary.consistency < 0.7) {
            recommendations.push({
                type: 'consistency',
                priority: 'MEDIUM',
                message: 'Response consistency is low',
                action: 'Implement retry logic for critical applications'
            });
        }
        
        // Cost recommendations
        if (summary.totalCost > 0.1) {
            recommendations.push({
                type: 'cost',
                priority: 'MEDIUM',
                message: 'Cost per evaluation is high',
                action: 'Consider using for high-value tasks only'
            });
        }
        
        // Speed recommendations
        if (summary.averageResponseTime > 1000) {
            recommendations.push({
                type: 'speed',
                priority: 'MEDIUM',
                message: 'Response time is slow',
                action: 'Use for non-time-critical applications'
            });
        }
        
        // Category-specific recommendations
        const bestCategory = summary.bestCategory;
        const worstCategory = summary.worstCategory;
        
        recommendations.push({
            type: 'optimization',
            priority: 'LOW',
            message: `Model excels at ${bestCategory}`,
            action: `Prioritize this model for ${bestCategory} tasks`
        });
        
        recommendations.push({
            type: 'optimization',
            priority: 'LOW',
            message: `Model struggles with ${worstCategory}`,
            action: `Consider alternative models for ${worstCategory} tasks`
        });
        
        return recommendations;
    }
    
    /**
     * Generate evaluation report
     */
    generateEvaluationReport(evaluation) {
        const { modelName, summary, results, recommendations } = evaluation;
        
        return `
## 📊 Overall Performance Summary

**Model**: ${modelName}
**Overall Score**: ${(summary.overallScore * 100).toFixed(1)}%
**Average Response Time**: ${summary.averageResponseTime.toFixed(0)}ms
**Total Cost**: $${summary.totalCost.toFixed(4)}
**Consistency**: ${(summary.consistency * 100).toFixed(1)}%

## 🎯 Category Performance

| Category | Score | Time (ms) | Cost | Consistency |
|----------|-------|-----------|------|-------------|
${Object.entries(results).map(([category, result]) => 
`| ${category} | ${(result.averageScore * 100).toFixed(1)}% | ${result.averageTime.toFixed(0)} | $${result.cost.toFixed(4)} | ${(result.consistency * 100).toFixed(1)}% |`
).join('\n')}

## 🏆 Performance Analysis

**Best Category**: ${summary.bestCategory} (${(results[summary.bestCategory].averageScore * 100).toFixed(1)}%)
**Worst Category**: ${summary.worstCategory} (${(results[summary.worstCategory].averageScore * 100).toFixed(1)}%)

## 🎯 Recommendations

${recommendations.map((rec, index) => 
`${index + 1}. **${rec.type.toUpperCase()}** (${rec.priority} Priority)
   - ${rec.message}
   - Action: ${rec.action}`
).join('\n\n')}

## 💡 Usage Guidelines

- **Optimal Use Cases**: ${summary.bestCategory}
- **Avoid For**: ${summary.worstCategory}
- **Cost Efficiency**: ${summary.totalCost < 0.05 ? 'Excellent' : summary.totalCost < 0.1 ? 'Good' : 'Expensive'}
- **Speed Rating**: ${summary.averageResponseTime < 500 ? 'Fast' : summary.averageResponseTime < 1000 ? 'Moderate' : 'Slow'}
        `;
    }
    
    /**
     * Compare multiple models
     */
    async compareModels(modelIds, iterations = 3) {
        console.log(`🔍 Comparing ${modelIds.length} models...\n`);
        
        const comparisons = [];
        
        for (const modelId of modelIds) {
            const evaluation = await this.evaluateModel(modelId, iterations);
            comparisons.push(evaluation);
        }
        
        // Generate comparison report
        const comparisonReport = this.generateComparisonReport(comparisons);
        
        console.log('\n' + '='.repeat(60));
        console.log('🏆 MODEL COMPARISON RESULTS');
        console.log('='.repeat(60));
        console.log(comparisonReport);
        
        return comparisons;
    }
    
    /**
     * Generate comparison report
     */
    generateComparisonReport(comparisons) {
        return `
## 🏆 Model Rankings

| Rank | Model | Overall Score | Speed | Cost | Consistency |
|------|-------|---------------|-------|------|-------------|
${comparisons
    .sort((a, b) => b.summary.overallScore - a.summary.overallScore)
    .map((comp, index) => 
`| ${index + 1} | ${comp.modelName} | ${(comp.summary.overallScore * 100).toFixed(1)}% | ${comp.summary.averageResponseTime.toFixed(0)}ms | $${comp.summary.totalCost.toFixed(4)} | ${(comp.summary.consistency * 100).toFixed(1)}% |`
).join('\n')}

## 🎯 Best Model by Category

${this.getBestModelByCategory(comparisons)}

## 💰 Cost Analysis

${this.getCostAnalysis(comparisons)}

## ⚡ Speed Analysis

${this.getSpeedAnalysis(comparisons)}
        `;
    }
    
    /**
     * Get best model by category
     */
    getBestModelByCategory(comparisons) {
        const categories = ['Code Generation', 'Text Analysis', 'Problem Solving', 'Creative Writing', 'Technical Documentation'];
        const results = {};
        
        for (const category of categories) {
            let bestModel = null;
            let bestScore = 0;
            
            for (const comp of comparisons) {
                const score = comp.results[category]?.averageScore || 0;
                if (score > bestScore) {
                    bestScore = score;
                    bestModel = comp.modelName;
                }
            }
            
            results[category] = { model: bestModel, score: bestScore };
        }
        
        return Object.entries(results).map(([category, result]) => 
`**${category}**: ${result.model} (${(result.score * 100).toFixed(1)}%)`
).join('\n');
    }
    
    /**
     * Get cost analysis
     */
    getCostAnalysis(comparisons) {
        const sortedByCost = [...comparisons].sort((a, b) => a.summary.totalCost - b.summary.totalCost);
        
        return `**Most Cost-Effective**: ${sortedByCost[0].modelName} ($${sortedByCost[0].summary.totalCost.toFixed(4)})
**Most Expensive**: ${sortedByCost[sortedByCost.length - 1].modelName} ($${sortedByCost[sortedByCost.length - 1].summary.totalCost.toFixed(4)})`;
    }
    
    /**
     * Get speed analysis
     */
    getSpeedAnalysis(comparisons) {
        const sortedBySpeed = [...comparisons].sort((a, b) => a.summary.averageResponseTime - b.summary.averageResponseTime);
        
        return `**Fastest**: ${sortedBySpeed[0].modelName} (${sortedBySpeed[0].summary.averageResponseTime.toFixed(0)}ms)
**Slowest**: ${sortedBySpeed[sortedBySpeed.length - 1].modelName} (${sortedBySpeed[sortedBySpeed.length - 1].summary.averageResponseTime.toFixed(0)}ms)`;
    }
    
    /**
     * Get evaluation results
     */
    getEvaluationResults() {
        return Array.from(this.evaluationResults.values());
    }
    
    /**
     * Clear evaluation results
     */
    clearResults() {
        this.evaluationResults.clear();
    }
}

module.exports = ModelPerformanceEvaluator; 