# 2. Backlog Selection and Requirement Analysis

Define 10 requirements spanning both the React Native client and the Django API. Each entry below has its own write-up covering priority/selection, risks/assumptions/dependencies, acceptance criteria, and non-functional requirements.

## 10 User stories

1. As a home gardener, I want to add a tree I've identified with its species, location, and condition, so that I can keep a record of trees I've found.
2. As a citizen scientist, I want to browse the catalogue of recorded trees, so that I can discover interesting or notable trees in my local area.
3. As a tree enthusiast, I want to search for trees across New Zealand, so that I can learn about species outside my immediate region.
4. As a user, I want to have a page listing all of my recorded trees, so I can view what trees I have recorded.
5. As a user, I want to filter trees by height, girth, and region, so that I can narrow down results relevant to my search.
6. As a user, I want to filter trees by significance status, so that I can find notable or protected trees in an area.
7. As an arborist, I want to maintain detailed records for trees I manage, so that I have an accurate history of my professional work.
8. As an arborist, I want to log maintenance history for a specific tree, so that future work can be tracked over time.
9. As an arborist, I want to record a tree's health status in a report, so that I can monitor its condition across visits.
10. As a conservation group member, I want to view trees recorded in a specific region, so that I can monitor native or significant species in that area.

---

## Prioritisation approach

