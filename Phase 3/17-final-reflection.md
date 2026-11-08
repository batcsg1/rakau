# 17. Final Reflection

## 1. Biggest difference between original designs and final implementation (~110 words)

In `Phase 1/03-system-design.md` the location was captured "by GPS fix or manual map pin", with `react-native-maps` for the pin, and in `06-design-reflection.md` I expected the map to be the hardest part. The final app has no map at all. Add Tree started with latitude and longitude fields, and in UAT P1 and P3 both named them as the most confusing part. In `8e0ec6d` (I7) I took them out. The location now comes from a Photon address lookup or "Use my current location", and the coordinates are set in the background. The map pin is still open (#71). I designed around coordinates, but participants thought about where a tree is as an address.

## 2. What implementing the React Native client revealed about your API design (~110 words)

`04-api-design.md` defined one error shape, `{"error": {"code", "message", "fields"}}`. I never built it. DRF returns `{"field": ["message"]}` for validation errors and `{"detail": "..."}` for everything else, and the client had to work with what it actually got. `toApiError` (`api/errors.ts:17`) turns both into one `ApiError` that keeps the per-field messages, so forms can show each error under its field. Building the client also showed that DRF sends decimals as strings (`"30.00"`, `api/types.ts:87`). The API also never says whether the user can edit a tree, so `canModify` copies the `IsOwnerOrReadOnly` rule in two screens. A `can_edit` field on the tree response would have been simpler.

## 3. Single most significant improvement you would make to your development process (~80 words)

Set up CI from the first sprint. Docs commit `971ae5b` accidentally deleted 178 lines from `trees/tests.py`, dropping the suite from 60 tests to 45, and I didn't notice for two days (#65, restored in `6d9500a`). There's no `.github/workflows`, so the tests only ran when I remembered to run them. A GitHub Actions job running `python manage.py test`, `ruff`, `tsc` and ESLint on every push would have failed on that commit straight away. It would also mean "all tests pass" at the end of each sprint was checked, not just my word.

---

## AI Tools Declaration

**Tools used:** Claude Code (Anthropic), in the terminal. TODO: add any other AI tools you used, e.g. ChatGPT or Copilot

**What each was used for:** Claude Code helped implement GitHub issues on the API and client (e.g. #44 tree photos, #62 location without coordinates, #70 filter by creator) and write the API tests for them. It also helped with the Expo SDK 58 upgrade (#55) and debugging, and drafted commit messages, issue comments, release notes, sprint plans and the UAT test plan and session template. It wrote first drafts of file 10, Part 5 of file 11 and sections 3–4 of file 16, which I checked against the code and my notes and then edited. It wasn't used to produce UAT data: the participants, results, ratings and quotes all come from the real sessions.

**One instance where a tool genuinely helped:** The SDK 58 upgrade. My phone's Expo Go only supported SDK 58, and my first attempt left the project half upgraded on Node 20, with `npm install` failing on `expo-router@57` (ERESOLVE). Claude Code found that SDK 58 needs Node 22.13 or newer, switched to Node 22, and did a clean reinstall without the old lock file. I checked it with `expo-doctor` (20/20 checks), `tsc` and an Android bundle build, then by running the app on the phone for P3's session.

**One instance where a tool misled you or produced something you had to reject:** When `ImageBackground` was replaced for SDK 58, Claude Code's first version of the home screen header photo stopped partway down instead of filling the header. The lint and type checks passed, so the code looked fine, and I only noticed when I opened the app on my phone and took a screenshot. The fix was an `expo-image` with an explicit absolute position. Since then I check UI changes on the device rather than trusting a clean build.
