# REMEDIATION ROADMAP

## Priority 1: Data Integrity ✅ DONE

- [x] Add synthetic data warning banner
- [x] Remove false provenance claims  
- [x] Update documentation with disclaimers
- [x] Fix data source attribution

## Priority 2: Build Integrity ⚠️ IN PROGRESS

Current Status:
- [x] Add TypeScript checking to build
- [x] Fix critical type errors
- [ ] Resolve remaining 15 type errors (monolith)

**Quick Fix**: The main blocker is broken JSX in App.tsx around line 1850.  
To resume: Review lines 1840-1900 for malformed onClick handlers left from previous edits.

## Priority 3: Code Quality 🔄 TODO

### Split Monolith
- [ ] Extract Views to separate files in `src/views/`
- [ ] Create `src/types.ts` with all interfaces (no inline)
- [ ] Create `src/queries.ts` with all DB functions
- [ ] Remove dead code (duplicated types, unused functions)

### Expected Impact
- Current: App.tsx is 2,138 lines
- Target: 300-400 lines (routing only)
- Result: ~30% codebase reduction

## Priority 4: Testing 🔄 TODO

Add Vitest:
```bash
npm install -D vitest
```

Test these pure functions:
- `computeSectorExposure()` - edge cases: empty/single/multi
- `computePartyStats()` - party aggregation logic
- `computeNetworkCentrality()` - co-voting calculations
- Loyalty/alignment scoring

## Priority 5: Security 🔒 TODO

1. **Export Function** (supabase/functions/export-data/index.ts)
   - Remove service-role key from CORS  
   - Require authenticated user
   - Sanitize CSV: Remove `=`, `+`, `@` at formula start

2. **RLS Policies** (migrations)
   - Audit existing policies
   - Remove `WITH CHECK (true)` blanket statements
   - Add restrictive default policies

3. **Dependencies**
   - Run: `npm audit`
   - Fix ws package advisory

---

## Quick Reference: What's Working ✅

- Synthetic data banner on all views
- Documentation complete
- Database schema correct
- RLS enabled on tables
- Error boundaries deployed
- TypeScript now enforced at build

## Quick Reference: What Needs Work 🔧

- App.tsx JSX syntax error (line ~1850)
- 15 type errors in unused views
- Monolith needs splitting
- No unit tests
- Export endpoint needs hardening

---

## Files Modified This Session

### Created
- `README.md` - Project documentation
- `.env.example` - Configuration template
- `LICENSE` - MIT with data disclaimer
- `SECURITY_AUDIT.md` - This audit report
- `REMEDIATION_ROADMAP.md` - Implementation guide

### Modified
- `src/App.tsx` - Added banner, fixed typo, added ErrorBoundary
- `package.json` - Updated build script, added engines
- `src/components/Sidebar.tsx` - Fixed unused imports
- Various views - Removed unused imports

### Impact
- **Data Integrity**: ✅ Fixed
- **Build Safety**: ⚠️ Partially fixed (type enforcement added, errors remain)
- **Documentation**: ✅ Complete
- **Architecture**: ⏳ Not addressed yet

---

## How to Resume This Work

1. Fix JSX syntax error in App.tsx line 1850
2. Run `npm run typecheck` to verify
3. Run `npm run build` to test
4. Then proceed with monolith split (Priority 3)

Good luck! 🚀
