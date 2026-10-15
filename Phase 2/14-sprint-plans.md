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

## Sprint 2 — 5 Oct - 18 Oct (v0.2.0)

**Sprint goal.** Finish both Must features from Sprint 1, **Add a Tree** (REQ-01) and **My Trees List** (REQ-02), by carrying over their sub-issues that were still in Todo at sprint close. Then secure the tree endpoints with custom permissions and add list filtering. At the end of the sprint, a user can add a validated tree with a captured location, see it on a paginated My Trees list, change only their own records, and filter the tree list.

**Sprint backlog.**

| Issue | Type | Notes |
|---|---|---|
| **Feature: Add a Tree** (carried over) | Parent | REQ-01 (Backlog story 1 — Must). Remaining sub-issues still in Todo at Sprint 1 close |
| ↳ #4 API: field validation on create | Sub-issue | Species/condition choices, lat/lng ranges; `400` + shared error shape |
| ↳ #5 API tests: create endpoint | Sub-issue | `201` valid; `400` invalid; `401` unauthenticated. Depends on #4 |
| ↳ #6 Client: Add Tree screen UI | Sub-issue | Species picker, condition picker, location input |
| ↳ #7 Client: location capture | Sub-issue | Manual lat/lng or map-pin first (`react-native-maps`); GPS auto-fill (`expo-location`) as stretch. Depends on #6 |
| **#8 Feature 2: My Trees List** (carried over) | Parent | REQ-02 (Backlog story 2 — Must). 0/6 sub-issues complete at Sprint 1 close |
| ↳ #9 API: `GET /api/trees/mine/` endpoint | Sub-issue | Owner-scoped queryset, newest-first, paginated (20/page) |
| ↳ #10 API: `GET /api/trees/{id}/` detail endpoint | Sub-issue | Open to any authenticated user |
| ↳ #11 API tests: ownership scoping + pagination | Sub-issue | Two-user fixture; pagination metadata + page 2 request. Depends on #9, #10 |
| ↳ #12 Client: My Trees list screen | Sub-issue | Virtualised list, newest first. Depends on #9 |
| ↳ #13 Client: empty state | Sub-issue | Message + "Add tree" CTA when zero trees. Depends on #12 |
| ↳ #14 Client: pagination / infinite scroll | Sub-issue | Load next page at scroll end. Depends on #12 |
| **New this sprint** | | |
| #21 API: Add custom permissions | Standalone | Object-level permission so only a tree's owner can update/delete it; read stays open to any authenticated user. Groundwork for the per-object "is manager" check in story 5 |
| #22 API: add filtering for trees by species, condition, status and location | Standalone (REQ-03/REQ-04 groundwork) | Declarative `django-filter` filterset (`TreeFilter`) on the tree list endpoint, shared by `/trees/` and `/trees/mine/`; filter values passed as URL query params; invalid values (unknown region, `min > max`, negative measurements) return `400`. Covers story 3 sub-issues 3.1 and 3.3 |
| **Stretch: Should stories** | | Pulled in only once all twelve issues above are Done; anything unstarted at sprint close carries over to Sprint 3 |
| **Feature: Filter trees by height, girth and region** | Parent | REQ-03 (Backlog story 3 — Should). Region choices, `?region=` filter and catalogue filter chips already exist |
| ↳ API: height and girth range filters | Sub-issue | `height_min`/`height_max`, `girth_min`/`girth_max` on `TreeFilter`; index the numeric columns. Depends on #22 |
| ↳ API tests: filters individually and combined | Sub-issue | Exact result sets per filter and combined; `400` for invalid values; cleared filters return the full list (AC1–AC3) |
| ↳ Client: height and girth range inputs on catalogue | Sub-issue | Min/max inputs in `trees/index.tsx`, extend `TreeFilters`; active ranges shown as clearable chips |
| ↳ Client: region filter on My Trees | Sub-issue | `mine.tsx` only filters by condition; reuse `FilterRow` and `REGION_OPTIONS` |
| **Feature: Filter trees by significance status** | Parent | REQ-04 (Backlog story 4 — Should) |
| ↳ API: `significance_status` field on `Tree` | Sub-issue | `TextChoices` (`none`, `locally_notable`, `heritage`, `protected`), default `none`, indexed; migration + serializer field |
| ↳ API: significance filter + "significant only" toggle | Sub-issue | `?significance_status=` and `?significant_only=true` (excludes `none`) on `TreeFilter`. Depends on #22 |
| ↳ API tests: significance filtering | Sub-issue | Per status; toggle excludes `none`; combined with region (AC1–AC3) |
| ↳ Client: significance picker on Add Tree | Sub-issue | `ChipGroup` with "Unsure" mapped to `none`; mirror type and labels in `api/types.ts` |
| ↳ Client: significance filter and badge | Sub-issue | Filter row + "Significant only" toggle on the catalogue; badge on cards and tree detail |

**Definition of Done.**
- #4–#7 meet the remaining REQ-01 acceptance criteria and #9–#14 meet the REQ-02 acceptance criteria in `Phase 1/02-backlog-requirements-analysis.md` (stories 1 and 2), checked by the tests listed against each sub-issue.
- A user can, on a real device/emulator: open the Add Tree screen, capture a location, and submit, getting a `400` error message when a field is invalid; then see the new tree on the My Trees list, scroll to load the next page, and see the empty state when they have no trees.
- #11: an explicit two-user test proves one user cannot see another's trees on `/mine/`.
- #21: API tests show a non-owner gets `403` on update/delete and the owner succeeds.
- #22: API tests cover each filter on its own and combined, and assert the exact result sets plus a `400` for an invalid value.
- Any stretch Should sub-issue marked Done meets its story's acceptance criteria in `Phase 1/02-backlog-requirements-analysis.md` (stories 3 and 4), checked by its API tests; unfinished stretch items move to Sprint 3 and are noted in the release notes.
- No known regressions; CI (lint + tests) green on `main`.
- Tagged `v0.2.0` per `Phase 2/12-releases.md`, with release notes completed.

**Risks / dependencies going in.**
- Ten of the twelve issues are carried over, so Sprint 1 was over-committed and this sprint is heavy for a single developer. Scope is limited to these twelve. Should stories (3–6) are pulled in only once all twelve are Done, and #22 is the first issue to defer to Sprint 3 if time runs short, since it is not a Must story.
- Dependency order: #4 before #5; #6 before #7; #9 before #12, then #13 and #14; #9 and #10 before #11; #21 before #22.
- Location capture (#7) is still the least-proven client piece. GPS auto-fill stays a stretch goal, not a blocker for Done.
- Ownership scoping on `/mine/` (#9) is security-critical. #21 changes the permission classes on the same viewset, so re-run #11 after #21 lands to confirm scoping hasn't regressed.
- Pull-to-refresh with a stale-cache fallback was planned as a REQ-02 sub-issue in Sprint 1 but isn't in this backlog. REQ-02's reliability requirement (cached list shown with a stale indicator) can't be signed off until it's scheduled.
- #22 filters on species, condition, status and location, while story 3 specifies height, girth and region. The REQ-03 stretch sub-issues extend the #22 filterset with height and girth ranges rather than building a second one.
- Stretch dependency order: #22 before the REQ-03 range filters and the REQ-04 filter; REQ-04's model field before its filter.

---
