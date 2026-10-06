# Record timestamp ownership and native date input specification

## Goal and boundaries

- Goal: save the current server timestamp for every newly created record, independent of incoming `dataHora`, and restore a native picker for frontend date fields.
- In scope: authenticated record creation, API-key ingestion, CSV import, their validation/docs, `BrazilianDateInput`, and focused verification.
- Out of scope: rewriting existing `records.data_hora`, note timestamps, a database migration, or timestamp display formatting.
- Source / approval: user decision on 2026-10-05 after identifying that the displayed record used an API-provided date instead of its insertion time.

## Observed facts and open decisions

| Type | Item | Evidence or decision needed |
|---|---|---|
| Observed fact | The records table displays `dataHora`, not `createdAt`. | `RecordsTable.tsx`. |
| Observed fact | The supplied record has `data_hora` `2026-02-10 15:07:00` and `created_at` `2026-10-02 18:13:17.354`. | Supplied CSV and screenshot. |
| Observed fact | Authenticated API, API-key ingestion, and CSV imports transform and persist an incoming `dataHora`. | Current routes, validator, and service. |
| User decision | New records save current date/time, not the date/time supplied by API. | Current request. |
| User decision | Date fields must use a native picker. | Current request. |
| Assumption | Existing callers may keep sending `dataHora`; it remains accepted but is ignored for persistence. | Compatibility without violating the new rule. |

## Domain

- Record timestamp: server-side instant when a `Record` is saved.
- API `dataHora`: legacy input that is not authoritative for new records.
- Native date control: `input type="date"`; browser-localized display with ISO value for React/API consumers.

### Domain rules

- DR-1: New records from `POST /api/records`, `POST /api/ingest/records`, and CSV import persist a server-generated current timestamp in `data_hora`.
- DR-2: Incoming `dataHora`, if present, is ignored and its absence or malformed value does not reject a valid new record.
- DR-3: Existing records retain their timestamps; this change performs no backfill.
- DR-4: The reusable date component uses the native picker, emits ISO `YYYY-MM-DD`, and preserves `required`, `disabled`, label, and CSS-class behavior.
- DR-5: API documentation marks record `dataHora` optional/ignored, so consumers do not rely on it as the persisted timestamp.

## Acceptance scenarios

### AC-1: Server-owned record timestamp

**Given** a caller sends `dataHora: "2026-02-10 15:07:00"`

**When** the server saves the record on 2026-10-05 at 14:30:00

**Then** `data_hora` is the server-generated 2026-10-05 14:30:00 instant, not the supplied February timestamp.

### AC-2: Caller without a date

**Given** a valid new-record request omits `dataHora`

**When** it is saved through API, ingestion, or CSV import

**Then** it succeeds and receives the current server timestamp.

### AC-3: Native date selection

**Given** a user focuses a frontend date field

**When** they choose a date in the browser picker

**Then** its consumer receives ISO `YYYY-MM-DD` without requiring full manual entry.

## Error, authorization, and edge cases

- Authorization is unchanged: authenticated users create records; API-key callers ingest records.
- Server time comes from the application runtime; no client-timezone conversion or schema migration is introduced.
- Native picker display follows browser locale. A Portuguese-Brazil browser ordinarily shows `DD/MM/AAAA`, while the component/API value remains ISO.
- Future list ordering, filters, and reports use ingestion time for new records; historical records retain operational timestamps.

## Technical decisions

| Decision | Chosen approach | Rationale | Consequence / migration |
|---|---|---|---|
| Timestamp authority | Set `dataHora` to `new Date()` at the record service boundary on every creation path. | One enforcement point avoids route divergence. | New semantics, with no migration. |
| Legacy input | Make `dataHora` optional and do not parse/validate it for new records. | Ignored input must not block saves. | Docs/validation update; callers remain compatible. |
| Date UX | Use native `type="date"` with ISO forwarding. | Provides requested picker while retaining API format. | Visual ordering depends on browser locale. |

## Implementation and verification plan

1. Update record validation, services, and API documentation to stamp server time and ignore incoming dates across all creation paths.
2. Replace the masked/text date component with the native picker while preserving its prop contract.
3. Add/update focused tests; run narrow checks, then backend and frontend builds where practical.
4. Review the result against DR-1 through DR-5.

## Risks, rollout, and deferred work

- Consumers and reports that treated `dataHora` as an operational event time will receive insertion time for new records. This is the stated product decision and must be communicated in the API docs.
- The native picker cannot force `DD/MM/AAAA` in every browser locale, but it removes manual full-date entry.
