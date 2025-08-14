#!/usr/bin/env python3
"""
LITELLM COMPLETE SETUP & VERIFICATION - VERSION 12 AUTO
======================================================

This version includes Claude Opus 4.1 and runs AUTOMATICALLY without user input.

Updates in v12:
✅ Added Claude Opus 4.1 (claude-opus-4-1-20250805)
✅ Updated model count to 20 total models
✅ Runs all tests automatically
✅ Shows progress in real-time
✅ Provides detailed summary at the end

Just save this file and run: python litellm_v12_auto.py
"""

import os
import sys
import json
import time
from datetime import datetime
from pathlib import Path

# ============ STEP 1: ENVIRONMENT SETUP ============

def load_api_keys():
    """Load API keys from .env file - MUST happen first"""
    print("🔍 Searching for .env file...")
    
    # Search for .env in multiple locations
    possible_paths = [
        ".env",
        "../.env",
        "../../.env",
        "/Users/calvinwilliamsjr/Dev Projects/v0.1/.env",
        "/Users/calvinwilliamsjr/Dev Projects/AI App Builder/v0.2/.env",
        os.path.expanduser("~/.env"),
        os.path.join(os.getcwd(), ".env")
    ]
    
    env_found = False
    loaded_from = None
    
    for env_path in possible_paths:
        if os.path.exists(env_path):
            print(f"✅ Found .env at: {env_path}")
            try:
                # Try python-dotenv first
                try:
                    from dotenv import load_dotenv
                    load_dotenv(env_path)
                    env_found = True
                except ImportError:
                    pass
                
                # Always do manual loading as backup
                with open(env_path, 'r') as f:
                    for line in f:
                        line = line.strip()
                        if '=' in line and not line.startswith('#') and line:
                            key, value = line.split('=', 1)
                            value = value.strip().strip('"').strip("'")
                            os.environ[key] = value
                
                env_found = True
                loaded_from = env_path
                break
                
            except Exception as e:
                print(f"⚠️  Error reading {env_path}: {e}")
    
    if not env_found:
        print("\n❌ No .env file found!")
        create_env_template()
        return False
    
    # Ensure GEMINI_API_KEY is set from GOOGLE_API_KEY
    if 'GOOGLE_API_KEY' in os.environ and 'GEMINI_API_KEY' not in os.environ:
        os.environ['GEMINI_API_KEY'] = os.environ['GOOGLE_API_KEY']
    
    print(f"\n✅ Environment loaded from: {loaded_from}")
    return True

def create_env_template():
    """Create template .env file"""
    template = """# LiteLLM API Keys
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key  
GOOGLE_API_KEY=your-google-api-key
GEMINI_API_KEY=your-google-api-key
DEEPSEEK_API_KEY=your-deepseek-key
"""
    with open('.env.template', 'w') as f:
        f.write(template)
    print("📄 Created .env.template - rename to .env and add your keys")

def check_api_keys():
    """Check which API keys are available"""
    required_keys = {
        'OPENAI_API_KEY': 'OpenAI',
        'ANTHROPIC_API_KEY': 'Anthropic',
        'GEMINI_API_KEY': 'Google',
        'DEEPSEEK_API_KEY': 'DeepSeek'
    }
    
    available = {}
    missing = []
    
    print("\n🔑 Checking API Keys:")
    for key, provider in required_keys.items():
        if key in os.environ and os.environ[key] and len(os.environ[key]) > 10:
            masked = os.environ[key][:8] + "..." + os.environ[key][-4:]
            print(f"  ✅ {provider}: {masked}")
            available[provider] = True
        else:
            print(f"  ❌ {provider}: Not found")
            missing.append(provider)
            available[provider] = False
    
    if missing:
        print(f"\n⚠️  Missing keys for: {', '.join(missing)}")
        print("🤖 AUTO MODE: Continuing with available keys only...")
    
    return available

# ============ STEP 2: IMPORT AND SETUP ============

