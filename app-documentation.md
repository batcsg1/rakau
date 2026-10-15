# App Documentation

## Project description

Rākau is a mobile app for recording and browsing New Zealand's native and exotic
trees. It addresses the lack of a single maintained record across the country's
broad catalogue of trees.

Intended users are anyone in New Zealand who wants to record individual trees:
home gardeners, arborists, local and regional council members, conservation
groups, and citizen scientists, with secondary users including plant-nursery
staff, property developers, and school educators.

Core functionality:

- Add and record an identified tree — species, location, and condition.
- Browse the shared catalogue to discover trees locally and across New Zealand.
- Filter trees by species, genus, height, girth, region, and significance status.
- For professional users, maintain detailed per-tree records — maintenance
  history and health-status reports.
- Follow-up observations on an existing record, with health status shown over
  time.

This document covers the **React Native (Expo) client**. The Django REST API it
consumes is documented in `api-documentation.md`.

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

- Node.js v20.19.2
- `npm` Node Package Manager
- Expo tooling via `npx expo`
- Expo Go on a physical device, or an Android/iOS emulator

```bash
# Clone the project branch
git clone -b project https://github.com/otago-polytechnic-bit-courses/s2-26-samuel-batchelor-id608001 rakau

cd rakau/rakau_frontend             # TODO: confirm client directory name
npm install
cp .env.example .env          # set the API base URL (see below)
```

Environment variables:

| Name | Purpose | Example |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | Base URL of the Django API | `http://<ip_adress>:8000/api` |
| TODO | | |

On a physical device the API URL must be your machine's LAN IP, not `localhost`.

## React Native development / build instructions

```bash
npm run typecheck            # TypeScript type check
npm run lint                 # ESLint (eslint-config-expo)
npm run format               # Prettier, with the Tailwind class-sorting plugin
```

```bash
npx expo start               # opens the Expo dev tools
# a = Android emulator, i = iOS simulator, w = web, or scan the QR with Expo Go

# Run the project on an Android Studio based emulator
npm run android
```
- Native prebuild steps (`npx expo prebuild`): TODO — only if native modules require it
- Production build (`eas build`, etc.): TODO — not required by the brief; local run is sufficient

## Releases

At least one semantic-versioned tag per sprint. Full release notes (delivered
work, known issues, technical notes) are in `12-releases.md`.

Run a specific release locally:

```bash
git checkout <tag>
# API:    follow api-documentation.md setup, then: python manage.py runserver
# Client: cd client && npm install && npx expo start
```

| Tag | Sprint | Delivered | Notes |
|---|---|---|---|
| v0.1.0 | Sprint 1 | TODO | TODO |
| v0.2.0 | Sprint 2 | TODO | TODO |
| v0.3.0 | Sprint 3 | TODO | TODO |
| v0.4.0 | UAT Sprint | TODO | Includes UAT evidence bundle |
