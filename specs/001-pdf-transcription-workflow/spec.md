# Feature Specification: PDF Transcription Workflow

**Feature Branch**: `main`

**Created**: 2026-08-14

**Status**: Draft

**Input**: User description: "Complete PDF transcription, review, alerts, and export workflow."

## Clarifications

### Session 2026-08-14

- Q: Qual limite máximo de upload deve ser imposto a cada PDF? → A: No máximo 10 MiB por PDF.
- Q: Quando o OCR não obtiver nenhum caractere utilizável de uma página, o processamento deve falhar por inteiro ou entregar uma transcrição parcial? → A: Falhar toda a transcrição, com `value: null` e erro seguro.
- Q: Como preservar datas e horários brutos ilegíveis ou impossíveis? → A: `date_raw` e `time_raw` são imutáveis; `?` representa somente caracteres não identificados pelo OCR. Valores impossíveis permanecem observáveis, mas nunca são normalizados como válidos.
- Q: Como a aplicação deve tratar um PDF protegido por senha, sem páginas ou estruturalmente corrompido no envio? → A: Rejeitar antes de criar job, com erro seguro e sem solicitar senha.
- Q: Por quanto tempo os PDFs enviados e as transcrições devem permanecer armazenados antes da exclusão automática? → A: Excluir PDF e transcrição automaticamente após 24 horas.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Submit and Track a Document (Priority: P1)

A user submits one work-document PDF, identifies it as a Cartão de Ponto or Holerite, and sees an
honest progress state until its transcription has completed or failed. The same experience works
for documents that contain selectable text and for scanned or image-only documents.

**Why this priority**: Without successful submission, asynchronous progress, and usable extraction,
the user cannot obtain a transcription to review or export.

**Independent Test**: Submit a valid native-text PDF and a valid scanned PDF for each document type;
verify that each reaches a terminal state with a transcription, or a clear processing error.

**Acceptance Scenarios**:

1. **Given** a user has a valid Cartão de Ponto or Holerite PDF and selects its type, **When** the
   user submits it, **Then** the application acknowledges the submission and displays that
   processing is in progress without making the page appear stalled.
2. **Given** a document is processing, **When** its state changes, **Then** the screen refreshes its
   visible state automatically until it reaches either completed or failed.
3. **Given** a scanned PDF has no usable embedded text, **When** the user submits it, **Then** the
   application attempts document-text recognition before declaring extraction failure.
4. **Given** text recognition yields no usable character for any required page, **When** processing
   ends, **Then** the whole request reaches the failed state with `value` unavailable; no partial
   transcription is offered as a completed result.
5. **Given** a user submits a missing, non-PDF, password-protected, zero-page, corrupted, or
   oversized file, **When** validation occurs, **Then** the application refuses the submission
   before creating a transcription request, with a readable error that exposes no document content.

---

### User Story 2 - Review and Correct a Faithful Transcription (Priority: P2)

A user reviews a completed transcription with the source PDF and an editable table visible side by
side. The user can correct extracted values while seeing all uncertainty and sequence problems
clearly highlighted.

**Why this priority**: Human review is the safeguard against imperfect document recognition and is
required before an exported spreadsheet can be trusted.

**Independent Test**: Open a completed transcription containing an unreadable character, an odd
number of punches, and a sequence error; correct a value and verify that the table and alerts
reflect the saved result.

**Acceptance Scenarios**:

1. **Given** a completed transcription, **When** the user opens it, **Then** the original PDF and
   its editable transcription table are visible at the same time.
2. **Given** a Cartão de Ponto record with an odd number of punches or an unreadable character,
   **When** the table is displayed, **Then** that record is highlighted yellow (`#FFF3CD`) with a
   readable explanation.
3. **Given** a Cartão de Ponto date or Holerite competence that breaks the readable sequence,
   **When** the table is displayed, **Then** that record is highlighted red (`#F8D7DA`), including
   a red left border (`#DC3545`) on its first cell.
4. **Given** a record qualifies for both yellow and red alerts, **When** the table is displayed,
   **Then** the red alert takes precedence.
5. **Given** the user corrects a table value, **When** the correction is saved, **Then** the saved
   transcription retains the correction, remains structurally valid, and recalculates its alerts.
6. **Given** a Cartão de Ponto contains an impossible observed date or time, **When** the table is
   displayed, **Then** its raw value remains visible and read-only and is never normalized into a
   valid-looking value.

---

### User Story 3 - Export the Reviewed Result (Priority: P3)

A user downloads the corrected transcription in a chosen supported format and receives the exact
data currently saved in review, including the required warning presentation where the format can
represent it.

