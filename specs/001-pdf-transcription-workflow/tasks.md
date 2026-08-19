---

description: "Actionable development tasks for the PDF Transcription Workflow"
---

# Tasks: PDF Transcription Workflow

**Input**: Design documents from `/specs/001-pdf-transcription-workflow/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, and `contracts/`

**Tests**: Required by the constitution and feature specification. Prioritize parser, validation,
warning, contract, and exporter tests; retain one deterministic Playwright critical path.

**Organization**: The requested delivery phases are preserved. Tasks tied to user stories carry
`[US1]`, `[US2]`, or `[US3]`; setup, foundational, Docker, and documentation tasks are shared.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel after its listed prerequisites are complete and does not edit the
  same file as another parallel task.
- **[Story]**: Maps a task to the corresponding user story in `spec.md`.
- Every task has an exact target path and is sized for one coding session.

## Phase 1: Setup, Core Contracts & API Mocks

**Purpose**: Establish the strict TypeScript/Next foundation, contract types, test harness, and
deterministic fakes before domain or UI work.

- [x] T001 Initialize the Next.js App Router TypeScript project, dependency lockfile, and required scripts in `package.json`.
- [x] T002 Create the planned source and test directory skeleton in `src/`, `tests/unit/`, `tests/integration/`, and `tests/e2e/`.
- [x] T003 [P] Configure strict TypeScript and Next standalone output in `tsconfig.json` and `next.config.ts`.
- [x] T004 [P] Create the MUI Core v9 theme, native-table conventions, and centralized warning/export color tokens in `src/components/ui/theme.ts` and `src/app/layout.tsx`.
- [x] T005 [P] Configure Jest, React Testing Library, coverage collection, and test setup in `jest.config.ts` and `src/test/setup.ts`.
- [x] T006 [P] Configure Playwright projects, deterministic test server startup, and artifact capture in `playwright.config.ts`.
- [x] T007 [P] Define typed, non-secret runtime settings—including the fixed 10 MiB upload limit—in `src/lib/env.ts` and `.env.example`.
- [x] T008 Define immutable domain TypeScript models for Cartão, Holerite, lifecycle, export formats, and derived warnings in `src/domain/transcription/model.ts` and `src/domain/warnings/model.ts`.
- [x] T009 Implement shared executable Zod schemas for immutable transcription values and HTTP request/response payloads in `src/schemas/transcription.ts` and `src/schemas/http.ts`.
- [x] T010 Create deterministic repository, OCR, clock, and PDF fixtures without PII for tests in `src/test/helpers/fakes.ts` and `src/test/fixtures/`.
- [x] T011 Add the health route with its literal 200 behavior in `src/app/api/healthz/route.ts` and its contract test in `tests/integration/healthz.contract.test.ts`.

**Checkpoint**: Types, executable schemas, test harness, API fakes, color tokens, and health check
exist without changing the public transcription contract.

---

## Phase 2: Motor de Extração (PDF Text + Tesseract OCR Fallback)

**Purpose**: Build the shared in-memory processing path that validates uploads, obtains
text safely, and records only valid terminal lifecycle states. This phase blocks all user stories.

- [x] T012 Implement byte limit, PDF signature, password-protection, zero-page, and corruption validation in `src/infrastructure/pdf/validate-pdf.ts`.
- [x] T013 [P] Implement page-ordered native PDF text extraction in `src/infrastructure/pdf/native-text-extractor.ts`.
- [x] T014 [P] Implement source-order page preparation suitable for `tesseract.js` in `src/infrastructure/pdf/page-renderer.ts`.
- [x] T015 [P] Implement the Node.js `tesseract.js` adapter with timeout and confidence masking in `src/infrastructure/ocr/tesseract-js-adapter.ts`.
- [x] T016 Implement the per-page usability policy and native-text-to-OCR fallback orchestration in `src/lib/ocr/extract-pages.ts`.
- [x] T017 Implement the process-memory job repository, 24-hour expiry checks, and source-byte cleanup in `src/infrastructure/storage/in-memory-transcription-store.ts`.
- [x] T018 Implement safe structured operational logging with opaque IDs only in `src/infrastructure/logging/logger.ts`.
- [x] T019 Implement in-process asynchronous scheduling, one-job concurrency, and terminal failure updates in `src/application/commands/process-transcription.ts`.
- [x] T020 Add the extraction integration test for native-text preference, OCR fallback, uncertainty preservation, and safe all-page OCR failure in `tests/integration/extraction-pipeline.test.ts`.
- [x] T021 Add upload-boundary integration tests for missing file/type, spoofed PDF, password-protected, zero-page, corrupt, exactly 10 MiB, and over-10 MiB inputs in `tests/integration/upload-validation.test.ts`.

**Checkpoint**: An in-memory job can move only from `processando` to a validated `concluido` value or
safe `erro` state; a page with total OCR failure never yields a partial completed transcription.

---

## Phase 3: Parsers e Regras de Negócio (Holerite + Cartão de Ponto) + Testes Unitários de Parsers

**Goal**: Deliver User Story 1's trustworthy document model: ordered extraction for both document
types, no invented values, and deterministic derived warnings.

**Independent Test**: Given deterministic extracted-page fixtures for both document types, parsers
produce the literal output schemas or a safe error; no UI, real OCR, or Docker service is required.

### Tests for User Story 1

- [x] T022 [P] [US1] Write Cartão parser tests for source order, raw values, empty punches, IN/OUT sequence, and `?` preservation in `tests/unit/cartao-parser.test.ts`.
- [x] T023 [P] [US1] Write Cartão validation tests proving impossible dates/times are never normalized into plausible values in `tests/unit/cartao-validation.test.ts`.
- [x] T024 [P] [US1] Write Holerite parser tests for strict `fields`/`bases` separation, empty code/reference, BRL strings, and `?` preservation in `tests/unit/holerite-parser.test.ts`.
- [x] T025 [P] [US1] Write pure warning tests for odd punches, empty Holerite pages, readable date/month sequence, December→January, and red-over-yellow precedence in `tests/unit/warnings.test.ts`.

### Implementation for User Story 1

- [x] T026 [P] [US1] Implement Cartão line parsing, raw/normalized time handling, and ordered IN/OUT punch creation in `src/lib/parsers/cartao-ponto-parser.ts`.
- [x] T027 [P] [US1] Implement Holerite section-aware parsing that permits main-table items only in `fields` and bases/totals only in `bases` in `src/lib/parsers/holerite-parser.ts`.
- [x] T028 [US1] Implement no-invention validation for dates, times, months, monetary text, page indexes, and source order in `src/domain/transcription/validation.ts`.
- [x] T029 [US1] Implement pure Cartão and Holerite warning derivation plus red-over-yellow row presentation in `src/domain/warnings/derive-warnings.ts`.
- [x] T030 [US1] Complete the type-dispatched processing command with extraction, parser, validation, and in-memory terminal write in `src/application/commands/process-transcription.ts`.

**Checkpoint**: Cartão and Holerite fixtures reach a literal, valid model independently of the UI;
`Base INSS` and other totals cannot enter Holerite `fields`.

---

## Phase 4: Interface do Usuário (Upload, Split View, MUI Editable Table, Visual Alerts)

**Goal**: Deliver User Story 1's submit/status experience and User Story 2's accessible split-screen
review and correction flow without adding a public endpoint or field.

**Independent Test**: A user can submit a deterministic fixture, observe `processando` until a
terminal state, review the original local PDF beside a typed editable table, and save one valid
correction; `date_raw` and `time_raw` remain visible and read-only.

### User Story 1 — submission and status

- [x] T031 [US1] Implement `POST /api/transcricoes` with literal multipart fields, 202 `{ id }`, input validation, opaque ID storage, and job scheduling in `src/app/api/transcricoes/route.ts`.
- [x] T032 [US1] Implement literal lifecycle retrieval in `src/app/api/transcricoes/[id]/route.ts`.
- [x] T033 [US1] Implement the MUI upload form, document-type selection, local PDF session cache, and safe validation messages in `src/components/upload/upload-form.tsx` and `src/app/page.tsx`.
- [x] T034 [US1] Implement polling with 1-to-3-second backoff, cancellation, terminal-state handling, and no manual-refresh dependency in `src/components/upload/transcription-status.tsx`.
- [x] T035 [US1] Add CONTEXT-literal HTTP contract tests for POST, GET lifecycle, PUT replacement verified by subsequent GET, explicit XLSX/CSV/JSON downloads, and `/healthz` in `tests/integration/transcricoes.contract.test.ts`.

### User Story 2 — review, alerts, and correction

- [x] T036 [P] [US2] Implement the split-screen review shell, local PDF object-URL pane, and accessible fallback when the local preview is unavailable in `src/components/review/review-split-view.tsx`.
- [x] T037 [P] [US2] Implement MUI Core native document tables with semantic headers; Cartão `date_raw`/`time_raw` are read-only while `time_hhmm` and valid Holerite fields are editable in `src/components/review/cartao-table.tsx` and `src/components/review/holerite-table.tsx`.
- [x] T038 [US2] Implement warning rendering with yellow `#FFF3CD`, red `#F8D7DA`, red first-cell border `#DC3545`, readable reasons, and red precedence in `src/components/review/warning-row.tsx`.
- [x] T039 [US2] Implement whole-value correction validation, raw-field immutability, and last-valid-state preservation in `src/application/commands/update-transcription.ts` and `src/app/api/transcricoes/[id]/route.ts`.
- [x] T040 [US2] Connect review loading, saving, alert recalculation, and the completed-status route to the review page in `src/app/transcricoes/[id]/page.tsx`.
- [x] T041 [US2] Add RTL tests for accessible upload/review states, visible alert precedence, and read-only raw Cartão fields in `tests/unit/review-ui.test.tsx`.

