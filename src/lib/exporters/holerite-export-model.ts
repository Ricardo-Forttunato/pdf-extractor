import type { HoleriteValue } from "@/domain/transcription/model";
import type { TabularExport } from "@/lib/exporters/cartao-export-model";
export function holeriteExportModel(value: HoleriteValue): TabularExport {
  const headers = ["Pág.", "Mês", "Ano"]; for (const page of value.pages) for (const field of page.fields) if (!headers.includes(field.label)) headers.push(field.label);
  return { headers, rows: value.pages.map((page) => { const row: Record<string, string> = { "Pág.": String(page.page), "Mês": page.month, "Ano": page.year }; for (const field of page.fields) row[field.label] = field.value; return row; }) };
}
