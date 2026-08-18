import type { HoleriteValue } from "@/domain/transcription/model";
import type { TabularExport } from "@/lib/exporters/cartao-export-model";
export function holeriteExportModel(value: HoleriteValue): TabularExport {
  const headers = ["Pág.", "Mês", "Ano", "Tipo", "Código", "Descrição", "Referência", "Valor"];
  return { headers, rows: value.pages.flatMap((page) => [
    ...page.fields.map((field) => ({ "Pág.": String(page.page), "Mês": page.month, "Ano": page.year, Tipo: "Verba", "Código": field.code, "Descrição": field.label, "Referência": field.reference, Valor: field.value })),
    ...page.bases.map((base) => ({ "Pág.": String(page.page), "Mês": page.month, "Ano": page.year, Tipo: "Base de cálculo", "Código": "", "Descrição": base.label, "Referência": "", Valor: base.value }))
  ]) };
}