**Checkpoint**: Users can observe processing, review a completed value beside their source PDF,
correct valid data, and cannot save an invalid date or see an undocumented contract field.

---

## Phase 5: Módulo de Exportação (.xlsx ExcelJS, .csv, .json) com Destaques de Cor

**Goal**: Deliver User Story 3 by exporting the latest saved correction in all formats while
preserving literal layout, order, and XLSX styling.

**Independent Test**: Given a saved corrected Cartão or Holerite value with derived alerts, each
writer produces its required output without a UI, in-process scheduler, or live OCR dependency.

### Tests for User Story 3

- [x] T042 [P] [US3] Write exporter tests for Cartão column expansion/order, Holerite label-union transposition, saved corrections, and CSV/JSON data preservation in `tests/unit/exporters.test.ts`.
- [x] T043 [P] [US3] Write XLSX inspection tests for `#173772` white-bold headers, yellow/red rows, red first-cell border, and red-over-yellow precedence in `tests/unit/xlsx-styles.test.ts`.

### Implementation for User Story 3

- [x] T044 [P] [US3] Implement the format-independent Cartão export row model with maximum alternating Entrada/Saída columns in `src/lib/exporters/cartao-export-model.ts`.
- [x] T045 [P] [US3] Implement the Holerite export row model with first-appearance `fields.label` union and no `bases` columns in `src/lib/exporters/holerite-export-model.ts`.
- [x] T046 [US3] Implement XLSX writing with ExcelJS header and derived-alert styles in `src/infrastructure/export/xlsx-writer.ts`.
- [x] T047 [US3] Implement CSV and JSON writers that preserve the validated current value without materializing warning fields in `src/infrastructure/export/csv-writer.ts` and `src/infrastructure/export/json-writer.ts`.
- [x] T048 [US3] Implement explicit xlsx/csv/json format selection and latest-saved-value download at `GET /api/transcricoes/:id/planilha` in `src/app/api/transcricoes/[id]/planilha/route.ts`.

