# Brazilian date input build repair specification

## Goal and boundaries

- Goal: restore the frontend build and make the reusable date control display and accept Brazilian civil dates while API-bound state remains `YYYY-MM-DD`.
- In scope: `web/src/components/BrazilianDateInput.tsx` and focused frontend verification.
- Out of scope: database timestamp presentation, backend persistence/schema changes, and changes to existing API payload contracts.
- Source / approval: user request on 2026-10-05 to correct the failing build, with frontend dates in Brazilian format and backend dates in American/ISO format.

## Observed facts and open decisions

| Type | Item | Evidence or decision needed |
|---|---|---|
| Observed fact | `BrazilianDateInput.tsx` calls React hooks and date helpers without importing them; its `validate` function is unused. | Reported TypeScript errors and current source. |
| Observed fact | `dateTime.ts` already converts `YYYY-MM-DD` to `DD/MM/YYYY` and strictly parses valid Brazilian dates back to ISO. | Current helper implementation. |
| User decision | UI dates use `DD/MM/YYYY`; backend-facing date values use `YYYY-MM-DD`. | Current request. |
| Assumption | The date input must preserve its existing props (`required`, `disabled`, class, label) and caller contract. | Smallest compatible repair. |

## Domain

- Glossary: Brazilian date = `DD/MM/YYYY`; ISO/API date = `YYYY-MM-DD`; civil date = date without time or timezone.

### Domain rules

- DR-1: When a caller provides an ISO/API date, the component displays the equivalent Brazilian civil date.
- DR-2: When a user enters a complete valid Brazilian civil date, the component calls `onChange` with the corresponding ISO/API date.
- DR-3: Empty input is allowed unless `required` is set; malformed or impossible Brazilian dates produce the existing native validation message and are not emitted as API values.
- DR-4: The component must compile with the repository TypeScript configuration without unused declarations.

## Acceptance scenarios

### AC-1: Display an API value

**Given** a date input receives `2026-10-02`

**When** it renders

**Then** the user sees `02/10/2026`.

### AC-2: Emit a valid user-entered date

**Given** a date input is shown in the frontend

**When** the user enters `02/10/2026`

**Then** its consumer receives `2026-10-02`.

### AC-3: Reject an invalid date

**Given** a date input contains `31/02/2026`

**When** browser validation runs

**Then** it reports `Informe a data no formato DD/MM/AAAA.`

**And** no invalid ISO value is sent to the consumer.

## Technical decisions

| Decision | Chosen approach | Rationale | Consequence / migration |
|---|---|---|---|
| Formatting/parsing | Reuse existing `dateTime.ts` helpers from the component. | They already perform the requested conversion and calendar validation. | No API or data migration. |
| Input behavior | Use the component's controlled display state and its native custom validity. | Keeps Brazilian text unambiguous while callers retain ISO state. | Existing consumers remain compatible. |

## Implementation and verification plan

1. Import the React hooks and date helpers; wire display-state changes through parsing and validation; remove or use the unused validation declaration.
2. Run the narrowest relevant frontend check and `npm run build` in `web`, mapping its result to DR-4.

## Risks, rollout, and deferred work

- Existing notes record a prior preference for a native browser date input; this current user request explicitly prioritizes Brazilian display plus ISO serialization. Confirm behavior with the requested build repair only.
- Timestamp fields such as `created_at` remain out of scope; they are date-times, not the API civil-date inputs governed here.
