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
