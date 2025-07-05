# No Bananas For Me

A TV series recommendation web application built with Next.js 14+ and Supabase.

## 🚨 IMPORTANT: Git Automation Active

**This project has automated git commit tools set up!**

- **Before coding**: Run `source scripts/git-helpers.sh`
- **Quick commits**: Use `auto_commit` or `quick_commit <type> <message>`
- **Full guide**: See [`GIT_AUTOMATION_GUIDE.md`](GIT_AUTOMATION_GUIDE.md)
- **Pre-commit hooks active**: Checks files, secrets, linting before each commit

**Available commands:**
```bash
source scripts/git-helpers.sh  # Load helpers first
auto_commit                    # Smart auto-commit based on changes
quick_commit feat "new thing"  # Conventional commit
session_commit "work-name"     # Session checkpoint
```

## Features

- **Discovery Feed** - Browse curated TV shows with rating system
- **Personal Lists** - Organize shows into Watchlist and Rated lists
- **New Seasons Tracking** - Get notified about upcoming seasons
- **User Authentication** - Secure login with Supabase Auth
- **Rating System** - Simple 3-option rating (Loved It, Liked It, Not For Me)

## Tech Stack

- **Frontend**: Next.js 14+ with App Router, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Authentication, Storage)
- **Development**: Local development on localhost:3000

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Environment variables are already configured in `.env.local`

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── globals.css     # Global styles with Tailwind
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Homepage
├── components/         # Reusable UI components
├── lib/               # Utility functions and configurations
│   └── supabase.ts    # Supabase client setup
└── types/             # TypeScript definitions
    └── database.ts    # Database schema types
```

## Development Guidelines

- Components are Server Components by default
- Only add "use client" when needed for interactivity
- Keep dependencies minimal
- Follow the mobile-first responsive design approach

## Database Schema

The application connects to an existing Supabase database with the following main tables:

- `shows` - TV show data with metadata, ratings, and streaming info
- `profiles` - User profiles and preferences
- `user_shows` - User-show relationships (watchlist, ratings)
- `genres` - Genre lookup table

## Color Scheme

- **Page Background**: #faf9f7 (light warm beige)
- **Card Background**: #ffffff (pure white)
- **Shadow**: 0 2px 8px rgba(0,0,0,0.08)
- **Hover Shadow**: 0 4px 16px rgba(0,0,0,0.12)
- **Border Radius**: 12px cards, 8px buttons
- **Transitions**: all 0.2s ease