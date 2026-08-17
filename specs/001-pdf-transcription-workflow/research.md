# Research: PDF Transcription Workflow

## Decision: Use an in-memory job store and in-process asynchronous processing

**Decision**: Keep job state, values, and source-PDF bytes in Node.js process memory. The web
application schedules an in-process asynchronous command after accepting a request; no worker,
SQLite database, lease, or external storage is used.

**Rationale**: A single Docker process is the functional evaluation environment and favors the
simplest complete workflow within the time limit. The trade-off is explicit: a restart loses jobs
and results, so this is not durable production architecture.

**Alternatives considered**:

- In-request OCR: rejected because it prevents the required immediate asynchronous response.
- Durable SQLite worker: rejected as disproportionate for the scoped Docker demonstration.
- PostgreSQL plus an external queue: deferred; it is the correct upgrade for multiple replicas but
  disproportionate for this challenge.

## Decision: Extract native text first and apply Tesseract only to unusable pages

**Decision**: Extract embedded text page by page with `pdfjs-dist`. Pages without usable text use
`tesseract.js` in the Node.js runtime. Parse and validate the combined page sequence in source order.

**Rationale**: Native text is faster and more faithful when available. Per-page fallback avoids
lowering quality on mixed PDFs. OCR confidence is only a signal: anything not supported by the source/validation is
represented with `?`, never heuristically corrected.

**Alternatives considered**:

- OCR every PDF page: rejected because it needlessly loses native-text fidelity and consumes CPU.
- Cloud OCR: rejected for the initial design because source PDFs contain sensitive worker data and
  would require a new data-sharing/privacy decision.
- Tesseract CLI plus Poppler: rejected to keep the Docker and Vercel-compatible Node deployment
  simple.

## Decision: Keep the HTTP contract closed and preserve review PDF locally in the browser

**Decision**: Do not add a download or preview HTTP endpoint. The upload screen retains the selected
file in a feature-level session and a short-lived browser-local blob cache keyed by the opaque ID;
the review pane uses an object URL. `GET /api/transcricoes/:id` returns only its documented fields.

**Rationale**: Adding PDF bytes, a URL, progress percent, timestamps, or warnings to the status
response would violate the fixed response shape. The local source PDF is sufficient for the
required upload-to-review journey and avoids widening the public surface containing PII.

**Alternatives considered**:

- Add `/api/transcricoes/:id/pdf`: rejected because it adds an uncontracted public API.
- Embed the PDF in the status JSON: rejected because it changes the immutable schema and magnifies
  sensitive-data exposure.

## Decision: Define safe behavior for unspecified contract details

**Decision**: Apply these stable design rules:

- XLSX, CSV, and JSON are selected explicitly by the documented `formato` query; CSV and JSON
  preserve data but cannot preserve cell styles.
- PUT success status/body are not specified by `.agents/CONTEXT.md`. Invalid replacement data is rejected
  and an edit before completion fails without overwriting the saved value.
- An unreadable Holerite competence preserves unknown characters as `?` (for example `0?` or `??`)
  and an empty extracted page remains present with `fields: []` and `bases: []`.
- An impossible candidate date/time/month is not normalized or rewritten. `?` is used only where OCR
  failed to identify a character; the literal raw text remains auditable.
- Cartão date-sequence checking requires chronologically increasing adjacent readable dates; it
  does not flag calendar gaps because documents may omit weekends or absences. Holerite checking
  requires the next readable monthly competence and accepts December→January.

**Rationale**: These decisions preserve the no-invention rule, avoid adding response fields, and
prevent false alerting for normal non-work days while making every uncertainty auditable.

**Alternatives considered**:

- Guess a plausible date/month: rejected by the constitution.
- Treat every missing calendar day as an error: rejected because it produces false positives for
  normal time-card layouts.
- Persist warnings in the document JSON: rejected because warnings are derived projections, not
  contract fields.

## Decision: Use executable schemas and pure export/warning transformations

**Decision**: Model every public JSON body with shared TypeScript types and Zod schemas. Derive
warnings from the current value at review/export time. Transform the current validated value into a
format-independent export model before XLSX, CSV, or JSON writing.

**Rationale**: Static types alone cannot validate multipart input or stored JSON. Shared schemas
prevent API and processing-command drift. Pure warning/export functions permit high-signal Jest tests without
OCR, HTTP, database, or MUI setup.

**Alternatives considered**:

- Separate schemas in each route and parser: rejected because duplicated schemas drift.
- Store warnings with the transcription: rejected because a correction can make them stale and the
  public output contract has no warning field.

## Decision: Build one Docker web service and publish a UI-only Vercel preview

**Decision**: Build a Node image for the single Next.js web process, including the JavaScript OCR
dependency. Docker Compose starts this functional service. The Vercel deployment uses safe fixture
data only for interface review and does not execute OCR, job processing, or exports.

**Rationale**: JavaScript-only OCR avoids operating-system packages and lets Docker be the reliable
single-process evaluator. Vercel remains a visual preview rather than a serverless job runtime.

**Alternatives considered**:

- Separate worker/SQLite deployment: rejected because it exceeds the scoped evaluation architecture.

## Sources

- [Next.js: Backend for Frontend](https://nextjs.org/docs/app/guides/backend-for-frontend)
- [Next.js: Route Handlers](https://nextjs.org/docs/app/api-reference/file-conventions/route)
- [Next.js: Self-hosting](https://nextjs.org/docs/app/guides/self-hosting)
- [Next.js Docker standalone example](https://github.com/vercel/next.js/tree/canary/examples/with-docker)
- [Tesseract.js](https://github.com/naptha/tesseract.js)
