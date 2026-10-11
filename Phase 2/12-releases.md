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
| v0.1.0 | Sprint 1 | TODO | TODO |
| v0.2.0 | Sprint 2 | TODO | TODO |
| v0.3.0 | Sprint 3 | TODO | TODO |
| v0.4.0 | UAT Sprint | TODO | TODO (includes UAT evidence bundle) |
| v1.0.0 | Sprint 1 | 2026-10-12 | Phase 1 design docs complete; Django backend scaffolded with Species/Tree models and serializers |

---

### v0.1.0 — Sprint 1 — 2026-10-12

**Delivered**

*Phase 1: design and planning*
- App concept for Rākau, plus a project roadmap and the project description in `README.md`.
- Backlog with 10 user stories ranked by MoSCoW, including acceptance criteria, risks, assumptions and dependencies.
- System design with diagrams for features 1 and 2. Any user can view every tree, but only the tree's owner can edit or delete it.
- API design, wireframes for all 9 screens, and a design reflection.
- Docs reorganised into `Phase 1/` to `Phase 4/` folders. Templates added for the API and app documentation.

*Phase 2: API foundations (story 1, "Add a tree", groundwork)*
- Django project `rakau_backend` created, with a `trees` app.
- `Species` model: common and scientific name, native flag, active flag, and an auto-generated unique slug. Scientific names are unique regardless of case.
- `Tree` model: owner, species, latitude/longitude with range validation, condition (healthy / stressed / diseased / dead), and optional height, trunk girth and crown spread with validation. It also has timestamps and a uniqueness constraint on owner + species + location.
- `SpeciesSerializer`, `SpeciesDetailSerializer` (with `tree_count`), `TreeSerializer` and `TreeDetailSerializer` drafted.
- Backend `requirements.txt`, `.env.example` and `.gitignore` added. API setup instructions started in `api-documentation.md`.

**Known issues**
- The `trees` app (and `rest_framework`) are not yet in `INSTALLED_APPS`, so the models are not picked up by Django.
- The `trees` app has no migrations yet.
- The serializers don't inherit from `serializers.ModelSerializer`, so they won't work as DRF serializers yet.
- `TreeSerializer` lists an `is_present` field that the `Tree` model doesn't have.
- No API endpoints yet: `urls.py` only exposes `/admin/`, and `views.py` / `tests.py` are empty.
- `settings.py` doesn't read the `DJANGO_*` variables from `.env` yet. The secret key, debug flag and allowed hosts are hard-coded.
- There is no React Native client yet.

**Run the API locally (from this tag)**
```bash
git checkout v0.1.0
cd rakau_backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env          # fill in values (not yet read by settings.py)
python manage.py migrate
python manage.py runserver    # http://127.0.0.1:8000/admin/
```

**Run the client locally (from this tag)**
- Not applicable. The client has not been started in this release.

**Technical notes**
- Stack: Django 6.1, Django REST Framework 3.18, SimpleJWT 5.5.1, django-cors-headers 4.9, django-environ 0.14, ruff 0.16.5. SQLite for local development.
- Migrations added: none for `trees` yet (only Django's built-in migrations).
- New env vars: `DJANGO_SECRET_KEY`, `DJANGO_DEBUG`, `DJANGO_ALLOWED_HOSTS`, `DJANGO_CORS_ALLOWED_ORIGINS` (in `.env.example`).
- Breaking changes: none. This is the first backend release. The `fittrack-test-app` scratch project was removed at v0.1.0.

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
