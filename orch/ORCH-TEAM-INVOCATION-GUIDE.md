# ORCH Team Invocation Guide
## Complete Documentation for Agent Discovery and Invocation System

---

## 🎯 Purpose

This system ensures that when you request "whole team" or "all agents", the ORCH system will:
1. **Dynamically discover** all 34 available agents (excluding utility files)
2. **Verify completeness** to prevent missing critical perspectives
3. **Enforce safety checks** to ensure critical agents are always included
4. **Provide transparency** about what will be invoked
5. **Track and audit** all invocations for continuous improvement

---

## 📁 System Components

### 1. **orch-team-manifest.json**
- Complete registry of all 34 agents
- Defines agent domains, expertise, and dependencies
- Marks critical agents that must never be excluded
- Groups agents by domain for organized invocation

### 2. **orch-config.yaml**
- Configuration for discovery and invocation behavior
- Defines aliases (e.g., "whole team" = "all agents")
- Sets safety thresholds and confirmation requirements
- Contains invocation strategies and presets

### 3. **discover-agents.py**
- Dynamically scans `/orch/team/` directory
- Validates agent files and counts
- Generates invocation lists based on requests
- Ensures no agents are missed

### 4. **verify-invocation.py**
- Creates detailed invocation plans
- Checks for missing critical agents
- Estimates time and cost
- Tracks actual vs planned invocations
- Logs everything for audit

---

## 🚀 How It Works

### When You Say "Whole Team" or "All Agents"

1. **Discovery Phase**
   ```
   → System scans /orch/team/ directory
   → Finds 35 files total
   → Excludes "rca-10-whys-prompt.md" (utility file)
   → Confirms 34 valid agents
   ```

2. **Validation Phase**
   ```
   → Checks all critical agents are included:
     • AI Safety Engineer ✓
     • Privacy Engineer ✓
     • CISO ✓
     • Security Architect ✓
     • Business Analyst ✓
     • Project Manager ✓
   ```

3. **Planning Phase**
   ```
   → Groups agents by domain
   → Estimates 17-20 minutes for full team
   → Calculates ~$3.40 cost
   → Prepares confirmation prompt
   ```

4. **Confirmation Phase**
   ```
   🔍 Agent Invocation Plan
   ━━━━━━━━━━━━━━━━━━━━━
   Agents to invoke: 34 agents
   Estimated time: 20 minutes
   Critical agents included: ✓
   
   Proceed? [Y/n]
   ```

5. **Execution Phase**
   ```
   → Invokes agents in parallel batches
   → Shows progress updates
   → Tracks any failures
   → Logs everything
   ```

6. **Verification Phase**
   ```
   → Confirms all 34 agents responded
   → Alerts if any were missed
   → Saves audit log
   ```

---

## 📋 Agent Groups and Domains

### Critical Safety & Security (6 agents)
**ALWAYS INCLUDED - NEVER OPTIONAL**
- AI Safety Engineer
- CISO
- Security Architect
- Application Security Engineer
- DevSecOps Engineer
- Privacy Engineer

### Leadership (4 agents)
- CTO
- VP Engineering
- VP Product
- Chief AI Officer

### Engineering (5 agents)
- Staff Engineer
- Backend Engineer
- Frontend Engineer
- Full-Stack Engineer
- AI Engineer

### ML/AI Specialists (5 agents)
- Machine Learning Engineer
- ML Research Scientist
- MLOps Engineer
- Data Scientist
- AI Engineer (shared with Engineering)

### Product (3 agents)
- Product Manager
- Technical Product Manager
- AI Product Manager

### Operations (3 agents)
- DevOps Engineer
- Site Reliability Engineer
- DevSecOps Engineer (shared with Security)

### Quality (2 agents)
- QA Engineer
- QA Automation Engineer

### Data (3 agents)
- Data Engineer
- Data Analyst
- Data Scientist (shared with ML/AI)

### Design (2 agents)
- UX/UI Designer
- UX Researcher

### Business (2 agents)
- Business Analyst
- Project Manager

---

## 🎭 Invocation Aliases

The system recognizes multiple ways to request teams:

