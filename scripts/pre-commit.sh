#!/bin/bash

# Team Leader System v4.0 - Pre-commit Hook
# This script runs before each commit to ensure code quality

set -e

echo "🔍 Running pre-commit checks..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_error "Not in a git repository"
    exit 1
fi

# Get staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM)

if [ -z "$STAGED_FILES" ]; then
    print_status "No files staged for commit"
    exit 0
fi

echo "📁 Staged files:"
echo "$STAGED_FILES"

# 1. Check for TODO comments in staged files
echo ""
echo "🔍 Checking for TODO comments..."
TODO_FOUND=false

for file in $STAGED_FILES; do
    if [ -f "$file" ]; then
        if grep -q "TODO" "$file"; then
            print_warning "Found TODO comment in $file"
            TODO_FOUND=true
        fi
    fi
done

if [ "$TODO_FOUND" = true ]; then
    print_warning "TODO comments found. Consider addressing them before committing."
fi

# 2. Check for console.log statements in JavaScript files
echo ""
echo "🔍 Checking for console.log statements..."
CONSOLE_FOUND=false

for file in $STAGED_FILES; do
    if [[ "$file" == *.js ]] && [ -f "$file" ]; then
        if grep -q "console\.log" "$file"; then
            print_warning "Found console.log in $file"
            CONSOLE_FOUND=true
        fi
    fi
done

if [ "$CONSOLE_FOUND" = true ]; then
    print_warning "console.log statements found. Consider using the Logger instead."
fi

# 3. Check for hardcoded API keys
echo ""
echo "🔍 Checking for hardcoded API keys..."
API_KEY_FOUND=false

for file in $STAGED_FILES; do
    if [ -f "$file" ]; then
        if grep -q "sk-[a-zA-Z0-9]" "$file" || grep -q "AIza[a-zA-Z0-9]" "$file"; then
            print_error "Found potential API key in $file"
            API_KEY_FOUND=true
        fi
    fi
done

if [ "$API_KEY_FOUND" = true ]; then
    print_error "API keys found in staged files. Please remove them and use environment variables."
    exit 1
fi

# 4. Check file sizes
echo ""
echo "🔍 Checking file sizes..."
LARGE_FILES=false

for file in $STAGED_FILES; do
    if [ -f "$file" ]; then
        SIZE=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null || echo "0")
        if [ "$SIZE" -gt 1048576 ]; then  # 1MB
            print_warning "Large file detected: $file ($(($SIZE / 1024))KB)"
            LARGE_FILES=true
        fi
    fi
done

if [ "$LARGE_FILES" = true ]; then
    print_warning "Large files detected. Consider if they should be in .gitignore"
fi

# 5. Check for merge conflicts
echo ""
echo "🔍 Checking for merge conflicts..."
CONFLICT_FOUND=false

for file in $STAGED_FILES; do
    if [ -f "$file" ]; then
        if grep -q "<<<<<<< HEAD" "$file" || grep -q "=======" "$file" || grep -q ">>>>>>>" "$file"; then
            print_error "Merge conflict markers found in $file"
            CONFLICT_FOUND=true
        fi
    fi
done

if [ "$CONFLICT_FOUND" = true ]; then
    print_error "Merge conflicts found. Please resolve them before committing."
    exit 1
fi

# 6. Check for trailing whitespace
echo ""
echo "🔍 Checking for trailing whitespace..."
WHITESPACE_FOUND=false

for file in $STAGED_FILES; do
    if [ -f "$file" ]; then
        if grep -q "[[:space:]]$" "$file"; then
            print_warning "Trailing whitespace found in $file"
            WHITESPACE_FOUND=true
        fi
    fi
done

if [ "$WHITESPACE_FOUND" = true ]; then
    print_warning "Trailing whitespace found. Consider removing it."
fi

# 7. Check for proper file permissions
echo ""
echo "🔍 Checking file permissions..."
PERMISSION_ISSUES=false

for file in $STAGED_FILES; do
    if [ -f "$file" ]; then
        if [[ "$file" == *.sh ]] && [ ! -x "$file" ]; then
            print_warning "Shell script $file is not executable"
            PERMISSION_ISSUES=true
        fi
    fi
done

if [ "$PERMISSION_ISSUES" = true ]; then
    print_warning "Permission issues found. Consider fixing them."
fi

# 8. Run tests if package.json is modified
echo ""
echo "🔍 Checking if tests need to be run..."

if echo "$STAGED_FILES" | grep -q "package.json\|package-lock.json"; then
    print_status "Dependencies modified, running tests..."
    if command -v npm >/dev/null 2>&1; then
        npm test || {
            print_error "Tests failed"
            exit 1
        }
    else
        print_warning "npm not found, skipping tests"
    fi
fi

# 9. Check for sensitive files
echo ""
echo "🔍 Checking for sensitive files..."
SENSITIVE_FILES=false

for file in $STAGED_FILES; do
    if [[ "$file" == .env* ]] || [[ "$file" == *.key ]] || [[ "$file" == *.pem ]]; then
        print_error "Sensitive file detected: $file"
        SENSITIVE_FILES=true
    fi
done

if [ "$SENSITIVE_FILES" = true ]; then
    print_error "Sensitive files found. Please add them to .gitignore"
    exit 1
fi

# 10. Final status
echo ""
print_status "Pre-commit checks completed successfully!"
echo "🚀 Ready to commit!"

exit 0 