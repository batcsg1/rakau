# Reflection

Assembled from `Phase 3/15-design-and-implementation-reflection.md`, `Phase 3/16-uat-reflection.md` and `Phase 3/17-final-reflection.md`.

## 15. Design and Implementation Reflection

### 1. What changed? (~80 words)

In `Phase 1/04-api-design.md` species was a fixed `TextChoices` value sent as `species`. While building the API I made `Species` its own model (`e13e970`) with a native flag, active flag and unique slug, and `f29a129` made `species_slug` the writable field (`trees/serializers.py:64-68`). Species is reference data that grows: a fixed enum would need a migration for every new species. As a model, staff add species in the admin and `SpeciesDetailSerializer` can report `tree_count`.

### 2. What was harder than expected? (~120 words)

Stopping duplicate trees. The model has a `unique_tree_per_owner_location` constraint (`trees/models.py:162`), so I expected recording the same species at the same coordinates twice to return a `400`. It returned a `500` `IntegrityError`. DRF only runs a model's unique-together validator when every field in it is writable, and `owner` is read-only because it comes from the token (`perform_create`, `trees/views.py:41-42`). Making `owner` writable would have let clients spoof ownership, which I rejected in `03-system-design.md`. The fix (`5af9dc5`) was a `validate()` method that runs the duplicate query itself (`serializers.py:97-120`). A constraint in the database isn't the same as validation in the API.

### 3. Patterns and principles (~140 words)

