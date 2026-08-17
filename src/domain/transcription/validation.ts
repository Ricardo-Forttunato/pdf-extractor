import type { DocumentType, TranscriptionValue } from "@/domain/transcription/model";
import { cartaoValueSchema, holeriteValueSchema } from "@/schemas/transcription";

const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const datePattern = /^(\d{2})\/(\d{2})\/(\d{4})$/;
const moneyPattern = /^(?:\d{1,3}(?:\.\d{3})*|\d+),\d{2}$/;
export const isKnownValidTime = (value: string) => timePattern.test(value);
export const isKnownValidDate = (value: string) => {
  const match = value.match(datePattern); if (!match) return false;
  const [day, month, year] = match.slice(1).map(Number); const candidate = new Date(Date.UTC(year, month - 1, day));
  return candidate.getUTCFullYear() === year && candidate.getUTCMonth() === month - 1 && candidate.getUTCDate() === day;
};
export const isKnownValidMonth = (value: string) => /^(0[1-9]|1[0-2])$/.test(value);
export const isObservedMoney = (value: string) => value.includes("?") || moneyPattern.test(value);
export function validateTranscription(type: DocumentType, value: TranscriptionValue): TranscriptionValue {
  const parsed = (type === "cartao-ponto" ? cartaoValueSchema : holeriteValueSchema).parse(value);
  const pages = parsed.pages;
  if (pages.some((page, index) => page.page !== index + 1)) throw new Error("A numeração das páginas é inválida.");
  if (type === "cartao-ponto") {
    for (const page of (parsed as import("@/domain/transcription/model").CartaoPontoValue).pages) for (const day of page.days) for (const punch of day.punches) {
      if (punch.time_hhmm !== "?" && !punch.time_hhmm.includes("?") && !isKnownValidTime(punch.time_hhmm)) throw new Error("Um horário editável é inválido.");
    }
  } else for (const page of (parsed as import("@/domain/transcription/model").HoleriteValue).pages) {
    if (!page.month.includes("?") && !isKnownValidMonth(page.month)) throw new Error("O mês é inválido.");
    for (const entry of [...page.fields, ...page.bases]) if (!isObservedMoney(entry.value)) throw new Error("Um valor monetário é inválido.");
  }
  return parsed as TranscriptionValue;
}
