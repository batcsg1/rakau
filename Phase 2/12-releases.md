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
| v0.2.0 | Sprint 2 | TODO | TODO |
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
