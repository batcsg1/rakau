# 15. Design and Implementation Reflection

<!--
Brief. Marks: 8. ~400 words total. Part of the final reflection.md.
Must be based on specific evidence from your project (commits, code, design docs).
Generic statements ("I learned a lot") score nothing.
Assemble files 15–17 into reflection.md at the repo root for submission.
-->

## 1. What changed? (~80 words)

In `Phase 1/04-api-design.md` species was a fixed `TextChoices` value sent as `species`. While building the API I made `Species` its own model (`e13e970`) with a native flag, active flag and unique slug, and `f29a129` made `species_slug` the writable field (`trees/serializers.py:64-68`). Species is reference data that grows: a fixed enum would need a migration for every new species. As a model, staff add species in the admin and `SpeciesDetailSerializer` can report `tree_count`.

## 2. What was harder than expected? (~120 words)

Stopping duplicate trees. The model has a `unique_tree_per_owner_location` constraint (`trees/models.py:162`), so I expected recording the same species at the same coordinates twice to return a `400`. It returned a `500` `IntegrityError`. DRF only runs a model's unique-together validator when every field in it is writable, and `owner` is read-only because it comes from the token (`perform_create`, `trees/views.py:41-42`). Making `owner` writable would have let clients spoof ownership, which I rejected in `03-system-design.md`. The fix (`5af9dc5`) was a `validate()` method that runs the duplicate query itself (`serializers.py:97-120`). A constraint in the database isn't the same as validation in the API.

## 3. Patterns and principles (~140 words)

### Pattern 1 — Strategy (DRF permission classes)
`IsOwnerOrReadOnly` and `IsAdminOrReadOnly` (`trees/permissions.py:4-37`) are interchangeable rule objects. Each viewset plugs one in (`views.py:29`, `:91`), and `mine` swaps in `IsAuthenticated` (`:60`). The alternative, owner checks inside each view method, would repeat the rule five times. It worked: the `403` permission tests (`8d94087`) pass, and photos (#44) needed no new rule.

### Pattern 2 — Decorator (wrapping `fetch`)
`request()` (`api/client.ts:8-40`) adds the headers, the Bearer token and one refresh-and-retry on a `401`. The trade-off is that `router.replace("/login")` (`:36`) ties navigation to the network layer. When token refresh was added (`99e27b2`), no screen changed.

### Principle 1 — DRY
`84a06bc` moved the Add Tree fields into `TreeForm` (`components/TreeForm.tsx:45`), shared by Add and Edit (277 lines removed). The UAT location fix (`8e0ec6d`) later reached both screens without touching either.

### Principle 2 — Defensive programming
The API never trusts the client: `owner` is read-only (`serializers.py:95`), only active species are accepted (`:67`), and reversed ranges are rejected (`filters.py:16-23`). The cost is duplicated rules, because the client's checks repeat the server's.

## 4. What are you most confident about? (~60 words)

Ownership and authorisation. It was designed in `04-api-design.md`, implemented the same way (`owner` from the token at `views.py:42`, `/mine/` filtered by `request.user` at `views.py:62`, `IsOwnerOrReadOnly` on writes), and tested in `8d94087`. All three participants passed UAT T6 and T8. I can explain why each layer exists, including the `5af9dc5` bug it caused.

---
