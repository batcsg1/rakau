# 4. API Design

<!--
Brief: document the Django API endpoints required by your TWO selected features.
Marks: 3.
Use the table below. Consider: authentication, authorisation, validation,
invalid requests, error responses, status codes, returned data.
The design must fit sensibly into your overall app architecture.
-->

## Authorisation model

- **Read** (`GET` list / detail) — any authenticated user may view any tree. Trees are a public catalogue; there is no private-record concept in this release.
- **Create** (`POST /api/trees/`) — any authenticated user. `owner` is set server-side from the token, never accepted from the body.
- **Modify** (`PATCH` / `DELETE /api/trees/{id}/`) — **owner only**. A non-owner is authenticated but not authorised, so the API returns `403`.

DRF permission classes: `IsAuthenticated` on every endpoint, plus a custom `IsOwnerOrReadOnly` (object-level `has_object_permission` allows safe methods for everyone, write methods only when `obj.owner == request.user`).

---

## Endpoint reference

### Feature 1 — Add a tree with species, location, and condition

| HTTP Method | URL | Description | Authentication | Roles | Body Parameters |
|---|---|---|---|---|---|
| POST | `/api/trees/` | Create a tree record owned by the caller | Required (Token) | Any authenticated user | `species` (string, required — one of the species `TextChoices`); `latitude` (number, required, −90…90); `longitude` (number, required, −180…180); `condition` (string, required — one of the condition `TextChoices`). `owner` is **not accepted** — set server-side from the token. |
| GET | `/api/trees/{id}/` | Retrieve one tree (shows the record after creation; shared with Feature 2) | Required (Token) | Any authenticated user (public read) | — |

**Modify an existing tree** — not exercised by the two selected features, but the authorisation rule is defined here:

| HTTP Method | URL | Description | Authentication | Roles | Body Parameters |
|---|---|---|---|---|---|
| PATCH | `/api/trees/{id}/` | Update one or more fields on a tree | Required (Token) | **Owner only** — non-owner gets `403` | Any of `species`, `latitude`, `longitude`, `condition` (all optional; same per-field validation as `POST`). `owner` is read-only. |
| DELETE | `/api/trees/{id}/` | Delete a tree | Required (Token) | **Owner only** — non-owner gets `403` | — |

### Feature 2 — Page listing all of my recorded trees

| HTTP Method | URL | Description | Authentication | Roles | Body Parameters |
|---|---|---|---|---|---|
| GET | `/api/trees/mine/` | List the caller's own trees, newest first, paginated (page size 20) | Required (Token) | Owner only — queryset filtered to `request.user`; never returns another user's trees | — (query param `page`, integer, optional, default 1) |
| GET | `/api/trees/{id}/` | Retrieve one tree when a list row is tapped (shared with Feature 1) | Required (Token) | Any authenticated user (public read) | — |

> A full public catalogue list (`GET /api/trees/` returning every user's trees) belongs to the separate "Browse the catalogue" feature (Backlog story 8) and is not detailed here.

---

## Validation rules

| Endpoint | Field | Rule | Error message |
|---|---|---|---|
| `POST /api/trees/` | `species` | Required; must be a value in the species choices | "Select a valid species." |
| `POST /api/trees/` | `latitude` | Required; number between −90 and 90 | "Latitude must be between -90 and 90." |
| `POST /api/trees/` | `longitude` | Required; number between −180 and 180 | "Longitude must be between -180 and 180." |
| `POST /api/trees/` | `condition` | Required; must be a value in the condition choices | "Select a valid condition." |
| `POST` / `PATCH /api/trees/` | `owner` | Read-only; ignored if supplied (owner comes from the token) | — (silently ignored) |
| `PATCH /api/trees/{id}/` | `species`, `latitude`, `longitude`, `condition` | Optional, but each supplied value must pass the same rule as on `POST` | as above |
| `GET /api/trees/mine/` | `page` | Optional integer ≥ 1; page must exist | "Invalid page." (404) |

---

## Status codes used

| Code | When |
|---|---|
| 200 | Tree list or single tree returned; tree updated (`PATCH`) |
| 201 | Tree created (`POST /api/trees/`) |
| 204 | Tree deleted (`DELETE /api/trees/{id}/`) |
| 400 | Validation failure / malformed body (`POST` or `PATCH`) |
| 401 | Missing or invalid token (any endpoint) |
| 403 | Authenticated but not the owner, on `PATCH` or `DELETE` |
| 404 | Tree id does not exist, or `page` out of range |

---

## Error response shape

<!-- Define one consistent JSON shape for all error responses and show an example. -->

```json
{
  "error": {
    "code": "validation_error",
    "message": "The submitted data was invalid.",
    "fields": { "latitude": ["Latitude must be between -90 and 90."] }
  }
}
```

- `code` — machine-readable slug (`validation_error`, `not_authenticated`, `permission_denied`, `not_found`).
- `message` — human-readable summary.
- `fields` — present only for `400`; maps each rejected field to a list of messages. Omitted for `401` / `403` / `404`.

```json
// PATCH /api/trees/9/ by a non-owner  -> 403
{ "error": { "code": "permission_denied",
  "message": "You do not have permission to modify this tree." } }
```

## Success response examples

```json
// GET /api/trees/mine/?page=1  -> 200
{
  "count": 42,
  "next": "https://api.example.com/api/trees/mine/?page=2",
  "previous": null,
  "results": [
    { "id": 8, "species": "kauri", "condition": "healthy", "region": "Northland",
      "thumbnail_url": null, "created_at": "2026-09-05T21:14:00Z" }
  ]
}
```

```json
// GET /api/trees/8/  -> 200  (any authenticated user, owner or not)
{ "id": 8, "species": "kauri", "latitude": -35.221, "longitude": 173.968,
  "condition": "healthy", "region": "Northland", "owner": 3,
  "created_at": "2026-09-05T21:14:00Z" }
```

```json
// POST /api/trees/  -> 201
{ "id": 43, "species": "pohutukawa", "latitude": -36.848, "longitude": 174.763,
  "condition": "fair", "owner": 3, "created_at": "2026-09-07T09:02:11Z" }
```

```json
// POST /api/trees/  -> 400
{ "error": { "code": "validation_error", "message": "The submitted data was invalid.",
  "fields": { "latitude": ["Latitude must be between -90 and 90."] } } }
```

---

## Marker checklist

- [x] Every endpoint the two features need is listed
- [x] Auth requirement stated per endpoint
- [x] Authorisation / roles stated per endpoint
- [x] Body parameters typed and marked required/optional
- [x] Validation rules documented
- [x] Consistent error response shape defined
- [x] Status codes listed with meaning
- [x] Endpoints fit the architecture described in `03-system-design.md`
