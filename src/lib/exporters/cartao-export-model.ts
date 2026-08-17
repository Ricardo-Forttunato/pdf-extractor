import type { CartaoPontoValue } from "@/domain/transcription/model";
export interface TabularExport { headers: string[]; rows: Array<Record<string, string>>; }
export function cartaoExportModel(value: CartaoPontoValue): TabularExport {
  const days = value.pages.flatMap((page) => page.days); const maxPunches = Math.max(0, ...days.map((day) => day.punches.length));
  const headers = ["Data", ...Array.from({ length: Math.ceil(maxPunches / 2) }, (_, index) => [`Entrada ${index + 1}`, `Saída ${index + 1}`]).flat()];
  return { headers, rows: days.map((day) => { const row: Record<string, string> = { Data: day.date_raw }; day.punches.forEach((punch, index) => { row[index % 2 ? `Saída ${Math.floor(index / 2) + 1}` : `Entrada ${Math.floor(index / 2) + 1}`] = punch.time_hhmm; }); return row; }) };
}
