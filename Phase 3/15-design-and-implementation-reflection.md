# 15. Design and Implementation Reflection

<!--
Brief. Marks: 8. ~400 words total. Part of the final reflection.md.
Must be based on specific evidence from your project (commits, code, design docs).
Generic statements ("I learned a lot") score nothing.
Assemble files 15–17 into reflection.md at the repo root for submission.
-->

## 1. What changed? (~80 words)

In `Phase 1/04-api-design.md` species was a fixed `TextChoices` value sent as `species`. While building the API I made `Species` its own model (`e13e970`) with a native flag, active flag and unique slug, and `f29a129` made `species_slug` the writable field (`trees/serializers.py:25-29`). Species is reference data that grows: a fixed enum would need a migration for every new species. As a model, staff add species in the admin and `SpeciesDetailSerializer` can report `tree_count`.

## 2. What was harder than expected? (~120 words)

Stopping duplicate trees. The model has a `unique_tree_per_owner_location` constraint (`trees/models.py:162`), so I expected recording the same species at the same coordinates twice to return a `400`. It returned a `500` `IntegrityError`. DRF only runs a model's unique-together validator when every field in it is writable, and `owner` is read-only because it comes from the token (`perform_create`, `trees/views.py:24-25`). So the check was skipped and the database rejected the row. Making `owner` writable would have fixed the error, but it would have let clients spoof ownership, which I rejected in `03-system-design.md`. The fix (`5af9dc5`) was a `validate()` method that runs the duplicate query itself (`serializers.py:57-80`). Now I know a constraint in the database isn't the same as validation in the API.

## 3. Patterns and principles (~140 words)

### Pattern 1 — Strategy (DRF permission classes)
`IsOwnerOrReadOnly` and `IsAdminOrReadOnly` (`trees/permissions.py:4-37`) are interchangeable rule objects. Each viewset plugs one in (`views.py:17`, `views.py:42`), and `mine` swaps in `IsAuthenticated` (`views.py:30`). The alternative was `if request.user != tree.owner` checks inside each view method, which would repeat the rule and be easy to miss on one method. The trade-off is that the rules are less visible when you read a view. It was effective: the permission tests (`8d94087`) pass, and all three UAT participants failed to edit someone else's tree (T6).

### Pattern 2 — Decorator (wrapping `fetch`)
`request()` (`api/client.ts:8-39`) wraps `fetch` and adds the JSON headers, the Bearer token, and one refresh-and-retry on a `401`. Every `*Api.ts` file calls it. The alternative was attaching the token in each API call. The trade-off is that `router.replace("/login")` (`client.ts:35`) ties navigation to the network layer. It was effective: when token refresh was added in Sprint 2, no screen code changed.

### Principle 1 — DRY
`84a06bc` moved the Add Tree fields into `components/TreeForm.tsx:45`, which is used by both `new.tsx:47` and `[id]/edit.tsx:91` (277 lines removed). The trade-off is that `TreeForm` is now one 296-line component controlled by props (`initial`, `submitLabel`, `onSubmit`). Editing a tree took one sprint task instead of rebuilding the form.

### Principle 2 — Defensive programming
The API never trusts the client. `owner` is read-only (`serializers.py:55`), only active species are accepted (`serializers.py:28`), and `TreeFilterForm` rejects reversed ranges (`filters.py:12-19`). On the client, `toApiError` handles bodies that aren't JSON (`api/errors.ts:17-36`). The cost is that rules are duplicated, because client-side checks repeat the server's. All participants passed UAT T3 (field errors for an invalid latitude).

## 4. What are you most confident about? (~60 words)

Ownership and authorisation. It was designed in `04-api-design.md`, implemented the same way (`owner` from the token at `views.py:25`, `/mine/` filtered by `request.user` at `views.py:32`, `IsOwnerOrReadOnly` on writes), and tested in `8d94087`. All three participants passed UAT T6 and T8. I can explain why each layer exists, including the `5af9dc5` bug it caused.

---
