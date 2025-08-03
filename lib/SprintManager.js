// SprintManager.js - Comprehensive Sprint Management System
// Part of Team Leader System v4.0

/**
 * SprintManager - Manages sprint lifecycle, planning, demos, and retrospectives
 * 
 * Features:
 * - Sprint planning with goal setting and feature allocation
 * - Progress tracking with real-time updates
 * - Demo management with staging deployment
 * - Quality gate enforcement
 * - Automated retrospectives
 * - Sprint velocity and burndown tracking
 */

class SprintManager {
    constructor(teamLeaderSystem) {
        this.system = teamLeaderSystem;
        this.projectPath = teamLeaderSystem.projectName;
        this.fs = typeof window !== 'undefined' ? window.fs : require('fs').promises;
        
        // Sprint configuration
        this.sprintConfig = {
            duration: 3, // days
            totalSprints: 6,
            currentSprint: 0,
            sprintStartDate: null,
            sprintEndDate: null
        };
        
        // Sprint data structures
        this.sprints = new Map();
        this.currentSprintData = null;
        this.sprintHistory = [];
        
        // Sprint templates
        this.templates = {
            sprintPlan: this.getSprintPlanTemplate(),
            demoScript: this.getDemoScriptTemplate(),
            retrospective: this.getRetrospectiveTemplate(),
            velocityReport: this.getVelocityTemplate()
        };
        
        // Quality gates
        this.qualityGates = {
            testCoverage: 95,
            criticalBugs: 0,
            performanceTarget: 2000, // ms
            securityVulnerabilities: 0,
            demoDeployed: true,
            userApproval: true
        };
        
        // Demo configuration
        this.demoConfig = {
            stagingUrl: null,
            demoData: {},
            recordings: []
        };
        
        console.log("🏃 Sprint Manager initialized");
    }
    
    /**
     * Load sprint history from files
     */
    async loadSprintHistory() {
        try {
            console.log("📚 Loading sprint history...");
            
            // For now, just initialize empty sprint history
            // In a full implementation, this would load from files
            this.sprintHistory = new Map();
            this.sprintConfig = {
                currentSprint: 0,
                totalSprints: 0,
                duration: 14, // 2 weeks
                teamSize: 4
            };
            
            console.log("✅ Sprint history loaded");
            return true;
        } catch (error) {
            console.log("⚠️  Could not load sprint history, starting fresh");
            this.sprintHistory = new Map();
            this.sprintConfig = {
                currentSprint: 0,
                totalSprints: 0,
                duration: 14,
                teamSize: 4
            };
            return true;
        }
    }

    /**
     * Initialize sprint management
     */
    async initialize() {
        await this.createSprintDirectories();
        await this.loadSprintHistory();
        
        // Set initial sprint if needed
        if (this.system.currentSprint === 0) {
            await this.planSprint(1);
        }
        
        return {
            success: true,
            currentSprint: this.sprintConfig.currentSprint,
            totalSprints: this.sprintConfig.totalSprints
        };
    }
    
    /**
     * Plan a new sprint
     */
    async planSprint(sprintNumber, config = {}) {
        console.log(`\n📅 Planning Sprint ${sprintNumber}...`);
        
        const sprint = {
            number: sprintNumber,
            name: config.name || `Sprint ${sprintNumber}`,
            goal: config.goal || '',
            startDate: new Date().toISOString(),
            endDate: this.calculateEndDate(new Date(), this.sprintConfig.duration),
            status: 'planning',
            
            // Sprint planning
            planning: {
                goals: config.goals || [],
                features: config.features || [],
                userStories: config.userStories || [],
                teamAllocations: config.teams || {},
                dependencies: config.dependencies || [],
                risks: config.risks || []
            },
            
            // Sprint execution
            execution: {
                startedAt: null,
                progress: 0,
                completedFeatures: [],
                blockers: [],
                dailyUpdates: []
            },
            
            // Sprint metrics
            metrics: {
                plannedPoints: 0,
                completedPoints: 0,
                velocity: 0,
                burndown: [],
                teamPerformance: {}
            },
            
            // Demo details
            demo: {
                scheduled: this.calculateDemoDate(this.calculateEndDate(new Date(), this.sprintConfig.duration)),
                deployed: false,
                stagingUrl: null,
                script: null,
                feedback: [],
                recording: null
            },
            
            // Quality metrics
            quality: {
                testCoverage: 0,
                bugs: { critical: 0, high: 0, medium: 0, low: 0 },
                performance: { target: 2000, actual: null },
                security: { vulnerabilities: 0, lastScan: null }
            },
            
            // Retrospective
            retrospective: {
                conducted: false,
                date: null,
                successes: [],
                improvements: [],
                actionItems: [],
                lessonsLearned: []
            }
        };
        
        // Calculate story points
        sprint.metrics.plannedPoints = this.calculateStoryPoints(sprint.planning.userStories);
        
        // Save sprint plan
        this.sprints.set(sprintNumber, sprint);
        this.currentSprintData = sprint;
        this.sprintConfig.currentSprint = sprintNumber;
        
        // Create sprint files
        await this.saveSprintPlan(sprint);
        
        // Notify teams
        await this.notifyTeamsOfSprintPlan(sprint);
        
        console.log(`✅ Sprint ${sprintNumber} planned successfully`);
        
        return sprint;
    }
    
