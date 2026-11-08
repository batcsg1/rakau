# 16. User Acceptance Testing Reflection

## 1. Test scenario design (~90 words)

Each of the eight tasks (T1–T8) maps to a Phase 1 acceptance criterion (file 11, Part 1), and the task cards give the data but not the screen to use. After planning I changed T1 to include registering (`8d56c7f`), swapped T1 and T2 (`225f07b`) and dropped the seeded data (`2828aaa`). Because of this, T2 could no longer show the empty state (F2-AC2), since the participant already had a tree. T7 was meant to test paging (F2-AC3), but all three participants read "oldest" as a sorting problem. So T7 ended up testing whether the list order is visible (F2-AC1), not paging.

## 2. What participants struggled with (~90 words)

Participants could finish the tasks. The problems were in how data was shown and entered. All three passed T3 and T6.

- **T7, Partial ×3:** P2 couldn't "tell straight away what trees were the oldest and the newest", because the date was only on the detail page.
- **T4:** P1 and P2 found the condition had no label.
- **Location:** P1's coordinates auto-filled to Hamilton and were then "over ridden". P3 saw "No Region" after Otago auto-filled.

Q4 (satisfied) averaged 2.3 and Q5 (comfortable without help) 2.0, so they finished the tasks but didn't trust the result.

## 3. Feedback acted on vs. not (~110 words)

**Fixed**, mostly because each one broke an acceptance criterion:

- I1 condition label (#56, `71ba5af`), I4 recorded date and sort (#59, `3b3003e`), and I5 hiding "Add" when logged out (#60, `3c8c542`). P1 had called the Add button "misleading".
- I2 "No Region" (#57, `464b372`): tapping the auto-filled Otago chip toggled it off.
- I3 (#58, `fe4a7d4`): the existing delete confirmation now asks "Are you sure…?", as P3 suggested.
- I6 girth and crown spread hints (#61, `dedc9f7`), and I7 removing the coordinate fields (#62, `8e0ec6d`). P1 said they "could just be auto filled every time".
- I8 Purpose section (#63, `15fb38b`) and I12 filter by creator (#70) aren't tied to a criterion, but two participants asked for each.

**Not fixed:** the map pin (#71), the keyboard covering fields (#64) and health value definitions are deferred as usability work. Imperial units and size guides are outside REQ-01 and REQ-02. Page-based pagination would replace F2-AC3's infinite scroll.

## 4. How the changes improved the feature(s) (~70 words)

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

## 5. What you would do differently next round (~40 words)

I'd finish the sprint plan and task cards before the first session, and do a dry run. Changing T1, T2 and the seed data during the sessions broke the T2 and T7 checks. I'd also add the species the tasks use beforehand, because Rimu and Kōwhai weren't in the app.

---
