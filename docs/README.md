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

- **Discovery Feed** – Curated TV shows with preloaded infinite scroll and smooth image loading
- **Search & Suggestions** – Inline search panel with live suggestions (title, creators, cast), highlights, and full results
- **Filters** – Genres, year range, and streaming providers for Discovery (staged apply, smart fetching)
- **Personal Lists** – Watchlist and Rated (Loved It, Liked It, Not For Me)
- **New Seasons Tracking** – Upcoming and recently released seasons for liked/loved shows
- **Navigation Counters** – Discovery total count; Watchlist/Rated/New Seasons are user-specific and refresh after actions
- **User Authentication** – Supabase Auth; mock user enabled locally for development
- **Rating System** – 3-option rating (Loved It, Liked It, Not For Me) + Watchlist action

## Tech Stack

- **Frontend**: Next.js 14+ with App Router, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Authentication, Storage)
- **Development**: Local development on localhost:3000

## UI Theme

- **Style**: Dark, glassmorphism-inspired with subtle gradients and animations
- **Cards**: Consistent height, rounded corners, hover elevation and gentle scale
- **Images**: Optimized URLs with blur placeholders; “NEW” badge for recent releases
- **Actions**: Animated success messages (e.g., “Loved it! ❤️”, “Liked it! 👍”, “Bananas! 🍌”)

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

### Environment

Create `.env.local` (or reuse existing) with:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

In development, a mock user is auto-initialized to simplify testing. The header includes a “Reset Data” button to clear mock user lists/ratings.

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── globals.css     # Global styles with Tailwind
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Homepage
├── components/         # Reusable UI components
│   ├── layout/         # Header, navigation, main layout
│   ├── sections/       # Discovery, Watchlist, Rated, New Seasons
│   └── ui/             # SortSelector, FilterSidebar, SearchPanel, etc.
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

- **Background**: Layered radial/linear gradients over a dark base
- **Card/Glass**: Semi-transparent surfaces with soft borders and blur
- **Accents**: Indigo/Purple gradients; success/ready states with subtle pulses
- **Motion**: fade-in, slide-up, and success-bounce animations; quick and unobtrusive

## Navigation & Views

- **Navigation**: Discovery, New Seasons, Watchlist, Rated; sticky; counters refresh after actions; clicking Discovery again resets search
- **Discovery**: Infinite scroll with image preloading; sorts: Latest Shows, By Rating; inline search and filter sidebar
- **Watchlist**: Sorts by Recently Added or Best Rated
- **Rated**: Sorts by Recently Added or By Rating (grouped logic)
- **New Seasons**: Upcoming and last 6 months, infinite scroll