    /**
     * Start sprint execution
     */
    async startSprint(sprintNumber) {
        const sprint = this.sprints.get(sprintNumber);
        if (!sprint) {
            throw new Error(`Sprint ${sprintNumber} not found`);
        }
        
        console.log(`\n🚀 Starting Sprint ${sprintNumber}: ${sprint.name}`);
        
        sprint.status = 'active';
        sprint.execution.startedAt = new Date().toISOString();
        this.sprintConfig.sprintStartDate = sprint.execution.startedAt;
        
        // Activate teams for sprint features
        await this.activateSprintTeams(sprint);
        
        // Initialize burndown tracking
        this.initializeBurndown(sprint);
        
        // Set up daily standup schedule
        this.scheduleDailyStandups(sprint);
        
        // Update dashboard
        if (this.system.dashboard) {
            await this.system.dashboard.updateSprintInfo({
                current: sprintNumber,
                total: this.sprintConfig.totalSprints,
                progress: 0,
                status: 'active'
            });
        }
        
        // Save updated sprint
        await this.saveSprintStatus(sprint);
        
        return {
            success: true,
            sprint: sprintNumber,
            status: 'active',
            endDate: sprint.endDate
        };
    }
    
    /**
     * Update sprint progress
     */
    async updateSprintProgress(updates) {
        const sprint = this.currentSprintData;
        if (!sprint || sprint.status !== 'active') {
            console.error("No active sprint to update");
            return;
        }
        
        // Update completed features
        if (updates.completedFeature) {
            sprint.execution.completedFeatures.push({
                feature: updates.completedFeature,
                completedAt: new Date().toISOString(),
                team: updates.team
            });
            
            // Update metrics
            const completedPoints = this.calculateCompletedPoints(sprint);
            sprint.metrics.completedPoints = completedPoints;
            sprint.metrics.velocity = completedPoints / this.getSprintDaysElapsed(sprint);
        }
        
        // Update blockers
        if (updates.blocker) {
            sprint.execution.blockers.push({
                issue: updates.blocker,
                team: updates.team,
                reportedAt: new Date().toISOString(),
                impact: updates.impact || 'medium'
            });
        }
        
        // Update quality metrics
        if (updates.quality) {
            Object.assign(sprint.quality, updates.quality);
        }
        
        // Calculate overall progress
        sprint.execution.progress = this.calculateSprintProgress(sprint);
        
        // Update burndown
        this.updateBurndown(sprint);
        
        // Save status
        await this.saveSprintStatus(sprint);
        
        // Update dashboard
        if (this.system.dashboard) {
            await this.system.dashboard.updateSprintProgress(sprint.execution.progress);
        }
        
        // Check if sprint is complete
        if (sprint.execution.progress >= 100) {
            await this.prepareSprintCompletion(sprint);
        }
        
        return {
            progress: sprint.execution.progress,
            velocity: sprint.metrics.velocity,
            blockers: sprint.execution.blockers.length
        };
    }
    