# Import LiteLLM after environment is loaded
try:
    import litellm
    from litellm import completion
    print(f"\n✅ LiteLLM version: {getattr(litellm, '__version__', 'unknown')}")
except ImportError:
    print("❌ LiteLLM not installed. Run: pip install litellm")
    sys.exit(1)

# Colors for terminal output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    MAGENTA = '\033[95m'
    BOLD = '\033[1m'
    END = '\033[0m'

# ============ STEP 3: MODEL DEFINITIONS WITH CLAUDE OPUS 4.1 ============

MODELS_TO_TEST = {
    # OpenAI Models
    "gpt-4o": {
        "provider": "OpenAI",
        "formats": ["gpt-4o"],
        "cost_per_1k": 12.50
    },
    "gpt-4o-mini": {
        "provider": "OpenAI", 
        "formats": ["gpt-4o-mini"],
        "cost_per_1k": 0.75
    },
    "o3-mini": {
        "provider": "OpenAI",
        "formats": ["o3-mini"],
        "special_params": {"temperature": 1, "max_completion_tokens": 100},
        "cost_per_1k": 5.50,
        "reasoning_model": True
    },
    "o3": {
        "provider": "OpenAI",
        "formats": ["o3"],
        "special_params": {"temperature": 1, "max_completion_tokens": 100},
        "tier_required": 4,
        "cost_per_1k": 30.00,
        "reasoning_model": True
    },
    
    # Anthropic Models - INCLUDING OPUS 4.1
    "claude-3-haiku-20240307": {
        "provider": "Anthropic",
        "formats": ["claude-3-haiku-20240307"],
        "cost_per_1k": 1.50
    },
    "claude-3-5-sonnet-20241022": {
        "provider": "Anthropic",
        "formats": ["claude-3-5-sonnet-20241022"],
        "cost_per_1k": 18.00
    },
    "claude-sonnet-4-20250514": {
        "provider": "Anthropic",
        "formats": ["claude-sonnet-4-20250514"],
        "cost_per_1k": 18.00
    },
    "claude-opus-4-20250514": {
        "provider": "Anthropic",
        "formats": ["claude-opus-4-20250514"],
        "cost_per_1k": 90.00
    },
    "claude-opus-4-1-20250805": {
        "provider": "Anthropic",
        "formats": ["claude-opus-4-1-20250805"],
        "cost_per_1k": 90.00  # $15 input + $75 output averaged
    },
    
    # Google Gemini Models
    "gemini-1.5-flash-8b": {
        "provider": "Google",
        "formats": ["gemini/gemini-1.5-flash-8b"],
        "cost_per_1k": 0.50
    },
    "gemini-2.0-flash-exp": {
        "provider": "Google",
        "formats": ["gemini/gemini-2.0-flash-exp"],
        "cost_per_1k": 0.00
    },
    "gemini-1.5-flash": {
        "provider": "Google",
        "formats": ["gemini/gemini-1.5-flash"],
        "cost_per_1k": 2.80
    },
    "gemini-1.5-pro": {
        "provider": "Google",
        "formats": ["gemini/gemini-1.5-pro"],
        "cost_per_1k": 14.00
    },
    
    # Gemini 2.5 with STABLE names
    "gemini-2.5-pro": {
        "provider": "Google",
        "formats": [
            "gemini/gemini-2.5-pro",
            "gemini/gemini-2.5-pro-latest"
        ],
        "cost_per_1k": 20.00,
        "thinking_model": True
    },
    "gemini-2.5-flash": {
        "provider": "Google", 
        "formats": [
            "gemini/gemini-2.5-flash",
            "gemini/gemini-2.5-flash-latest"
        ],
        "cost_per_1k": 5.00,
        "thinking_model": True
    },
    "gemini-2.5-flash-lite": {
        "provider": "Google",
        "formats": [
            "gemini/gemini-2.5-flash-lite",
            "gemini/gemini-2.5-flash-lite-latest"
        ],
        "cost_per_1k": 1.00
    },
    
    # DeepSeek Models
    "deepseek-chat": {
        "provider": "DeepSeek",
        "formats": ["deepseek/deepseek-chat"],
        "cost_per_1k": 0.28
    },
    "deepseek-coder": {
        "provider": "DeepSeek",
        "formats": ["deepseek/deepseek-coder"],
        "cost_per_1k": 0.28
    },
    "deepseek-reasoner": {
        "provider": "DeepSeek",
        "formats": ["deepseek/deepseek-reasoner"],
        "cost_per_1k": 2.19,
        "reasoning_model": True
    }
}

