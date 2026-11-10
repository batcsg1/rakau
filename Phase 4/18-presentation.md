# 18. Final Presentation

<!--
Brief. Marks: 14. Individual presentation, 10–15 minutes, live or recorded.
Communicate your work as a professional developer would to a technical lead,
development team or client. Do NOT simply read your written reflections.
The code walkthrough is unscripted, in front of / for a marker.
-->

## Running order & timing (target 10–15 min)

| # | Section | Target time | Notes |
|---|---|---|---|
| 1 | Project overview — concept, backlog & prioritisation, sprint plan | 1–2 min | Show the backlog table (file 02) or the release log (file 12) |
| 2 | Feature demonstration — the two Phase 1 features, run from latest local release | 3–4 min | Use tag `v1.0.0` |
| 3 | Code walkthrough — one design pattern in the real implementation | 3–4 min | Pattern: Strategy (DRF permission classes) |
| 4 | User acceptance testing — concise, honest account + what it revealed | 2–3 min | 3 participants, 17 Passed / 7 Partial / 0 Failed, 8 fixes |
| 5 | Final takeaway — single most important thing learned | 1 min | Passing tests isn't the same as users succeeding |

Aim for about 12 minutes in total.

## 1. Project overview — talking points

- **Concept in one sentence:** "Rākau is an app for recording New Zealand's native and exotic trees. You record a tree's species, location and condition, and you can browse and filter everyone's records."
- **Prioritisation approach + why the top items are on top:** "I used MoSCoW, because I'm one developer with a fixed deadline. What mattered most was deciding what gets dropped if time runs out. Adding a tree and My Trees are the two Musts, because every other feature reads the data they create. The height, girth, region and significance filters are Shoulds."
- **Sprint plan shape (3 dev + UAT), what each sprint delivered:**
  - Sprint 1 (`v0.1.0`): the API and catalogue foundations.
  - Sprint 2 (`v0.2.0`): login, Add/Edit/Delete Tree, My Trees and the filters.
  - Sprint 3 (`v0.3.0`): UAT with three participants. I cut it to one week, and upgraded the client to SDK 58 during it.
  - Sprint 4 (`v1.0.0`): the eight UAT fixes, photos, filter by creator, and the test suite back up to 105 tests.

## 2. Feature demonstration — runbook

- **Release/tag to run:** `v1.0.0`
- **Start API:** `git checkout v1.0.0`, then `./setup.sh`, which starts both the API and the client. To start the API on its own: `cd rakau_backend`, `source venv/bin/activate.fish`, `python manage.py runserver 0.0.0.0:8000`
- **Start client:** `cd rakau_frontend`, then `npx expo start`. On a phone, use the store version of Expo Go (SDK 58), with `EXPO_PUBLIC_API_URL` set to the laptop's LAN IP. This needs Node 22.13 or newer.
- **Before the demo:** log in as a demo account with at least 21 trees, so the next page of My Trees loads. The seed script only adds species, not trees.
- **Feature 1 demo path:**
  1. Log in, open Add Tree, and tap Save with nothing filled in. Say: "Every required field shows its own error, and nothing is saved." (the error state)
  2. Type **149 Forfar Street**, pick the suggestion, and point out that the region fills in as Otago. Say: "There are no latitude or longitude fields. In UAT, people found those the most confusing part, so the location now comes from the address or the phone."
  3. Choose a species and a condition, then save. The app goes to My Trees with the new tree highlighted.
  4. Open the tree, edit it to Stressed, and show the labelled Condition badge (I1). Then delete it and show the "Are you sure…?" prompt (I3).
  5. Log out, and show that the catalogue has no "+ Add" button (I5).
- **Feature 2 demo path:**
  1. Only your own trees are listed, newest first, each with the date and time it was recorded. Switch the sort to Oldest first (I4).
  2. Filter by condition, and pull down to refresh.
  3. Scroll past 20 trees so the next page loads by itself.
  4. Optionally, log in as a new account to show the empty state with its "Add your first tree" button.
- **Fallback if something breaks live:** the screenshots on issues #56–#63 and #70, plus a recording of this run made beforehand.

## 3. Code walkthrough — script-free prep

- **Pattern:** Strategy (DRF permission classes)
- **File(s) to open:** `rakau_backend/trees/permissions.py`, `rakau_backend/trees/views.py`, and a terminal in `rakau_backend` with the venv activated
- **Say:** (1) where it is used, (2) why it was selected, (3) what problem it solves:
  1. **What the pattern is:** "The pattern I used is Strategy. You put a rule in its own class, and the code that uses it can swap one rule for another without changing. In Rākau, the rules are about who's allowed to change data."
  2. **The rules, `permissions.py`:**
     - `IsOwnerOrReadOnly` (line 4): "Anyone can read a tree. To change it you have to be logged in, and you have to be the tree's owner or staff."
     - `IsAdminOrReadOnly` (line 26): "Species are shared reference data, so anyone can read them, but only staff can change them."
  3. **Where they plug in, `views.py`:**
     - Line 29: "The tree endpoints use the owner rule."
     - Line 91: "The species endpoints use the staff rule. It's the same kind of view with a different rule plugged in."
     - Line 60: "My Trees swaps in DRF's `IsAuthenticated`, because you have to log in just to see your own list."
     - Then: "None of these views check who the user is. DRF calls whichever rule I give it."
  4. **Why it was worth it:** "Without it, I'd have repeated the owner check in five places: update, partial update, delete, photo upload and photo delete. Missing one would be a security hole. When I added photos in Sprint 4, they got the tree's rule automatically, with no new permission code."
  5. **Prove it works:** run `python manage.py test trees.tests.UpdateDeleteTreeTests`. "These tests check that another user gets a `403` and the tree doesn't change, and that a logged-out user gets a `401`."
- **Anticipated marker questions + answers:**
  - *What's the downside?* "You can't see the rule when you read a view. You have to open `permissions.py` to find it."
  - *Isn't this just DRF?* "DRF provides the interface and calls the rules. I wrote the two rules and chose which one each view uses."

## 4. UAT — talking points

- **Who tested, how many, how representative:** "Three participants: a family member, a colleague and a lecturer. None of them helped build the app. They're members of the public, not arborists, which is a limitation."
- **Top 2–3 issues found:**
  - "Out of 24 task attempts, 17 passed, 7 were partial and none failed. But satisfaction averaged 2.3 out of 5, and feeling comfortable without help averaged 2.0. People could finish the tasks, but they didn't trust the result."
  - Coordinates were confusing. P1 said "most people aren't gonna need to manually enter them".
  - Nobody could tell which tree was oldest, so T7 was Partial for all three participants.
  - A real bug: tapping the auto-filled Region chip cleared it.
- **What changed as a result + re-verification:** "Eight fixes, each tracked as its own GitHub issue (#56–#63). The biggest was removing the coordinate fields. I re-checked the fixes myself, but a participant hasn't re-run them yet, so I can't claim the satisfaction scores have gone up."
- **What you would do differently:** "I'd finish the plan and the task cards before the first session, and do a dry run. Changing T1, T2 and the seed data during the sessions broke the T2 and T7 checks. I'd also add the species the tasks use beforehand."

## 5. Final takeaway

- "Passing tests isn't the same as users succeeding. All my API tests passed, but every participant was confused by coordinates, and that only showed up because I watched real people use the app."

---

