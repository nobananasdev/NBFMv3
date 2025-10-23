# Git Automation Guide

This project now has automated git commit tools set up for better version control.

## 🚀 Quick Commands

### Load Git Helpers
```bash
source scripts/git-helpers.sh
```

### Auto-commit based on file changes
```bash
auto_commit
```

### Quick conventional commits
```bash
quick_commit feat "add user authentication"
quick_commit fix "resolve login validation issue"
quick_commit docs "update API documentation"
```

### Session checkpoints
```bash
session_commit "feature-development"
session_commit "bug-fixing"
```

## 📋 Commit Types

- **feat**: new feature
- **fix**: bug fix
- **docs**: documentation
- **style**: formatting, missing semicolons, etc
- **refactor**: code change that neither fixes a bug nor adds a feature
- **test**: adding missing tests
- **chore**: maintenance, dependencies, config

## 🔧 Automated Features

### Pre-commit Hook
Automatically runs before each commit:
- ✅ Checks for large files (>10MB)
- ✅ Prevents accidental secret commits
- ✅ Runs ESLint if available

### Smart Auto-commits
The `auto_commit` function automatically detects:
- Component changes → `feat: update components`
- Logic changes → `refactor: update core logic`
- Documentation → `docs: update documentation`
- Dependencies → `chore: update dependencies`

## 💡 Best Practices

1. Use `auto_commit` for quick saves during development
2. Use `quick_commit` with specific types for important features
3. Use `session_commit` for end-of-day checkpoints
4. Manual commits with detailed messages for major features

## 🎯 Example Workflow

```bash
# Load helpers
source scripts/git-helpers.sh

# During development - quick saves
auto_commit

# Finished feature - specific commit
quick_commit feat "implement user profile page"

# End of session
session_commit "profile-feature-work"