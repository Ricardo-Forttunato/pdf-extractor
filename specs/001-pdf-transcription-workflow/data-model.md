# Data Model: PDF Transcription Workflow

## Public contract types

The following TypeScript declarations describe the exact externally observable JSON fields. They
are paired with runtime schemas in `src/schemas/`; TypeScript types do not replace validation of
multipart input, JSON received over HTTP, or values recovered from storage.

```ts
export type DocumentType = "cartao-ponto" | "holerite";
export type TranscriptionStatus = "processando" | "concluido" | "erro";
export type PunchKind = "IN" | "OUT";
export type ExportFormat = "xlsx" | "csv" | "json";

/**
 * Text from a document. It may include `?` at positions that cannot be read safely.
 * Validators, not a numeric conversion, determine whether its known characters are valid.
 */
export type DocumentText = string;
export type BrlValue = DocumentText;

export interface CartaoPunch {
  kind: PunchKind;
  time_raw: DocumentText;
  time_hhmm: DocumentText;
}

export interface CartaoDay {
  date_raw: DocumentText;
  punches: CartaoPunch[];
}

export interface CartaoPage {
  page: number;
  days: CartaoDay[];
}

export interface CartaoPontoValue {
  pages: CartaoPage[];
}

export interface HoleriteField {
  code: DocumentText;
  label: DocumentText;
  reference: DocumentText;
  value: BrlValue;
}

export interface HoleriteBase {
  label: DocumentText;
  value: BrlValue;
}

export interface HoleritePage {
  page: number;
  year: DocumentText;
  month: DocumentText;
  fields: HoleriteField[];
  bases: HoleriteBase[];
}

export interface HoleriteValue {
  pages: HoleritePage[];
}

export type TranscriptionValue = CartaoPontoValue | HoleriteValue;

/** POST /api/transcricoes multipart fields; this request is not a JSON body. */
export interface CreateTranscriptionFields {
  arquivo: File;
  tipo: DocumentType;
}

export interface CreateTranscriptionResponse {
  id: string;
}

export interface ProcessingTranscriptionResponse {
  id: string;
  tipo: DocumentType;
  status: "processando";
  erro: null;
  value: null;
}

export interface CompletedCartaoResponse {
  id: string;
  tipo: "cartao-ponto";
  status: "concluido";
  erro: null;
  value: CartaoPontoValue;
}

export interface CompletedHoleriteResponse {
  id: string;
  tipo: "holerite";
  status: "concluido";
  erro: null;
  value: HoleriteValue;
}

export interface FailedTranscriptionResponse {
  id: string;
  tipo: DocumentType;
  status: "erro";
  erro: string;
  value: null;
}

export type GetTranscriptionResponse =
  | ProcessingTranscriptionResponse
  | CompletedCartaoResponse
  | CompletedHoleriteResponse
  | FailedTranscriptionResponse;

export interface UpdateTranscriptionRequest {
  value: TranscriptionValue;
}

/** CONTEXT.md does not define a successful PUT response shape. */
export type UpdateTranscriptionResponse = unknown;

/** GET /api/transcricoes/:id/planilha accepts ?formato=xlsx|csv|json. */
export type ExportResponse = Uint8Array | string;

/** CONTEXT.md defines only the required 200 status for GET /healthz. */
export type HealthzResponse = unknown;
```

## Validation rules and invariants

| Model area | Rules |
|---|---|
| All document text | Preserve the literal observed characters. A missing/unreadable character is `?`; neither parser, editor, validator, nor exporter guesses a substitute. |
| Cartão pages/days/punches | `page` is an integer beginning at 1. Pages, days, and punches retain document order. `date_raw` and `time_raw` stay raw. `time_hhmm` is normalized only when all known characters form a valid 24-hour time. `kind` is only `IN` or `OUT`. |
| Cartão date candidates | An impossible candidate is never treated as valid. If a known invalid position can be localized, it becomes `?`; otherwise the complete value is uncertain. Readable adjacent dates must be chronologically increasing; calendar gaps do not independently create an alert. |
| Holerite pages | `page` is an integer beginning at 1. A readable month is `01` through `12`. An unreadable month/year retains `?` in its textual positions rather than becoming a guessed competence. |
| Holerite `fields` | Contains only items read from the main earnings/deductions table. `code` and `reference` are `""` when the document lacks them. The label excludes the code. |
| Holerite `bases` | Contains only items from the separate bases/totals section. Bases and totals must not appear in `fields`, even if their label resembles an earnings item. |
| Monetary values | Remain strings with Brazilian decimal punctuation and no conversion to number/float. Known valid values conform to `1.234,56`-style formatting; `?` may replace only an unreadable character. |
| Lifecycle response | `processando` always has `value: null`; `concluido` always has an applicable non-null value and `erro: null`; `erro` always has `value: null` and a readable `erro`. |
| Warnings | Not stored in either public output. They are calculated from the current validated value before review rendering and export. |

## Internal persistence model

Internal fields never appear in `CreateTranscriptionResponse` or `GetTranscriptionResponse`.

```ts
export interface InMemoryTranscriptionJob {
  id: string;
  tipo: DocumentType;
  status: TranscriptionStatus;
  erro: string | null;
  value: TranscriptionValue | null;
  sourcePdf: Uint8Array;      // process memory only; never public or logged
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
}

export type WarningCode =
  | "UNKNOWN_CHARACTER"
  | "ODD_PUNCH_COUNT"
  | "EMPTY_HOLERITE_PAGE"
  | "NON_SEQUENTIAL_DATE"
  | "NON_SEQUENTIAL_MONTH";

export interface DerivedWarning {
  code: WarningCode;
  tone: "yellow" | "red";
  message: string;
}

export interface RowPresentation {
  warnings: DerivedWarning[];
  fill: "#FFF3CD" | "#F8D7DA" | null;
  firstCellLeftBorder: "#DC3545" | null;
}
```

## Relationships and state transitions

```text
Document Submission 1 ── creates ── 1 Transcription Job
Transcription Job    1 ── contains ── 0..1 Current Transcription Value
Current Value        1 ── derives ── 0..N Review/Export Warnings
Current Value        1 ── produces ── 0..N Format Exports

processando --in-process command validates--> concluido
processando --controlled processing failure--> erro
concluido  --validated user replacement-------> concluido
```

The in-process asynchronous command performs the first terminal write. User replacements are
permitted only from the completed state and are whole-value replacements, never patches; that keeps
the public update shape literal and makes export read one coherent current value. Jobs expire with
the process and are not durable across restart.