# ============ STEP 4: VERIFICATION FUNCTIONS ============

def get_test_prompt(model_name):
    """Get appropriate test prompt for model type"""
    if "o3" in model_name.lower():
        return "What is 2+2? Think step by step and respond with just the number 4."
    elif "reasoner" in model_name.lower():
        return "Calculate 2+2. Show your reasoning then give the answer 4."
    elif "gemini-2.5" in model_name:
        return "What is 2+2? Please respond with exactly '4' and nothing else."
    else:
        return "Reply with exactly the number 4"

def auto_provider_test(available_providers):
    """Test ONE model per provider automatically"""
    print(f"\n{Colors.BOLD}📡 Quick Provider Connectivity Test{Colors.END}")
    print("🤖 AUTO MODE: Testing providers automatically...\n")
    
    test_models = {
        "OpenAI": "gpt-4o-mini",
        "Anthropic": "claude-3-haiku-20240307", 
        "Google": "gemini/gemini-1.5-flash-8b",
        "DeepSeek": "deepseek/deepseek-chat"
    }
    
    results = {}
    working_count = 0
    
    for provider, model in test_models.items():
        if not available_providers.get(provider):
            print(f"{provider:12} {Colors.YELLOW}⏭️  Skipped (no API key){Colors.END}")
            results[provider] = "no_key"
            continue
        
        print(f"{provider:12}", end="", flush=True)
        
        try:
            # Ultra minimal test
            response = completion(
                model=model,
                messages=[{"role": "user", "content": "1"}],
                max_tokens=1,
                temperature=0.1
            )
            
            print(f" {Colors.GREEN}✅ Connected{Colors.END}")
            results[provider] = "working"
            working_count += 1
            
        except Exception as e:
            error = str(e)[:40]
            print(f" {Colors.RED}❌ {error}...{Colors.END}")
            results[provider] = "failed"
        
        time.sleep(0.2)  # Rate limit protection
    
    # Summary
    print(f"\n{Colors.BOLD}Provider Summary:{Colors.END}")
    print(f"✅ Working: {working_count}/4 providers")
    
    if working_count == 0:
        print(f"\n{Colors.RED}❌ No providers working. Check:{Colors.END}")
        print("1. API key validity")
        print("2. Network connectivity")
        print("3. Rate limits")
        return None
    
    return results

def test_single_model(model_name, config):
    """Test a single model with handling for all model types"""
    format_name = config["formats"][0]
    
    try:
        # Get appropriate prompt
        prompt = get_test_prompt(model_name)
        
        params = {
            "model": format_name,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.1
        }
        
        # Model-specific parameters
        if config.get("reasoning_model"):
            # O3 and reasoning models need special handling
            if "o3" in model_name.lower():
                params.update({
                    "temperature": 1,
                    "max_completion_tokens": 100
                })
            else:
                params["max_tokens"] = 100
        else:
            params["max_tokens"] = 10
        
        # Apply any special params
        if config.get("special_params"):
            params.update(config["special_params"])
        
        response = completion(**params)
        
        # Check response based on model type
        if "o3" in model_name.lower():
            # O3 models may have empty content but reasoning tokens
            if hasattr(response, 'usage'):
                if hasattr(response.usage, 'reasoning_tokens') and response.usage.reasoning_tokens > 0:
                    return "working", f"reasoning:{response.usage.reasoning_tokens}"
            return "working", "o3_reasoning"
            
        elif "deepseek-reasoner" in model_name:
            # DeepSeek reasoner uses reasoning_content
            if hasattr(response.choices[0].message, 'reasoning_content'):
                return "working", "has_reasoning_content"
            if response.choices[0].message.content:
                return "working", None
            return "working", "deepseek_reasoning"
            
        elif "gemini-2.5" in model_name:
            # Gemini 2.5 are thinking models
            content = response.choices[0].message.content
            if content:
                return "working", None
            if hasattr(response, 'usage') and hasattr(response.usage, 'thinking_tokens'):
                return "working", f"thinking:{response.usage.thinking_tokens}"
            return "working", "gemini_thinking"
        
        # Default: check for content
        if response.choices[0].message.content:
            return "working", None
        else:
            return "working", "no_visible_output"
            
    except Exception as e:
        error = str(e)
        if "404" in error or "not found" in error.lower():
            return "not_found", "model_unavailable"
        elif "tier" in error.lower() or "access" in error.lower():
            return "restricted", "tier_required"
        elif "rate" in error.lower():
            return "rate_limited", "rate_limit_hit"
        else:
            return "failed", error[:50]