    /**
     * Prepare sprint demo
     */
    async prepareDemo(sprintNumber) {
        const sprint = this.sprints.get(sprintNumber);
        if (!sprint) {
            throw new Error(`Sprint ${sprintNumber} not found`);
        }
        
        console.log(`\n🎭 Preparing demo for Sprint ${sprintNumber}...`);
        
        // Deploy to staging
        const deployment = await this.deployToStaging(sprint);
        sprint.demo.deployed = deployment.success;
        sprint.demo.stagingUrl = deployment.url;
        
        // Generate demo script
        const script = await this.generateDemoScript(sprint);
        sprint.demo.script = script;
        
        // Prepare demo data
        await this.prepareDemoData(sprint);
        
        // Run quality checks
        const qualityCheck = await this.runDemoQualityChecks(sprint);
        
        // Save demo artifacts
        await this.saveDemoArtifacts(sprint);
        
        // Notify stakeholders
        await this.notifyDemoReady(sprint);
        
        console.log(`✅ Demo prepared: ${sprint.demo.stagingUrl}`);
        
        return {
            success: true,
            demoUrl: sprint.demo.stagingUrl,
            script: script.path,
            qualityPassed: qualityCheck.passed
        };
    }
    
    /**
     * Conduct sprint demo
     */
    async conductDemo(sprintNumber, feedback = {}) {
        const sprint = this.sprints.get(sprintNumber);
        if (!sprint) {
            throw new Error(`Sprint ${sprintNumber} not found`);
        }
        
        console.log(`\n🎬 Conducting Sprint ${sprintNumber} demo...`);
        
        const demoResult = {
            conductedAt: new Date().toISOString(),
            attendees: feedback.attendees || [],
            feedback: feedback.comments || [],
            issues: feedback.issues || [],
            approval: feedback.approved || false,
            recording: feedback.recordingUrl || null
        };
        
        sprint.demo = { ...sprint.demo, ...demoResult };
        
        // Process feedback
        if (feedback.issues && feedback.issues.length > 0) {
            await this.createDemoIssues(sprint, feedback.issues);
        }
        
        // Update sprint status based on demo
        if (demoResult.approval) {
            sprint.status = 'demo-approved';
            console.log("✅ Demo approved!");
        } else {
            sprint.status = 'demo-revision';
            console.log("🔄 Demo requires revisions");
        }
        
        // Save demo results
        await this.saveDemoResults(sprint);
        
        return {
            success: true,
            approved: demoResult.approval,
            issueCount: demoResult.issues.length,
            nextSteps: demoResult.approval ? 'proceed-to-retrospective' : 'address-feedback'
        };
    }
    
    /**
     * Complete sprint with quality checks
     */
    async completeSprint(sprintNumber) {
        const sprint = this.sprints.get(sprintNumber);
        if (!sprint) {
            throw new Error(`Sprint ${sprintNumber} not found`);
        }
        
        console.log(`\n🏁 Completing Sprint ${sprintNumber}...`);
        
        // Run final quality gates
        const qualityResults = await this.runQualityGates(sprint);
        
        if (!qualityResults.passed) {
            console.error("❌ Quality gates failed:");
            qualityResults.failures.forEach(f => console.error(`  - ${f}`));
            return {
                success: false,
                reason: 'quality-gates-failed',
                failures: qualityResults.failures
            };
        }
        
        // Calculate final metrics
        sprint.metrics.velocity = sprint.metrics.completedPoints / this.sprintConfig.duration;
        sprint.execution.progress = 100;
        sprint.status = 'completed';
        sprint.completedAt = new Date().toISOString();
        
        // Archive sprint artifacts
        await this.archiveSprintArtifacts(sprint);
        
        // Update sprint history
        this.sprintHistory.push({
            number: sprint.number,
            name: sprint.name,
            velocity: sprint.metrics.velocity,
            completedPoints: sprint.metrics.completedPoints,
            quality: sprint.quality,
            completedAt: sprint.completedAt
        });
        
        // Save final sprint state
        await this.saveSprintCompletion(sprint);
        
        console.log(`✅ Sprint ${sprintNumber} completed successfully!`);
        console.log(`📊 Velocity: ${sprint.metrics.velocity.toFixed(1)} points/day`);
        
        return {
            success: true,
            velocity: sprint.metrics.velocity,
            completedPoints: sprint.metrics.completedPoints,
            nextSprint: sprintNumber + 1
        };
    }
    
