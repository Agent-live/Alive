# Project Structure Contract

This file defines the repository structure contract for ALIVE, aligned with the
layered style used in Axon-family projects.

## Semantic Layers

1. `backend/`: API runtime, domain logic, persistence, and agent bridge.
2. `Frontend/`: product UI and client integrations (`Frontend/Alive-app`).
3. `document/`: architecture notes, product plans, and engineering reviews.
4. `scripts/`: reproducible local/dev automation entry points.
5. `test/`: runnable test plans, API contracts, and smoke scripts.
6. `assets/`: static brand/media assets consumed by product surfaces.
7. `alive-agent-skills*/`: external skill mirror data sources.
8. `work/`: local runtime artifacts and temporary operational outputs.

## Directory Intent

- `document/architecture/`: technical architecture and protocol design docs.
- `document/plans/`: product and strategy planning docs.
- `document/reviews/`: review notes, rollout plans, and curation outputs.

## Migration Rules

1. Structural moves and business logic edits should be separated when possible.
2. Any moved path must update first-party references in the same change set.
3. New root folders must include an index file (`README.md`) describing intent.
4. Avoid alias directories; keep one canonical path for each artifact class.

## Commenting Contract

1. Prefer "why" comments over "what" comments.
2. Package/file header comments must state responsibility boundaries.
3. Do not add speculative TODOs without an owner path or follow-up location.
4. Keep comments synchronized with runtime behavior; delete stale comments fast.
