# 16. User Acceptance Testing Reflection

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

**Fixed, mostly because each one broke an acceptance criterion:**

- **I1 (#56, `71ba5af`):** labelled the condition field on the detail page (F1-AC4; P1, P2).
- **I2 (#57, `464b372`):** fixed the "No Region" bug (F1-AC1; P3, seen twice). The Region chips toggled, so when P3 tapped the auto-filled Otago chip to confirm it, the region was cleared.
- **I3 (#58, `fe4a7d4`):** the delete prompt now asks "Are you sure you want to delete this {species}?" There was already a confirmation step (`1865912`), so T5 was a fair pass, but P3 didn't read it as a question.
- **I4 (#59, `3b3003e`):** both lists show when each tree was recorded and can sort Newest or Oldest first (F2-AC1; all three participants).
- **I5 (#60, `3c8c542`):** "Add" is hidden when logged out (F1-AC3; P1 called it "misleading").
- **I6 (#61, `dedc9f7`):** Girth and Crown Spread now have a short explanation under them (F1-AC1). P3 was "confused about what Trunk girth vs crown spread meant".
- **I7 (#62, `8e0ec6d`):** the latitude and longitude fields are gone. The location comes from the address or the phone instead (F1-AC1, F1-AC2; P1, P3). P1 said "most people aren't gonna need to manually enter them and could just be auto filled every time".
- **I8 (#63, `15fb38b`):** the text under the motto moved into a Purpose section (P2, P3). P3 asked to "make the UI less clutered/less busy". It doesn't break an acceptance criterion, but two people asked for it without being prompted.
- **I9 and I11** came with I7 and I4. Without coordinate fields, nothing can overwrite them (P1). The detail page already showed the time, so P3's point was really about the lists, which I4 fixed.
- **I12 (#70, `0f3b2a8`, `b46f9f1`):** I first deferred filter by creator (P1, P2), but I had time to add it in Sprint 4.

**Deferred or not fixed:**

- **Map pin (P1, #71), keyboard covering the measurements (P3, #64) and health value definitions (P3):** still open. These are usability problems, not defects, and the map pin needs a new library.
- **Imperial units and regional size guidelines (P3):** won't fix. Both are outside REQ-01 and REQ-02.
- **Page-based pagination (P2):** won't fix. F2-AC3 deliberately uses infinite scroll.

## 4. How the changes improved the feature(s) (~70 words)

| Change (issue) | Criterion re-verified | Result |
|---|---|---|
| I1 condition label (#56) | F1-AC4 | The condition label appears on the right hand side of the screen, a distance apart from an individual tree record's species name|
| I2 region saved and shown (#57) | F1-AC1 | API tests pass (a new tree keeps its region and My Trees returns it). The phone re-run wasn't recorded |
| I3 delete confirmation (#58) | F1-AC5 | Partly: the prompt now reads as a question (screenshot on #58). T5 not re-run |
| I4 date shown and sortable (#59) | F2-AC1 | The two sort options for newest and oldest first appear near the top of the 'Tree Catalogue' screen |
| I5 "Add" hidden when logged out (#60) | F1-AC3 | No "+ Add" option appears when logged out (#60) |
| I6 Girth and Crown Spread labels (#61) | F1-AC1 | Partly: the explanations show (#61). |
| I7 coordinates hidden and filled automatically (#62) | F1-AC1, F1-AC2 | Pass: no coordinate fields, the right coordinates were saved, and an empty location was rejected (#62) |
| I8 home screen text moved into a Purpose section (#63) | Exempt from defined Acceptance Criteria | Partly: the Purpose section shows (#63). Not checked with a participant |

I7 is the change I'm happiest with. P1 and P3 both named the coordinates as the most confusing part, and now there's nothing to type. What I can't say yet is whether the app is easier for real users. I did every re-check myself, knowing what to look for. Re-running T1, T4 and T7 with a participant is the only way to find out if the low Q4 and Q5 scores improve.

## 5. What you would do differently next round (~40 words)

I should have been more prepared for what I was actually going to test on, and have all the sprint planning for the UAT sprint prior to actually executing the UAT tests. Changing T1, T2 and the seed data during the sessions broke the T2 and T7 checks. I also should have done a dry run to test if the tests are do-able for the UAT sessions. I should have planned ahead by adding different species entries as the user's were mislead by the fact that the species entries for Rimu and Kowhai were not added to the app, prior to them testing.

---

