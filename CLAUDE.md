# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SportsBet is a sports betting research tool that provides odds data, parlay building, and AI-powered suggestions. It consists of a React 19 frontend with a Node.js/Express backend, using SQLite for persistence.

**Important**: This is a research-only tool. All betting suggestions include disclaimers that this is not financial or betting advice.

## Development Commands

```bash
# Development - run both frontend and backend
npm run dev:all          # Runs server.js + vite concurrently

# Alternatively, run separately:
npm run dev              # Vite dev server (frontend on :5173)
npm run dev:server       # Express server (backend on :3001)

# Production build
npm run build            # Vite production build
npm start                # Run production server

# Linting
npm run lint
```

## Docker

```bash
docker-compose up --build       # Build and run container
docker-compose up -d            # Run in background
docker-compose logs -f          # View logs
```

Container exposes port 8083 (maps to internal 3001). SQLite data persists via volume mount to `./data`.

## Architecture

### Frontend (`src/`)
- **React 19** with Vite, React Router 7, Tailwind CSS 4, Framer Motion
- Pages: Home, Builder (parlay builder), Suggestions (AI recommendations), Settings (user prefs), Login/Register
- Context providers: `AuthContext` (authentication state), `ParlayContext` (parlay building state)
- Components organized by feature: `components/Auth/`, `components/Games/`, `components/Parlay/`, etc.

### Backend (`server/` + `server.js`)
- **Express 5** server with JWT cookie-based authentication
- Routes: `/api/auth`, `/api/odds`, `/api/parlays`, `/api/suggestions`
- SQLite via `better-sqlite3` (WAL mode enabled)
- Database location: `data/sportsbet.db` (dev) or `/app/data/sportsbet.db` (Docker)

### External APIs
- **The Odds API** (`ODDS_API_KEY`): Live odds for NFL, NBA, MLB from DraftKings
- **Anthropic Claude** (`ANTHROPIC_API_KEY`): AI-powered parlay suggestions and analysis (uses claude-3-haiku)
- Falls back to mock data if API keys not configured

### Database Schema (`server/db/schema.sql`)
Tables: `users`, `preferences` (favorite teams, risk tolerance), `parlays` (saved parlays with legs as JSON), `suggestions` (analysis history)

## API Patterns

- Protected routes use `authenticateToken` middleware
- Many routes also support `optionalAuth` for enhanced features when logged in
- Parlay legs stored as JSON arrays in SQLite
- American odds converted to decimal for combined parlay calculations
