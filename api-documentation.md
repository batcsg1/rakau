# API Documentation

<!--
Required contents (from the brief): project description; setup instructions;
environment variables; development instructions; testing instructions.
Maintain this throughout the project, not at the end. Replace every TODO.
-->

## Project description

Rākau is a full-stack app for recording and browsing New Zealand's native and
exotic trees. This document covers the **Django REST API** that backs the React
Native client (documented in `app-documentation.md`).

The API owns persistence, validation, authentication and authorisation, and all
business logic. Clients consume it over HTTP with JSON request and response
bodies. Core resources: trees (species, location, condition, dimensions,
significance status), maintenance records, and health-status observations.

## Setup instructions

Prerequisites:

- Python TODO (e.g. 3.12)
- `pip` and `venv`
- Database: SQLite for local development by default TODO (PostgreSQL if adopted)

```bash
git clone <repo-url>
cd <repo>/api                 # TODO: confirm API directory name
python -m venv .venv
source .venv/bin/activate     # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env          # then fill in the values in the table below
python manage.py migrate
python manage.py createsuperuser   # optional — Django admin access
python manage.py loaddata seed     # TODO: if seed fixtures are provided
```

## Environment variables

Stored in `api/.env` (git-ignored). `api/.env.example` is committed with
placeholder values.

| Name | Required | Purpose | Example |
|---|---|---|---|
| `SECRET_KEY` | yes | Django cryptographic signing key | `django-insecure-…` |
| `DEBUG` | yes | Debug mode; `False` for production-like runs | `True` |
| `ALLOWED_HOSTS` | yes | Comma-separated hosts the API will serve | `localhost,127.0.0.1` |
| `DATABASE_URL` | TODO | DB connection string (omit to use default SQLite) | `postgres://user:pass@localhost:5432/rakau` |
| `CORS_ALLOWED_ORIGINS` | TODO | Origins the client runs from | `http://localhost:8081` |
| TODO | | | |

## Development instructions

```bash
source .venv/bin/activate
python manage.py runserver          # http://127.0.0.1:8000
python manage.py makemigrations     # after changing models
python manage.py migrate
```

- API base URL (dev): `http://127.0.0.1:8000/api/`
- Browsable API: TODO (e.g. DRF browsable API at `/api/`)
- Lint / format: TODO (e.g. `ruff check .`, `black .`)

## Testing instructions

```bash
source .venv/bin/activate
python manage.py test               # or: pytest
```

The suite covers, for each implemented endpoint:

- successful requests — correct status code and response body
- create/update validation failures — `400` with the consistent JSON error shape
- authentication / authorisation failures — `401` / `403`

TODO: coverage tool and how to produce a report, if used.
