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

Tasks are read from a printed task card, in this order. Each card gives the information a participant needs (species, condition, address or coordinates) but **not** which screen or button to use. Each participant logs in as their own empty account (`uat_p1`, `uat_p2`, …) created by `python manage.py seed_uat`.

| ID | Scenario / task given to participant | Feature | Maps to AC | Success = |
|---|---|---|---|---|
| T1 | "You've just joined Rākau. Find the list of trees *you* have recorded." | 2 | F2-AC2 | Reaches My Trees, sees the empty-state message, and identifies the "Add your first tree" button as the next step |
| T2 | "You've found a healthy **kōwhai** at **149 Forfar Street, Dunedin**. Record it." | 1, 2 | F1-AC1, F2-AC1 | Tree saved with kōwhai, healthy and a location; it appears at the **top** of My Trees, and only the participant's own trees are shown |
| T3 | "Record a **stressed rimu**. Your notes say latitude **-458.87**, longitude **170.5**." (deliberate typo) | 1 | F1-AC2 | Participant notices the latitude error message, corrects it to -45.887 and saves; afterwards My Trees has exactly one new rimu, not two |
| T4 | "On a second look, the kōwhai from T2 is **stressed**, not healthy. Update it." | 1 | F1-AC4 | Opens the kōwhai, edits and saves; the tree page shows Stressed |
| T5 | "The rimu from T3 was recorded by mistake. Remove it." | 1, 2 | F1-AC5 | Deletes it after confirming; it's gone from My Trees |
| T6 | "In the catalogue, open the **tōtara** recorded by someone else (`uat_other`). Could you change that record?" | 1 | F1-AC6 | No Edit or Delete controls are shown, and the participant concludes they can't change it |
| T7 | (Facilitator logs in as `uat_collector`, which has 25 trees.) "This account belongs to a keen recorder. Find the **oldest** tree they've recorded." | 2 | F2-AC3 | Scrolls past the first 20; the next page loads by itself and the participant reaches tree 25 ("all 25 trees shown") |
| T8 | (Facilitator logs out.) "You're not logged in. Try to record a tree." | 1 | F1-AC3 | The app asks them to log in before any tree can be saved; after logging in, they're back on the Add Tree form |

### Method

- **Session type:** moderated, observed, in person, one participant at a time, about 30 minutes. Participants think aloud. The facilitator only gives a hint if a participant is stuck for 2 minutes or asks for help; that task is then recorded as "completed with hint".
- **Environment:**
  - The facilitator's Android phone running Expo Go, connected to the API on the facilitator's laptop over the same Wi-Fi.
  - The build is commit `TODO: hash` (`v0.2.0` plus the `seed_uat` command), the same for every session. Record the hash before the first session.
  - The database is reset with `seed_uat` before each session.
- **Data recorded per task:**
  - outcome: completed unaided / completed with hint / failed
  - time on task, from finishing reading the card to success or giving up
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
| P1 | T1 | TODO | TODO | TODO |
| P1 | T2 | TODO | TODO | TODO |
| P2 | T1 | TODO | TODO | TODO |
| … | … | … | … | … |

### Questionnaire results

| Q | P1 | P2 | P3 | Mean |
|---|---|---|---|---|
| Q1 easy to use | | | | |
| Q2 clear steps | | | | |
| Q3 understood feedback | | | | |
| Q4 satisfied | | | | |
| Q5 comfortable unaided | | | | |

Open-question responses: TODO (quote each participant)

Raw notes / recordings stored at: `docs/uat/` (session notes `P1.md`, `P2.md`, `P3.md`; questionnaires `P1-survey.*` …)

---

## Part 3 — Issue log

| ID | Description | Feature | Source (task / participant) | Severity | Priority | Decision |
|---|---|---|---|---|---|---|
| I1 | TODO | 1 | T1, P1+P2 | High / Med / Low | Must / Should / Won't | Fix / Defer / Won't fix |
| I2 | TODO | 2 | T3, P3 | | | |
| I3 | TODO | | | | | |

### Feedback deliberately not actioned

| Feedback | Why not actioned |
|---|---|
| TODO | TODO |

---

## Part 4 — Changes made and re-verification

| Issue | Change made | Commit / PR | Acceptance criterion re-verified | Re-verification result |
|---|---|---|---|---|
| I1 | TODO | `TODO` | F1-AC1 | Pass — TODO how checked |
| I2 | TODO | `TODO` | F2-AC1 | Pass — TODO |

<!-- Brief requires at least TWO issues to result in a tracked, implemented change. -->

---

## Part 5 — Findings summary (short written summary)

TODO — a few paragraphs: what the sessions showed, the pattern behind the issues,
what changed as a result, and what the re-verification confirmed.

---

## Evidence bundle for the UAT release

- [ ] `docs/11-user-acceptance-testing.md` (this file, completed)
- [ ] `docs/uat/` raw session notes for every participant
- [ ] `docs/uat/` completed questionnaires for every participant
- [ ] Issue log with severity/priority per issue
- [ ] ≥ 2 tracked changes linked to issues
- [ ] Re-verification results for changed acceptance criteria
- [ ] Findings summary
- [ ] All of the above referenced in the UAT sprint release notes (file 12)

## Marker checklist (UAT criteria table from the brief)

- [ ] ≥ 3 participants, none involved in development, representative of intended users
- [ ] Scenarios map directly to Phase 1 acceptance criteria (not "click around")
- [ ] ≥ 1 moderated/observed session with notes on what participants did/said/struggled with
- [ ] Structured feedback captured consistently across all participants
- [ ] Issues logged individually with severity/priority
- [ ] ≥ 2 issues → tracked, implemented change
- [ ] Changed features re-checked against original acceptance criteria
- [ ] Test plan + raw results + written summary all included in evidence
