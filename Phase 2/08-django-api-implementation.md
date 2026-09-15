# 8. Django API Implementation

<!--
Brief. Marks: 6. You must:
- implement the required endpoints;
- validate create and update operations;
- return consistent JSON error responses;
- write automated tests demonstrating success, validation, and error responses;
- implement appropriate relationships / queries involving multiple models where relevant.
The API must integrate cleanly with the rest of the app.
This file is a tracking sheet — the code lives in the API repo/dir.
-->

## Endpoint implementation status

| Method + URL | Feature | Serializer / view | Validation | Tests | Status |
|---|---|---|---|---|---|
| `POST /api/todo/` | 1 | `TodoSerializer` / `TodoViewSet` | TODO | `test_todo_create*` | TODO |
| `PATCH /api/todo/:id/` | 1 | TODO | TODO | TODO | TODO |
| TODO | 2 | TODO | TODO | TODO | TODO |

## Consistent error response

<!-- Point to the exception handler / renderer that guarantees this shape. -->

- Implemented in: `TODO` (e.g. `api/exceptions.py::custom_exception_handler`)
- Shape: see `04-api-design.md`

## Multi-model relationships / queries

| Where | Models involved | Relationship / query |
|---|---|---|
| TODO | TODO ↔ TODO | TODO (FK / M2M / annotate / select_related …) |

## Automated tests

| Test | Covers | File |
|---|---|---|
| `test_todo_create_success` | 201 + body | `TODO` |
| `test_todo_create_missing_field` | 400 + error shape | `TODO` |
| `test_todo_update_invalid` | 400 on PATCH | `TODO` |
| `test_todo_requires_auth` | 401 | `TODO` |
| `test_todo_forbidden_role` | 403 | `TODO` |

- Run command: `TODO` (e.g. `python manage.py test` / `pytest`)
- Coverage summary: TODO

## Deviations from `04-api-design.md`

| Planned | Actual | Why |
|---|---|---|
| TODO | TODO | TODO |

---

## Marker checklist

- [ ] All endpoints for the two features implemented
- [ ] Create and update operations validated
- [ ] Error responses use one consistent JSON shape
- [ ] Tests cover success, validation failure, and error/permission responses
- [ ] At least one meaningful multi-model relationship or query
- [ ] `api-documentation.md` testing instructions match the run command above
