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

## Quick start

`setup.sh` in the repository root sets up, builds and starts both the API and the client.
It creates the virtual environment, installs dependencies, writes a local `.env` for each
project if one doesn't exist, applies migrations, type-checks the client, then runs the API
on port 8000 and the Expo dev server on port 8081. Ctrl+C stops both.

```bash
./setup.sh               # set up and start everything
./setup.sh --setup-only  # set up and build without starting the servers
./setup.sh --check       # also run the API tests, Ruff, ESLint and Prettier first
```

On Windows, run it from Git Bash. The manual steps below do the same thing one at a time.

## Setup instructions

Prerequisites:

- Python TODO (e.g. 3.12)
- `pip` and `venv`
- Database: SQLite for local development by default TODO (PostgreSQL if adopted)

- Clone the project

```bash
git clone -b project https://github.com/otago-polytechnic-bit-courses/s2-26-samuel-batchelor-id608001.git s2-26-samuel-batchelor-id608001
cd s2-26-samuel-batchelor-id608001/rakau_backend
```

- Create and activate the virtual environment

```bash
python -m venv venv

# On Powershell
source venv/Scripts/activate

# On Fish
source venv/bin/activate.fish
```

- Install dependencies

```bash
pip install -r requirements.txt
```

- Setup environment, setup database and apply database migrations

```bash
cp .env.example .env          # then fill in the values in the table below
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser   # optional — Django admin access
```

## Environment variables

Stored in `rakau_backend/.env` (git-ignored). `rakau_backend/.env.example` is committed with
placeholder values.

| Name | Required | Purpose | Example |
|---|---|---|---|
| `DJANGO_SECRET_KEY` | yes | Django cryptographic signing key | `django-insecure-…` |
| `DJANGO_DEBUG` | no (default `False`) | Debug mode; `False` for production-like runs | `True` |
| `DJANGO_ALLOWED_HOSTS` | no (default none) | Comma-separated hosts the API will serve | `localhost,127.0.0.1` |
| `DJANGO_CORS_ALLOWED_ORIGINS` | no (default none) | Comma-separated origins the web client runs from | `http://localhost:8081` |

## Development instructions

- Activate the virtual environment

```bash
# On Powershell
source venv/Scripts/activate

# On Fish
source venv/bin/activate.fish
```

- Install dependencies

```bash
pip install -r requirements.txt
```

- Run the development server

```bash
python manage.py runserver 0.0.0.0:8000
```

- API base URL (dev): `http://127.0.0.1:8000/api/`
- Admin page URL: `http://127.0.0.1:8000/admin/`

- Lint and format with Ruff (configured in `ruff.toml`)

```bash
ruff check .
ruff format .
```

## Testing instructions

- Activate the virtual environment

```bash
# On Powershell
source venv/Scripts/activate

# On Fish
source venv/bin/activate.fish
```

- Install dependencies

```bash
pip install -r requirements.txt
```
- Run the tests

```bash
python manage.py test             
```

The suite covers, for each implemented endpoint:

- successful requests — correct status code and response body
- create/update validation failures — `400` with the consistent JSON error shape
- authentication / authorisation failures — `401` / `403`

TODO: coverage tool and how to produce a report, if used.
