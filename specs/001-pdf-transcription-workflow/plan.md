# Implementation Plan: PDF Transcription Workflow

**Branch**: `001-pdf-transcription-workflow` | **Date**: 2026-08-14 | **Spec**:
[spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-pdf-transcription-workflow/spec.md`

## Summary

Implement the complete Quick Filler journey: a user submits a Cartão de Ponto or Holerite PDF,
observes asynchronous processing, reviews the transcription next to the source PDF, corrects it,
and downloads the saved result. The web application will use Next.js App Router, strict TypeScript,
and MUI Core v9 with native tables. A single Node.js process keeps jobs in memory, extracts embedded
text first, falls back to `tesseract.js` per page when needed, validates the immutable output model,
and exposes terminal results for polling by opaque ID.

The public HTTP contract and the Cartão de Ponto/Holerite JSON shapes remain literal. Parsing,
validation, warning derivation, and export layout are pure domain operations; route handlers,
in-memory storage, PDF/OCR commands, and workbook generation are infrastructure adapters. The source PDF is
kept visible in the originating browser session through a local object URL/cache, avoiding a new
HTTP endpoint that would expand the fixed public contract.

## Technical Context

**Language/Version**: TypeScript with `strict: true`, running on Node.js 22 LTS (and never below
the current Next.js supported minimum).

**Primary Dependencies**: Next.js App Router, React, Material UI, Zod for executable schemas,
`pdfjs-dist` for native-text extraction, `tesseract.js` for OCR, ExcelJS for styled XLSX, and a CSV
serializer. MUI uses Core v9 table and form components; `@mui/x-data-grid` is not used.

**Storage**: In-memory process map for jobs, source PDF bytes, and corrected values. Jobs are
available only while the Docker process remains alive; source bytes and job state are discarded on
restart and never logged.

**Testing**: Jest for domain and route/integration tests, React Testing Library for accessible UI
states, and one deterministic Playwright happy-path test. OCR is replaced by a deterministic fake
outside a narrowly scoped adapter integration test.

**Target Platform**: A single Linux Docker Compose web service for functional evaluation. Vercel is
a fixture-backed visual preview only and does not run OCR, jobs, persistence, or exports.

**Project Type**: Web application with in-process asynchronous processing.

**Performance Goals**: A status change is visible to an active review client within 3 seconds; a
valid fixture document completes the submit-to-download journey within 3 minutes; one OCR job runs
at a time by default to protect CPU and memory.

**Constraints**: `.agents/CONTEXT.md` is the literal source for HTTP methods, paths, fields, and specified
returns; no PII or document text in logs; fixed 10 MiB (10,485,760 bytes) upload limit; no invented
values; invalid dates/months are never emitted as valid; monetary output stays in Brazilian string
form; no alternate public API for source PDF retrieval.

**Scale/Scope**: One Docker process and in-memory jobs for the technical challenge. Parsing targets
the supplied fixtures and prioritizes the complete user cycle over generic-layout depth.

## Constitution Check

*GATE: Passed before Phase 0 research. Re-checked and passed after Phase 1 design.*

| Constitutional gate | Plan evidence | Status |
|---|---|---|
| Required stack | Next.js App Router, strict TypeScript, MUI, Jest + RTL, Playwright, and Docker are mandatory in the technical context and source layout. | PASS |
| Literal HTTP and JSON contracts | Route handlers expose only the documented contract; schemas validate exact request/response shapes; no warning, timestamp, progress, or source-PDF fields are added. | PASS |
| Data fidelity | Parsers preserve source order and raw text, use `?` for uncertainty, reject impossible values, and keep Holerite money as strings. | PASS |
| Risk-based tests | Eight focused tests cover parsers, OCR fallback, warnings, contracts, exports, and a single end-to-end user flow. | PASS |
| Security and privacy | Signature/size checks, opaque IDs, in-memory data, no-PII logging, Docker execution, and generic user errors are planned. | PASS |

## Architecture and Processing Strategy

### Request and in-process flow

1. `POST /api/transcricoes` validates the declared type, multipart shape, actual byte size, PDF
   signature, readable PDF structure, and concurrency admission before accepting anything.
2. The route generates an opaque UUID, creates an in-memory job with `status: "processando"`,
   `erro: null`, `value: null`, and source bytes, and returns
   exactly `202 { "id": "..." }`. It does not perform parsing or OCR in the request.
3. An in-process asynchronous command processes the job. The state is intentionally lost on process
   restart; Docker Compose is the supported functional environment.
4. For each page, the command tries native text extraction first. A page whose extracted text is
   empty or below the usability threshold uses `tesseract.js`; parser and OCR adapters preserve
   source order and replace only unrecognized characters with `?`.
5. The type-specific pure parser produces the immutable model, which the schema validates before it
   writes `status: "concluido"` with `value`. A controlled failure writes
   `status: "erro"`, a safe readable `erro`, and leaves `value: null`.
6. The review screen polls `GET /api/transcricoes/:id` only while the status is `processando`, using
   a 1-second initial interval and capped 3-second backoff, aborting when unmounted and stopping in
   every terminal state.
7. `PUT /api/transcricoes/:id` is accepted only after completion. It validates the complete edited
   value and replaces the in-memory current value. Its successful status/body are not extended beyond
   what `.agents/CONTEXT.md` specifies. Export reads only that latest validated value.

### Contract-preserving PDF review

The browser creates an object URL from the user-selected PDF and retains it in a feature-level
review session. A short-lived browser-local blob cache keyed by the opaque transcription ID restores
the preview across an in-session reload and is deleted on completion/TTL. This gives the required
split-screen review without a new public PDF-serving endpoint or any PDF bytes in the immutable GET
response. A link opened in a different browser session shows a clear request to resubmit the source
PDF for visual comparison while preserving the server-side transcription and export workflow.

### Docker and Vercel delivery

The Dockerfile uses the Node.js runtime required by Next.js and `tesseract.js`; it does not install
Tesseract CLI, Poppler, SQLite, or a worker bundle. `docker-compose.yml` defines one `web` service
and a `/healthz` check. It is the environment used to evaluate upload, processing, review, and
export. `.env.example` documents the fixed upload limit and non-secret OCR/process settings.

Vercel serves only a safe, fixture-backed UI preview. It must not expose real upload processing,
OCR, job polling, server-side persistence, or export actions as functional capabilities.

### Strategic test plan

| ID | Layer | Strategic assertion |
|---|---|---|
| T-01 | Jest unit: Cartão parser | Preserves day/punch order, raw values, `IN`/`OUT` alternation, empty punches, and uncertain time text. |
| T-02 | Jest unit: Cartão validation | Never normalizes impossible dates/times or replaces unreadable characters with a guessed value. |
| T-03 | Jest unit: Holerite parser | Separates `fields` from `bases`, retains empty code/reference, and preserves BRL strings including `?`. |
| T-04 | Jest integration: extraction pipeline | Uses OCR only for pages without usable native text and returns no OCR/document content in observable errors or logs. |
| T-05 | Jest unit: warning derivation | Detects uncertainty, odd punches, empty pages, and date/month sequence rules, including December→January and red-over-yellow precedence. |
| T-06 | Jest integration: HTTP contract | Verifies literal methods, paths, 202 creation response, lifecycle nullability, valid PUT, export format selection, and `/healthz` 200. |
| T-07 | Jest unit: exporters | Verifies Cartão column expansion/order, Holerite label-union transposition, saved corrections, XLSX styling, and data preservation in CSV/JSON. |
| T-08 | Playwright E2E: critical happy path | Uploads a deterministic Cartão fixture, observes processing, reviews PDF/table side by side, edits and saves a value, sees recalculated alerting, and downloads a corrected XLSX. |

## Project Structure

### Documentation (this feature)

```text
specs/001-pdf-transcription-workflow/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── http-api.md
│   └── transcription-json.md
└── tasks.md                    # Created later by $speckit-tasks
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── api/
│   │   ├── transcricoes/
│   │   │   ├── route.ts                    # POST
│   │   │   └── [id]/
│   │   │       ├── route.ts                # GET and PUT
│   │   │       └── planilha/route.ts       # GET export
│   │   └── healthz/route.ts
│   ├── transcricoes/[id]/page.tsx          # Review screen
│   ├── layout.tsx
│   └── page.tsx                            # Upload screen
├── components/
│   ├── ui/                                 # MUI wrappers, theme, domain color tokens
│   ├── upload/                             # File/type form and progress states
│   └── review/                             # PDF pane, editable tables, alerts, export actions
├── domain/
│   ├── transcription/                      # Models, schemas, invariants, lifecycle rules
│   ├── document/                           # Document type rules and PDF validation policy
│   ├── warnings/                           # Pure Cartão/Holerite warning derivation
│   └── export/                             # Format-independent export rows and style intent
├── application/
│   ├── commands/                           # Submit, process, save correction, export
│   ├── queries/                            # Read transcription status/current value
│   └── services/                           # Orchestration interfaces and use cases
├── infrastructure/
│   ├── pdf/                                # PDF signature, native text, page rendering adapters
│   ├── ocr/                                # Tesseract.js adapter
│   ├── storage/                            # In-memory job repository
│   └── export/                             # XLSX, CSV, and JSON writers
├── lib/
│   ├── parsers/                            # Pure Cartão and Holerite text-to-domain parsers
│   ├── ocr/                                # OCR ports, page usability policy, confidence masking
│   ├── exporters/                           # Export-model mappers shared by infrastructure writers
│   ├── env.ts                              # Typed environment configuration
│   └── ids.ts                              # Opaque ID creation and path-safe helpers
├── schemas/
│   ├── http.ts                             # Executable request/response schemas
│   └── transcription.ts                    # Executable immutable document schemas
└── test/
    ├── fixtures/                           # Synthetic, deterministic, PII-free documents/models
    └── helpers/                            # Fake OCR, clock, repository, and workbook readers

tests/
├── unit/
├── integration/
└── e2e/
    └── pdf-transcription.spec.ts

Dockerfile
docker-compose.yml
.env.example
next.config.ts
```

**Structure Decision**: A single Next.js process serves the UI, fixed HTTP contract, and in-process
OCR command. Domain and application layers are independent of React, Next.js, memory storage, and
Tesseract.js. The user-requested `lib/parsers`, `lib/ocr`, and
`lib/exporters` hold pure reusable transformations and ports; all system effects stay in
`infrastructure/`.
