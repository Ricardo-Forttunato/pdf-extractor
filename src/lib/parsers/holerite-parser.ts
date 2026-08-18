import type { HoleriteValue } from "@/domain/transcription/model";
import type { VisionPayrollPage, VisionPayrollStatement } from "@/lib/document-processing/vision-contract";

const monthByName = { jan: "01", fev: "02", mar: "03", abr: "04", mai: "05", jun: "06", jul: "07", ago: "08", set: "09", out: "10", nov: "11", dez: "12" } as const;

function normalizeCompetence(reference: string) {
  const numeric = reference.match(/(\d{1,2})\D+(\d{4})/);
  if (numeric) return { month: numeric[1]!.padStart(2, "0"), year: numeric[2]! };
  const named = reference.match(/(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)[a-z]*[-/\s]*(\d{2,4})/i);
  if (named) {
    const year = named[2]!.length === 2 ? `20${named[2]}` : named[2]!;
    return { month: monthByName[named[1]!.toLowerCase() as keyof typeof monthByName] ?? "??", year };
  }
  return { month: "??", year: "????" };
}

function parseMoney(value: string) {
  if (!/^-?[\d.]+,\d{2}$/.test(value.trim())) return undefined;
  return Number(value.replaceAll(".", "").replace(",", "."));
}

function hasCalculationDifference(statement: VisionPayrollStatement) {
  const totalProventos = parseMoney(statement.total_proventos);
  const totalDescontos = parseMoney(statement.total_descontos);
  const liquido = parseMoney(statement.liquido_receber);
  if (totalProventos === undefined || totalDescontos === undefined || liquido === undefined) return true;
  return Math.round((totalProventos - totalDescontos) * 100) !== Math.round(liquido * 100);
}

export function parseHolerite(pages: VisionPayrollPage[]): HoleriteValue {
  const statements = pages.flatMap((page) => page.statements);
  return {
    pages: statements.map((statement, index) => {
      const { month, year } = normalizeCompetence(statement.reference);
      return {
        page: index + 1,
        year,
        month,
        reference: statement.reference,
        divergence_calculo: hasCalculationDifference(statement),
        fields: statement.itens.map((item) => ({
          code: item.code,
          label: item.description,
          reference: item.reference,
          value: item.value,
          kind: item.type
        })),
        bases: [
          { label: "TOTAL PROVENTOS", value: statement.total_proventos },
          { label: "TOTAL DESCONTOS", value: statement.total_descontos },
          { label: "LIQUIDO A RECEBER", value: statement.liquido_receber }
        ]
      };
    })
  };
}
