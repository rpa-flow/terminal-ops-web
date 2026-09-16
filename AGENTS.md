# Terminal Ops Web

## Working agreement

- Use the smallest capable scope: work directly on small, local changes.
- Delegate only independent, bounded work. Use at most two agents at once and never start every role by default.
- Request product decisions only when the code and the task do not determine them; label these as `Não definido`.
- Preserve API contracts unless the request explicitly changes them.
- Keep credentials, `.env` values, tokens, and production data out of code, logs, and responses.
- State validation actually run; do not claim a build, test, or deploy passed without evidence.

## Specialist routing

- `pm`: clarify user value, acceptance criteria, scope, and open decisions. It does not edit code.
- `design`: define interaction and visual guidance using `design.md`; it does not edit code unless explicitly asked.
- `backend`: owns `api/`, API contracts, validation, Prisma, authentication, and migrations.
- `frontend`: owns `web/`, accessible UI, client state, and API integration.
- `qa`: read-only verification of changed behavior, regression risks, and proportionate test coverage.

## Validation

- Backend changes: run the narrowest relevant API validation, then `npm run build` in `api` when practical.
- Frontend changes: run the narrowest relevant check, then `npm run lint` and `npm run build` in `web` when practical.
- Do not modify generated artifacts or lockfiles unless the task requires dependency changes.
