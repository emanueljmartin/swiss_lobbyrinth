# Swiss Lobbying Transparency Platform

**⚠️ RESEARCH PREVIEW - SYNTHETIC DATA ONLY**

This is a prototype research application demonstrating political transparency analysis. **All data in this application is completely fabricated and does not represent actual Swiss parliamentary records, government data, or real individuals.**

## Important Disclaimer

- ❌ **NOT** based on real Swiss Parliament data
- ❌ **NOT** affiliated with Swiss government
- ❌ **NOT** suitable for actual political analysis
- ✅ Research and demonstration purposes only
- ✅ Synthetic dataset for UI/UX testing
- ✅ Educational architecture examples

## Features

- Political network visualization (synthetic data)
- Conflict of interest detection algorithm (demonstration)
- Campaign finance tracking interface (fabricated data)
- Lobbying activity analysis (simulated)
- Voting record patterns (synthetic)
- Real-time monitoring system (demo)
- Predictive voting models (test implementation)

## Technology Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS + Lucide React
- **Backend**: Supabase PostgreSQL
- **Build**: Vite + TypeScript
- **Database**: PostgreSQL with RLS

## Quick Start

### Requirements
- Node.js 16+
- Supabase account (free tier works)

### Installation

```bash
npm install
npm run build
npm run dev
```

### Environment Setup

Create `.env`:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

See `.env.example` for reference.

## Development Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build (with typecheck)
npm run typecheck    # Run TypeScript compiler
npm run lint         # ESLint validation
```

## Database

All tables are automatically seeded with synthetic data via migrations in `supabase/migrations/`.

Tables include:
- politicians, organizations, mandates
- interests, votes, committees  
- lobbying_meetings, campaign_contributions
- alerts, activity_log, voting_anomalies

## Project Status

- **Data**: 100% Synthetic/Fabricated
- **Purpose**: Research prototype
- **Production Ready**: No
- **Real Data**: None

##For Actual Swiss Political Data

Consult official sources:
- https://www.parlament.ch (Swiss Parliament)
- https://www.bfs.admin.ch (Federal Statistics)
- https://www.shab.ch (Swiss Business Registry)

## License

See LICENSE file

---

**Status**: Research Prototype | **Data**: Synthetic | **Updated**: June 2026
