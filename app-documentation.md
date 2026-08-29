# App Documentation

<!--
Required contents (from the brief): project description (app concept); setup
instructions; React Native development/build instructions; a note of each
versioned release/tag (at least one per sprint) with instructions for running
that release locally. Maintain this throughout the project. Replace every TODO.
-->

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

## Setup instructions

Prerequisites:

- Node.js TODO (e.g. 20.x LTS)
- npm TODO
- Expo tooling via `npx expo`
- Expo Go on a physical device, or an Android/iOS emulator

```bash
git clone <repo-url>
cd <repo>/client              # TODO: confirm client directory name
npm install
cp .env.example .env          # set the API base URL (see below)
```

Environment variables:

| Name | Purpose | Example |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | Base URL of the Django API | `http://192.168.x.x:8000/api` |
| TODO | | |

On a physical device the API URL must be your machine's LAN IP, not `localhost`.

## React Native development / build instructions

```bash
npx expo start               # opens the Expo dev tools
# a = Android emulator, i = iOS simulator, w = web, or scan the QR with Expo Go
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
