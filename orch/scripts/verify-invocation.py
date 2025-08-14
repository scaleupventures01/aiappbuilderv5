#!/usr/bin/env python3
"""
ORCH Team Invocation Verification System
Ensures complete team invocation and prevents missing critical agents
"""

import os
import json
import yaml
import time
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Set, Optional, Tuple
from dataclasses import dataclass, field

@dataclass
class InvocationPlan:
    """Represents a planned agent invocation"""
    request_text: str
    request_type: str
    agents_to_invoke: List[str]
    estimated_time: float
    estimated_cost: float
    requires_confirmation: bool
    critical_agents_included: bool
    warnings: List[str] = field(default_factory=list)
    
@dataclass
class InvocationResult:
    """Represents the result of an invocation"""
    plan: InvocationPlan
    agents_invoked: List[str]
    agents_failed: List[str]
    agents_skipped: List[str]
    actual_time: float
    actual_cost: float
    success: bool
    issues: List[str] = field(default_factory=list)

class InvocationVerifier:
    def __init__(self, base_path: str = None):
        """Initialize the invocation verification system"""
        self.base_path = base_path or "/Users/calvinwilliamsjr/Dev Projects/Elite Trading Coach AI/mvp v.05/orch"
        self.manifest_path = Path(self.base_path) / "orch-team-manifest.json"
        self.config_path = Path(self.base_path) / "orch-config.yaml"
        self.log_path = Path(self.base_path) / "logs" / "invocations"
        self.manifest = {}
        self.config = {}
        self.load_configuration()
        
    def load_configuration(self):
        """Load manifest and configuration files"""
        # Load manifest
        if self.manifest_path.exists():
            with open(self.manifest_path, 'r') as f:
                self.manifest = json.load(f)
        else:
            raise FileNotFoundError(f"Manifest not found: {self.manifest_path}")
        
        # Load config
        if self.config_path.exists():
            with open(self.config_path, 'r') as f:
                self.config = yaml.safe_load(f)
        else:
            raise FileNotFoundError(f"Config not found: {self.config_path}")
    
    def parse_request(self, request_text: str) -> str:
        """Parse user request to determine invocation type"""
        request_lower = request_text.lower()
        
        # Check aliases
        aliases = self.config.get("invocation_aliases", {})
        
        for alias_type, phrases in aliases.items():
            if isinstance(phrases, list):
                for phrase in phrases:
                    if phrase.lower() in request_lower:
                        return alias_type
            elif phrases.lower() in request_lower:
                return alias_type
        
        # Check for specific team mentions
        if "security" in request_lower:
            return "security_review"
        elif "leadership" in request_lower or "executive" in request_lower:
            return "leadership_review"
        elif "technical" in request_lower and "review" in request_lower:
            return "technical_review"
        elif "product" in request_lower:
            return "product_review"
        elif "ai" in request_lower or "ml" in request_lower:
            return "ai_ml_review"
        elif "compliance" in request_lower:
            return "compliance_review"
        
        # Default to whole team for comprehensive requests
        if any(word in request_lower for word in ["review", "evaluate", "assess", "analyze"]):
            return "whole_team"
        
        return "custom"
    
    def get_agents_for_request(self, request_type: str) -> List[str]:
        """Get list of agents to invoke based on request type"""
        invocation_rules = self.config.get("invocation_rules", {})
        
        if request_type in invocation_rules:
            rule = invocation_rules[request_type]
            agents = rule.get("agents", [])
            
            if agents == "all":
                # Return all agents from manifest
                return list(self.manifest.get("agents", {}).keys())
            else:
                return agents
        
        # Check presets
        presets = self.config.get("presets", {})
        if request_type in presets:
            return presets[request_type].get("agents", [])
        
        # Default to all agents
        return list(self.manifest.get("agents", {}).keys())
    
    def check_critical_agents(self, agents_list: List[str]) -> Tuple[bool, List[str]]:
        """Check if all critical agents are included"""
        critical_agents = self.manifest.get("validation", {}).get("critical_agents_always_include", [])
        missing_critical = []
        
        for critical in critical_agents:
            if critical not in agents_list:
                missing_critical.append(critical)
        
        all_included = len(missing_critical) == 0
        return all_included, missing_critical
    
    def check_group_completeness(self, agents_list: List[str]) -> List[str]:
        """Check if agent groups are complete and suggest additions"""
        suggestions = []
        complete_groups = self.config.get("safety_checks", {}).get("complete_groups", {})
        
        for group_name, group_config in complete_groups.items():
            trigger_agents = group_config.get("trigger_agents", [])
            must_include = group_config.get("must_include", [])
            
            # Check if any trigger agent is in the list
            if any(agent in agents_list for agent in trigger_agents):
                # Check if all must_include agents are present
                for required in must_include:
                    if required not in agents_list:
                        suggestions.append(required)
        
        return list(set(suggestions))  # Remove duplicates
    
    def estimate_resources(self, agents_list: List[str]) -> Tuple[float, float]:
        """Estimate time and cost for invocation"""
        resource_config = self.config.get("resource_management", {})
        
        time_per_agent = resource_config.get("time_per_agent", 0.5)
        time_overhead = resource_config.get("time_overhead", 2)
        cost_per_agent = resource_config.get("estimated_cost_per_agent", 0.10)
        
        estimated_time = (len(agents_list) * time_per_agent) + time_overhead
        estimated_cost = len(agents_list) * cost_per_agent
        
        return estimated_time, estimated_cost
    
    def create_invocation_plan(self, request_text: str) -> InvocationPlan:
        """Create a detailed invocation plan"""
        # Parse request
        request_type = self.parse_request(request_text)
        
        # Get agents list
        agents_list = self.get_agents_for_request(request_type)
        
        # Check for critical agents
        critical_included, missing_critical = self.check_critical_agents(agents_list)
        
        # Check group completeness
        suggested_additions = self.check_group_completeness(agents_list)
        
        # Add suggested agents
        if suggested_additions:
            agents_list.extend(suggested_additions)
            agents_list = list(set(agents_list))  # Remove duplicates
        
        # Estimate resources
        estimated_time, estimated_cost = self.estimate_resources(agents_list)
        
        # Check if confirmation required
        requires_confirmation = False
        safety_config = self.config.get("safety_checks", {})
        confirm_threshold = safety_config.get("require_confirmation_above", 10)
        
        if len(agents_list) > confirm_threshold:
            requires_confirmation = True
        
        # Build warnings
        warnings = []
        if missing_critical:
            warnings.append(f"⚠️ CRITICAL agents missing: {', '.join(missing_critical)}")
        
        if suggested_additions:
            warnings.append(f"ℹ️ Added for completeness: {', '.join(suggested_additions)}")
        
        if len(agents_list) > 25:
            warnings.append(f"⏰ Large invocation: {len(agents_list)} agents will take ~{estimated_time:.1f} minutes")
        
        # Create plan
        plan = InvocationPlan(
            request_text=request_text,
            request_type=request_type,
            agents_to_invoke=agents_list,
            estimated_time=estimated_time,
            estimated_cost=estimated_cost,
            requires_confirmation=requires_confirmation,
            critical_agents_included=critical_included,
            warnings=warnings
        )
        
        return plan
    
    def display_plan(self, plan: InvocationPlan):
        """Display the invocation plan to the user"""
        print("\n" + "="*60)
        print("🔍 AGENT INVOCATION PLAN")
        print("="*60)
        
        print(f"Request: {plan.request_text}")
        print(f"Type: {plan.request_type}")
        print(f"Agents to invoke: {len(plan.agents_to_invoke)}")
        print(f"Estimated time: {plan.estimated_time:.1f} minutes")
        print(f"Estimated cost: ${plan.estimated_cost:.2f}")
        
        # Critical agents check
        if plan.critical_agents_included:
            print("\n✅ Critical agents included:")
            critical = self.manifest.get("validation", {}).get("critical_agents_always_include", [])
            for agent in critical:
                if agent in plan.agents_to_invoke:
                    agent_info = self.manifest.get("agents", {}).get(agent, {})
                    print(f"  • {agent_info.get('name', agent)}")
        else:
            print("\n❌ MISSING CRITICAL AGENTS!")
        
        # Warnings
        if plan.warnings:
            print("\n⚠️ Warnings:")
            for warning in plan.warnings:
                print(f"  {warning}")
        
        # Agent list by domain
        print("\n📋 Agents by Domain:")
        domain_groups = self.manifest.get("domain_groups", {})
        
        for domain, agents in domain_groups.items():
            domain_agents = [a for a in agents if a in plan.agents_to_invoke]
            if domain_agents:
                print(f"\n  {domain.replace('_', ' ').title()}:")
                for agent in domain_agents:
                    agent_info = self.manifest.get("agents", {}).get(agent, {})
                    print(f"    • {agent_info.get('name', agent)}")
        
        print("\n" + "="*60)
    
    def verify_invocation_completeness(self, plan: InvocationPlan, 
                                      actually_invoked: List[str]) -> InvocationResult:
        """Verify that all planned agents were actually invoked"""
        start_time = time.time()
        
        # Determine what was invoked, failed, or skipped
        agents_invoked = []
        agents_failed = []
        agents_skipped = []
        
        for agent in plan.agents_to_invoke:
            if agent in actually_invoked:
                agents_invoked.append(agent)
            else:
                agents_skipped.append(agent)
        
        # Calculate actual time and cost
        actual_time = (time.time() - start_time) / 60  # Convert to minutes
        actual_cost = len(agents_invoked) * self.config.get("resource_management", {}).get("estimated_cost_per_agent", 0.10)
        
        # Determine success
        issues = []
        success = True
        
        # Check if critical agents were skipped
        critical_agents = self.manifest.get("validation", {}).get("critical_agents_always_include", [])
        critical_skipped = [a for a in critical_agents if a in agents_skipped]
        
        if critical_skipped:
            success = False
            issues.append(f"Critical agents were skipped: {', '.join(critical_skipped)}")
        
        # Check completion rate
        completion_rate = len(agents_invoked) / len(plan.agents_to_invoke) if plan.agents_to_invoke else 0
        
        if completion_rate < 0.9:  # Less than 90% completion
            issues.append(f"Low completion rate: {completion_rate:.1%}")
        
        # Create result
        result = InvocationResult(
            plan=plan,
            agents_invoked=agents_invoked,
            agents_failed=agents_failed,
            agents_skipped=agents_skipped,
            actual_time=actual_time,
            actual_cost=actual_cost,
            success=success,
            issues=issues
        )
        
        return result
    
    def display_result(self, result: InvocationResult):
        """Display the invocation result"""
        print("\n" + "="*60)
        print("📊 INVOCATION RESULT")
        print("="*60)
        
        # Summary
        if result.success:
            print("✅ Invocation completed successfully!")
        else:
            print("❌ Invocation completed with issues")
        
        print(f"\nStatistics:")
        print(f"  • Planned: {len(result.plan.agents_to_invoke)} agents")
        print(f"  • Invoked: {len(result.agents_invoked)} agents")
        print(f"  • Skipped: {len(result.agents_skipped)} agents")
        print(f"  • Failed: {len(result.agents_failed)} agents")
        
        completion_rate = len(result.agents_invoked) / len(result.plan.agents_to_invoke) if result.plan.agents_to_invoke else 0
        print(f"  • Completion: {completion_rate:.1%}")
        
        print(f"\nResources:")
        print(f"  • Estimated time: {result.plan.estimated_time:.1f} minutes")
        print(f"  • Actual time: {result.actual_time:.1f} minutes")
        print(f"  • Estimated cost: ${result.plan.estimated_cost:.2f}")
        print(f"  • Actual cost: ${result.actual_cost:.2f}")
        
        # Issues
        if result.issues:
            print("\n⚠️ Issues:")
            for issue in result.issues:
                print(f"  • {issue}")
        
        # Skipped agents detail
        if result.agents_skipped:
            print("\n📝 Skipped Agents:")
            for agent in result.agents_skipped:
                agent_info = self.manifest.get("agents", {}).get(agent, {})
                priority = agent_info.get("priority", "unknown")
                print(f"  • {agent_info.get('name', agent)} (Priority: {priority})")
        
        print("\n" + "="*60)
    
    def log_invocation(self, result: InvocationResult):
        """Log the invocation for audit purposes"""
        # Create log directory if it doesn't exist
        self.log_path.mkdir(parents=True, exist_ok=True)
        
        # Create log entry
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "request": result.plan.request_text,
            "request_type": result.plan.request_type,
            "agents_planned": len(result.plan.agents_to_invoke),
            "agents_invoked": len(result.agents_invoked),
            "agents_skipped": result.agents_skipped,
            "completion_rate": len(result.agents_invoked) / len(result.plan.agents_to_invoke) if result.plan.agents_to_invoke else 0,
            "success": result.success,
            "issues": result.issues,
            "estimated_time": result.plan.estimated_time,
            "actual_time": result.actual_time,
            "estimated_cost": result.plan.estimated_cost,
            "actual_cost": result.actual_cost
        }
        
        # Save to log file
        log_file = self.log_path / f"invocation_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(log_file, 'w') as f:
            json.dump(log_entry, f, indent=2)
        
        print(f"\n💾 Invocation logged to: {log_file}")
    
    def get_confirmation(self, plan: InvocationPlan) -> bool:
        """Get user confirmation for invocation"""
        if not plan.requires_confirmation:
            return True
        
        print("\n" + "="*60)
        print("⚠️ CONFIRMATION REQUIRED")
        print("="*60)
        print(f"You are about to invoke {len(plan.agents_to_invoke)} agents.")
        print(f"This will take approximately {plan.estimated_time:.1f} minutes")
        print(f"and cost approximately ${plan.estimated_cost:.2f}")
        
        # Double confirmation for very large invocations
        double_confirm_threshold = self.config.get("safety_checks", {}).get("require_double_confirmation_above", 25)
        
        if len(plan.agents_to_invoke) > double_confirm_threshold:
            print("\n🚨 LARGE INVOCATION - DOUBLE CONFIRMATION REQUIRED")
            response = input("\nType 'YES' to proceed: ")
            return response == "YES"
        else:
            response = input("\nProceed? [Y/n]: ")
            return response.lower() in ['y', 'yes', '']