    /**
     * Conduct sprint retrospective
     */
    async conductRetrospective(sprintNumber, input = {}) {
        const sprint = this.sprints.get(sprintNumber);
        if (!sprint) {
            throw new Error(`Sprint ${sprintNumber} not found`);
        }
        
        console.log(`\n🔄 Conducting Sprint ${sprintNumber} retrospective...`);
        
        // Collect team feedback
        const teamFeedback = await this.collectTeamFeedback(sprint);
        
        // Analyze sprint metrics
        const analysis = this.analyzeSprintMetrics(sprint);
        
        // Generate retrospective
        const retrospective = {
            conducted: true,
            date: new Date().toISOString(),
            
            successes: [
                ...teamFeedback.successes,
                ...(input.successes || []),
                ...analysis.successes
            ],
            
            improvements: [
                ...teamFeedback.improvements,
                ...(input.improvements || []),
                ...analysis.improvements
            ],
            
            actionItems: this.generateActionItems(teamFeedback, analysis, input),
            
            lessonsLearned: this.extractLessonsLearned(sprint, teamFeedback, analysis),
            
            metrics: {
                velocity: sprint.metrics.velocity,
                completedVsPlanned: `${sprint.metrics.completedPoints}/${sprint.metrics.plannedPoints}`,
                qualityScore: this.calculateQualityScore(sprint),
                teamSatisfaction: teamFeedback.satisfaction || 0
            }
        };
        
        sprint.retrospective = retrospective;
        
        // Save retrospective
        await this.saveRetrospective(sprint);
        
        // Apply lessons learned
        await this.applyLessonsLearned(retrospective.lessonsLearned);
        
        // Create action items for next sprint
        await this.createActionItems(retrospective.actionItems);
        
        console.log(`✅ Retrospective completed with ${retrospective.actionItems.length} action items`);
        
        return retrospective;
    }
    
    /**
     * Run quality gates
     */
    async runQualityGates(sprint) {
        const results = {
            passed: true,
            failures: [],
            details: {}
        };
        
        // Test coverage check
        if (sprint.quality.testCoverage < this.qualityGates.testCoverage) {
            results.passed = false;
            results.failures.push(`Test coverage ${sprint.quality.testCoverage}% < ${this.qualityGates.testCoverage}%`);
        }
        
        // Critical bugs check
        if (sprint.quality.bugs.critical > this.qualityGates.criticalBugs) {
            results.passed = false;
            results.failures.push(`Critical bugs: ${sprint.quality.bugs.critical} > ${this.qualityGates.criticalBugs}`);
        }
        
        // Performance check
        if (sprint.quality.performance.actual && sprint.quality.performance.actual > this.qualityGates.performanceTarget) {
            results.passed = false;
            results.failures.push(`Performance ${sprint.quality.performance.actual}ms > ${this.qualityGates.performanceTarget}ms`);
        }
        
        // Security check
        if (sprint.quality.security.vulnerabilities > this.qualityGates.securityVulnerabilities) {
            results.passed = false;
            results.failures.push(`Security vulnerabilities: ${sprint.quality.security.vulnerabilities}`);
        }
        
        // Demo deployment check
        if (this.qualityGates.demoDeployed && !sprint.demo.deployed) {
            results.passed = false;
            results.failures.push("Demo not deployed to staging");
        }
        
        // User approval check
        if (this.qualityGates.userApproval && !sprint.demo.approval) {
            results.passed = false;
            results.failures.push("User approval not received");
        }
        
        results.details = {
            testCoverage: sprint.quality.testCoverage,
            bugs: sprint.quality.bugs,
            performance: sprint.quality.performance,
            security: sprint.quality.security,
            demo: { deployed: sprint.demo.deployed, approved: sprint.demo.approval }
        };
        
        return results;
    }
    
