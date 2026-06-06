# Remediation Roadmap

## Completed Workstreams

### Data Integrity — COMPLETE

- 254 real active Federal Assembly members from Parliament OData MemberCouncil
- 181 real committees from Parliament OData Committee endpoint
- 929 real committee memberships from MembersCommittee endpoint
- 40 parliamentary votes with 290 individual voting records
- All synthetic data purged: campaign_contributions, alerts, activity_log, lobbying_meetings, organizations
- Inactive politicians (246 synthetic) deactivated and filtered from all queries
- voting_similarity recomputed from real vote_records only
- Views (politician_influence, politician_risk_scores, mandate_vote_alignment) auto-compute from real data

### Build Integrity — COMPLETE

- TypeScript strict mode with zero errors
- All type casts removed
- Search queries parameterized against injection
- Build passes clean

### Architecture — COMPLETE

- Modular views in src/views/
- Shared types in src/types/
- Pure calculation functions in src/lib/calculations.ts
- Test coverage via Vitest
- All views query real data tables with graceful empty states

### Data Ingestion Pipeline — COMPLETE

- Edge functions: sync-parliament-votes, sync-lobbywatch, sync-zefix
- Provenance tracking in data_sync_log
- Raw data tables for all sources
- Data Ingestion UI view

---

## Remaining Improvements

1. Fetch more parliamentary votes (currently 40 of thousands available)
2. Add French/Italian translations for committee names
3. Implement CSV export sanitization
4. Add authentication for data modification operations
5. Schedule automated data syncs for fresh parliamentary data
