# Quickstart Validation Guide

This guide validates the planned workflow without prescribing implementation bodies. Refer to the
[HTTP contract](./contracts/http-api.md) and [data model](./data-model.md) for exact shapes and
invariants.

## Prerequisites

- Docker Engine with Compose v2.
- The repository checkout, including the sample PDFs under `samples/timeCard/` and
  `samples/PayRoll/`.
- A generated `.env` from `.env.example`; use only non-secret local values for the fixed upload
  limit, OCR, and in-process processing timeout.

## Start the full environment

```bash
docker compose up --build
curl -i http://localhost:3000/healthz
```

Expected result: Compose starts one web service and `/healthz` responds with HTTP 200. The health
endpoint must remain healthy while no job is active and while in-process OCR is busy.

## Validate the primary user journey

1. Open the application and select a valid Cartão de Ponto PDF plus `cartao-ponto`.
2. Submit it. Confirm that the screen visibly remains in processing and then changes automatically
   to completed or a safe readable error.
3. On completion, confirm the PDF preview and editable table are visible side by side.
4. Verify that document order and raw text are represented; an unreadable fixture character must
   appear as `?`, not a guessed digit.
5. Confirm Cartão `date_raw` and `time_raw` are read-only; edit one valid `time_hhmm` or Holerite
   value and save. Confirm the value remains after refresh/status retrieval.
6. Download XLSX and verify the saved edit, column layout, header style, and any alert color. Repeat
   data verification with CSV and JSON, noting that those formats do not carry cell colors.
7. Repeat with a Holerite PDF. Confirm bases/totals are not placed in the main `fields` union in
   its spreadsheet.

## Validate error and privacy behavior

1. Submit a non-PDF renamed with a `.pdf` extension, an empty/corrupt PDF, and a file above the
   configured byte limit.
2. Confirm each is rejected with a useful message that includes no name, CPF, salary, source text,
   original filename, internal path, or stack trace.
3. Submit a scanned fixture. Confirm it reaches OCR fallback when native extraction has no usable
   page text, then either presents a faithful transcription or a controlled error.
4. Inspect application logs only by opaque transcription ID and event metadata; no PII, OCR text,
   document content, or PDF path is acceptable.

## Run quality gates

After dependencies and scripts are added by implementation, run:

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
```

Expected result: the eight strategic checks described in [plan.md](./plan.md) pass. The Playwright
check is the one deterministic upload → processing → split-screen review → edit → download journey;
it must not depend on a cloud OCR service or real PII.

## Vercel UI preview

The published Vercel URL is only for reviewing the interface with safe fixture data. It does not run
upload processing, OCR, server-side job polling, persistence, or export. Run `docker compose up`
for every functional evaluation.
