# SECURITY & DATA INTEGRITY REPORT

## Project: Swiss Transparency Platform

**Status**: Live Data Application
**Data**: 100% Real — Swiss Parliamentary Records (LP 51) from ws.parlament.ch
**Review Date**: 2026-06-05

---

## Executive Summary

This application uses exclusively real data from official Swiss government APIs. All synthetic data has been purged.

### Data Sources

1. **Swiss Parliament OData API** (ws.parlament.ch)
   - 254 active Federal Assembly members (MemberCouncil endpoint)
   - 181 parliamentary committees (Committee endpoint)
   - 929 committee memberships (MembersCommittee endpoint)
   - 40 parliamentary votes with 290 individual voting records
   - Councillor mandates, biographical data, party affiliations

2. **Lobbywatch SPARQL** (lod.lobbywatch.ch)
   - Parliamentary mandates and interest declarations
   - Access rights (Zutrittsberechtigungen)

3. **Zefix Commercial Registry** (zefix.admin.ch)
   - Company verification and UID matching

---

## Completed Workstreams

### Data Integrity — COMPLETE

- All 500 synthetic politicians deactivated; 254 real councillors active
- 181 real committees from OData Committee endpoint (standing, special, sub-committees)
- 929 real committee memberships linked to active politicians
- All synthetic analytics (alerts, activity_log, campaign_contributions, lobbying_meetings) purged
- All views (politician_influence, politician_risk_scores) auto-compute from real data
- voting_similarity recomputed from real vote_records only
- Organizations view repurposed to show real committees

### Build Integrity — COMPLETE

- TypeScript strict mode with zero errors
- All `as any` type casts removed
- Search queries use parameterized ilike (no SQL injection)
- Inactive politicians filtered from all queries

### RLS — COMPLETE

- RLS enabled on all data tables
- Politicians: own-record read for authenticated users
- Organizations and political_parties: RLS enabled with read policies
- All tables have appropriate CRUD policies

---

## Recommendations

1. Schedule regular data syncs via edge functions for fresh votes
2. Add authentication for write operations
3. Fetch more vote data per session (currently limited to 40 votes)
4. Add French/Italian committee name translations
