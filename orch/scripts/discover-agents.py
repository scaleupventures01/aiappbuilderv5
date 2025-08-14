#!/usr/bin/env python3
"""
ORCH Agent Discovery System
Dynamically discovers all available agents and validates completeness
"""

import os
import json
import yaml
import hashlib
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Set, Tuple

class AgentDiscovery:
    def __init__(self, base_path: str = None):
        """Initialize the agent discovery system"""
        self.base_path = base_path or "/Users/calvinwilliamsjr/Dev Projects/Elite Trading Coach AI/mvp v.05/orch/team"
        self.manifest_path = Path(self.base_path).parent / "orch-team-manifest.json"
        self.config_path = Path(self.base_path).parent / "orch-config.yaml"
        self.excluded_patterns = ["rca-", "template-", "README", "test-", "draft-"]
        self.discovered_agents = {}
        self.validation_errors = []
        
    def discover_all_agents(self) -> Dict:
        """Discover all agent files in the team directory"""
        print(f"🔍 Discovering agents in: {self.base_path}")
        
        agent_files = []
        team_dir = Path(self.base_path)
        
        if not team_dir.exists():
            raise FileNotFoundError(f"Team directory not found: {self.base_path}")
        
        # Find all .md files
        for file_path in team_dir.glob("*.md"):
            filename = file_path.name
            
            # Check if file should be excluded
            if any(pattern in filename for pattern in self.excluded_patterns):
                print(f"  ⏭️  Excluding: {filename}")
                continue
                
            agent_files.append(file_path)
            
        print(f"✅ Found {len(agent_files)} agent files")
        return self._process_agent_files(agent_files)
    
    def _process_agent_files(self, agent_files: List[Path]) -> Dict:
        """Process and validate each agent file"""
        agents = {}
        
        for file_path in agent_files:
            agent_name = file_path.stem
            
            # Read and parse agent file
            try:
                with open(file_path, 'r') as f:
                    content = f.read()
                    
                # Extract metadata from YAML frontmatter if present
                metadata = self._extract_metadata(content)
                
                agents[agent_name] = {
                    "name": self._format_agent_name(agent_name),
                    "file": str(file_path),
                    "valid": True,
                    "metadata": metadata,
                    "checksum": hashlib.md5(content.encode()).hexdigest()
                }
                
            except Exception as e:
                print(f"  ⚠️  Error processing {agent_name}: {e}")
                agents[agent_name] = {
                    "name": self._format_agent_name(agent_name),
                    "file": str(file_path),
                    "valid": False,
                    "error": str(e)
                }
        
        self.discovered_agents = agents
        return agents
    
    def _extract_metadata(self, content: str) -> Dict:
        """Extract metadata from agent file frontmatter"""
        metadata = {}
        
        if content.startswith("---"):
            try:
                # Extract YAML frontmatter
                parts = content.split("---", 2)
                if len(parts) >= 2:
                    yaml_content = parts[1]
                    metadata = yaml.safe_load(yaml_content) or {}
            except:
                pass
                
        # Extract key information from content
        if "expertise" in content.lower():
            metadata["has_expertise"] = True
        if "critical" in content.lower():
            metadata["has_critical_info"] = True
            
        return metadata
    
    def _format_agent_name(self, agent_slug: str) -> str:
        """Convert agent slug to readable name"""
        return agent_slug.replace("-", " ").title()
    
    def validate_completeness(self, expected_count: int = None) -> Tuple[bool, List[str]]:
        """Validate that all expected agents are discovered"""
        issues = []
        
        actual_count = len(self.discovered_agents)
        
        # Load manifest for comparison
        if self.manifest_path.exists():
            with open(self.manifest_path, 'r') as f:
                manifest = json.load(f)
                manifest_count = manifest.get("total_agents", 0)
                
                if actual_count != manifest_count:
                    issues.append(
                        f"Agent count mismatch: Found {actual_count}, Manifest expects {manifest_count}"
                    )
                
                # Check for missing critical agents
                critical_agents = manifest.get("validation", {}).get("critical_agents_always_include", [])
                for critical in critical_agents:
                    if critical not in self.discovered_agents:
                        issues.append(f"CRITICAL: Missing required agent: {critical}")
        
        # Check against expected count if provided
        if expected_count and actual_count != expected_count:
            issues.append(f"Expected {expected_count} agents, found {actual_count}")
        
        # Validate each agent file
        for agent_name, agent_info in self.discovered_agents.items():
            if not agent_info.get("valid"):
                issues.append(f"Invalid agent file: {agent_name}")
        
        is_valid = len(issues) == 0
        return is_valid, issues
    
    def generate_invocation_list(self, request_type: str = "whole_team") -> List[str]:
        """Generate list of agents to invoke based on request type"""
        
        # Load configuration
        config = {}
        if self.config_path.exists():
            with open(self.config_path, 'r') as f:
                config = yaml.safe_load(f)
        
        # Check invocation rules
        invocation_rules = config.get("invocation_rules", {})
        
        if request_type == "whole_team" or request_type == "all":
            # Return all valid agents
            return [name for name, info in self.discovered_agents.items() if info.get("valid")]
        
        elif request_type in invocation_rules:
            # Return specific agent list
            rule = invocation_rules[request_type]
            agent_list = rule.get("agents", [])
            
            if agent_list == "all":
                return [name for name, info in self.discovered_agents.items() if info.get("valid")]
            else:
                return agent_list
        
        # Check presets
        presets = config.get("presets", {})
        if request_type in presets:
            return presets[request_type].get("agents", [])
        
        # Default: return all agents
        print(f"⚠️  Unknown request type '{request_type}', returning all agents")
        return [name for name, info in self.discovered_agents.items() if info.get("valid")]
    
    def display_discovery_report(self):
        """Display a formatted discovery report"""
        print("\n" + "="*60)
        print("📊 AGENT DISCOVERY REPORT")
        print("="*60)
        print(f"Timestamp: {datetime.now().isoformat()}")
        print(f"Base Path: {self.base_path}")
        print(f"Total Agents Found: {len(self.discovered_agents)}")
        
        # Group by validity
        valid_agents = [a for a, i in self.discovered_agents.items() if i.get("valid")]
        invalid_agents = [a for a, i in self.discovered_agents.items() if not i.get("valid")]
        
        print(f"✅ Valid Agents: {len(valid_agents)}")
        print(f"❌ Invalid Agents: {len(invalid_agents)}")
        
        # List agents by category
        print("\n📁 Discovered Agents:")
        for agent_name in sorted(valid_agents):
            agent_info = self.discovered_agents[agent_name]
            print(f"  • {agent_info['name']} ({agent_name})")
        
        if invalid_agents:
            print("\n⚠️  Invalid/Problem Agents:")
            for agent_name in invalid_agents:
                agent_info = self.discovered_agents[agent_name]
                print(f"  • {agent_name}: {agent_info.get('error', 'Unknown error')}")
        
        # Validation results
        is_valid, issues = self.validate_completeness()
        
        print("\n🔍 Validation Results:")
        if is_valid:
            print("  ✅ All validation checks passed!")
        else:
            print("  ❌ Validation issues found:")
            for issue in issues:
                print(f"    • {issue}")
        
        print("\n" + "="*60)
    
    def save_discovery_cache(self):
        """Save discovery results to cache file"""
        cache_file = Path(self.base_path).parent / ".agent_discovery_cache.json"
        
        cache_data = {
            "timestamp": datetime.now().isoformat(),
            "base_path": self.base_path,
            "discovered_agents": self.discovered_agents,
            "agent_count": len(self.discovered_agents),
            "valid_agents": [a for a, i in self.discovered_agents.items() if i.get("valid")]
        }
        
        with open(cache_file, 'w') as f:
            json.dump(cache_data, f, indent=2)
        
        print(f"💾 Discovery cache saved to: {cache_file}")
    
    def check_for_missing_critical_agents(self) -> List[str]:
        """Check if any critical agents are missing"""
        critical_agents = [
            "ai-safety-engineer",
            "privacy-engineer",
            "ciso",
            "security-architect",
            "business-analyst",
            "project-manager"
        ]
        
        missing = []
        for agent in critical_agents:
            if agent not in self.discovered_agents or not self.discovered_agents[agent].get("valid"):
                missing.append(agent)
        
        if missing:
            print("\n🚨 CRITICAL AGENTS MISSING:")
            for agent in missing:
                print(f"  ❌ {agent}")
            print("\n⚠️  These agents are REQUIRED for platform safety and compliance!")
        
        return missing


def main():
    """Main execution function"""
    print("🚀 ORCH Agent Discovery System v1.0")
    print("-" * 60)
    
    # Initialize discovery
    discovery = AgentDiscovery()
    
    # Discover all agents
    agents = discovery.discover_all_agents()
    
    # Display report
    discovery.display_discovery_report()
    
    # Check for critical agents
    missing_critical = discovery.check_for_missing_critical_agents()
    
    # Save cache
    discovery.save_discovery_cache()
    
    # Generate sample invocation lists
    print("\n📋 Sample Invocation Lists:")
    
    print("\n1. Whole Team Request:")
    whole_team = discovery.generate_invocation_list("whole_team")
    print(f"   Would invoke {len(whole_team)} agents")
    
    print("\n2. Security Review Request:")
    security_team = discovery.generate_invocation_list("security_review")
    print(f"   Would invoke {len(security_team)} agents")
    
    # Exit with appropriate code
    if missing_critical:
        print("\n❌ Discovery completed with critical issues!")
        exit(1)
    else:
        print("\n✅ Discovery completed successfully!")
        exit(0)


if __name__ == "__main__":
    main()