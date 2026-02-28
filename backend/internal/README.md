# Internal Backend Layering

`backend/internal` follows a pragmatic layered architecture:

- `handler/`: transport entry (HTTP adapters), request/response wiring only.
- `logic/`: use-case orchestration and business rules.
- `service/`: reusable domain services shared across use cases.
- `svc/`: process-wide wiring (DB, clients, engines, bootstrap).
- `middleware/`: cross-cutting request guards.
- `types/`: transport DTOs and generated-facing schema glue.
- `aliveagent/` + `skillshop/`: platform integrations.

## Aesthetic Rules

1. One package, one dominant responsibility.
2. Keep handler thin; move policy decisions into `logic/` and `service/`.
3. Use domain names (`agent`, `conversation`, `timer`) over transport terms.
4. Keep comments short, factual, and boundary-oriented.
