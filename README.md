# Swiss Transparency Platform

A political transparency analysis platform built on real data from official Swiss government APIs.

## Data Sources

- **Swiss Parliament OData API** (`ws.parlament.ch/odata.svc`) — 254 active councillors, 181 committees, 929 committee memberships, 40 parliamentary votes, 290 voting records
- **Lobbywatch SPARQL** (`lod.lobbywatch.ch`) — Parliamentary mandates, access rights, interest declarations
- **Zefix Commercial Registry** (`zefix.admin.ch`) — Company legal data and UID matching

All data is sourced from official APIs. No synthetic or fabricated data is used.

## Features

- **Politician Profiles** — 254 active Federal Assembly members with mandates, committee positions, and voting records
- **Committee Browser** — 181 standing, special, and sub-committees with real membership data
- **Voting Analysis** — Vote-by-vote records and MP-to-MP similarity scoring
- **Conflict Detection** — Risk flags derived from declared interests and mandate overlap
- **Influence Rankings** — Weighted scoring from mandates, committees, and voting participation
- **Cross-Party Alignment** — Identify unusual voting similarity across party lines
- **Network Analysis** — Committee networks and influence hubs from real parliamentary data

## Technology Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS + Lucide React
- **Backend**: Supabase PostgreSQL with Row Level Security
- **Build**: Vite + TypeScript with strict type checking
- **APIs**: Parliament OData, Lobbywatch SPARQL, Zefix REST

## Quick Start

### Prerequisites

- Node.js 16+
- Supabase account (free tier at https://supabase.com)

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

### Production Build

```bash
npm run build
```

## Environment

Create `.env.local` with:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_public_anon_key
```

## Database

All tables use Row Level Security. Data sourced from official APIs:

- `politicians` — 254 active councillors from Parliament OData MemberCouncil
- `committees` — 181 committees from Parliament OData Committee endpoint
- `committee_memberships` — 929 real memberships from MembersCommittee endpoint
- `parliamentary_votes` / `vote_records` — Real voting data from Parliament OData
- `voting_similarity` — Computed pairwise similarity scores
- `politician_influence` / `politician_risk_scores` — Materialized views on real data

### Edge Functions

- `sync-parliament-votes` — Fetches votes, votings, and members from Parliament OData
- `sync-lobbywatch` — Fetches mandates and access rights via SPARQL
- `sync-zefix` — Enriches organizations with commercial registry data
- `import-parliament-data` — Councillor import from MemberCouncil OData

## Security

- Row Level Security (RLS) on all tables
- Read-only public access for browsing
- Edge functions enforce authentication and input sanitization
- No service role keys exposed to the client

## Project Structure

```
project/
├── src/
│   ├── App.tsx                 # Main app with routing and inline views
│   ├── components/             # Reusable UI components
│   ├── views/                  # Page-level view components
│   ├── lib/
│   │   ├── supabase.ts         # Supabase client
│   │   ├── queries.ts          # Database queries
│   │   └── calculations.ts    # Pure analysis functions
│   └── types/                  # TypeScript type definitions
├── supabase/
│   ├── migrations/             # Database schema and data migrations
│   └── functions/              # Edge Functions for API sync
├── .env.example                # Environment template
└── package.json
```

## License

MIT — See LICENSE file.

---

**Data**: Swiss Federal Assembly Official Records (LP 51) | **Updated**: 2026-06-05
