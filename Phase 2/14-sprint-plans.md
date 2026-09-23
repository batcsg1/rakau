# 14. Sprint Plans

<!--
One sprint plan per sprint (Sprint 1-4, including the UAT sprint). Copy the
template below for each new sprint. Each plan states: the sprint goal, the
sprint backlog (issues pulled from the product backlog in
`Phase 1/02-backlog-requirements-analysis.md`), the Definition of Done, and
known risks/dependencies going in.
-->

## Sprint plan template (copy per sprint)

### Sprint N — DD Mon - DD Mon (vX.Y.0)

**Sprint goal.** TODO

**Sprint backlog.**

| Issue | Type | Notes |
|---|---|---|
| TODO | TODO | TODO |

**Definition of Done.** TODO

**Risks / dependencies going in.** TODO

---

## Sprint 1 — 21 Sep - 4 Oct (v0.1.0)

**Sprint goal.** Ship a working end-to-end slice: an authenticated user can add a tree record and see it on their own My Trees list. This is the two **Must** stories from the backlog (REQ-01, REQ-02) plus the foundational auth and project setup they depend on — nothing else is in scope this sprint.

**Sprint backlog.**

| Issue | Type | Notes |
|---|---|---|
| Sprint 1 setup | Standalone | Django + DRF project scaffold, Expo client scaffold, `Tree` model migration, CI (lint + test), env config. Blocks everything else. |
| Auth flow | Standalone | Register/login screen, token storage, `Authorization: Token` header on all requests, redirect to login on `401`. Blocks both features. |
| **Feature: Add a Tree** | Parent | REQ-01 (Backlog story 1 — Must) |
| ↳ API: Tree model + migration | Sub-issue | `species`, `latitude`, `longitude`, `condition`, `owner`, `created_at` |
| ↳ API: `POST /api/trees/` endpoint | Sub-issue | `IsAuthenticated`; `owner` set server-side from token |
| ↳ API: field validation on create | Sub-issue | Species/condition choices, lat/lng ranges; `400` + shared error shape |
| ↳ API tests: create endpoint | Sub-issue | `201` valid; `400` invalid; `401` unauthenticated |
| ↳ Client: Add Tree screen UI | Sub-issue | Species picker, condition picker, location input |
| ↳ Client: location capture | Sub-issue | Manual lat/lng or map-pin first (`react-native-maps`); GPS auto-fill (`expo-location`) as stretch |
| ↳ Client: submit + retry-safe state | Sub-issue | Attach token; preserve form state on failure |
| ↳ Client: push new tree into list cache | Sub-issue | On `201`, insert into My Trees cache |
| **Feature: My Trees List** | Parent | REQ-02 (Backlog story 2 — Must) |
| ↳ API: `GET /api/trees/mine/` endpoint | Sub-issue | Owner-scoped queryset, newest-first, paginated (20/page) |
| ↳ API: `GET /api/trees/{id}/` endpoint | Sub-issue | Open to any authenticated user |
| ↳ API tests: ownership scoping + pagination | Sub-issue | Two-user fixture; pagination metadata + page 2 request |
| ↳ Client: My Trees list screen | Sub-issue | Virtualised list, newest first |
| ↳ Client: empty state | Sub-issue | Message + "Add tree" CTA when zero trees |
| ↳ Client: pagination / infinite scroll | Sub-issue | Load next page at scroll end |
| ↳ Client: pull-to-refresh + stale cache fallback | Sub-issue | `AsyncStorage` cache, "stale" badge on failed refresh |

**Definition of Done.**
- All acceptance criteria in `Phase 1/02-backlog-requirements-analysis.md` (stories 1 and 2) pass, verified by the API/UI tests listed against each sub-issue.
- A user can, on a real device/emulator: log in, add a tree, and see it appear on their My Trees list.
- No known regressions; CI (lint + tests) green on `main`.
- Tagged `v0.1.0` per `Phase 2/12-releases.md`, with release notes completed (delivered, known issues, local run instructions, technical notes).

**Risks / dependencies going in.**
- Single-developer sprint — no parallelism; setup and auth must land first or every other issue stalls.
- Location capture (GPS/map-pin) is the least-proven client piece — scoped to manual/map-pin entry first per the risk note in the backlog doc, GPS auto-fill is a stretch, not a blocker for Done.
- Ownership scoping on `/mine/` is the one security-critical piece this sprint — must be covered by an explicit two-user test, not just manual checking.

---

## Marker checklist

- [ ] One sprint plan per sprint, including UAT
- [ ] Each plan states a clear sprint goal
- [ ] Sprint backlog traces to product backlog requirements (`Phase 1/02-backlog-requirements-analysis.md`)
- [ ] Definition of Done stated per sprint
- [ ] Risks/dependencies noted going into each sprint