**Approach used: MoSCoW** (Must have / Should have / Could have / Won't have this release).

MoSCoW was chosen over Weighted Shortest Job First (WSJF) and Kano because this is a single-developer project with a fixed academic deadline (13 Nov) and a sprint-based roadmap. The decision that carries the most weight is *what is dropped if time runs short*, and MoSCoW's Must/Won't boundary expresses that directly while mapping cleanly onto the sprint plan (Must → Sprint 1, Should → Sprint 2, and so on).

WSJF was considered and rejected: it requires a credible Cost of Delay (user-business value + time criticality + risk reduction / opportunity enablement) divided by job size. With no real customer, revenue, or competing team backlog, those inputs would be guesses and would add false precision rather than insight. WSJF is strongest when economically sequencing many similarly-valuable items that compete for shared team capacity — not this project. Where two stories sit in the same tier, a lightweight value-vs-effort comparison is used as a tie-breaker.

| Rank | User story | MoSCoW tier |
|---|---|---|
| 1 | Add a tree (species, location, condition) | **Must** |
| 2 | Page listing all of my recorded trees | **Must** |
| 3 | Filter trees by height, girth, and region | **Should** |
| 4 | Filter trees by significance status | **Should** |
| 5 | Arborist: maintain detailed records for managed trees | **Should** |
| 6 | Arborist: record a tree's health status in a report | **Should** |
| 7 | Arborist: log maintenance history for a tree | **Could** |
| 8 | Browse the catalogue of recorded trees | **Could** |
| 9 | View trees recorded in a specific region | **Could** |
| 10 | Search for trees across New Zealand | **Won't (this release)** |

> Note on ranking: "browse the catalogue" (rank 8) is a core concept feature but is sequenced late because it depends on a meaningful volume of records existing first and reuses the list/filter components built in ranks 2–5. If time allows it should be promoted to Should.

---

## 1. Add a tree with species, location, and condition — **Must**

*As a home gardener, I want to add a tree I've identified with its species, location, and condition, so that I can keep a record of trees I've found.*

**Priority and selection.** This is the app's foundational create operation. Every other story — listing, filtering, browsing, maintenance logs, health reports — reads data that this story produces, so without it there is nothing to demonstrate. It therefore delivers the highest value per unit of effort and unblocks the largest number of downstream requirements. It is ranked above all others because it is a hard prerequisite, not merely desirable. Under MoSCoW it is a Must: the product is not viable or demonstrable without it.

**Risks, assumptions and dependencies.** Technical dependency: a Django `Tree` model, its serializer, a `POST /api/trees/` endpoint, and token authentication must exist before the client screen can function. Assumption: species is chosen from a predefined picker (native/exotic list) rather than free text, keeping data clean and filterable later. Risk: capturing location on React Native (GPS vs manual map pin) requires device-permission handling that could slip the estimate. Effect on implementation: location is built as manual latitude/longitude or map-pin entry first, with GPS auto-fill added later, so the story can ship on schedule.

**Acceptance criteria.**
1. Given an authenticated user on the Add Tree screen, when they submit a valid species, location, and condition, then the API returns `201 Created` and the new record appears in their tree list. *Verify:* API integration test asserting status and response body, plus a manual client walkthrough.
2. Given a required field is missing or invalid, when the form is submitted, then a `400` with per-field errors is shown and no record is created. *Verify:* unit test asserting `400`, the error shape, and an unchanged row count.
3. Given an unauthenticated request, when `POST /api/trees/` is called, then `401` is returned. *Verify:* API test with no token.

**Non-functional requirements and constraints.** Performance: submit round-trip under 1 s on Wi-Fi. Usability: inline validation with no loss of entered data on error. Security: authentication required; the owner is set server-side from the token and never trusted from the payload. Reliability: form state is preserved if the request fails so the user can retry.

---

## 2. Page listing all of my recorded trees — **Must**

*As a user, I want to have a page listing all of my recorded trees, so I can view what trees I have recorded.*

**Priority and selection.** This is the primary read operation and the natural landing screen after adding a tree. It closes the core create-then-view loop, giving the user immediate proof their data was saved and a route into every tree's detail page. It is ranked second because it depends only on story 1 and is the base component that filtering (stories 3–4) and browsing (story 8) extend. MoSCoW: Must — without it the user cannot access their own data.

**Risks, assumptions and dependencies.** Technical dependency: a `GET /api/trees/?owner=me` endpoint (or `/api/trees/mine/`) scoped to the authenticated user, plus a client list component with pull-to-refresh. Assumption: a single user will hold tens, not thousands, of trees, so simple pagination (page size 20) is sufficient. Project dependency: the app's navigation shell and auth session must be in place. Risk: an unscoped query could leak other users' trees. Effect on implementation: ownership filtering is enforced in the queryset on the server, and an automated test asserts one user cannot see another's records.

**Acceptance criteria.**
1. Given an authenticated user with recorded trees, when they open the My Trees page, then only their own trees are listed, newest first. *Verify:* API test seeding two users and asserting the response contains only the caller's records; snapshot/UI test of the list.
2. Given a user with no trees, when they open the page, then an empty-state message and an "Add tree" call to action are shown. *Verify:* UI test with an empty fixture.
3. Given more than 20 trees, when the user scrolls to the end, then the next page loads. *Verify:* integration test asserting pagination metadata and a second request.

**Non-functional requirements and constraints.** Performance: first page renders within 1.5 s on 4G; list scrolls at 60 fps using a virtualised list. Usability: pull-to-refresh and a visible loading indicator. Security: results filtered by owner server-side. Reliability: a cached last-known list is shown if the network request fails, with a stale indicator.

---

## 3. Filter trees by height, girth, and region — **Should**

*As a user, I want to filter trees by height, girth, and region, so that I can narrow down results relevant to my search.*

**Priority and selection.** Filtering makes the catalogue usable once record counts grow; without it users must scroll. It is selected because it directly serves the concept's stated goal of narrowing results and it reuses the list component from story 2 at low marginal cost. It is a Should rather than a Must because the app still functions with an unfiltered list for a demo-sized dataset; it is higher priority than significance filtering (story 4) because height, girth, and region are populated on every record whereas significance is optional.

**Risks, assumptions and dependencies.** Technical dependency: `django-filter` (or equivalent query-param filtering) on the tree list endpoint, and a controlled list of NZ regions/districts stored as a model or fixed enum. Assumption: height and girth are stored as numbers in consistent units (metres, centimetres) so range queries are valid. Risk: free-text region values would make filtering unreliable. Effect on implementation: region is a foreign key or constrained choice from the outset, and height/girth use numeric fields with min/max validation.

**Acceptance criteria.**
1. Given trees with varied height, girth, and region, when the user applies a height range, a girth range, and a region, then only trees matching all active filters are returned. *Verify:* API tests for each filter individually and combined, asserting exact result sets.
2. Given an invalid filter value (e.g. negative height, unknown region), when the request is made, then `400` with a clear message is returned. *Verify:* parametrised API test.
3. Given active filters, when the user clears them, then the full list returns. *Verify:* UI test toggling filters.

**Non-functional requirements and constraints.** Performance: filtered query returns within 500 ms with an index on region and on the numeric columns. Usability: active filters are visible as chips and clearable in one tap. Maintainability: filtering is declarative (filterset class) so new fields are one-line additions. Compatibility: filter state is expressed as URL query params so it is shareable and testable.

---

## 4. Filter trees by significance status — **Should**

*As a user, I want to filter trees by significance status, so that I can find notable or protected trees in an area.*

**Priority and selection.** This targets a specific high-value audience — councils and conservation groups looking for protected or notable trees. It is selected because it adds meaningful discovery value for little effort once story 3's filter infrastructure exists. It is a Should, and ranked just below story 3, because significance is an optional attribute that not every record will carry, so its usefulness scales only as data quality improves.

**Risks, assumptions and dependencies.** Dependency: story 3's filterset and a `significance_status` field with a defined vocabulary (e.g. `none`, `locally_notable`, `heritage`, `protected`). Assumption: a single-select status per tree is sufficient; a tree does not need multiple concurrent designations in this release. Risk: users may not know a tree's official status, leaving the field empty and the filter sparse. Effect on implementation: the field defaults to `none`, the picker includes an "unsure" option mapped to `none`, and the filter explicitly supports "show only significant" as the common case.

**Acceptance criteria.**
1. Given trees with mixed significance statuses, when the user filters by a status, then only trees with that status are returned. *Verify:* API test per status value.
2. Given the "significant only" toggle, when enabled, then trees with status `none` are excluded. *Verify:* API test asserting the excluded set.
3. Given significance filtering combined with region (story 3), when both are applied, then results satisfy both. *Verify:* combined-filter integration test.

**Non-functional requirements and constraints.** Performance: adds no measurable latency; `significance_status` is indexed. Usability: statuses use consistent colour coding shared with the map/health indicators. Security: read-only, no authorisation change. Maintainability: status vocabulary defined once as a model `TextChoices` enum reused by serializer, filter, and client.

---

## 5. Arborist: maintain detailed records for trees I manage — **Should**

*As an arborist, I want to maintain detailed records for trees I manage, so that I have an accurate history of my professional work.*

**Priority and selection.** This establishes the professional-user layer: an arborist can mark trees as "managed by me" and attach richer detail (access notes, client, risk assessment) beyond the basic record. It is selected because arborists are a named target audience in the concept and this story is the container that maintenance logs (story 7) and health reports (story 6) hang off. It is a Should — the citizen-facing MVP works without it — and it is ranked ahead of stories 6–7 because it is their structural prerequisite.

**Risks, assumptions and dependencies.** Technical dependency: a management/ownership link between `User` and `Tree` (e.g. a `ManagedTree` join model or a `managed_by` M2M), plus role handling so arborist-only fields are gated. Project dependency: a decision on roles — whether "arborist" is a self-selected profile flag or an admin-assigned role. Assumption: a tree can be managed by more than one arborist (e.g. a firm). Risk: role logic can sprawl into a full permissions system that is out of scope. Effect on implementation: a single boolean `is_arborist` on the profile plus per-object "is manager" checks, deferring any full RBAC.

**Acceptance criteria.**
1. Given an arborist user, when they mark a tree as managed, then it appears in their "Managed" list and exposes the extended fields. *Verify:* API test asserting the join row and the serializer field set for an arborist vs a standard user.
2. Given a non-arborist user, when they request the extended fields or the manage action, then `403` is returned. *Verify:* authorisation test.
3. Given a managed tree, when a second arborist adds themselves as manager, then both see it. *Verify:* integration test with two arborist users.

**Non-functional requirements and constraints.** Security: extended fields and the manage action are authorised per object; a user can only manage trees, not reassign others'. Maintainability: arborist-only serialization handled by a dedicated serializer, not conditional branching. Reliability: removing management does not delete the underlying tree or its public data. Usability: managed trees are visually distinguished in lists.

---

## 6. Arborist: record a tree's health status in a report — **Should**

*As an arborist, I want to record a tree's health status in a report, so that I can monitor its condition across visits.*

**Priority and selection.** This turns a static record into a monitored one: each visit produces a timestamped health entry, enabling the concept's proposed "health over time" graph. It is selected because condition tracking is a distinct, testable slice of the professional workflow and produces the data the dashboard's colour-coded status depends on. It is a Should and is ranked just below story 5 because it requires the managed-tree relationship to exist first, and above story 7 because health status is a simpler, more frequently used entry than a full maintenance record.

**Risks, assumptions and dependencies.** Technical dependency: a `HealthReport` model (`tree` FK, `status`, `assessed_on`, `notes`, `assessor`) and a nested route `POST /api/trees/:id/health-reports/`. Assumption: health status uses a small ordinal scale (e.g. `healthy`, `fair`, `poor`, `dead`) rather than free text, so it can be charted and colour-coded. Dependency on story 5: only a manager (or the tree owner) may add a report. Risk: back-dated or duplicate reports could distort a trend line. Effect on implementation: `assessed_on` is user-set but validated as not in the future, and the tree's displayed status is derived from the most recent report by date.

**Acceptance criteria.**
1. Given a manager on a managed tree, when they submit a health report with a status and assessment date, then `201` is returned and the tree's current status reflects the latest report. *Verify:* API test asserting creation and the recomputed current status.
2. Given a future `assessed_on`, when submitted, then `400` is returned. *Verify:* validation unit test.
3. Given a non-manager, when they POST a report, then `403`. *Verify:* authorisation test.
4. Given multiple reports, when the tree detail is fetched, then reports are returned newest first. *Verify:* ordering test.

**Non-functional requirements and constraints.** Performance: adding a report and refreshing current status completes under 1 s. Reliability: reports are append-only; correcting a mistake is a new report, preserving history. Usability: status uses the shared colour scheme (`#2D5A3D` healthy → `#C1272D` alert). Security: assessor is set from the token. Maintainability: current-status derivation is one queryset method, unit-tested independently.

---

## 7. Arborist: log maintenance history for a tree — **Could**

*As an arborist, I want to log maintenance history for a specific tree, so that future work can be tracked over time.*

**Priority and selection.** This records concrete work done — pruning, cabling, pest treatment — with date and description, giving a defensible professional history. It is selected because it completes the arborist workflow and reuses the nested-resource pattern from story 6. It is a Could: valuable to one user segment but not required for the app to deliver its core citizen-science value, and it is the lowest-ranked arborist story because it depends on stories 5 and 6 being in place and is the least frequently exercised in a demo.

**Risks, assumptions and dependencies.** Technical dependency: a `MaintenanceRecord` model (`tree` FK, `work_type`, `performed_on`, `description`, `performed_by`) and `POST /api/trees/:id/maintenance/`. Assumption: `work_type` is a controlled list so records are reportable; a free-text "other" is allowed with a required description. Dependency: reuses story 5's manager authorisation. Risk: scope creep toward attachments, cost tracking, and scheduling. Effect on implementation: this release captures type, date, and text only; attachments and scheduling are explicitly deferred and noted in the backlog.

**Acceptance criteria.**
1. Given a manager, when they log a maintenance record with type and date, then `201` is returned and the entry appears in that tree's history, newest first. *Verify:* API integration test for creation and ordering.
2. Given `work_type = other` with no description, when submitted, then `400`. *Verify:* conditional-validation unit test.
3. Given a standard user viewing a public tree, when they open its history, then maintenance entries are visible read-only (no add button). *Verify:* UI test for role-based controls; API test that GET is public but POST is `403`.

**Non-functional requirements and constraints.** Performance: history list paginated at 20, query under 500 ms with an index on `tree` + `performed_on`. Maintainability: shares the nested-resource viewset base class with health reports. Reliability: records are immutable once saved; edits create a correction entry. Usability: entries grouped by year on the timeline. Compatibility: dates stored and transmitted as ISO 8601 UTC, rendered in NZ local time.

---

## 8. Browse the catalogue of recorded trees — **Could**

*As a citizen scientist, I want to browse the catalogue of recorded trees, so that I can discover interesting or notable trees in my local area.*

**Priority and selection.** This opens all public records (not just the user's own) for discovery, supporting the concept's community-catalogue goal. It is selected because it broadens the app from a personal logbook to a shared resource. It is a Could and sequenced at rank 8 because it needs a meaningful volume of records to be worthwhile and it reuses the list, pagination, and filter components already built in stories 2–4, so its marginal cost is low and it can be added opportunistically. If the schedule holds it should be promoted to Should.

**Risks, assumptions and dependencies.** Technical dependency: a public `GET /api/trees/` (no owner scope) with the same filterset as story 3, and a client Browse screen distinct from My Trees. Assumption: all tree records are public by default; there is no private-record concept in this release. Project dependency: the region vocabulary from story 3. Risk: exposing precise locations of vulnerable or protected trees. Effect on implementation: for trees flagged `protected`, the public API returns location rounded to a coarser precision (e.g. ~1 km), with exact coordinates visible only to the owner and managers.

**Acceptance criteria.**
1. Given trees from multiple users, when any user (including unauthenticated) opens Browse, then all public trees are listed with pagination. *Verify:* API test with no token asserting a `200` and cross-user results.
2. Given a `protected` tree, when fetched via the public endpoint, then its coordinates are coarsened. *Verify:* API test comparing owner vs anonymous responses.
3. Given the region filter, when applied on Browse, then results are scoped identically to story 3. *Verify:* shared filter test suite.

**Non-functional requirements and constraints.** Performance: first page under 1.5 s on 4G; endpoint cache-friendly (short public cache header). Security: read-only, no auth required, location coarsening enforced server-side. Reliability: available in read-only mode even if write services are degraded. Usability: clearly labelled as the public catalogue, distinct from My Trees. Compatibility: same response schema as the authenticated list so the client reuses one model.

---

## 9. View trees recorded in a specific region — **Could**

*As a conservation group member, I want to view trees recorded in a specific region, so that I can monitor native or significant species in that area.*

**Priority and selection.** This is a focused view of the catalogue scoped to one region or district (e.g. Otago, Canterbury), letting a conservation group monitor their patch. It is selected because it serves a named audience and supports ongoing monitoring rather than one-off discovery. It is a Could because it is largely story 8 plus story 3's region filter with a dedicated entry point and summary counts; it carries little independent risk and can be dropped without affecting the MVP.

**Risks, assumptions and dependencies.** Technical dependency: the region model/vocabulary and the public browse endpoint (stories 3 and 8). Assumption: NZ regions are a stable, well-known list that can be seeded once from a fixture. Project dependency: agreement on whether "region" means the 16 regional council areas or territorial districts — mixing them makes counts misleading. Effect on implementation: one level (regional council) is chosen and seeded; district-level filtering is a later enhancement noted in the backlog.

**Acceptance criteria.**
1. Given a selected region, when the user opens the regional view, then only trees in that region are listed and a total count is shown. *Verify:* API test asserting result set and count for a seeded region.
2. Given a region with no records, when opened, then a zero-count empty state is shown. *Verify:* UI test with an empty region.
3. Given significance filtering (story 4) applied within a region, when set, then results satisfy both constraints. *Verify:* combined-filter integration test.

**Non-functional requirements and constraints.** Performance: regional query under 500 ms with a region index; counts computed with a single aggregate query. Usability: region chosen from a searchable picker; current region shown in the header. Maintainability: region list seeded via a versioned fixture, not hard-coded in the client. Reliability: read-only; unaffected by write-path outages. Compatibility: region codes stable so saved/shared links keep working.

---

## 10. Search for trees across New Zealand — **Won't (this release)**

*As a tree enthusiast, I want to search for trees across New Zealand, so that I can learn about species outside my immediate region.*

**Priority and selection.** This is free-text nationwide search across species, common names, and locations. It is deferred because the structured filters (stories 3, 4, 9) already cover the concrete discovery needs for this release, and full-text search adds real infrastructure cost — indexing, ranking, typo tolerance, and query-performance tuning — that is not justified before there is a large dataset. Classifying it Won't-this-release keeps the MVP scope honest and protects the deadline; it is the first candidate for a follow-up release.

**Risks, assumptions and dependencies.** Technical dependency: PostgreSQL full-text search (`SearchVector` / `SearchRank`) or an external engine, plus a maintained search index and a debounced client search screen. Assumption: Postgres FTS is sufficient at expected data volumes, avoiding a separate service. Risk: naive `icontains` queries over a growing table degrade badly and set a poor precedent. Effect on implementation: if any search ships early, it is limited to an indexed species/common-name lookup with an explicit result cap, and general free-text search is left for a later sprint with its own performance budget.

**Acceptance criteria (for when it is built).**
1. Given a query matching species or common name, when submitted, then results are returned ranked by relevance within 800 ms for a 10k-record dataset. *Verify:* seeded performance test asserting latency and ordering.
2. Given a misspelled common query (e.g. "kauri" vs "kaurii"), when submitted, then the intended results still appear. *Verify:* test with trigram similarity fixtures.
3. Given an empty or whitespace query, when submitted, then a `400` (or an empty result with guidance) is returned, not a full table scan. *Verify:* unit test asserting no unbounded query runs.

**Non-functional requirements and constraints.** Performance: search is the tightest latency budget in the app (<800 ms) and must not lock the trees table. Scalability: index maintained incrementally on write, not rebuilt per query. Usability: debounced input, recent searches, and a clear "no results" state. Maintainability: search logic isolated in one service module so the backing engine can be swapped. Reliability: search failure returns a graceful message and never blocks browse or filter.

---

