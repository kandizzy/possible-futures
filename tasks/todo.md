# Radar chart rollout — plan

## Phase 1 — Migrate live data

- [ ] Confirm the source app at `resume/job-search-app/` is **not running** (quit dev server) so the SQLite copy is clean
- [ ] Create `career/possible-futures/data/` directory
- [ ] Copy `resume/job-search-app/data/job-search.db` + `.db-wal` + `.db-shm` → `career/possible-futures/data/`
- [ ] Copy `resume/Carrie_Kengle_Project_Bible.md` → `career/Carrie_Kengle_Project_Bible.md`
- [ ] Copy `resume/JOB_SEARCH_COMPASS.md` → `career/JOB_SEARCH_COMPASS.md`
- [ ] Copy `resume/APPLICATION_PLAYBOOK.md` → `career/APPLICATION_PLAYBOOK.md`
- [ ] (Decision) Copy `resume/versions/` → `career/versions/` — yes or no?
- [ ] Create `career/possible-futures/.env.local` with `ANTHROPIC_API_KEY` + `PROJECT_BOOK=Carrie_Kengle_Project_Bible.md`
- [ ] Start dev server, verify dashboard loads with migrated data, spot-check one role detail page

## Phase 2 — Branch

- [ ] (Decision) Commit existing README.md changes on main first, or carry onto the feature branch?
- [ ] `git checkout -b radar-chart` (or whatever name)

## Phase 3 — Build ScoreRadar component

- [ ] Create `src/components/roles/score-radar.tsx` with two exports:
  - `<ScoreRadar scores={...} tier="stamp|ink|muted" />` — the full 240×240 version with axis labels, tick marks, vertex dots
  - `<ScoreRadarMini scores={...} tier="..." />` — the 60×60 compact version, hex scaffold + polygon only
- [ ] Unit tests covering geometry (point calculation at known scores, polygon shape correctness)

## Phase 4 — Integrate mini in dashboard row

- [ ] Modify `src/components/roles/role-row.tsx` desktop layout:
  - Remove the `dim-strip` (the W·C·G·P·T·I column)
  - Place `<ScoreRadarMini>` in the column immediately left of the total score
  - Update grid-template-columns to match the preview (`32px 1fr auto 90px 110px` or similar)
- [ ] Handle the mobile layout — either drop the radar on mobile or stack it above the dim numbers
- [ ] Verify the dashboard catalog still reads well at all breakpoints

## Phase 5 — Integrate full radar in role detail header

- [ ] Modify `src/app/roles/[id]/page.tsx` header:
  - Add `<ScoreRadar>` to the right side of the title block
  - Enlarge the total score under it, with "Total score" smallcaps caption
  - Preserve the eyebrow, role title, and meta line treatments
- [ ] Verify the existing score-breakdown section below still makes sense alongside the new radar

## Phase 6 — Verify

- [ ] `npm run lint` passes
- [ ] `npm run test` passes
- [ ] `npm run build` passes
- [ ] Manual smoke test: open dashboard, click into 2–3 roles at different score tiers, confirm radar matches the numeric scores

## Review

(filled in after implementation)