**Checkpoint**: Each format exports exactly the last valid saved transcription; XLSX alone renders
the contractual header and warning styles.

---

## Phase 6: Testes E2E (Playwright) & Dockerization (Dockerfile + docker-compose)

**Purpose**: Prove the single critical user journey and package the single-process Node.js
architecture for reproducible functional delivery.

- [x] T049 Implement a deterministic Playwright happy path—upload, polling, split review, edit/save, alert recalculation, and corrected XLSX download—in `tests/e2e/pdf-transcription.spec.ts`.
- [x] T050 Add production build/typecheck scripts for the single Next.js process in `package.json`.
- [x] T051 Create a Node Dockerfile with Next standalone output, `tesseract.js`, non-root runtime, and `/healthz` check in `Dockerfile`.
- [x] T052 Create one web Compose service with non-secret settings and a health check in `docker-compose.yml`.
- [x] T053 Create a safe fixture-backed Vercel UI-preview configuration and document its non-functional limits in `vercel.json` and `SOLUCAO.md`.
- [x] T054 Execute the quickstart health, upload-error, scanned-PDF, review/export, and privacy-log checks; record any failures in `specs/001-pdf-transcription-workflow/quickstart.md`.

**Checkpoint**: `docker compose up --build` starts the web service, `/healthz` is 200,
and the one constitution-required Playwright flow succeeds with deterministic fixtures.

