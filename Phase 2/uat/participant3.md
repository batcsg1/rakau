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
| Date | 26/10/2026 |
| Session type | Moderated, **observed**, in person |
| Device | Emulated Pixel 8 |
| Device | Android phone, Expo Go (SDK 58, store version) |
| Build (commit) | (Expo SDK 58, #55) |

 > This session used the SDK 58 build; P1 and P2 used SDK 57. See Method → Environment in file 11.

## Tasks

Outcome: **Passed** / **Partial** / **Failed**. Time is from finishing reading the card to success or giving up.


### T1: Register as a new user and record the kōwhai at 149 Forfar Street (F1-AC1, F2-AC1)

Outcome: Partial

Notes: User successfully registered a new user account with username: **Cbatc001**.
User was confused about the coordinates, and couldn't get to the measurements fields properly without the keyboard being in the way.
User had to hit the tick box on the keyboard just to see what the inputs were.
User suggested it could be easier to measure fields such as height in feet (Imperial). Have a conversion between Metric and Imperial systems.
User was confused about what Trunk girth vs crown spread meant.
User recommends having definitions for Trunk Girth and Crown Spread.
When user logged Otago as the Region, the tree appears to show no region despite region being auto-filled from user's current location.
User suggested have field definitions for the tree's health values.

### T2: Find your own trees (F2-AC2)

Outcome: Partial

Notes: User logged another tree but using a different address, yet again region showed as 'No Region'

### T3: Record the rimu with the latitude typo (F1-AC2)

Outcome: Passed

Notes: User successfully got rejected from creating the tree with an invalid coordinate pair

### T4: Update the kōwhai to stressed (F1-AC4)

Outcome: Passed

Notes: The tree had its status succesfully updated to stressed

### T5: Remove the rimu (F1-AC5)

Outcome: Passed

Notes: User suggested make the deletion more helpful, by asking the user something like: 'Are you sure you want to delete this tree?'

### T6: Try to change someone else's tōtara (F1-AC6)

Outcome: Passed

Notes: User opened Robert Loggia's logged Monkey Puzzle Tree and all they were able to do was view and not modify it.

### T7: Find the test user's: (batcsam5) oldest tree (F2-AC3)

Outcome: Partial

Notes: User noted the recorded times didn't show the exact time the recorded trees were recorded.
User noted it wasn't very clear when looking from the main catalogue page.

### T8: Record a tree while logged out (F1-AC3)

Outcome: Passed 

Notes: The User was redirected to the login page, when trying to add a tree from the catalogue page.

## Feedback

1 = strongly disagree, 5 = strongly agree.

| # | Statement | Rating |
|---|---|---|
| Q1 | The features were easy to use. | 3 |
| Q2 | It was clear what to do at each step. | 3 |
| Q3 | I understood the feedback the app gave me. | 4 |
| Q4 | I was satisfied with the result. | 2 |
| Q5 | I would be comfortable using this without help. | 2 |

**What was the most confusing part?** (word for word)

The longitude and latitude fields, and the girth and crown spread fields, and understanding the definitions would have helped,

**What would you change?** (word for word)

Add more field definitions to latitude, longitude, crown spread and girth. Have a feature/guidelines that highlights the average size for each trees within each region. 




