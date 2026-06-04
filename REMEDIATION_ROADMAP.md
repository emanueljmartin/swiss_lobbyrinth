# REMEDIATION ROADMAP

## Completed Workstreams

### Data Integrity — COMPLETE
- Replaced synthetic politician data with 254 real active Federal Assembly members
- Seeded 30 real parliamentary votes from LP 51 (Herbstsession 2023)
- Removed all synthetic data warning banners and disclaimers
- Data provenance tracked via `data_sync_log` and `parliament_members_raw`

### Build Integrity — COMPLETE
- TypeScript checking enforced at build time
- All type errors resolved
- ESLint configured and passing

### Architecture — COMPLETE
- Monolith split into modular views
- Shared types in `src/types/`
- Pure calculation functions extracted to `src/lib/calculations.ts`
- Test coverage via Vitest

### Data Ingestion Pipeline — COMPLETE
- Edge functions: sync-parliament-votes, sync-lobbywatch, sync-zefix
- Provenance tracking in data_sync_log
- Raw data tables for all sources
- Data Ingestion UI view

### Documentation — COMPLETE
- README updated to reflect real data sources
- Environment template provided
- Architecture documented

---

## Remaining Improvements

1. Schedule regular data syncs for fresh parliamentary data
2. Add authentication for data modification operations
3. Implement CSV export sanitization
4. Add more comprehensive test coverage
5. Support multiple languages (DE/FR/IT)
