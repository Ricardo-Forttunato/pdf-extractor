import type { CartaoPontoValue, HoleriteValue, TranscriptionValue } from "@/domain/transcription/model";
import type { DerivedWarning, RowPresentation } from "@/domain/warnings/model";
import { isKnownValidDate, isKnownValidMonth } from "@/domain/transcription/validation";

const yellow = (code: DerivedWarning["code"], message: string): DerivedWarning => ({ code, tone: "yellow", message });
const red = (code: DerivedWarning["code"], message: string): DerivedWarning => ({ code, tone: "red", message });
const unknown = (value: unknown) => JSON.stringify(value).includes("?");
export function presentation(warnings: DerivedWarning[]): RowPresentation { const isRed = warnings.some((warning) => warning.tone === "red"); return { warnings, fill: isRed ? "#F8D7DA" : warnings.length ? "#FFF3CD" : null, firstCellLeftBorder: isRed ? "#DC3545" : null }; }
export function cartaoWarnings(value: CartaoPontoValue): DerivedWarning[][] {
  const result: DerivedWarning[][] = []; let previous: Date | undefined;
  for (const page of value.pages) for (const day of page.days) { const warnings: DerivedWarning[] = []; if (unknown(day)) warnings.push(yellow("UNKNOWN_CHARACTER", "Há caracteres não identificados.")); if (day.punches.length % 2) warnings.push(yellow("ODD_PUNCH_COUNT", "Há número ímpar de batidas.")); if (isKnownValidDate(day.date_raw)) { const [d, m, y] = day.date_raw.split("/").map(Number); const current = new Date(Date.UTC(y, m - 1, d)); if (previous && current <= previous) warnings.push(red("NON_SEQUENTIAL_DATE", "A data não é sequencial.")); previous = current; } result.push(warnings); }
  return result;
}
export function holeriteWarnings(value: HoleriteValue): DerivedWarning[][] {
  const result: DerivedWarning[][] = []; let previous: number | undefined;
  for (const page of value.pages) { const warnings: DerivedWarning[] = []; if (unknown(page)) warnings.push(yellow("UNKNOWN_CHARACTER", "Há caracteres não identificados.")); if (!page.fields.length && !page.bases.length) warnings.push(yellow("EMPTY_HOLERITE_PAGE", "Não há dados extraídos nesta página.")); if (isKnownValidMonth(page.month) && /^\d{4}$/.test(page.year)) { const current = Number(page.year) * 12 + Number(page.month); if (previous !== undefined && current !== previous + 1) warnings.push(red("NON_SEQUENTIAL_MONTH", "A competência não é sequencial.")); previous = current; } result.push(warnings); }
  return result;
}
export function warningsFor(value: TranscriptionValue): DerivedWarning[][] { return "days" in value.pages[0]! ? cartaoWarnings(value as CartaoPontoValue) : holeriteWarnings(value as HoleriteValue); }
