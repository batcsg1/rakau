# 11. User Acceptance Testing Sprint

<!--
Brief. Marks: 9. One sprint is the UAT sprint. In it, alongside that sprint's
planned development work, you validate your two Phase 1 features with real users.

NON-NEGOTIABLE (from the brief): never fabricate UAT data. Invented participants,
sessions or results are research misconduct and are handled under academic
integrity, not by deduction. Every row in this file must come from a real session.

Required steps:
1. Design a UAT test plan for the two features; scenarios derived directly from
   your Phase 1 acceptance criteria.
2. Recruit ≥ 3 participants NOT involved in development, who reasonably represent
   your intended users.
3. Observe and record how each participant completes each task; note issues,
   confusion, failures.
4. Collect structured feedback from each participant (same questionnaire / rating
   scale for all): usability, clarity, satisfaction.
5. Analyse results; identify issues that require implementation changes.
6. Make ≥ 2 tracked changes; re-verify the affected acceptance criteria.
7. Document test plan, raw results, and resulting changes.
8. Include this evidence in the UAT sprint release.
-->

## Part 1 — Test plan

### Features under test

The two features selected in Phase 1 (`Phase 1/06-design-reflection.md`). The acceptance criteria are from `Phase 1/02-backlog-requirements-analysis.md`.

| Feature | Phase 1 acceptance criteria (from file 02) |
|---|---|
| Feature 1: Add a tree with species, location and condition (REQ-01) | AC1: a valid species, location and condition saves the tree, and it appears in My Trees / AC2: a missing or invalid field shows per-field errors and saves nothing / AC3: a signed-out user can't add a tree / AC4: the owner can edit a tree and see the change / AC5: the owner can delete a tree after confirming, and it's no longer listed / AC6: a non-owner can't edit or delete, and the controls are hidden |
| Feature 2: My Trees list (REQ-02) | AC1: only the user's own trees are listed, newest first / AC2: with no trees, an empty-state message and an "Add tree" button are shown / AC3: with more than 20 trees, scrolling to the end loads the next page |

The API side of each criterion is covered by automated tests (`rakau_backend/trees/tests.py`). These sessions check the same criteria from a real user's point of view in the client.

### Scenarios (mapped to acceptance criteria)

Tasks are read from a printed task card, in this order. Each card gives the information a participant needs (species, condition, address or coordinates) but **not** which screen or button to use.

| ID | Scenario / task given to participant | Feature | Maps to AC | Success = |
|---|---|---|---|---|
| T1 | "You've just joined Rakau. Register as a new user, then record the healthy **kōwhai** you found at **149 Forfar Street, Dunedin**." | 1 | F1-AC1, F2-AC1 | Account created; tree saved with kōwhai, healthy and a location; it appears at the **top** of My Trees, and only the participant's own trees are shown |
| T2 | "Find the list of trees *you* have recorded." | 2 | F2-AC1 | Reaches My Trees and sees only their own trees |
| T3 | "Record a **stressed rimu**. Your notes say latitude **-458.87**, longitude **170.5**." (deliberate typo) | 1 | F1-AC2 | Participant notices the latitude error message, corrects it to -45.887 and saves; afterwards My Trees has exactly one new rimu, not two |
| T4 | "On a second look, the kōwhai from T1 is **stressed**, not healthy. Update it." | 1 | F1-AC4 | Opens the kōwhai, edits and saves; the tree page shows Stressed |
| T5 | "The rimu from T3 was recorded by mistake. Remove it." | 1, 2 | F1-AC5 | Deletes it after confirming; it's gone from My Trees |
| T6 | "In the catalogue, open a tree recorded by someone else. Could you change that record?" | 1 | F1-AC6 | No Edit or Delete controls are shown, and the participant concludes they can't change it |
| T7 | "Find the **oldest** tree recorded by the test user `batcsam5`." | 2 | F2-AC3 | Scrolls through the list; further pages load by themselves and the participant identifies the oldest tree |

> **Changes after planning:** T1 was changed to include registering (`8d56c7f`), T1 and T2 were swapped (`225f07b`), and the `seed_uat` data was dropped (`2828aaa`). As a result, T2 no longer tests the empty state (F2-AC2), and T6 and T7 use existing records instead of the seeded `uat_other` and `uat_collector` accounts.
| T8 | (Facilitator logs out.) "You're not logged in. Try to record a tree." | 1 | F1-AC3 | The app asks them to log in before any tree can be saved; after logging in, they're back on the Add Tree form |

### Method

