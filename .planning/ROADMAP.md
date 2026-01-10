# BlackPill Bug Fix Milestone — Roadmap

## Overview

Fix critical bugs blocking core functionality and polish UI issues. Phases ordered by severity: core functionality first, then UI polish.

## Phases

### Phase 1: Photo Saving
**Goal:** Fix photos not saving to Supabase Storage

**Scope:**
- Diagnose photo upload failure (client-side or server-side)
- Fix Supabase Storage upload in camera/capture flow
- Verify photos persist and can be retrieved
- Update both `mobile/` and `shemax-mobile/`

**Research needed:** Yes — need to identify root cause before fixing

**Success:** Photos captured in app save successfully to Supabase Storage

---

### Phase 2: Analysis Pipeline
**Goal:** Fix end-to-end analysis flow (capture → AI → results)

**Scope:**
- Diagnose analysis failure point (Edge Function, OpenAI API, DB write)
- Fix the `ai` Edge Function if broken
- Verify analysis results save to database
- Confirm results display in app

**Research needed:** Yes — need to trace failure through pipeline

**Success:** User can take photo, get AI analysis, see results

---

### Phase 3: Analysis UI — Feature Scores
**Goal:** Add dropdown arrows and decimal precision to feature scores

**Scope:**
- Add expandable dropdown arrows to feature score components
- Show detailed breakdowns when expanded
- Display scores with decimal precision (7.8 not 8)
- Update both mobile apps

**Research needed:** No — UI implementation task

**Success:** Feature scores show dropdowns with details, scores have decimals

---

### Phase 4: Analysis UI — Performance & Layout
**Goal:** Fix lag and layout issues on analysis screens

**Scope:**
- Profile and optimize analysis results screen performance
- Fix layout issues on final analysis screen
- Reduce unnecessary re-renders
- Update both mobile apps

**Research needed:** Yes — need to profile to find bottleneck

**Success:** Analysis screens render smoothly without lag, layout correct

---

### Phase 5: Shop & Coach UI
**Goal:** Fix title overflow issues on Shop and AI Coach screens

**Scope:**
- Fix Shop screen title overflow (floating off screen)
- Fix AI Coach screen title overflow
- Verify text truncation/wrapping works correctly
- Update both mobile apps

**Research needed:** No — straightforward CSS/layout fix

**Success:** All titles stay within screen bounds

---

## Summary

| Phase | Name | Research | Status | Plans |
|-------|------|----------|--------|-------|
| 1 | Photo Saving | Yes | **Completed** | 1 |
| 2 | Analysis Pipeline | Yes | Pending | 0 |
| 3 | Analysis UI — Feature Scores | No | Pending | 0 |
| 4 | Analysis UI — Performance & Layout | Yes | Pending | 0 |
| 5 | Shop & Coach UI | No | Pending | 0 |

---
*Created: 2026-01-10*
*Updated: 2026-01-10*