### Full Team Invocations
- "whole team" → All 34 agents
- "everyone" → All 34 agents
- "full team" → All 34 agents
- "all agents" → All 34 agents
- "complete team" → All 34 agents
- "comprehensive review" → All 34 agents

### Specialized Invocations
- "security review" → 6 security agents
- "leadership review" → 4 executives
- "technical review" → Core engineering team
- "product review" → Product and design team
- "compliance check" → Privacy and security agents

---

## ⚠️ Safety Features

### 1. **Critical Agent Protection**
These agents are NEVER optional for a financial + mental health platform:
- AI Safety Engineer (prevents psychological harm)
- Privacy Engineer (GDPR/HIPAA compliance)
- CISO (security oversight)
- Security Architect (security design)
- Business Analyst (validates viability)
- Project Manager (prevents chaos)

### 2. **Confirmation Thresholds**
- **>10 agents**: Requires confirmation
- **>25 agents**: Requires double confirmation
- **>34 agents**: Shows time/cost warning

### 3. **Group Completeness**
If you include one security agent, the system suggests including all security agents to ensure complete coverage.

### 4. **Resource Warnings**
```
⚠️ Large invocation: 34 agents
⏰ Estimated time: 20 minutes
💰 Estimated cost: $3.40
```

---

## 📊 Verification Reports

After each invocation, the system provides:

```
📊 INVOCATION RESULT
════════════════════
✅ Invocation completed successfully!

Statistics:
• Planned: 34 agents
• Invoked: 34 agents
• Skipped: 0 agents
• Completion: 100%

Resources:
• Estimated time: 20.0 minutes
• Actual time: 18.5 minutes
```

---

## 🔧 Running the Scripts

### 1. Discovery Check
```bash
python3 /orch/scripts/discover-agents.py
```
This will:
- Count all agents
- Validate files
- Check for missing critical agents
- Save discovery cache

### 2. Invocation Verification
```bash
python3 /orch/scripts/verify-invocation.py
```
This will:
- Test various request types
- Show invocation plans
- Simulate invocations
- Generate audit logs

---

## 📝 Audit Trail

All invocations are logged to `/orch/logs/invocations/` with:
- Timestamp
- Request text
- Agents planned vs invoked
- Time and cost
- Any issues or warnings
- Completion rate

---

## 🚨 Common Issues and Solutions

### Issue: "Only 25 agents invoked instead of 34"
**Solution**: The system now dynamically discovers all agents and validates completeness.

### Issue: "Critical agents were missed"
**Solution**: System blocks invocation if critical agents are missing and shows clear warning.

### Issue: "Don't know how many agents exist"
**Solution**: Run discovery script to get current count and validate manifest.

### Issue: "Invocation taking too long"
**Solution**: System batches agents by domain and runs in parallel where possible.

---

## 🎯 Best Practices

1. **Always use dynamic discovery** - Never hardcode agent counts
2. **Verify before invoking** - Check the plan before confirming
3. **Monitor completeness** - Review audit logs for patterns
4. **Update manifest regularly** - When new agents are added
5. **Test with dry runs** - Use verification script to test

---

## 📈 Continuous Improvement

The system learns from each invocation:
- Tracks which agents are most valuable
- Identifies unnecessary invocations
- Suggests optimized agent groups
- Improves time estimates

---

## 🔄 When New Agents Are Added

1. Agent file is automatically discovered
2. Update `orch-team-manifest.json` with agent details
3. Assign to appropriate domain group
4. Mark as critical if necessary
5. Run discovery script to validate

---

## ✅ Success Criteria

You know the system is working when:
1. "Whole team" consistently invokes all 34 agents
2. Critical agents are never missed
3. You receive clear confirmations before large invocations
4. Audit logs show 100% completion rates
5. No more "only 25 agents" issues

---

## 📞 Support

If you encounter issues:
1. Run the discovery script to validate agent count
2. Check the manifest for completeness
3. Review audit logs for patterns
4. Verify critical agents are marked correctly
5. Ensure config file is properly formatted

---

**Document Version**: 1.0.0
**Last Updated**: December 2024
**Total Agents**: 34 (excluding utility files)
**Critical Agents**: 6 (must never be excluded)