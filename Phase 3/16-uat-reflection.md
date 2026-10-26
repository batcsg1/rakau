# 16. User Acceptance Testing Reflection

<!--
Brief. Marks: 7. ~400 words. Part of the final reflection.md.
Assessed on specific evidence from your UAT sessions (file 11). Only your
participants can tell you what confused them — use their actual words and results.
-->

## 1. Test scenario design (~90 words)

Each of the eight tasks (T1–T8) maps to a Phase 1 acceptance criterion (file 11, Part 1), and the task cards give the data but not the screen to use. After planning I changed T1 to include registering (`8d56c7f`), swapped T1 and T2 (`225f07b`) and dropped the seeded data (`2828aaa`). Because of this, T2 could no longer show the empty state (F2-AC2), since the participant already had a tree. T7 was meant to test paging (F2-AC3), but all three participants read "oldest" as a sorting problem. So T7 ended up testing whether the list order is visible (F2-AC1), not paging.

## 2. What participants struggled with (~90 words)

Each feature failed at a different point. Validation worked well: all three passed T3 and the T6 ownership check. The problems were in how data was shown and entered:

- **T7, Partial ×3.** P2 said the most confusing part was "not being able to tell straight away what trees were the oldest and the newest", because the date only appears on the detail page.
- **T4.** P1 and P2 found the condition field had no label on the detail page.
- **Coordinates.** P1 found it confusing that the coordinates auto-filled to Hamilton and were then "over ridden" by their location. P3 asked for definitions of girth and crown spread.
- **Region.** For P3, the region showed as "No Region" even though it had auto-filled to Otago.

Average ratings were Q4 (satisfied) 2.3 and Q5 (comfortable without help) 2.0. So participants could finish the tasks but didn't trust the result.

## 3. Feedback acted on vs. not (~110 words)

<!-- TODO: replace I-numbers with the IDs from file 11's issue log once #52 is done, and add the commit/PR for each fix. -->

**To fix, because each one breaks an acceptance criterion:**

- **I1:** label the condition field (F1-AC4; P1, P2).
- **I2:** fix the "No Region" bug (F1-AC1; P3, seen twice).
- **I3:** ask for confirmation before deleting. P3 asked for "Are you sure you want to delete this tree?", but F1-AC5 already requires a confirmation, so T5 should not have been marked a pass.
- **I4:** show the creation date on the catalogue and allow sorting by it (F2-AC1; all three participants).
- **I5:** hide "Add" when logged out (F1-AC3; P1 called it "misleading").
- **I6:** add labels for Girth and Crown Spread (F1-AC1; P3). P3 was "confused about what Trunk girth vs crown spread meant" and named these fields as the most confusing part.
- **I7:** hide the latitude and longitude fields and fill them in automatically from the location the user enters (F1-AC1, F1-AC2; P1, P3). P1 said "most people aren't gonna need to manually enter them and could just be auto filled every time". P3 named the latitude and longitude fields as the most confusing part.
- **I8:** tidy up the home screen by moving the text under the motto and logo off the main photo and into a Purpose section below it (P2, P3). P3 asked to "make the UI less clutered/less busy in areas such as the main page" and to "have a Purpose section that contains the text below the motto for Rakau". P2 said "the UI looks a bit cluttered". This doesn't break an acceptance criterion, but it's a small change that two participants asked for on their own.

**Deferred or not fixed:**

- **Map pin (P1) and definitions for the other fields (P3: health values):** deferred to Sprint 4, because they are usability improvements, not defects.
- **Imperial units and regional size guidelines (P3):** won't fix. Both are outside REQ-01 and REQ-02.
- **Page-based pagination (P2):** won't fix. F2-AC3 deliberately uses infinite scroll.

## 4. How the changes improved the feature(s) (~70 words)

<!-- TODO: fill in once the fixes are merged and re-checked (file 11, Part 4). Only record results that were actually observed. -->

| Change | Criterion re-verified | Result |
|---|---|---|
| I1 condition label | F1-AC4 | TODO |
| I2 region saved and shown | F1-AC1 | TODO |
| I3 delete confirmation | F1-AC5 | TODO |
| I4 date shown and sortable | F2-AC1 | TODO |
| I6 Girth and Crown Spread labels | F1-AC1 | TODO |
| I7 coordinates hidden and filled automatically | F1-AC1, F1-AC2 | TODO |
| I8 home screen text moved into a Purpose section | None (check with a participant) | TODO |

## 5. What you would do differently next round (~40 words)

I should have been more prepared for what I was actually going to test on, and have all the sprint planning for the UAT sprint prior to actually executing the UAT tests. Changing T1, T2 and the seed data during the sessions broke the T2 and T7 checks. I also should have done a dry run to test if the tests are do-able for the UAT sessions. I should have planned ahead by adding different species entries as the user's were mislead by the fact that the species entries for Rimu and Kowhai were not added to the app, prior to them testing.

---

