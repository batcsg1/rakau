# 12. Releases

<!--
Brief. Marks: 2. At the end of each sprint (including the UAT sprint):
- create a semantic-versioned release/tag, e.g. v0.1.0;
- produce release notes covering: what was delivered; known issues; how to run
  the release locally (API AND client); relevant technical information.
Each release must be runnable locally from the tagged commit. No deployment /
store publishing required. The release history must show genuine incremental
development.
-->

## Release log

| Tag | Sprint | Date | Summary |
|---|---|---|---|
| v0.1.0 | Sprint 1 | 2026-10-12 | Species/Tree API with CRUD + filtering; Expo client with home screen and filterable tree catalogue |
| v0.2.0 | Sprint 2 | 2026-10-20 | JWT auth; Add, edit and delete a tree; My Trees with infinite scroll; height/girth/region and significance filters; street address with autocomplete and GPS; 60 API tests |
| v0.3.0 | Sprint 3 | TODO | TODO |
| v0.4.0 | UAT Sprint | TODO | TODO (includes UAT evidence bundle) |

---

### v0.1.0 — Sprint 1 — 2026-10-12

**Delivered**

*Design and planning (Phase 1)*
- App concept, project roadmap and project description in `README.md`.
- Backlog of 10 user stories ranked by MoSCoW, with acceptance criteria, risks, assumptions and dependencies.
- System design, API design, wireframes for all 9 screens, and a design reflection.
- Sprint plans for Sprint 1 and Sprint 2 in `Phase 2/14-sprint-plans.md`.

