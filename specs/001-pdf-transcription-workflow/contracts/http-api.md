# HTTP Contract

This document restates the immutable HTTP surface from the README. It does not add alternate
endpoints, response fields, progress metadata, warnings, source-PDF bytes, or a source-PDF URL.

## `POST /api/transcricoes`

**Request**: `multipart/form-data`

| Field | Type | Rule |
|---|---|---|
| `arquivo` | PDF file | Required; genuine, readable PDF; must not exceed configured byte limit. |
| `tipo` | `cartao-ponto` or `holerite` | Required. |

**Success**: `202 Accepted`

```json
{ "id": "abc123" }
```

The ID is opaque. Validation failures return a safe readable error without PII, OCR text, original
file name, filesystem paths, or stack traces.

## `GET /api/transcricoes/:id`

**Success**: `200 OK`

```json
{
  "id": "abc123",
  "tipo": "cartao-ponto",
  "status": "processando",
  "erro": null,
  "value": null
}
```

`status` is exactly one of `processando`, `concluido`, or `erro`.

- During `processando`, `value` is `null`.
- During `concluido`, `value` is the exact Cartão de Ponto or Holerite JSON model and `erro` is
  `null`.
- During `erro`, `value` is `null` and `erro` is a readable, non-sensitive message.


## `PUT /api/transcricoes/:id`

**Request**:

```json
{ "value": { "pages": [] } }
```

`value` must fully validate as the correct type's immutable document model. The request replaces
the saved transcription atomically only after processing has completed; it does not accept partial
patches or change `tipo`.

The README does not prescribe a successful PUT status code or response body. Do not treat either as
part of the immutable external contract. Invalid values and attempts to edit before completion fail
safely and never overwrite a saved value.

## `GET /api/transcricoes/:id/planilha`

**Query**: `formato=xlsx|csv|json`.

The response is built from the latest saved, validated `value`.

| Format | Response representation | Required behavior |
|---|---|---|
| `xlsx` | Workbook download | Includes header styling and derived alert styling. |
| `csv` | CSV download | Preserves corrected data/layout; cell styling is not representable. |
| `json` | JSON download | Preserves the corrected immutable document model; derived warnings are not materialized. |

## `GET /healthz`

Returns `200 OK` when the web application can serve requests. It does not depend on OCR execution,
an active job, or a source PDF.

## Contract invariants

- Documented paths, methods, request fields, status lifecycle values, and documented JSON field
  names are literal.
- Do not add an endpoint to retrieve source PDFs, do not embed them in status JSON, and do not add
  progress, timestamps, leases, revisions, alerts, or storage metadata to responses.
- Route handlers and the in-process processing command validate before an in-memory job can expose
  an invalid export.