#### Pattern 1 — Strategy (DRF permission classes)
`IsOwnerOrReadOnly` and `IsAdminOrReadOnly` (`trees/permissions.py:4-37`) are interchangeable rule objects. Each viewset plugs one in (`views.py:29`, `:91`), and `mine` swaps in `IsAuthenticated` (`:60`). The alternative, owner checks inside each view method, would repeat the rule five times. It worked: the `403` permission tests (`8d94087`) pass, and photos (#44) needed no new rule.

#### Pattern 2 — Decorator (wrapping `fetch`)
`request()` (`api/client.ts:8-40`) adds the headers, the Bearer token and one refresh-and-retry on a `401`. The trade-off is that `router.replace("/login")` (`:36`) ties navigation to the network layer. When token refresh was added (`99e27b2`), no screen changed.

#### Principle 1 — DRY
`84a06bc` moved the Add Tree fields into `TreeForm` (`components/TreeForm.tsx:45`), shared by Add and Edit (277 lines removed). The UAT location fix (`8e0ec6d`) later reached both screens without touching either.

#### Principle 2 — Defensive programming
The API never trusts the client: `owner` is read-only (`serializers.py:95`), only active species are accepted (`:67`), and reversed ranges are rejected (`filters.py:16-23`). The cost is duplicated rules, because the client's checks repeat the server's.

### 4. What are you most confident about? (~60 words)

Ownership and authorisation. It was designed in `04-api-design.md`, implemented the same way (`owner` from the token at `views.py:42`, `/mine/` filtered by `request.user` at `views.py:62`, `IsOwnerOrReadOnly` on writes), and tested in `8d94087`. All three participants passed UAT T6 and T8. I can explain why each layer exists, including the `5af9dc5` bug it caused.

---

## 16. User Acceptance Testing Reflection

### 1. Test scenario design (~90 words)

Each of the eight tasks (T1–T8) maps to a Phase 1 acceptance criterion (file 11, Part 1), and the task cards give the data but not the screen to use. After planning I changed T1 to include registering (`8d56c7f`), swapped T1 and T2 (`225f07b`) and dropped the seeded data (`2828aaa`). Because of this, T2 could no longer show the empty state (F2-AC2), since the participant already had a tree. T7 was meant to test paging (F2-AC3), but all three participants read "oldest" as a sorting problem. So T7 ended up testing whether the list order is visible (F2-AC1), not paging.

### 2. What participants struggled with (~90 words)

Participants could finish the tasks. The problems were in how data was shown and entered. All three passed T3 and T6.

- **T7, Partial ×3:** P2 couldn't "tell straight away what trees were the oldest and the newest", because the date was only on the detail page.
- **T4:** P1 and P2 found the condition had no label.
- **Location:** P1's coordinates auto-filled to Hamilton and were then "over ridden". P3 saw "No Region" after Otago auto-filled.

Q4 (satisfied) averaged 2.3 and Q5 (comfortable without help) 2.0, so they finished the tasks but didn't trust the result.

### 3. Feedback acted on vs. not (~110 words)

**Fixed**, mostly because each one broke an acceptance criterion:

- I1 condition label (#56, `71ba5af`), I4 recorded date and sort (#59, `3b3003e`), and I5 hiding "Add" when logged out (#60, `3c8c542`). P1 had called the Add button "misleading".
- I2 "No Region" (#57, `464b372`): tapping the auto-filled Otago chip toggled it off.
- I3 (#58, `fe4a7d4`): the existing delete confirmation now asks "Are you sure…?", as P3 suggested.
- I6 girth and crown spread hints (#61, `dedc9f7`), and I7 removing the coordinate fields (#62, `8e0ec6d`). P1 said they "could just be auto filled every time".
- I8 Purpose section (#63, `15fb38b`) and I12 filter by creator (#70) aren't tied to a criterion, but two participants asked for each.

**Not fixed:** the map pin (#71), the keyboard covering fields (#64) and health value definitions are deferred as usability work. Imperial units and size guides are outside REQ-01 and REQ-02. Page-based pagination would replace F2-AC3's infinite scroll.

### 4. How the changes improved the feature(s) (~70 words)

| Change (issue) | Criterion | Result |
|---|---|---|
| I1 (#56) | F1-AC4 | A label shows beside the condition badge |
| I2 (#57) | F1-AC1 | API tests pass; phone re-run not recorded |
| I3 (#58) | F1-AC5 | The prompt reads as a question; T5 not re-run |
| I4 (#59) | F2-AC1 | Newest and oldest sort options at the top of the catalogue |
| I5 (#60) | F1-AC3 | No "+ Add" when logged out |
| I6 (#61) | F1-AC1 | Explanations show under the fields |
| I7 (#62) | F1-AC1, F1-AC2 | No coordinate fields, correct coordinates saved, empty location rejected |
| I8 (#63) | None | Purpose section shows; not checked with a participant |

I7 helped most: the coordinates P1 and P3 found most confusing are gone. But I did every re-check myself, so only re-running T1, T4 and T7 with a participant will show if Q4 and Q5 improve.

### 5. What you would do differently next round (~40 words)

I'd finish the sprint plan and task cards before the first session, and do a dry run. Changing T1, T2 and the seed data during the sessions broke the T2 and T7 checks. I'd also add the species the tasks use beforehand, because Rimu and Kōwhai weren't in the app.

---

## 17. Final Reflection

### 1. Biggest difference between original designs and final implementation (~110 words)

In `Phase 1/03-system-design.md` the location was captured "by GPS fix or manual map pin", with `react-native-maps` for the pin, and in `06-design-reflection.md` I expected the map to be the hardest part. The final app has no map at all. Add Tree started with latitude and longitude fields, and in UAT P1 and P3 both named them as the most confusing part. In `8e0ec6d` (I7) I took them out. The location now comes from a Photon address lookup or "Use my current location", and the coordinates are set in the background. The map pin is still open (#71). I designed around coordinates, but participants thought about where a tree is as an address.

### 2. What implementing the React Native client revealed about your API design (~110 words)

`04-api-design.md` defined one error shape, `{"error": {"code", "message", "fields"}}`. I never built it. DRF returns `{"field": ["message"]}` for validation errors and `{"detail": "..."}` for everything else, and the client had to work with what it actually got. `toApiError` (`api/errors.ts:17`) turns both into one `ApiError` that keeps the per-field messages, so forms can show each error under its field. Building the client also showed that DRF sends decimals as strings (`"30.00"`, `api/types.ts:87`). The API also never says whether the user can edit a tree, so `canModify` copies the `IsOwnerOrReadOnly` rule in two screens. A `can_edit` field on the tree response would have been simpler.

### 3. Single most significant improvement you would make to your development process (~80 words)

Set up CI from the first sprint. Docs commit `971ae5b` accidentally deleted 178 lines from `trees/tests.py`, dropping the suite from 60 tests to 45, and I didn't notice for two days (#65, restored in `6d9500a`). There's no `.github/workflows`, so the tests only ran when I remembered to run them. A GitHub Actions job running `python manage.py test`, `ruff`, `tsc` and ESLint on every push would have failed on that commit straight away. It would also mean "all tests pass" at the end of each sprint was checked, not just my word.

---

### AI Tools Declaration

**Tools used:** Claude Code (Anthropic), in the terminal. TODO: add any other AI tools you used, e.g. ChatGPT or Copilot

**What each was used for:** Claude Code helped implement GitHub issues on the API and client (e.g. #44 tree photos, #62 location without coordinates, #70 filter by creator) and write the API tests for them. It also helped with the Expo SDK 58 upgrade (#55) and debugging, and drafted commit messages, issue comments, release notes, sprint plans and the UAT test plan and session template. It wrote first drafts of file 10, Part 5 of file 11 and sections 3–4 of file 16, which I checked against the code and my notes and then edited. It wasn't used to produce UAT data: the participants, results, ratings and quotes all come from the real sessions.

**One instance where a tool genuinely helped:** The SDK 58 upgrade. My phone's Expo Go only supported SDK 58, and my first attempt left the project half upgraded on Node 20, with `npm install` failing on `expo-router@57` (ERESOLVE). Claude Code found that SDK 58 needs Node 22.13 or newer, switched to Node 22, and did a clean reinstall without the old lock file. I checked it with `expo-doctor` (20/20 checks), `tsc` and an Android bundle build, then by running the app on the phone for P3's session.

**One instance where a tool misled you or produced something you had to reject:** When `ImageBackground` was replaced for SDK 58, Claude Code's first version of the home screen header photo stopped partway down instead of filling the header. The lint and type checks passed, so the code looked fine, and I only noticed when I opened the app on my phone and took a screenshot. The fix was an `expo-image` with an explicit absolute position. Since then I check UI changes on the device rather than trusting a clean build.
