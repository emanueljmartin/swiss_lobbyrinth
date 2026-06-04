# SECURITY & DATA INTEGRITY REPORT

## Project: Swiss Lobbying Transparency Platform

**Status**: Live Data Application
**Data**: Real Swiss Parliamentary Records (LP 51) + Lobbywatch + Zefix
**Review Date**: 2026-06-04

---

## Executive Summary

This application uses real data from official Swiss government APIs to analyze political transparency. Previous synthetic data concerns have been fully resolved.

### Data Sources

1. **Swiss Parliament OData API** (ws.parlament.ch)
   - 254 active Federal Assembly members
   - Votes and individual votings from Legislative Period 51
   - Member council data including party, canton, council affiliation

2. **Lobbywatch SPARQL** (lod.lobbywatch.ch)
   - Parliamentary mandates and interest declarations
   - Access rights (Zutrittsberechtigungen)
   - Sector and compensation data

3. **Zefix Commercial Registry** (zefix.admin.ch)
   - Company legal form, status, capital
   - UID-based matching to organizations

---

## Completed Workstreams

### Data Integrity — COMPLETE

- Removed all synthetic data warning banners
- Replaced synthetic politicians with 254 real active councillors
- Seeded 30 real parliamentary votes from Herbstsession 2023
- Data provenance tracked via `data_sync_log` and `raw_json` columns
- All source attribution is accurate

### Build Integrity — COMPLETE

- TypeScript checking enforced at build time
- All type errors resolved
- Strict mode enabled

### Data Ingestion Pipeline — COMPLETE

- Edge functions for Parliament OData, Lobbywatch SPARQL, Zefix
- Provenance tracking in `data_sync_log`
- Raw data preserved in `_raw` tables

---

## Remaining Security Considerations

### RLS Policies
- All tables have RLS enabled
- Public SELECT policies on read-only data
- Service role key restricted to backend edge functions

### Export Function
- CSV formula injection protection needed
- Auth enforcement recommended

---

## Recommendations

1. Schedule regular data syncs via edge functions
2. Add authentication for write operations
3. Implement rate limiting on API calls
4. Add unit test coverage for calculation functions
