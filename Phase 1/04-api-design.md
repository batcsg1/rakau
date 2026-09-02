# 4. API Design

<!--
Brief: document the Django API endpoints required by your TWO selected features.
Marks: 3.
Use the table below. Consider: authentication, authorisation, validation,
invalid requests, error responses, status codes, returned data.
The design must fit sensibly into your overall app architecture.
-->

## Endpoint reference

### Feature 1 — TODO

| HTTP Method | URL | Description | Authentication | Roles | Body Parameters |
|---|---|---|---|---|---|
| GET | `/api/todo/` | TODO | Required / None | TODO | — |
| POST | `/api/todo/` | TODO | Required | TODO | `field` (string, required), … |
| PATCH | `/api/todo/:id/` | TODO | Required | TODO | TODO |
| DELETE | `/api/todo/:id/` | TODO | Required | TODO | — |

### Feature 2 — TODO

| HTTP Method | URL | Description | Authentication | Roles | Body Parameters |
|---|---|---|---|---|---|
| TODO | TODO | TODO | TODO | TODO | TODO |

---

## Validation rules

| Endpoint | Field | Rule | Error message |
|---|---|---|---|
| `POST /api/todo/` | `field` | TODO (e.g. non-empty, max 120 chars) | TODO |

---

## Status codes used

| Code | When |
|---|---|
| 200 | TODO |
| 201 | Resource created |
| 400 | Validation failure / malformed body |
| 401 | Missing or invalid credentials |
| 403 | Authenticated but not authorised for this action |
| 404 | Resource not found |
| TODO | TODO |

---

## Error response shape

<!-- Define one consistent JSON shape for all error responses and show an example. -->

```json
{
  "error": {
    "code": "validation_error",
    "message": "TODO",
    "fields": { "field": ["TODO"] }
  }
}
```

## Success response examples

```json
// GET /api/todo/:id/  -> 200
{ "id": 1, "field": "TODO" }
```

```json
// POST /api/todo/  -> 201
{ "id": 2, "field": "TODO" }
```

---

## Marker checklist

- [ ] Every endpoint the two features need is listed
- [ ] Auth requirement stated per endpoint
- [ ] Authorisation / roles stated per endpoint
- [ ] Body parameters typed and marked required/optional
- [ ] Validation rules documented
- [ ] Consistent error response shape defined
- [ ] Status codes listed with meaning
- [ ] Endpoints fit the architecture described in `03-system-design.md`