- **Session type:** moderated, observed, in person, one participant at a time, about 30 minutes. Participants think aloud. The facilitator only gives a hint if a participant is stuck for 2 minutes or asks for help; that task is then recorded as "completed with hint".
- **Environment:**
  - The facilitator's Android phone running Expo Go, connected to the API on the facilitator's laptop over the same Wi-Fi.
  - The build is commit `TODO: hash` (`v0.2.0` plus the `seed_uat` command), the same for every session. Record the hash before the first session.
  - **Build change for P3:** P1 and P2 used the SDK 57 build (commit `TODO`). Before P3's session the
  store version of Expo Go on the session phone updated to SDK 58, which can't open an SDK 57
  project, so the client was upgraded to Expo SDK 58 (React Native 0.88, React 19.3; #55) and P3
  used that build (commit `TODO`). The upgrade changed no screens, flows or wording in Add a Tree
  or My Trees. The regression checklist in #55 was run before the session to confirm this.

- **Data recorded per task:**
  - outcome: Passed / Partial / Failed
  - time on task, from finishing reading the card to success or giving up (planned, but not recorded in the sessions)
  - observations: where they tapped first, hesitations, wrong turns, error messages seen
  - verbatim quotes

  All are recorded on a printed observation sheet per participant and typed up into `Phase 2/uat/P<n>.md` the same day.
- **After the tasks:** the questionnaire below, on paper, answered alone, then the two open questions asked verbally and noted word for word.
- **Pilot:** one dry run with someone who isn't a participant, to check task cards, timing and the network setup. Pilot results are not counted.
- **Ethics:**
  - Participants are told the app is being tested, not them, and that they can stop at any time.
  - Verbal consent is recorded for taking notes and using anonymised quotes.
  - No names, contact details or recordings of faces go into the repo; participants are P1, P2, ….
  - **No data is invented:** if a session doesn't happen, its rows stay empty.

### Participants (anonymised)

<!-- Fill in only after each real session. Intended users from the backlog: home
gardener, citizen scientist, conservation group member, arborist. None of them
may have been involved in building or designing Rākau. -->

| ID | Relationship to you | Why they represent an intended user | Involved in development? |
|---|---|---|---|
| P1 | TODO | TODO | No |
| P2 | TODO | TODO | No |
| P3 | TODO | TODO | No |

### Structured feedback instrument

<!-- Same for every participant. Example scale below — adjust wording, keep it consistent. -->

Rate 1 (strongly disagree) – 5 (strongly agree):

1. The feature was easy to use.
2. It was clear what to do at each step.
3. I understood the feedback the app gave me.
4. I was satisfied with the result.
5. I would be comfortable using this without help.

Open questions:
- What was the most confusing part?
- What would you change?

---

## Part 2 — Raw results

### Task observations

| Participant | Task | Outcome | Time | Observations / quotes |
|---|---|---|---|---|
| P1 | T1 | Passed | Not recorded | Registered and created the kōwhai |
| P1 | T2 | Passed | Not recorded | Found their own trees |
| P1 | T3 | Passed | Not recorded | Got clear error messages for the invalid latitude |
| P1 | T4 | Partial | Not recorded | Condition field not labelled on the kōwhai's detail page |
| P1 | T5 | Passed | Not recorded | Removed the rimu |
| P1 | T6 | Passed | Not recorded | Couldn't modify the test user's tree |
| P1 | T7 | Partial | Not recorded | Found the oldest tree; no way to sort by creation time or filter by creator |
| P1 | T8 | Passed | Not recorded | Couldn't record while logged out; the "Add" button still showed on the catalogue, which was misleading |
| P2 | T1 | Passed | Not recorded | Registered and created the kōwhai |
| P2 | T2 | Passed | Not recorded | Found their own trees |
| P2 | T3 | Passed | Not recorded | Got clear error messages for the invalid latitude |
| P2 | T4 | Partial | Not recorded | Condition field not labelled on the detail page |
| P2 | T5 | Passed | Not recorded | Removed the rimu |
| P2 | T6 | Passed | Not recorded | Couldn't modify the test user's tree |
| P2 | T7 | Partial | Not recorded | Unclear which tree was oldest; had to open the detail page to see when each was recorded; suggested sorting by height, girth, crown spread and time created |
| P2 | T8 | Passed | Not recorded | No notes recorded |
| P3 | T1 | Partial | Not recorded | Confused by the coordinates; keyboard hid the measurement fields; confused by "trunk girth" vs "crown spread"; region showed "No Region" despite auto-filling to Otago; asked for imperial units and definitions of the health values |
| P3 | T2 | Partial | Not recorded | Logged another tree at a different address; the region again showed "No Region" |
| P3 | T3 | Passed | Not recorded | Invalid coordinates were rejected |
| P3 | T4 | Passed | Not recorded | Condition updated to Stressed |
| P3 | T5 | Passed | Not recorded | Suggested asking "Are you sure you want to delete this tree?" |
| P3 | T6 | Passed | Not recorded | Could view another user's Monkey Puzzle Tree but not modify it |
| P3 | T7 | Partial | Not recorded | Recorded times weren't exact; order not clear from the catalogue |
| P3 | T8 | Passed | Not recorded | Redirected to the login page when trying to add a tree |

### Questionnaire results

| Q | P1 | P2 | P3 | Mean |
|---|---|---|---|---|
| Q1 easy to use | 4 | 4 | 3 | 3.67 |
| Q2 clear steps | 3 | 3 | 3 | 3.00 |
| Q3 understood feedback | 4 | 3 | 4 | 3.67 |
| Q4 satisfied | 2 | 3 | 2 | 2.33 |
| Q5 comfortable unaided | 2 | 2 | 2 | 2.00 |

Open-question responses (word for word):

| | Most confusing part | What would you change |
|---|---|---|
| P1 | "The location having the cords above, then auto filling to hamilton. Later being over ridden my location auto fill." | "Make sure it's easy to add cords, bit confusing, most people aren't gonna need to manually enter them and could just be auto filled every time? Maybe need a map where you can moved the pin, since the tree might not be at the exact address." |
| P2 | "Not being able to tell straight away what trees were the oldest and the newest." | "Recommend adding sorting functionality for fields such as height, girth, crown spread and time created. Add search functionality for filtering trees based on creators. The UI looks a bit cluttered, and could do with more refactoring, especially paginating long tree lists so the user doesn't have to do one continous scroll." |
| P3 | "The longitude and latitude fields, and the girth and crown spread fields, and understanding the definitions would have helped," | "Add more field definitions to latitude, longitude, crown spread and girth. Have a feature/guidelines that highlights the average size for each trees within each region. Make the UI less clutered/less busy in areas such as the main page. Have a Purpose section that contains the text below the motto for Rakau." |

Raw notes stored at: `Phase 2/uat/` (`participant1.md`, `participant2.md`, `participant3.md`)

---

## Part 3 — Issue log

| ID | Description | Feature | Source (task / participant) | Severity | Priority | Decision |
|---|---|---|---|---|---|---|
| I1 | Condition field has no label on the tree detail page | 1 | T4, P1 + P2 | Med | Must | Fix (#56) |
| I2 | Region shows "No Region" even though it auto-filled (Otago) | 1 | T1 + T2, P3 | High | Must | Fix (#57) |
| I3 | No confirmation before deleting a tree, which F1-AC5 requires | 1 | T5, P3 | High | Must | Fix (#58) |
| I4 | Creation date not shown on the catalogue, so participants couldn't tell the oldest or newest tree; no sorting by it | 2 | T7, P1 + P2 + P3 | Med | Must | Fix (#59) |
| I5 | "Add" button still shown on the catalogue when logged out | 1 | T8, P1 | Low | Should | Fix (#60) |
| I6 | Girth and Crown Spread fields unclear; need labels | 1 | T1, P3 | Med | Should | Fix (#61) |
| I7 | Latitude and longitude fields confusing; should be hidden and filled in automatically from the location | 1 | T1, P3; questionnaire, P1 + P3 | Med | Should | Fix (#62) |
| I8 | Home screen cluttered; move the text under the motto and logo off the photo into a Purpose section | – | Questionnaire, P2 + P3 | Low | Should | Fix (#63) |
| I9 | Coordinates auto-filled to Hamilton, then overwritten by the device location | 1 | Questionnaire, P1 | Med | Should | Fix (resolved by I7, #62) |
| I10 | Keyboard covers the measurement fields on the Add Tree form | 1 | T1, P3 | Med | Should | Defer |
| I11 | Detail page shows the date recorded but not the time | 2 | T7, P3 | Low | Should | Fix (with I4, #59) |
| I12 | No filter by creator | 2 | T7, P1; questionnaire, P2 | Low | Should | Defer |
| I13 | No map pin to adjust the tree's location | 1 | Questionnaire, P1 | Low | Should | Defer |
| I14 | No definitions for the health values | 1 | T1, P3 | Low | Should | Defer |
| I15 | No sorting by height, girth or crown spread | 2 | T7, P2 | Low | Won't | Won't fix |
| I16 | Long lists are one continuous scroll; asked for pagination | 2 | Questionnaire, P2 | Low | Won't | Won't fix |
| I17 | No imperial units | 1 | T1, P3 | Low | Won't | Won't fix |
| I18 | No guide to average tree size per region | 1 | Questionnaire, P3 | Low | Won't | Won't fix |

### Feedback deliberately not actioned

| Feedback | Why not actioned |
|---|---|
| I10 keyboard covering fields | Real usability problem, but it doesn't stop a tree being saved; scheduled for Sprint 4 |
| I12 filter by creator | The catalogue isn't one of the two features under test; Sprint 4 |
| I13 map pin | Needs a map library and a new interaction; larger than a UAT fix; Sprint 4 |
| I14 health value definitions | Helpful but not a defect; Sprint 4, together with the I6 labels |
| I15 sort by measurements | Not needed by any acceptance criterion; I4 already addresses the oldest/newest confusion |
| I16 page-based pagination | F2-AC3 deliberately uses infinite scroll |
| I17 imperial units | Outside REQ-01; the app stores metric values, and converting adds complexity for one request |
| I18 regional size guide | A new feature outside REQ-01 and REQ-02 that needs reference data the app doesn't have |

---

## Part 4 — Changes made and re-verification

| Issue | Change made | Commit / PR | Acceptance criterion re-verified | Re-verification result |
|---|---|---|---|---|
| I1 (#56) | Added a "Condition" label next to the condition badge on the tree detail page, and a "Significance" label when that badge is shown (`app/trees/[id]/index.tsx`) | `71ba5af` | F1-AC4 | TODO: re-run T4 on the phone (edit the kōwhai to Stressed, save) and record whether the labelled condition shows Stressed |
| I2 (#57) | Region chips no longer toggle off when the selected region is tapped; a "Not set" chip clears the region instead (`components/TreeForm.tsx`, `constants/options.ts`). API tests check a created tree keeps its region and `/mine/` returns it | `464b372` | F1-AC1, F2-AC1 | TODO: re-run P3's path on the phone (auto-fill to Otago, tap Otago, save) and record whether My Trees shows Otago |
| I3 (#58) | The delete confirmation on the tree detail page now asks "Are you sure you want to delete this {species}?", and its buttons read "No, keep it" and "Yes, delete" (`app/trees/[id]/index.tsx`). An inline confirmation was already in place before UAT; this makes it read as the question P3 suggested | `fe4a7d4` | F1-AC5 | TODO: re-run T5 on the phone (open the rimu, tap Delete, tap "No, keep it" and check it's still listed, then delete it and check it's gone from My Trees) |
| I4 + I11 (#59) | Catalogue cards and My Trees rows now show the date and time each tree was recorded (`utils/dates.ts`), and both lists have a Newest first / Oldest first sort (`app/trees/index.tsx`, `app/trees/mine.tsx`). The API takes `?ordering=newest|oldest` on `/api/trees/` and `/api/trees/mine/` (`trees/filters.py`, `trees/views.py`), with API tests for both orders, paging and an invalid value. The detail page already showed the time (`feb17a5`) | `3b3003e` | F2-AC1, F2-AC3 | TODO: re-run T7 on the phone (sort the catalogue Oldest first and find batcsam5's oldest tree), then check My Trees still lists only your own trees, newest first by default |
| I5 (#60) | The catalogue's "+ Add" button is only shown to signed-in users, using the same `useCurrentUser` check as the nav bar (`app/trees/index.tsx`). The other ways to add a tree were already signed-in only (the nav menu and My Trees), and `/trees/new` still sends a logged-out user to the login screen | `3c8c542` | F1-AC3 | TODO: re-run T8 on the phone (log out, open the catalogue and check there's no "+ Add", then log in and check it's back) |
| I6 (#61) | Each measurement on the Add/Edit Tree form now has a short explanation under its label: trunk girth is the distance around the trunk at 1.4 m above the ground, and crown spread is the width of the branches at the widest point. Height got one too for consistency. `FormField` takes a new optional `hint`, which screen readers also read out (`components/FormField.tsx`, `components/TreeForm.tsx`) | `TODO` | F1-AC1 | TODO: re-run T1 on the phone (record a tree with height, girth and crown spread) and record whether the participant understands the girth and crown spread fields |

<!-- Brief requires at least TWO issues to result in a tracked, implemented change. -->

---

## Part 5 — Findings summary (short written summary)

TODO — a few paragraphs: what the sessions showed, the pattern behind the issues,
what changed as a result, and what the re-verification confirmed.

---

## Evidence bundle for the UAT release

- [x] `docs/11-user-acceptance-testing.md` (this file, completed)
- [x] `docs/uat/` raw session notes for every participant
- [x] `docs/uat/` completed questionnaires for every participant
- [ ] Issue log with severity/priority per issue
- [ ] ≥ 2 tracked changes linked to issues
- [ ] Re-verification results for changed acceptance criteria
- [ ] Findings summary

## Marker checklist (UAT criteria table from the brief)

- [ ] ≥ 3 participants, none involved in development, representative of intended users
- [ ] Scenarios map directly to Phase 1 acceptance criteria (not "click around")
- [ ] ≥ 1 moderated/observed session with notes on what participants did/said/struggled with
- [ ] Structured feedback captured consistently across all participants
- [ ] Issues logged individually with severity/priority
- [ ] ≥ 2 issues → tracked, implemented change
- [ ] Changed features re-checked against original acceptance criteria
- [ ] Test plan + raw results + written summary all included in evidence
