# Swiss Lobbying Transparency Platform

A political transparency analysis platform using real data from the Swiss Federal Assembly.

## Data Sources

- **Swiss Parliament OData API** (`ws.parlament.ch/odata.svc`) — Councillors, votes, individual votings
- **Lobbywatch SPARQL** (`lod.lobbywatch.ch`) — Parliamentary mandates, access rights
- **Zefix Commercial Registry** (`zefix.admin.ch`) — Company legal data and UIDs
- 254 active Federal Assembly members from Legislative Period 51
- Parliamentary votes from Herbstsession 2023 and ongoing

## Features

- **Political Network Visualization** — Relationships between politicians, organizations, and voting patterns
- **Conflict Detection** — Algorithm for identifying conflicts of interest from declared mandates
- **Voting Similarity Engine** — MP-to-MP and party-to-party alignment analysis
- **Influence-to-Vote Correlation** — Cross-reference mandates with voting behaviour
- **Data Ingestion Control** — Provenance-tracked sync from official APIs
- **Sector Analysis** — Lobbying exposure by economic sector

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
npm install
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

## Environment Setup

Create `.env.local` with:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_public_anon_key
```

See `.env.example` for template.

## Database

Data is sourced via migrations and edge functions from official Swiss APIs:

- `politicians`, `organizations`, `mandates` — real councillor and org data
- `parliamentary_votes`, `vote_records` — real LP 51 votes
- `parliament_members_raw`, `parliament_votes_raw` — raw OData ingestion
- `lobbywatch_mandates_raw`, `lobbywatch_access_rights_raw` — raw Lobbywatch data
- `zefix_companies_raw` — commercial registry enrichment
- `data_sync_log` — provenance tracking for all syncs

### Edge Functions

- `sync-parliament-votes` — Fetches votes, votings, and members from Parliament OData
- `sync-lobbywatch` — Fetches mandates and access rights via SPARQL
- `sync-zefix` — Enriches organizations with commercial registry data
- `import-parliament-data` — Legacy councillor import

## Security

- Row Level Security (RLS) enforced on all tables
- Read-only access for authenticated users
- Edge Functions sanitize inputs and enforce auth
- CSV exports protected against formula injection

## Architecture

### App Structure

- `src/App.tsx` — Main application routing and state
- `src/views/` — Page-level components
- `src/components/` — Reusable UI components
- `src/lib/` — Database queries, calculations, and utilities
- `src/types/` — TypeScript type definitions

### Database

- Real data from Swiss Parliament OData API (LP 51)
- RLS policies enforce data access control
- Public read-only views for aggregations
- Service role key restricted to backend

## Project Structure

```
project/
├── src/
│   ├── App.tsx                 # Main app component
│   ├── components/             # Reusable UI components
│   ├── views/                  # Page-level views
│   ├── lib/
│   │   ├── supabase.ts         # DB client setup
│   │   ├── queries.ts          # Database queries
│   │   └── calculations.ts    # Pure analysis functions
│   ├── types/                  # TypeScript definitions
│   └── index.css               # Global styles
├── supabase/
│   ├── migrations/             # Database migrations
│   └── functions/              # Edge Functions
├── public/                     # Static assets
├── .env.example               # Environment template
└── package.json               # Dependencies
```

## License

MIT — See LICENSE file for details.

---

**Data**: Live Swiss Parliament Records | **Updated**: 2026-06-04
