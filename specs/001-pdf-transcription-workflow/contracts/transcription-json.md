# Immutable Transcription JSON Contract

## Cartão de Ponto

```json
{
  "pages": [
    {
      "page": 1,
      "days": [
        {
          "date_raw": "21/05/2019",
          "punches": [
            { "kind": "IN", "time_raw": "08:25", "time_hhmm": "08:25" },
            { "kind": "OUT", "time_raw": "18:25", "time_hhmm": "18:25" }
          ]
        }
      ]
    }
  ]
}
```

| Path | Constraint |
|---|---|
| `pages[].page` | Integer beginning at 1. |
| `pages[].days[]` | One item for every source document line, in source order; never order by date. |
| `date_raw` | Observed text, including `?` where it cannot be read safely. |
| `punches[]` | Source order; empty when a day has no punches. |
| `kind` | Exactly `IN` or `OUT`. |
| `time_raw` | Observed text. |
| `time_hhmm` | A 24-hour `HH:MM` only where supported by the text; uncertainty stays `?`. |

## Holerite

```json
{
  "pages": [
    {
      "page": 1,
      "year": "2020",
      "month": "01",
      "fields": [
        { "code": "0010", "label": "Salário Base", "reference": "220,00", "value": "2.389,77" }
      ],
      "bases": [
        { "label": "Base INSS", "value": "2.545,68" }
      ]
    }
  ]
}
```

| Path | Constraint |
|---|---|
| `pages[].page` | Integer beginning at 1. |
| `year`, `month` | Strings; readable `month` is `01`–`12`, otherwise the unreadable characters are `?`. |
| `fields[]` | Only earnings/deductions from the main table. |
| `fields[].code` | Empty string when absent. |
| `fields[].label` | Printed label without its code. |
| `fields[].reference` | Empty string when absent. |
| `fields[].value`, `bases[].value` | Brazilian monetary string, for example `2.389,77`; never numeric. |
| `bases[]` | Only bases and totals from the separate lower section; never included in `fields`. |

## Shared fidelity rules

- Every field name, array nesting, and scalar type is immutable.
- Preserve pages, records, punches, and first appearances in document order.
- Use `?` only to surface uncertainty. Never omit a record merely because it is uncertain and never
  substitute a plausible value.
- Never coerce impossible dates, times, or months into valid-looking data.
- Warnings are calculated views over this data and are never appended to this JSON.