*API (`rakau_backend`)*
- REQ-01 (Add a tree), backend groundwork:
  - `Species` model: common and scientific name, native flag, active flag, and an auto-generated unique slug. Scientific names must be unique regardless of case.
  - `Tree` model: owner, species, latitude/longitude with range checks, condition (healthy / stressed / diseased / dead), and present/removed status (`is_present`).
  - `Tree` also has a region (one of New Zealand's 16 regions) and optional height, trunk girth and crown spread, each with validation.
  - `Tree` has timestamps and a uniqueness constraint on owner + species + location.
  - Three migrations: `0001_initial`, `0002_tree_is_present` and `0003_tree_region`.
- REST endpoints under `/api/` using DRF routers:
  - `/api/trees/` and `/api/trees/{id}/`: full CRUD. Anyone can read; writes need authentication. A new tree's species is set by `species_slug`.
  - `/api/species/` and `/api/species/{id}/`: full CRUD. Every request, including reads, needs authentication.
- REQ-03 / REQ-04 groundwork: `GET /api/trees/` can be filtered with the query parameters `species_slug`, `condition`, `region` and `is_present`. Filters can be combined.

*Client (`rakau_frontend`, Expo Router + NativeWind)*
- Home screen with the Rākau logo, a kauri forest hero image, a vintage NZ map background, feature cards, and buttons for "Get Started" and "Browse the Catalogue". The UI uses the Iosevka Nerd Font.
- Tree catalogue screen (`/trees`) lists every recorded tree. Users can filter by species, region, condition and present/removed status (filter chips with an "All" option), pull to refresh, and clear all filters. It has loading, error/retry and empty states.
- API layer (`api/`):
  - Configurable base URL (`EXPO_PUBLIC_API_URL`).
  - A request helper that adds a `Bearer` token and redirects to login on a `401` when a token was sent.
  - DRF errors turned into per-field form errors.
  - Typed functions for trees and species, and JWT storage in `expo-secure-store`.

**Known issues**
- **No authentication endpoint yet.** The client's `login()` posts to `/api/token/`, but SimpleJWT is installed without being configured or routed. Because of this:
  - Users can't log in from the app.
  - The only way to authenticate is a Django session, logged in through `/admin/` and then using the DRF browsable API.
- The "Get Started" button does nothing yet, and there's no `/login` screen for the 401 redirect to go to.
- **REQ-01 not complete:**
  - There's no Add Tree screen in the client.
  - The API doesn't set `owner` from the logged-in user when a tree is created, so every new tree has no owner.
- **REQ-02 not complete:** `GET /api/trees/mine/` (#9) doesn't exist, and nor does a My Trees screen. The client's `getMyTrees()` will get a 404.
- **No ownership permissions (#21):** any logged-in user can edit or delete any tree.
- **Species need a login to read.** Because of this, the catalogue hides the species filter for visitors who aren't logged in. (`SpeciesViewSet` uses `IsAuthenticated`.)
- **Invalid filter values aren't rejected.** An unknown `condition` or `region` returns an empty list instead of `400`, and any `is_present` value other than `true` is treated as `false`.
- Lists aren't paginated yet.
- `SpeciesDetailSerializer`/`TreeDetailSerializer` are unused. The `tree_count` annotation on species is computed but never returned.
- Models aren't registered in the Django admin. There's no seed data, so species have to be created through the API.
- **Settings are hard-coded.** `settings.py` doesn't read `.env`, so the secret key and `DEBUG` are hard-coded. `ALLOWED_HOSTS` is empty, so only `localhost`/`127.0.0.1` are accepted, and a phone on the LAN will get `400 Bad Request`.
- `django-cors-headers` is installed but not enabled, so the web build of the client (`npm run web`) is blocked by CORS.
- No automated tests (`trees/tests.py` is empty) and no CI yet.

**Run the API locally (from this tag)**
```bash
git checkout v0.1.0
cd rakau_backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser  # needed to log in and add species via /admin/ + /api/species/
python manage.py runserver        # API at http://127.0.0.1:8000/api/
```

**Run the client locally (from this tag)**
```bash
cd rakau_frontend
npm install
cp .env.example .env              # EXPO_PUBLIC_API_URL=http://127.0.0.1:8000/api
npx expo start                    # i = iOS simulator, a = Android emulator
```
- On the Android emulator, run `adb reverse tcp:8000 tcp:8000` so that `127.0.0.1` reaches the API.
- A physical device can't reach the API yet, because `ALLOWED_HOSTS` is empty (see Known issues).

**Technical notes**
- API stack: Python, Django 6.1, Django REST Framework 3.18 and SQLite. SimpleJWT 5.5.1, django-cors-headers 4.9 and django-environ 0.14 are installed but not wired up yet. ruff is used for linting.
- Client stack:
  - Expo SDK 57, React Native 0.86, React 19.2 and TypeScript 6.0.
  - Expo Router for file-based routing (the entry point is `expo-router/entry`).
  - NativeWind 4 / Tailwind 3 for styling.
  - `expo-image` for the AVIF map, because React Native's `Image` can't decode AVIF on Android.
  - `expo-secure-store` for tokens.
- Migrations added: `trees/0001_initial`, `0002_tree_is_present`, `0003_tree_region`. `manage.py makemigrations --check` reports no pending changes.
- New env vars:
  - API: `DJANGO_SECRET_KEY`, `DJANGO_DEBUG`, `DJANGO_ALLOWED_HOSTS` and `DJANGO_CORS_ALLOWED_ORIGINS` in `.env.example`. They aren't read yet.
  - Client: `EXPO_PUBLIC_API_URL`. If it isn't set, the client uses `http://127.0.0.1:8000/api`.
- Breaking changes: none. This is the first release.

---

### v0.2.0 — Sprint 2 — 2026-10-20

**Delivered**

*Planning and documentation*
- Features 3 and 4 added to the sprint backlog, each split into GitHub sub-issues (API, API tests, client).
- Feature 1 (REQ-01) extended with acceptance criteria AC4–AC6 for editing and deleting a tree.
- `setup.sh` usage, lint commands and corrected env var names in the API and app documentation.

*Authentication (#15)*
- **API:** an `accounts` app with these endpoints:
  - `POST /api/auth/register/`, which also takes first and last name
  - `POST /api/auth/login/`, which returns a SimpleJWT access/refresh pair
  - `POST /api/auth/token/refresh/`
  - `GET /api/auth/me/`
- **Client:**
  - Login and register screens. After logging in, the app returns to the screen that asked for it.
  - Tokens are stored in `expo-secure-store`, and an expired access token is refreshed automatically.
  - A shared nav bar with Catalogue and My trees links, and an account menu with logout (#41).

*REQ-01 Add a tree (with edit and delete)*

- Adding a tree:

<img width="464" height="1001" alt="image" src="https://github.com/user-attachments/assets/a639477b-5765-49d1-b33d-3a12610a0fc9" />

- Editing or updating a tree

<img width="472" height="1001" alt="image" src="https://github.com/user-attachments/assets/e88a64de-a829-46c9-997f-7d30d53c0daf" />

- **API:**
  - The owner is set from the logged-in user when a tree is created.
  - Field validation (#4): the species must be an active one, the condition one of the fixed choices, and latitude/longitude within range. Invalid input returns `400` with per-field messages (`{"field": ["message"]}`) and changes nothing.
  - Recording the same species at the same location twice now returns `400` instead of a `500` server error.
  - Custom permissions (#21): only a tree's owner or staff can change it (`IsOwnerOrReadOnly`). Species can be read by anyone, but only staff can change them (`IsAdminOrReadOnly`).
  - `significance_status` field (#36): `none`, `locally_notable`, `heritage` or `protected`, defaulting to `none`.
  - Optional street address fields (#45): `street_address`, `suburb`, `city` and a 4-digit NZ `postcode`.
  - `Tree` and `Species` are registered in the Django admin, and species detail includes `tree_count`.
- **Client:**
  - Add Tree screen (#6):
    - Species search, condition, latitude/longitude, region, present/removed status, and significance. Leaving significance on "Unsure" saves `none` (#39).
    - Optional height, trunk girth and crown spread.
    - Checks the fields before sending and shows the API's per-field errors.
  - Address section (#45):
    - Suggestions from Photon (OpenStreetMap) while typing.
    - Choosing an address also selects its region.
    - **Fill from location** finds the address for the coordinates entered, or the coordinates for an address. When neither is entered, it uses the phone's GPS (#7).
  - Edit and delete (#42):
    - The owner sees Edit and Delete on a tree's page.
    - Editing reuses the Add Tree form.
    - Deleting asks for confirmation on the page.

*REQ-02 My Trees list*

- List of an indvidual user's recorded trees.

<img width="464" height="977" alt="image" src="https://github.com/user-attachments/assets/afc9d280-d8ad-46f4-8121-53c95515322b" />

- **API:**
  - `GET /api/trees/mine/` (#9) returns only the logged-in user's trees, newest first, 20 per page.
  - `GET /api/trees/{id}/` (#10) returns a single tree.
- **Client:**
  - My Trees screen (#12):
    - Condition filter, pull to refresh, and an empty state with an "Add your first tree" button (#13).
    - Infinite scroll that loads the next page near the end of the list (#14).
    - Undo straight after adding a tree.
  - Tree detail screen (#24):
    - Condition and significance badges.
    - Measurements, plus the address and coordinates with an "Open in Maps" button.
    - Recorded and last-updated date and time.
  - The catalogue, My Trees and tree pages reload when you return to them, so edits and deletes show straight away.

*REQ-03 Filter by height, girth and region*

- Filtering a tree by **Region**, **Height** and **Region**

<img width="463" height="991" alt="image" src="https://github.com/user-attachments/assets/3e635158-9dd8-4f4c-856e-9cc5d3b43401" />

- **API:**
  - Filtering is now done by a declarative django-filter `TreeFilter` (#30), applied to both `/api/trees/` and `/api/trees/mine/`.
  - Unknown `region` or `condition` values return `400` instead of an empty list.
  - `height_min`/`height_max` and `girth_min`/`girth_max` range filters (#31):
    - Either end of a range can be left open.
    - Negative values and min > max return `400`.
    - Height and girth are indexed (migration `0005`).
- **Client:** the catalogue has height and girth min/max inputs, active ranges shown as clearable chips, and the API's `400` messages shown under the inputs (#33).

*REQ-04 Filter by significance*

- Filtering a tree by local **significance** status

<img width="430" height="502" alt="image" src="https://github.com/user-attachments/assets/651cdedf-5ed9-4238-b85e-05a1c5a6a28e" />


- **API:** `?significance_status=<status>` and `?significant_only=true` on both list endpoints (#37). Both combine with the other filters.
- **Client:**
  - A Significance filter row and a "Significant only" toggle on the catalogue.
  - A significance badge on catalogue cards and the tree page, hidden for `none` (#40).

*Quality*
- **60 API tests, all passing**, covering:
  - registration
  - tree creation and validation
  - My Trees scoping and pagination (#11)
  - species
  - tree and species permissions
  - significance filtering (#38)
  - address fields
- Code style:
  - API: `ruff` for linting and formatting.
  - Client: ESLint and Prettier.
  - Shared client components: `TreeForm`, `ChipGroup`, `FormField`, `RangeFilter`, `AddressSection`, badges and `NavBar`.
- `setup.sh` installs, migrates, type-checks and starts both the API and the client. It creates `.env` files with local defaults.

**Known issues**
- **No region filter on My Trees.** #34 is closed, but `app/trees/mine.tsx` still only filters by condition; reopen it.
- **No API tests for the height, girth and region filters (#32).** They were checked by hand against the API.
- **No automated client tests yet.** The UI checks in Feature 2 and 3's acceptance criteria were done by hand.
- **The web build doesn't run.** `npm run web` fails because `react-native-web` isn't installed. Use iOS, Android or Expo Go.
- **Address lookup depends on Photon's free public server**, called straight from the app:
  - It needs internet access.
  - It throttles heavy use (`503`); suggestions then stop and the form says so.
  - OpenStreetMap data can be thin in rural areas.
  - All address fields stay editable, and manual entry always works.
- **GPS fill needs a real phone, or an emulator set to an NZ location.** The Android emulator reports California by default, and the form rejects positions outside NZ.
- **Map-pin location entry (#7) isn't built.** Coordinates are typed in, filled from an address, or filled from GPS.
- **Tree photos (#44) are not started.**
- **No seed data.** Species have to be created by a staff user in `/admin/` or through `/api/species/`.
- **`GET /api/trees/` (the catalogue) isn't paginated.** This is deliberate for the demo-sized dataset; only My Trees is paginated.
- **Three ESLint warnings** (`react-hooks/set-state-in-effect`) in the loading effects of the catalogue, My Trees and tree detail screens.

**Run the API locally (from this tag)**
```bash
git checkout v0.2.0
./setup.sh --setup-only           # or ./setup.sh to also start both servers; --check also runs the tests and linters
```
To set it up by hand instead:
```bash
cd rakau_backend
python -m venv venv
source venv/bin/activate          # fish: source venv/bin/activate.fish · Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env              # set DJANGO_SECRET_KEY, DJANGO_DEBUG=True, DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1,10.0.2.2
python manage.py migrate
python manage.py createsuperuser  # staff user, needed to add species
python manage.py runserver 0.0.0.0:8000
python manage.py test             # 60 tests
```

**Run the client locally (from this tag)**
```bash
cd rakau_frontend
npm install
cp .env.example .env              # EXPO_PUBLIC_API_URL=http://127.0.0.1:8000/api
npx expo start                    # i = iOS simulator, a = Android emulator
```
- On the Android emulator, run `adb reverse tcp:8000 tcp:8000` so that `127.0.0.1` reaches the API.
- On a physical phone:
  - Set `EXPO_PUBLIC_API_URL=http://<your-LAN-IP>:8000/api`.
  - Add that IP to `DJANGO_ALLOWED_HOSTS`.
  - Allow location access when asked to use GPS fill.

**Technical notes**
- New dependencies:
  - API: `django-filter` 26.2.
  - Client: `expo-location` ~57.0.21, installed with `npx expo install`. The `app.json` plugin requests foreground location only.
- Migrations added:
  - `trees/0004_alter_tree_trunk_girth_cm`
  - `0005_tree_height_girth_indexes`
  - `0006_tree_significance_status`
  - `0007_tree_street_address`

  `makemigrations --check` reports no pending changes.
- **Env vars are now read from `rakau_backend/.env`** using django-environ:
  - `DJANGO_SECRET_KEY` (required)
  - `DJANGO_DEBUG`
  - `DJANGO_ALLOWED_HOSTS`
  - `DJANGO_CORS_ALLOWED_ORIGINS`

  CORS is enabled. The client still uses `EXPO_PUBLIC_API_URL`.
- External service: Photon (`https://photon.komoot.io`) for address search and reverse lookup. It needs no key, and searches are sent 300 ms after typing stops, with at least 3 characters, to stay within fair use.
- Breaking changes since v0.1.0:
  - Log in with `POST /api/auth/login/`; the old `/api/token/` path is gone.
  - Invalid filter values now return `400` instead of an empty list.
  - Tree writes are limited to the owner or staff.
  - Species writes are staff-only, but species reads no longer need a login.
  - The client's tree detail route moved from `app/trees/[id].tsx` to `app/trees/
  
---

## Release notes template (copy per release)

### vX.Y.Z — Sprint N — YYYY-MM-DD

**Delivered**
- REQ-TODO: TODO
- REQ-TODO: TODO

**Known issues**
- TODO

**Run the API locally (from this tag)**
```bash
git checkout vX.Y.Z
cd api
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in values
python manage.py migrate
python manage.py loaddata seed   # if applicable
python manage.py runserver
```

**Run the client locally (from this tag)**
```bash
cd client
npm install
cp .env.example .env   # set API base URL
npx expo start
```

**Technical notes**
- Migrations added: TODO
- New env vars: TODO
- Breaking changes: TODO

---

## Marker checklist

- [ ] One semantic-versioned tag per sprint, including UAT
- [ ] Release notes for each: delivered / known issues / local run (API + client) / technical notes
- [ ] Each tagged commit actually builds and runs locally
- [ ] Version numbers increase sensibly across sprints (incremental development visible)