---

## Phase 7: Documentação de entrega (README.md, SOLUCAO.md e PROCESSO.md)

**Purpose**: Publish the operational, privacy, and engineering evidence required for delivery.

- [x] T055 Document architecture, Docker start-up, 10 MiB enforcement, OCR fallback, in-memory-job limitations, environment settings, and Vercel UI-preview boundaries in `SOLUCAO.md`.
- [x] T056 Document the delivery process, AI/tool usage, ambiguous decisions, failures, rewrites, adversarial checks, and manual verification in `PROCESSO.md`.
- [x] T057 Create and maintain the official application `README.md` with project overview, prerequisites, run commands, usage, operational limits, and links to `CONTEXT.md`, `SOLUCAO.md`, and `PROCESSO.md`.

**Checkpoint**: A reviewer can run, evaluate, and understand the security/privacy and scope
tradeoffs without inspecting source code.

---

## Dependencies & Execution Order

### Phase dependencies

```text
Phase 1 Setup/Contracts
        ↓
Phase 2 Extraction/In-memory processing
        ↓
Phase 3 US1 Parsers and domain rules
        ↓
Phase 4 US1 submission/status + US2 review/correction UI
        ↓
Phase 5 US3 exports
        ↓
Phase 6 E2E + Docker/CI
        ↓
Phase 7 delivery documentation
```

- **US1 (P1)** depends on the shared setup and extraction foundations; it is independently proven by
parser tests plus the literal HTTP contract suite.
- **US2 (P2)** depends on a completed US1 value, but review components and tables can be developed
  in parallel after the domain model is stable. It is independently proven by review/validation
  tests using a stored fixture.
- **US3 (P3)** depends on the validated model and derived-warning functions, not on live OCR or UI.
  It is independently proven by exporter/writer tests using saved corrected fixtures.

### Parallel opportunities

- After T001, T003–T007 can proceed in parallel.
- After T008–T010, T012–T015 and T017–T018 can proceed in parallel where their files do not
  overlap; T016 and T019 then join the extraction path.
- T022–T025 are independent test-first tasks. T026 and T027 can proceed in parallel, then join at
  T028–T030.
- T036 and T037 can proceed in parallel after the model/schema foundation. T042–T045 can proceed
  in parallel after warning derivation.
- T049 and T050–T053 can proceed in parallel once Phase 5 creates the complete user journey.

## Implementation Strategy

### MVP first

1. Complete T001–T021 to establish contracts, durable processing, and safe OCR failure behavior.
2. Complete T022–T035 to demonstrate US1 with deterministic fixtures and literal status contract.
3. Stop and validate US1 before beginning editable review or export work.

### Incremental delivery

1. Add T036–T041 to make the output auditable and safely correctable (US2).
2. Add T042–T048 to make the saved transcription operationally useful (US3).
3. Complete T049–T057 only after the core business behavior and its focused tests pass.

## Notes

- All 57 tasks use the required checkbox, sequential ID, optional `[P]`, story-label, and file-path
  format.
- Do not replace contract tests with shallow UI snapshots. Every change touching parsers, contract,
  validation, warning rules, or exporters must retain its focused regression coverage.
- The original source PDF, OCR output, salaries, names, CPF values, and original filenames must not
  appear in fixtures, logs, test output, screenshots, or documentation.
