# BlackPill Bug Fix Milestone

## Vision

Fix critical bugs blocking core functionality and polish UI issues degrading user experience across the BlackPill mobile app.

## Problem Statement

The app has multiple breaking issues:
1. **Photos not saving** — core functionality completely broken
2. **Analyses not working** — core functionality completely broken
3. **Analysis UI broken** — missing dropdown arrows for feature score details, no decimal points on scores
4. **Analysis results laggy** — poor performance degrades UX
5. **Last analysis screen UI messed up** — layout issues
6. **Shop UI broken** — titles floating off screen
7. **AI Coach title floating off screen** — layout issue

Users cannot complete the primary flow (take photo → get analysis → see results).

## Success Criteria

- [ ] Photos save successfully to Supabase Storage
- [ ] Analysis flow completes end-to-end (capture → AI processing → results)
- [ ] Feature scores show dropdown arrows with detailed breakdowns
- [ ] Scores display with decimal precision (e.g., 7.8 not 8)
- [ ] Analysis results screen performs smoothly (no lag)
- [ ] Final analysis screen layout renders correctly
- [ ] Shop screen titles stay within bounds
- [ ] AI Coach screen title renders correctly

## Requirements

### Validated

- ✓ Dual mobile apps (BlackPill + SheMax) sharing codebase — existing
- ✓ Supabase BaaS architecture with RLS — existing
- ✓ Face analysis via OpenAI Vision API — existing
- ✓ RevenueCat subscription management — existing
- ✓ Tab navigation (Home, Progress, Shop, Coach, Profile) — existing
- ✓ Authentication flow (Email/Apple/Google) — existing
- ✓ Daily routines tracking — existing
- ✓ Progress photos & timelapse — existing
- ✓ AI Coach conversations — existing

### Active

- [ ] Fix photo saving to Supabase Storage
- [ ] Fix analysis pipeline (Edge Function → OpenAI → DB)
- [ ] Add dropdown arrows to feature scores in analysis UI
- [ ] Display decimal precision on scores
- [ ] Optimize analysis results screen performance
- [ ] Fix last analysis screen layout
- [ ] Fix Shop screen title overflow
- [ ] Fix AI Coach screen title overflow

### Out of Scope

- New features — strictly bug fixes
- Backend refactoring — minimal changes to fix issues
- Web app changes — mobile-only focus

## Constraints

- Must update both `mobile/` and `shemax-mobile/` for any changes
- No breaking changes to existing user data
- iOS primary target (issues confirmed there)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Fix core functionality first | Photos + analyses completely broken = unusable app | — Pending |
| All bugs equally urgent | User requested parallel priority | — Pending |

## Open Questions

- Root cause of photo saving failure (client vs server?)
- Root cause of analysis pipeline failure (Edge Function? OpenAI? DB?)
- Performance bottleneck in analysis results screen

---
*Last updated: 2026-01-10 after initialization*