def simulate_invocation(agents_list: List[str]) -> List[str]:
    """Simulate an actual invocation (for testing)"""
    import random
    
    # Simulate that 90-95% of agents are successfully invoked
    success_rate = random.uniform(0.90, 0.95)
    num_to_invoke = int(len(agents_list) * success_rate)
    
    # Randomly select which agents to "invoke"
    actually_invoked = random.sample(agents_list, num_to_invoke)
    
    return actually_invoked


def main():
    """Main execution function for testing"""
    print("🚀 ORCH Invocation Verification System v1.0")
    print("-" * 60)
    
    # Initialize verifier
    verifier = InvocationVerifier()
    
    # Test with different request types
    test_requests = [
        "Have the whole team review the platform",
        "I need a security review of the system",
        "Get the leadership team's perspective",
        "Review the technical architecture"
    ]
    
    for request in test_requests:
        print(f"\n\n{'='*60}")
        print(f"Testing request: '{request}'")
        print('='*60)
        
        # Create plan
        plan = verifier.create_invocation_plan(request)
        
        # Display plan
        verifier.display_plan(plan)
        
        # Get confirmation (auto-yes for testing)
        print("\n[Auto-confirming for test]")
        
        # Simulate invocation
        print("\n⏳ Simulating invocation...")
        actually_invoked = simulate_invocation(plan.agents_to_invoke)
        
        # Verify completeness
        result = verifier.verify_invocation_completeness(plan, actually_invoked)
        
        # Display result
        verifier.display_result(result)
        
        # Log invocation
        verifier.log_invocation(result)
    
    print("\n✅ Verification system test completed!")


if __name__ == "__main__":
    main()