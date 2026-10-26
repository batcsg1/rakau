# UAT session: P_

<!--
Copy this file to `P<n>.md` (e.g. `P1.md`) for each participant and fill it in
the same day as the session. Record only what actually happened in that session;
leave anything that didn't happen blank. No names or contact details.
Scenarios, success conditions and the questionnaire: `Phase 2/11-user-acceptance-testing.md`.
-->

## Session details

| | |
|---|---|
| Participant | Anon |
| Date | 21/10/2026 |
| Session type | Moderated, **observed**, in person |
| Device | Emulated Pixel 8 |

## Tasks

Outcome: **Passed** / **Partial** / **Failed**. Time is from finishing reading the card to success or giving up.


### T1: Register as a new user and record the kōwhai at 149 Forfar Street (F1-AC1, F2-AC1)

Outcome: Passed

Notes: 

User successfully created the Kowhai

### T2: Find your own trees (F2-AC2)

Outcome: Passed

Notes: 

User was able to find their own trees

### T3: Record the rimu with the latitude typo (F1-AC2)

Outcome: Passed

Notes: User got insightful error messages when adding an invalid latitude

### T4: Update the kōwhai to stressed (F1-AC4)

Outcome: Partial

Notes: User noted after the Kowhai was added, the field recording the condition wasn't labelled on
the detail page for the Kowhai.

### T5: Remove the rimu (F1-AC5)

Outcome: Passed

Notes: User was able to successfully remove the Rimu

### T6: Try to change someone else's tōtara (F1-AC6)

Outcome: Passed

Notes: User was not able to modify my test user's tree record

### T7: Find the test user's: (batcsam5) oldest tree (F2-AC3)

Outcome: Partial

Notes: It was very vague what tree was the oldest recorded by the test user, the user also suggested have a sorting functionality for fields such as height, girth, crown spread, and creation time. The user also had to go into the tree detail page just to view the time it was recorded, as it wasn't shown on the Tree catalogue page.

### T8: Record a tree while logged out (F1-AC3)

Outcome: Passed

Notes: 

## Feedback

1 = strongly disagree, 5 = strongly agree.

| # | Statement | Rating |
|---|---|---|
| Q1 | The features were easy to use. | 4 |
| Q2 | It was clear what to do at each step. | 3 |
| Q3 | I understood the feedback the app gave me. | 3 |
| Q4 | I was satisfied with the result. | 3 |
| Q5 | I would be comfortable using this without help. | 2 |

**What was the most confusing part?** (word for word)

Not being able to tell straight away what trees were the oldest and the newest. 

**What would you change?** (word for word)

Recommend adding sorting functionality for fields such as height, girth, crown spread and time created. Add search functionality for filtering trees based on creators.

The UI looks a bit cluttered, and could do with more refactoring, especially paginating long tree lists so the user doesn't have to do one continous scroll.