**Why this priority**: Download is the business outcome of the workflow; an accurate review that
does not carry through to the exported data has no operational value.

**Independent Test**: Correct a value in each document type, save it, download each supported
format, and verify that the correction and required output layout are present.

**Acceptance Scenarios**:

1. **Given** a user has saved review corrections, **When** the user downloads an XLSX, CSV, or JSON
   file, **Then** the downloaded data reflects those corrections rather than the original output.
2. **Given** a Cartão de Ponto transcription, **When** it is exported, **Then** it has one row per
   source day in document order and alternating Entrada/Saída columns for all observed punches.
3. **Given** a Holerite transcription, **When** it is exported, **Then** it has one row per source
   page and one distinct earnings/deduction column per first-encountered label.
4. **Given** an exported XLSX contains an alerting record, **When** the user opens it, **Then** its
   alert colors and red-over-yellow precedence match the review table.

---

### Edge Cases

- A document has embedded text but only part of a value is unreadable; the uncertain character is
  retained as `?`, rather than guessing or discarding the record.
- A recognized date is impossible (for example, `38/07`) or a Holerite month is outside `01` to
  `12`; it is not emitted as a valid normalized date or competence.
- A Cartão de Ponto day has no punches, or an odd number of punches; its source order is retained
  and the appropriate derived alert is shown.
- A Holerite page contains no extracted data, or readable competences are non-sequential across
  pages (including the December-to-January transition); the appropriate derived alert is shown.
- A Holerite omits a code or reference for a main-table item; the output retains an empty string
  for that value instead of inventing one.
- Text recognition obtains no usable character for a required page; the whole request enters the
  failed state with no partial transcription, no fabricated data, and no sensitive document content.
- A page is genuinely present but contains no extractable Holerite data; the completed model retains
  that empty page and shows the existing empty-page alert. This is distinct from OCR failure.
- A PDF exceeds 10 MiB (10,485,760 bytes); it is rejected before storage or processing begins.
- A PDF is password-protected, has zero pages, or fails structural validation; it is rejected before
  a transcription request exists, and the application does not collect a password.
- A user edits a value so it would violate the output structure or a data-fidelity rule; the
  application prevents that invalid result from being saved. The export remains available only for
  the last valid saved transcription.
- A CSV or JSON download cannot express spreadsheet colors; it preserves the corrected data and
  output structure, while XLSX preserves the required visual alert styling.
- A transcription has reached 24 hours since submission; its PDF and saved result are removed and
  later review, status retrieval, or export is unavailable through the expired identifier.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow a user to submit one PDF and identify it as either Cartão de
  Ponto or Holerite.
- **FR-002**: The system MUST reject a submission that lacks a file or document type, is not a
  genuine PDF, is password-protected, has zero pages, is corrupted, or exceeds 10 MiB
  (10,485,760 bytes), before storage, processing, or creation of a transcription request. It MUST
  return a readable error that does not reveal sensitive document data and MUST NOT collect a PDF
  password.
- **FR-003**: The system MUST create a retrievable transcription request and expose only the
  lifecycle states `processando`, `concluido`, and `erro`; while processing, no transcription value
  is available, and a failed request has a readable error message.
- **FR-004**: The user interface MUST automatically refresh the request state while it is
  processing and MUST direct the user to review on completion or clearly present the failure state.
- **FR-005**: The system MUST extract documents with an embedded text layer and MUST attempt text
  recognition for scanned or image-only PDFs when embedded text is unavailable. If text recognition
  yields no usable character for a required page, the request MUST end in `erro` with `value: null`;
  it MUST NOT expose a completed partial transcription.
- **FR-006**: The system MUST NEVER invent an extracted value. Every character not identified by OCR
  MUST be represented by `?`; a readable but impossible date, time, or month MUST remain observed
  and MUST NOT be treated as a valid normalized value.
- **FR-007**: For Cartão de Ponto, the system MUST preserve page, day, and punch order exactly as
  printed; retain `date_raw` and `time_raw`; normalize `time_hhmm` only when possible; and assign each punch only `IN` or `OUT` in its source sequence.
- **FR-008**: For Holerite, the system MUST keep `fields` exclusively for earnings and deductions
  from the main table and `bases` exclusively for bases and totals from the separate section.
  `code` and `reference` MUST be empty strings when absent, and every monetary `value` MUST remain
  a Brazilian-real string such as `2.389,77`.
- **FR-009**: The system MUST preserve the literal HTTP contract and JSON output schemas defined in
  `.agents/CONTEXT.md` for submission, status retrieval, review updates, downloads, and service health.
