#!/bin/bash

# Git helper scripts for automatic commits

# Quick commit with conventional commit format
quick_commit() {
    local type=$1
    local message=$2
    
    if [ -z "$type" ] || [ -z "$message" ]; then
        echo "Usage: quick_commit <type> <message>"
        echo "Types: feat, fix, docs, style, refactor, test, chore"
        return 1
    fi
    
    git add .
    git commit -m "$type: $message"
}

# Auto-commit based on file changes
auto_commit() {
    local changes=$(git status --porcelain)
    
    if [ -z "$changes" ]; then
        echo "No changes to commit"
        return 0
    fi
    
    # Analyze changes and suggest commit type
    if echo "$changes" | grep -q "src/components"; then
        echo "🎨 Component changes detected"
        git add src/components/
        git commit -m "feat: update components"
    elif echo "$changes" | grep -q "src/lib\|src/hooks"; then
        echo "⚡ Logic changes detected"
        git add src/lib/ src/hooks/
        git commit -m "refactor: update core logic"
    elif echo "$changes" | grep -q "\.md$"; then
        echo "📝 Documentation changes detected"
        git add "*.md"
        git commit -m "docs: update documentation"
    elif echo "$changes" | grep -q "package.*\.json"; then
        echo "📦 Dependency changes detected"
        git add package*.json
        git commit -m "chore: update dependencies"
    else
        echo "🔧 General changes detected"
        git add .
        git commit -m "chore: general updates"
    fi
}

# Commit with timestamp for work sessions
session_commit() {
    local session_name=${1:-"work-session"}
    local timestamp=$(date +"%Y%m%d-%H%M")
    
    git add .
    git commit -m "chore: $session_name checkpoint - $timestamp"
}

# Export functions for use
export -f quick_commit
export -f auto_commit
export -f session_commit

echo "Git helpers loaded! Available commands:"
echo "  quick_commit <type> <message>"
echo "  auto_commit"
echo "  session_commit [session-name]"