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

| Feature | Phase 1 acceptance criteria (from file 02) |
|---|---|
| Feature 1 — TODO | AC1: TODO / AC2: TODO / AC3: TODO |
| Feature 2 — TODO | AC1: TODO / AC2: TODO / AC3: TODO |

### Scenarios (mapped to acceptance criteria)

| ID | Scenario / task given to participant | Feature | Maps to AC | Success = |
|---|---|---|---|---|
| T1 | "TODO: do X starting from the home screen" | 1 | F1-AC1 | TODO observable outcome |
| T2 | TODO | 1 | F1-AC2 | TODO |
| T3 | TODO | 2 | F2-AC1 | TODO |
| T4 | TODO | 2 | F2-AC2 | TODO |

### Method

- Session type: moderated / observed (at least one must be) — TODO
- Environment: TODO (device, build/tag used)
- Data recorded per task: completed unaided / completed with hint / failed; time; observations; verbatim quotes
- Ethics: participants told it is the software being tested, not them; consent to notes; data anonymised

### Participants (anonymised)

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