- **FR-010**: The completed-review screen MUST show the source PDF beside a review table whose values
  represent the current transcription. Cartão `date_raw` and `time_raw` MUST be read-only;
  `time_hhmm` and valid Holerite fields remain editable.
- **FR-011**: The system MUST let the user save valid editable-field corrections and MUST derive all
  warnings again from the saved current data; warnings MUST NOT be stored as independent output
  fields. Read-only raw fields cannot be replaced; invalid editable values prevent saving and exports
  continue to use the last valid saved transcription.
- **FR-012**: The system MUST highlight rows with unreadable characters, odd punches, or empty
  Holerite pages in yellow (`#FFF3CD`), and rows with non-sequential dates or months in red
  (`#F8D7DA`) with a `#DC3545` left border on the first cell. Red MUST override yellow when both
  apply.
- **FR-013**: The system MUST offer XLSX, CSV, and JSON downloads of the saved transcription.
- **FR-014**: The Cartão de Ponto export MUST contain `Data`, followed by alternating `Entrada n`
  and `Saída n` columns up to the greatest observed punch count, with one row per source day in
  source order.
- **FR-015**: The Holerite export MUST contain `Pág.`, `Mês`, and `Ano`, followed by one column for
  each distinct `fields` label in first-appearance order, with one row per source page and no
  `bases` columns in that label union.
- **FR-016**: XLSX exports MUST render a bold white header on `#173772` and preserve the same alert
  colors and precedence used in review. CSV and JSON exports MUST preserve corrected data and the
  required output structure even though those formats do not represent cell styling.
- **FR-017**: The system MUST avoid recording personally identifiable information or document
  content in operational logs and MUST use non-identifying request references when correlation is
  necessary.
- **FR-018**: The system MUST delete the uploaded PDF and its saved transcription automatically 24
  hours after submission. An expired identifier MUST no longer provide review, status, or export.

### Key Entities *(include if feature involves data)*

- **Document Submission**: A user-provided PDF and its declared document type, subject to file and
  size validation.
- **Transcription Request**: The traceable unit of asynchronous processing, with an identifier,
  document type, lifecycle state, readable failure detail when applicable, and current result.
- **Cartão de Ponto Transcription**: Ordered pages, days, and IN/OUT punches with literal and, when
  valid, normalized representations.
- **Holerite Transcription**: Ordered pages with competence, main-table `fields`, and separate
  `bases`, while retaining Brazilian-formatted monetary strings.
- **Review Correction**: A valid user change to the current transcription that becomes the source
  for warnings and all subsequent exports.
- **Derived Alert**: A display and export indicator calculated from current transcription data for
  uncertainty, odd punches, empty pages, or broken date/month sequences.
- **Export**: The user-selected XLSX, CSV, or JSON representation of the saved transcription.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In acceptance testing, 100% of valid native-text and scanned fixture PDFs reach a
  completed review state or an explicit readable error; no submission remains indefinitely in a
  processing state.
- **SC-002**: In the acceptance suite, 100% of unreadable-character fixtures retain `?`, and
  impossible-date fixtures retain their observed raw value without inferred replacement or valid
  normalization.
- **SC-003**: In the acceptance suite, 100% of Cartão de Ponto and Holerite output fixtures conform
  to their required structure, source order, field/bases separation, and monetary string format.
- **SC-004**: A user can complete the primary flow—submit, observe completion, review, correct,
  save, and download—within 3 minutes for a valid fixture document.
- **SC-005**: In end-to-end acceptance testing, 100% of saved review corrections appear in each
  subsequently downloaded format.
- **SC-006**: In visual acceptance testing, 100% of fixture records with alert conditions use the
  specified color, with red taking precedence whenever a record meets both alert categories.

## Assumptions

- One submission contains one PDF and one declared document type; automatic type detection and
  multi-file batch submission are outside this feature's scope.
- The application is publicly usable without a login, as no authentication requirement is defined.
- A user remains on the processing screen until a terminal state is shown; the interface checks the
  request status automatically rather than requiring manual refresh.
- A human reviewer is responsible for replacing `?` with a verified value when the source PDF makes
  that possible; the application must not choose a replacement.
- Visual alert styling applies to the review table and XLSX. CSV and JSON retain alert-causing data
  and output structure but cannot carry spreadsheet cell formatting.
- The published Vercel URL is a UI-only preview with safe fixtures. Docker Compose is the functional
  evaluation environment for upload, OCR, processing, review, and export.
- The 24-hour retention period begins when the submission is accepted; it applies equally to the
  private source PDF and the saved transcription, regardless of processing outcome.
- The established project constitution governs the chosen application stack, test tools, container
  delivery, contract rigidity, privacy, and upload limit; this feature specification describes the
  user-visible behavior those constraints must support.
