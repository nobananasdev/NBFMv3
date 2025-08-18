#!/bin/bash

# Quick Upload Script - One command to commit and push everything
# This script handles all git operations and provides better error handling

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Default commit message if none provided
DEFAULT_MESSAGE="feat: update project files"
COMMIT_MESSAGE="${1:-$DEFAULT_MESSAGE}"

print_status "Starting quick upload process..."

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    print_error "Not in a git repository!"
    exit 1
fi

# Check git status
print_status "Checking git status..."
if git diff --quiet && git diff --cached --quiet; then
    print_warning "No changes detected. Nothing to commit."
    exit 0
fi

# Clean up any hanging git processes
print_status "Cleaning up any stuck git processes..."
pkill -f "git commit" 2>/dev/null || true
pkill -f "git add" 2>/dev/null || true

# Add all changes
print_status "Adding all changes..."
git add . || {
    print_error "Git add failed"
    exit 1
}

# Check if there are staged changes
if git diff --cached --quiet; then
    print_warning "No staged changes found."
    exit 0
fi

# Commit changes
print_status "Committing with message: '$COMMIT_MESSAGE'"
git commit -m "$COMMIT_MESSAGE" || {
    print_error "Git commit failed"
    exit 1
}

# Push to remote
print_status "Pushing to GitHub..."
git push origin main 2>/dev/null || git push origin master 2>/dev/null || {
    print_error "Git push failed"
    print_warning "You may need to push manually with: git push origin main"
    exit 1
}

print_success "✅ Successfully uploaded all changes to GitHub!"
print_success "📝 Commit: $COMMIT_MESSAGE"
print_success "🚀 Changes are now live on GitHub"