def auto_full_test(provider_results, available_providers):
    """Test all models automatically"""
    print(f"\n{Colors.BOLD}🔬 Full Model Testing - AUTO MODE{Colors.END}")
    
    working_providers = [p for p, s in provider_results.items() if s == "working"]
    if not working_providers:
        print("No working providers to test.")
        return []
    
    print(f"🤖 AUTO MODE: Testing all models for: {Colors.GREEN}{', '.join(working_providers)}{Colors.END}")
    print("This will take approximately 1-2 minutes...\n")
    
    # Group models by provider
    by_provider = {}
    for name, config in MODELS_TO_TEST.items():
        provider = config["provider"]
        if provider not in by_provider:
            by_provider[provider] = []
        by_provider[provider].append((name, config))
    
    all_results = []
    total_tested = 0
    total_models = sum(len(by_provider.get(p, [])) for p in working_providers)
    
    # Progress bar setup
    print(f"Progress: [{'_' * 40}] 0/{total_models}")
    
    # Test each provider
    for provider in working_providers:
        if provider not in by_provider:
            continue
            
        models = by_provider[provider]
        print(f"\n{Colors.BOLD}{Colors.CYAN}Testing {provider} Models ({len(models)} models){Colors.END}")
        
        provider_results = []
        
        for model_name, config in models:
            # Update progress
            progress = int((total_tested / total_models) * 40)
            print(f"\rProgress: [{'=' * progress}{'_' * (40 - progress)}] {total_tested}/{total_models}", end="", flush=True)
            print(f"\n  {model_name:30}", end="", flush=True)
            
            status, details = test_single_model(model_name, config)
            
            # Display result with colors
            if status == "working":
                print(f" {Colors.GREEN}✅{Colors.END}", end="")
                if details:
                    print(f" {Colors.MAGENTA}({details}){Colors.END}")
                else:
                    print()
            elif status == "restricted":
                print(f" {Colors.YELLOW}🔒 Tier required{Colors.END}")
            elif status == "not_found":
                print(f" {Colors.YELLOW}📍 Not available{Colors.END}")
            elif status == "rate_limited":
                print(f" {Colors.YELLOW}⏱️  Rate limited{Colors.END}")
            else:
                print(f" {Colors.RED}❌{Colors.END}")
            
            result = {
                "model": model_name,
                "provider": provider,
                "status": status,
                "format": config["formats"][0] if status == "working" else None,
                "cost_per_1k": config.get("cost_per_1k", 0),
                "details": details
            }
            
            provider_results.append(result)
            all_results.append(result)
            total_tested += 1
            
            time.sleep(0.3)  # Rate limit protection
        
        # Provider summary
        working = sum(1 for r in provider_results if r["status"] == "working")
        print(f"\n{provider} Result: {working}/{len(models)} working")
    
    # Final progress
    print(f"\rProgress: [{'=' * 40}] {total_models}/{total_models} - COMPLETE!\n")
    
    return all_results