    /**
     * Get sprint velocity trends
     */
    getVelocityTrends() {
        const trends = {
            average: 0,
            trend: 'stable', // improving, declining, stable
            data: []
        };
        
        if (this.sprintHistory.length === 0) {
            return trends;
        }
        
        // Calculate average velocity
        const velocities = this.sprintHistory.map(s => s.velocity);
        trends.average = velocities.reduce((a, b) => a + b, 0) / velocities.length;
        
        // Prepare chart data
        trends.data = this.sprintHistory.map(s => ({
            sprint: s.number,
            velocity: s.velocity,
            points: s.completedPoints
        }));
        
        // Determine trend
        if (velocities.length > 2) {
            const recent = velocities.slice(-3);
            const older = velocities.slice(-6, -3);
            const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
            const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
            
            if (recentAvg > olderAvg * 1.1) trends.trend = 'improving';
            else if (recentAvg < olderAvg * 0.9) trends.trend = 'declining';
        }
        
        return trends;
    }
    
    /**
     * Generate sprint report
     */
    async generateSprintReport(sprintNumber, format = 'markdown') {
        const sprint = this.sprints.get(sprintNumber);
        if (!sprint) {
            throw new Error(`Sprint ${sprintNumber} not found`);
        }
        
        console.log(`\n📊 Generating Sprint ${sprintNumber} report...`);
        
        const report = {
            sprint: sprint.number,
            name: sprint.name,
            duration: `${sprint.startDate} to ${sprint.endDate}`,
            status: sprint.status,
            
            goals: {
                planned: sprint.planning.goals,
                achieved: sprint.execution.completedFeatures
            },
            
            metrics: {
                velocity: sprint.metrics.velocity,
                pointsCompleted: sprint.metrics.completedPoints,
                pointsPlanned: sprint.metrics.plannedPoints,
                completionRate: `${Math.round((sprint.metrics.completedPoints / sprint.metrics.plannedPoints) * 100)}%`
            },
            
            quality: sprint.quality,
            
            demo: {
                conducted: sprint.demo.conductedAt ? true : false,
                approved: sprint.demo.approval,
                feedbackItems: sprint.demo.feedback.length
            },
            
            retrospective: sprint.retrospective.conducted ? {
                successes: sprint.retrospective.successes.length,
                improvements: sprint.retrospective.improvements.length,
                actionItems: sprint.retrospective.actionItems.length
            } : null,
            
            blockers: sprint.execution.blockers,
            
            teamPerformance: this.calculateTeamPerformance(sprint)
        };
        
        // Generate formatted report
        let formattedReport;
        switch (format) {
            case 'markdown':
                formattedReport = this.formatSprintReportMarkdown(report);
                break;
            case 'html':
                formattedReport = this.formatSprintReportHTML(report);
                break;
            case 'json':
                formattedReport = JSON.stringify(report, null, 2);
                break;
            default:
                formattedReport = this.formatSprintReportMarkdown(report);
        }
        
        // Save report
        const filename = `sprint_${sprintNumber}_report_${this.getTimestamp()}.${format === 'markdown' ? 'md' : format}`;
        const reportPath = `${this.projectPath}/sprints/sprint-${sprintNumber}/reports/${filename}`;
        await this.fs.writeFile(reportPath, formattedReport);
        
        console.log(`✅ Report generated: ${reportPath}`);
        
        return {
            report,
            path: reportPath
        };
    }
    
    /**
     * Helper: Deploy to staging
     */
    async deployToStaging(sprint) {
        // This would integrate with your deployment system
        console.log("🚀 Deploying to staging environment...");
        
        // Simulate deployment
        const deployment = {
            success: true,
            url: `https://staging.${this.projectPath}.demo/sprint-${sprint.number}`,
            deployedAt: new Date().toISOString(),
            version: `sprint-${sprint.number}-${Date.now()}`
        };
        
        // In real implementation, this would:
        // 1. Build the application
        // 2. Run tests
        // 3. Deploy to staging server
        // 4. Run smoke tests
        // 5. Return deployment details
        
        return deployment;
    }
    
