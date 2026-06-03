# Swiss Lobbying Transparency Platform

**⚠️ RESEARCH PROTOTYPE - SYNTHETIC DATA ONLY**

This application is a research prototype demonstrating political transparency analysis. **All data in this application is completely fabricated and does not represent actual Swiss parliamentary records, government data, or real individuals.**

## Important Disclaimer

- **NOT** based on real Swiss Parliament data
- **NOT** affiliated with Swiss government
- **NOT** suitable for actual political analysis or decision-making
- Research and demonstration purposes only
- Synthetic dataset for UI/UX and architecture testing

## Features

- **Political Network Visualization** - Display of fabricated relationships between politicians, organizations, and voting patterns
- **Conflict Detection** - Demonstration algorithm for identifying conflicts of interest (synthetic data)
- **Campaign Finance Tracking** - Interface for campaign contribution patterns (fabricated data)
- **Lobbying Activity Analysis** - Simulated meeting and relationship records
- **Voting Record Patterns** - Synthetic voting data for analysis demonstrations
- **Real-Time Monitoring** - Live alert system demonstration
- **Predictive Analytics** - ML model demonstrations (trained on synthetic data)

## Technology Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS + Lucide React
- **Backend**: Supabase PostgreSQL with Row Level Security
- **Build**: Vite + TypeScript with strict type checking
- **Deployment**: Edge Functions, REST API

## Quick Start

### Prerequisites

- Node.js 16+
- Supabase account (free tier available at https://supabase.com)

### Installation

```bash
# Clone and install dependencies
npm install

# Create environment file
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
```

### Development

```bash
npm run dev
```

Opens at `http://localhost:5173`

### Production Build

```bash
npm run build
```

Runs TypeScript checking first, then Vite build. All three must pass:

```bash
npm run typecheck  # Type safety
npm run lint       # Code quality
npm run build      # Production bundle
```

## Environment Setup

Create `.env.local` with:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_public_anon_key
```

See `.env.example` for template.

## Database

All data is seeded synthetically via migrations in `supabase/migrations/`. Tables include:

- `politicians`, `organizations`, `mandates`
- `interests`, `parliamentary_votes`, `vote_records`
- `committees`, `campaign_contributions`
- Analytics and monitoring tables

## Security

- Row Level Security (RLS) enforced on all tables
- Read-only access for authenticated users
- Authentication required for sensitive operations
- Edge Functions sanitize inputs and enforce auth
- CSV exports protected against formula injection

## Architecture

### App Structure

- `src/App.tsx` - Main application routing and state
- `src/views/` - Page-level components
- `src/components/` - Reusable UI components
- `src/lib/` - Database queries and utilities
- `src/types/` - TypeScript type definitions

### Database

- Migrations auto-seed synthetic data
- RLS policies enforce data access control
- Public read-only views for aggregations
- Service role key restricted to backend

## Development Workflow

1. Create feature branch from `main`
2. Run `npm run typecheck && npm run lint && npm run build` before each commit
3. Make changes in small, reviewable chunks
4. All tests and checks must pass
5. Create pull request with clear description

## Limitations & Known Issues

- Data is 100% synthetic and randomized
- Not suitable for production political analysis
- Limited to demonstration features
- No real-time parliamentary data integration
- Performance optimized for ~1000 records (demo scale)

## Integration with Real Data

To integrate actual Swiss parliamentary data:

1. Use the official Swiss Parliament API: https://www.parlament.ch/de/Über-das-Parlament/Aufträge-und-Behörden/Parlamentarische-Dienste
2. Replace seed migrations with real data import
3. Update data source attribution
4. Implement proper data validation
5. Add audit logging for data changes

## Official Data Sources

For accurate Swiss political information:

- **Swiss Parliament**: https://www.parlament.ch (official legislative records)
- **Federal Statistics Office**: https://www.bfs.admin.ch (demographic and voting data)
- **Swiss Business Registry (Handelsregister)**: https://www.shab.ch (organization data)
- **Federal Office of Justice**: https://www.bj.admin.ch (legal data)

## Project Structure

```
project/
├── src/
│   ├── App.tsx                 # Main app component
│   ├── components/             # Reusable UI components
│   ├── views/                  # Page-level views
│   ├── lib/
│   │   ├── supabase.ts         # DB client setup
│   │   └── queries.ts          # Database queries
│   ├── types/                  # TypeScript definitions
│   └── index.css               # Global styles
├── supabase/
│   ├── migrations/             # Database migrations
│   └── functions/              # Edge Functions
├── public/                     # Static assets
├── .env.example               # Environment template
└── package.json               # Dependencies
```

## Contributing

This is a research project. To contribute:

1. Ensure synthetic data is clearly labeled
2. Add comprehensive comments for non-obvious logic
3. Test TypeScript builds and linting
4. Document major architectural decisions

## License

MIT - See LICENSE file for details.

---

**Status**: Research Prototype | **Data**: 100% Synthetic | **Updated**: 2026-06-02

⚠️ **Remember**: This application uses completely fabricated data. Do not use for actual policy decisions or analysis without proper real data integration and verification.