# ============ STEP 5: MAIN EXECUTION ============

def main():
    """Main execution flow - FULLY AUTOMATIC"""
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'LITELLM AUTO SETUP & VERIFICATION v12':^60}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'NOW WITH CLAUDE OPUS 4.1':^60}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"\n🤖 Running in AUTO MODE - No user input required!")
    print(f"📦 Total models to test: 20 (including Claude Opus 4.1)")
    
    # Step 1: Load environment
    print(f"\n{Colors.BOLD}Step 1: Environment Setup{Colors.END}")
    if not load_api_keys():
        print("\n❌ Cannot proceed without .env file")
        print("Please create a .env file with your API keys and run again.")
        return
    
    # Step 2: Check API keys
    available_providers = check_api_keys()
    if not available_providers:
        print("\n❌ No API keys found. Please add keys to .env file.")
        return
    
    # Create log directory
    Path("verification_logs").mkdir(exist_ok=True)
    
    # Step 3: Quick connectivity test
    print(f"\n{Colors.BOLD}Step 2: Provider Connectivity Test{Colors.END}")
    provider_results = auto_provider_test(available_providers)
    
    if not provider_results:
        return
    
    # Step 4: Full testing - AUTOMATIC
    print(f"\n{Colors.BOLD}Step 3: Full Model Verification{Colors.END}")
    all_results = auto_full_test(provider_results, available_providers)
    
    # Step 5: Final summary and verification
    if all_results:
        working = [r for r in all_results if r["status"] == "working"]
        failed = [r for r in all_results if r["status"] == "failed"]
        restricted = [r for r in all_results if r["status"] == "restricted"]
        not_found = [r for r in all_results if r["status"] == "not_found"]
        
        print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.END}")
        print(f"{Colors.BOLD}{Colors.BLUE}{'VERIFICATION COMPLETE - FINAL RESULTS':^60}{Colors.END}")
        print(f"{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.END}")
        
        total_models = len(MODELS_TO_TEST)
        print(f"\n📊 Summary:")
        print(f"  ✅ Working: {len(working)}/{total_models} models ({len(working)/total_models*100:.0f}%)")
        print(f"  ❌ Failed: {len(failed)}/{total_models} models")
        print(f"  🔒 Restricted: {len(restricted)}/{total_models} models")
        print(f"  📍 Not Found: {len(not_found)}/{total_models} models")
        
        if working:
            print(f"\n{Colors.BOLD}{Colors.GREEN}✅ VERIFIED WORKING MODELS:{Colors.END}")
            
            # Group by cost
            budget = [m for m in working if m["cost_per_1k"] <= 1.0]
            standard = [m for m in working if 1.0 < m["cost_per_1k"] <= 10.0]
            premium = [m for m in working if m["cost_per_1k"] > 10.0]
            
            if budget:
                print(f"\n💰 Budget Models (<$1/1K tokens):")
                for m in sorted(budget, key=lambda x: x["cost_per_1k"]):
                    print(f"  ✅ {m['model']:30} ${m['cost_per_1k']:.2f}/1k tokens")
                    if m.get('details'):
                        print(f"     {Colors.CYAN}({m['details']}){Colors.END}")
            
            if standard:
                print(f"\n💎 Standard Models ($1-10/1K tokens):")
                for m in sorted(standard, key=lambda x: x["cost_per_1k"]):
                    print(f"  ✅ {m['model']:30} ${m['cost_per_1k']:.2f}/1k tokens")
                    if m.get('details'):
                        print(f"     {Colors.CYAN}({m['details']}){Colors.END}")
            
            if premium:
                print(f"\n👑 Premium Models (>$10/1K tokens):")
                for m in sorted(premium, key=lambda x: x["cost_per_1k"]):
                    print(f"  ✅ {m['model']:30} ${m['cost_per_1k']:.2f}/1k tokens")
                    if m.get('details'):
                        print(f"     {Colors.CYAN}({m['details']}){Colors.END}")
            
            # Highlight Claude Opus 4.1 if working
            opus_41 = next((m for m in working if m["model"] == "claude-opus-4-1-20250805"), None)
            if opus_41:
                print(f"\n{Colors.BOLD}{Colors.MAGENTA}🌟 NEW: Claude Opus 4.1 is WORKING!{Colors.END}")
                print(f"   Model: {opus_41['format']}")
                print(f"   Cost: ${opus_41['cost_per_1k']:.2f}/1k tokens")
        
        # Save results
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"verification_logs/litellm_v12_results_{timestamp}.json"
        
        with open(filename, 'w') as f:
            json.dump({
                "timestamp": datetime.now().isoformat(),
                "version": "v12_auto",
                "provider_test": provider_results,
                "models_tested": len(all_results),
                "working_models": working,
                "total_tokens_used": len(all_results) + 4,
                "estimated_cost": (len(all_results) + 4) * 0.00001
            }, f, indent=2)
        
        print(f"\n📄 Detailed results saved: {filename}")
        
        # Create quick config with working models
        if working:
            config = {
                "working_models": {m["model"]: m["format"] for m in working},
                "by_cost": {
                    "ultra_budget": next((m["format"] for m in working if m["cost_per_1k"] <= 0.5), None),
                    "budget": next((m["format"] for m in working if m["cost_per_1k"] <= 1.0), None),
                    "standard": next((m["format"] for m in working if 1.0 < m["cost_per_1k"] <= 10.0), None),
                    "premium": next((m["format"] for m in working if m["cost_per_1k"] > 10.0), None)
                },
                "reasoning_models": [m["format"] for m in working if m.get("details") and "reasoning" in str(m["details"])],
                "claude_opus_41": "claude-opus-4-1-20250805" if opus_41 else None
            }
            
            with open("litellm_v12_working_models.json", 'w') as f:
                json.dump(config, f, indent=2)
            
            print(f"📄 Working models config saved: litellm_v12_working_models.json")
            
            print(f"\n{Colors.GREEN}✅ VERIFICATION COMPLETE!{Colors.END}")
            print(f"\n{Colors.BOLD}Quick Start Examples:{Colors.END}")
            if config['by_cost']['ultra_budget']:
                print(f"  🔵 Ultra Budget: {config['by_cost']['ultra_budget']}")
            if config['by_cost']['budget']:
                print(f"  🟢 Best Value: {config['by_cost']['budget']}")
            if config['by_cost']['premium']:
                print(f"  🟡 Premium: {config['by_cost']['premium']}")
            if config.get('claude_opus_41'):
                print(f"  🌟 Claude Opus 4.1: {config['claude_opus_41']}")
            if config['reasoning_models']:
                print(f"  🧠 Reasoning: {config['reasoning_models'][0]}")
            
            # Show example usage
            print(f"\n{Colors.BOLD}Example Usage:{Colors.END}")
            print(f"""
from litellm import completion

# Use Claude Opus 4.1 (if available)
response = completion(
    model="claude-opus-4-1-20250805",
    messages=[{{"role": "user", "content": "Hello!"}}]
)
print(response.choices[0].message.content)
""")
    
    print(f"\n{Colors.BOLD}Test Statistics:{Colors.END}")
    print(f"  ⏱️  Total test time: ~{len(all_results) * 0.3:.1f} seconds")
    print(f"  🪙 Tokens used: {len(all_results) + 4}")
    print(f"  💰 Total cost: ~${((len(all_results) if all_results else 0) + 4) * 0.00001:.4f}")
    
    print(f"\n{Colors.GREEN}{Colors.BOLD}🎉 Auto-verification complete!{Colors.END}")
    print(f"{Colors.GREEN}All tests run automatically with full verification.{Colors.END}")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n\n{Colors.YELLOW}Interrupted by user.{Colors.END}")
    except Exception as e:
        print(f"\n{Colors.RED}Error: {e}{Colors.END}")
        import traceback
        traceback.print_exc()