    /**
     * Helper: Generate demo script
     */
    async generateDemoScript(sprint) {
        const script = {
            title: `Sprint ${sprint.number} Demo Script`,
            date: sprint.demo.scheduled,
            duration: '30 minutes',
            
            agenda: [
                {
                    time: '0-5 min',
                    topic: 'Sprint Overview',
                    presenter: 'Team Leader',
                    content: [
                        `Sprint goal: ${sprint.goal}`,
                        `Duration: ${this.sprintConfig.duration} days`,
                        `Team members: ${Object.keys(sprint.planning.teamAllocations).length} teams`
                    ]
                },
                {
                    time: '5-20 min',
                    topic: 'Feature Demonstrations',
                    presenter: 'Development Team',
                    content: sprint.execution.completedFeatures.map(f => ({
                        feature: f.feature,
                        demo: `Show ${f.feature} functionality`,
                        acceptance: 'Verify acceptance criteria'
                    }))
                },
                {
                    time: '20-25 min',
                    topic: 'Metrics & Quality',
                    presenter: 'Validation Team',
                    content: [
                        `Test coverage: ${sprint.quality.testCoverage}%`,
                        `Performance: ${sprint.quality.performance.actual || 'TBD'}ms`,
                        `Security scan: ${sprint.quality.security.vulnerabilities} issues`
                    ]
                },
                {
                    time: '25-30 min',
                    topic: 'Q&A and Feedback',
                    presenter: 'All',
                    content: ['Questions', 'Feedback collection', 'Next steps']
                }
            ],
            
            demoFlow: this.generateDemoFlow(sprint),
            
            fallbacks: [
                'If feature X fails, show screenshots',
                'Have backup environment ready',
                'Prepare video recording as fallback'
            ]
        };
        
        // Save demo script
        const scriptPath = `${this.projectPath}/sprints/sprint-${sprint.number}/demo/demo-script.md`;
        await this.fs.writeFile(scriptPath, this.formatDemoScript(script));
        
        return { script, path: scriptPath };
    }
    
    /**
     * Helper: Calculate sprint progress
     */
    calculateSprintProgress(sprint) {
        if (sprint.metrics.plannedPoints === 0) return 0;
        
        const progress = (sprint.metrics.completedPoints / sprint.metrics.plannedPoints) * 100;
        return Math.min(Math.round(progress), 100);
    }
    
    /**
     * Helper: Initialize burndown chart
     */
    initializeBurndown(sprint) {
        const totalPoints = sprint.metrics.plannedPoints;
        const daysInSprint = this.sprintConfig.duration;
        const idealBurnRate = totalPoints / daysInSprint;
        
        sprint.metrics.burndown = [{
            day: 0,
            ideal: totalPoints,
            actual: totalPoints,
            date: sprint.startDate
        }];
        
        // Pre-populate ideal burndown
        for (let day = 1; day <= daysInSprint; day++) {
            sprint.metrics.burndown.push({
                day,
                ideal: totalPoints - (idealBurnRate * day),
                actual: null, // Will be filled in daily
                date: this.addDays(new Date(sprint.startDate), day).toISOString()
            });
        }
    }
    
    /**
     * Helper: Format sprint report as Markdown
     */
    formatSprintReportMarkdown(report) {
        return `# Sprint ${report.sprint} Report: ${report.name}

**Duration**: ${report.duration}  
**Status**: ${report.status}

## 📊 Sprint Metrics

| Metric | Value |
|--------|-------|
| Velocity | ${report.metrics.velocity.toFixed(1)} points/day |
| Points Completed | ${report.metrics.pointsCompleted} |
| Points Planned | ${report.metrics.pointsPlanned} |
| Completion Rate | ${report.metrics.completionRate} |

## 🎯 Goals Achievement

### Planned Goals
${report.goals.planned.map(g => `- ${g}`).join('\n')}

### Completed Features
${report.goals.achieved.map(f => `- ✅ ${f.feature} (${f.team})`).join('\n')}

## 🔍 Quality Metrics

- **Test Coverage**: ${report.quality.testCoverage}%
- **Critical Bugs**: ${report.quality.bugs.critical}
- **Performance**: ${report.quality.performance.actual || 'Not measured'}ms
- **Security Issues**: ${report.quality.security.vulnerabilities}

## 🎭 Demo Summary

- **Conducted**: ${report.demo.conducted ? 'Yes' : 'No'}
- **Approved**: ${report.demo.approved ? 'Yes' : 'No'}
- **Feedback Items**: ${report.demo.feedbackItems}

${report.retrospective ? `
## 🔄 Retrospective Summary

- **Successes**: ${report.retrospective.successes}
- **Areas for Improvement**: ${report.retrospective.improvements}
- **Action Items**: ${report.retrospective.actionItems}
` : ''}

## 🚧 Blockers Encountered

${report.blockers.length > 0 ? report.blockers.map(b => 
`- **${b.issue}** (${b.team}) - Impact: ${b.impact}`).join('\n') : 'No major blockers'}

## 👥 Team Performance

${Object.entries(report.teamPerformance).map(([team, perf]) => 
`### ${team}
- Features Completed: ${perf.featuresCompleted}
- Efficiency: ${perf.efficiency}
- Quality Score: ${perf.qualityScore}`).join('\n\n')}

---
*Generated on ${new Date().toLocaleString()}*`;
    }
    
