import type { HoleriteValue } from "@/domain/transcription/model";
import type { TabularExport } from "@/lib/exporters/cartao-export-model";
export function holeriteExportModel(value: HoleriteValue): TabularExport {
  const headers = [
    "Pág.",
    "Mês",
    "Ano",
    "Referência documento",
    "Divergência cálculo",
    "Tipo",
    "Código",
    "Descrição",
    "Referência",
    "Valor",
  ];
  return {
    headers,
    rows: value.pages.flatMap((page) => [
      ...page.fields.map((field) => ({
        "Pág.": String(page.page),
        Mês: page.month,
        Ano: page.year,
        "Referência documento": page.reference,
        "Divergência cálculo": page.divergence_calculo ? "Sim" : "Não",
        Tipo: field.kind,
        Código: field.code,
        Descrição: field.label,
        Referência: field.reference,
        Valor: field.value,
      })),
      ...page.bases.map((base) => ({
        "Pág.": String(page.page),
        Mês: page.month,
        Ano: page.year,
        "Referência documento": page.reference,
        "Divergência cálculo": page.divergence_calculo ? "Sim" : "Não",
        Tipo: "Base de cálculo",
        Código: "",
        Descrição: base.label,
        Referência: "",
        Valor: base.value,
      })),
    ]),
  };
}