    /**
     * Helper: Create sprint directories
     */
    async createSprintDirectories() {
        const dirs = [
            `${this.projectPath}/sprints`,
            `${this.projectPath}/sprints/templates`,
            `${this.projectPath}/sprints/history`
        ];
        
        // Create directories for each potential sprint
        for (let i = 0; i <= this.sprintConfig.totalSprints; i++) {
            dirs.push(
                `${this.projectPath}/sprints/sprint-${i}`,
                `${this.projectPath}/sprints/sprint-${i}/plan`,
                `${this.projectPath}/sprints/sprint-${i}/deliverables`,
                `${this.projectPath}/sprints/sprint-${i}/demo`,
                `${this.projectPath}/sprints/sprint-${i}/retrospective`,
                `${this.projectPath}/sprints/sprint-${i}/reports`
            );
        }
        
        for (const dir of dirs) {
            try {
                await this.fs.mkdir(dir, { recursive: true });
            } catch (error) {
                // Directory might already exist
            }
        }
    }
    
    /**
     * Helper: Get timestamp
     */
    getTimestamp() {
        return new Date().toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '-');
    }
    
    /**
     * Helper: Calculate end date
     */
    calculateEndDate(startDate, days) {
        const end = new Date(startDate);
        end.setDate(end.getDate() + days);
        return end.toISOString();
    }
    
    /**
     * Helper: Calculate demo date
     */
    calculateDemoDate(endDate) {
        // Demo on last day of sprint
        return endDate;
    }
    
    /**
     * Helper: Add days to date
     */
    addDays(date, days) {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }
    
    /**
     * Helper: Calculate story points
     */
    calculateStoryPoints(stories) {
        if (!stories || stories.length === 0) return 0;
        return stories.reduce((sum, story) => sum + (story.points || 0), 0);
    }
    
    /**
     * Get sprint plan template
     */
    getSprintPlanTemplate() {
        return {
            sections: ['goals', 'features', 'teams', 'risks', 'dependencies'],
            format: 'structured'
        };
    }
    
    /**
     * Get demo script template
     */
    getDemoScriptTemplate() {
        return {
            sections: ['overview', 'features', 'metrics', 'qa'],
            duration: 30
        };
    }
    
    /**
     * Get retrospective template
     */
    getRetrospectiveTemplate() {
        return {
            sections: ['successes', 'improvements', 'actions', 'metrics'],
            format: 'collaborative'
        };
    }
    
    /**
     * Get velocity template
     */
    getVelocityTemplate() {
        return {
            metrics: ['velocity', 'completion', 'quality', 'satisfaction'],
            format: 'dashboard'
        };
    }
}

// Export for use in Team Leader System
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SprintManager;
}

// Make available globally in browser/Claude Code
if (typeof window !== 'undefined') {
    window.SprintManager = SprintManager;
}

// Usage example
console.log("🏃 Sprint Manager loaded!");
console.log("\nExample usage:");
console.log("const sprintManager = new SprintManager(teamLeaderSystem);");
console.log("await sprintManager.initialize();");
console.log("await sprintManager.planSprint(1, {");
console.log("  goal: 'Build authentication system',");
console.log("  features: ['Login', 'Registration', 'Password Reset'],");
console.log("  userStories: [{ title: 'User can login', points: 5 }]");
console.log("});");
console.log("await sprintManager.startSprint(1);");
console.log("await sprintManager.prepareDemo(1);");
