import type { CartaoDay, CartaoPontoValue, Punch } from "@/domain/transcription/model";
import { isKnownValidTime } from "@/domain/transcription/validation";
import type { ProcessedDocumentPage } from "@/lib/document-processing/document-page";
import type { VisionTimeCardPage } from "@/lib/document-processing/vision-contract";

const timeRegex = /(?<![\d/])([+]?(?:[01]\d|2[0-3]):?[0-5]\d)(?![\d/])/g;
const lineStartsWithTimeRegex = /^\s*[+]?(?:[01]\d|2[0-3]):?[0-5]\d(?![\d/])/;
const fullDateRegex = /\b(\d{2}\/\d{2}\/\d{4})\b/;
const monthYearRegex = /\b(\d{1,2})\/(\d{4})\b/;
const shortDayRegex = /^(\d{1,2})\s*-?\s*([A-ZÇ]{3,})\b/i;
const ignoredLineRegex = /(ASSINADO ELETRONICAMENTE|PJE DOCUMENTO|IMPRESSO POR|N[ÚU]MERO DO PROCESSO|N[ÚU]MERO DO DOCUMENTO|MATRICULA|UNIDADE DE LOTACAO|HORARIO DE TRABALHO|ASS\.RESPONS|ASS\.EMPREGADO|FLS\.|SIPON|FUNCION[ÁA]RIO|LOCALIZA[ÇC][ÃA]O|C[ÓO]DIGO NOME JORNADA|TOTAL DE HORAS|FOLGAS GERADAS|^EMISS[ÃA]O:|^DATA:|PER[IÍ]ODO:|CHAPA NOME DO FUNCION[ÁA]RIO|CARTEIRA DE TRABALHO|SE[ÇC][ÃA]O:|CART[ÃA]O DE PONTO P[ÁA]GINA)/i;

function toPunches(times: string[]): Punch[] {
  return times.map((time, punchIndex): Punch => ({
    kind: punchIndex % 2 === 0 ? "IN" : "OUT",
    time_raw: time,
    time_hhmm: isKnownValidTime(time) ? time : time
  }));
}

function normalizeTimeToken(value: string) {
  const normalized = value.replace(/^[+]/, "");
  return normalized.includes(":") ? normalized : `${normalized.slice(0, 2)}:${normalized.slice(2)}`;
}

function deriveMonthYear(lines: string[]) {
  for (const line of lines) {
    const match = line.match(monthYearRegex);
    if (match) return { month: match[1]!, year: match[2]! };
  }
  return undefined;
}

function buildDateRaw(day: string, lines: string[]) {
  const context = deriveMonthYear(lines);
  if (!context) return day.padStart(2, "0");
  return `${day.padStart(2, "0")}/${context.month.padStart(2, "0")}/${context.year}`;
}

function extractRelevantTimes(line: string, options?: { dropFirst?: boolean; maxTimes?: number }) {
  const times = [...line.matchAll(timeRegex)].map((match) => normalizeTimeToken(match[1] ?? ""));
  const startIndex = options?.dropFirst ? 1 : 0;
  const maxTimes = options?.maxTimes ?? 2;
  const extracted = times.slice(startIndex, startIndex + maxTimes);
  if (!options?.dropFirst && extracted.length === 4 && extracted[1]! > extracted[2]!) {
    return [extracted[0]!, extracted[2]!, extracted[3]!, extracted[1]!];
  }
  return extracted;
}

function appendTimes(target: CartaoDay, line: string, options?: { dropFirst?: boolean; maxTimes?: number }) {
  const effectiveTimes = extractRelevantTimes(line, options);
  const existingTimes = target.punches.map((punch) => punch.time_raw);
  target.punches = toPunches([...existingTimes, ...effectiveTimes]);
}

function parseProcessedTimeCardPage(page: ProcessedDocumentPage): CartaoPontoValue["pages"][number] {
  const days = new Map<string, CartaoDay>();
  let currentDay: CartaoDay | undefined;
  const pageHasJornadaColumn = page.lines.some((line) => /^(DIA|DATA)\b/i.test(line) && /JORNADA/i.test(line));

  for (const line of page.lines) {
    if (ignoredLineRegex.test(line)) {
      currentDay = undefined;
      continue;
    }

    const fullDate = line.match(fullDateRegex)?.[1];
    if (fullDate) {
      const existing = days.get(fullDate) ?? { date_raw: fullDate, punches: [] };
      days.set(fullDate, existing);
      currentDay = existing;
      appendTimes(currentDay, line, { dropFirst: pageHasJornadaColumn, maxTimes: pageHasJornadaColumn ? 2 : 4 });
      continue;
    }

    const shortDay = line.match(shortDayRegex);
    if (shortDay) {
      const key = shortDay[1]!.padStart(2, "0");
      const existing = days.get(key) ?? { date_raw: buildDateRaw(shortDay[1]!, page.lines), punches: [] };
      days.set(key, existing);
      currentDay = existing;
      appendTimes(currentDay, line, { dropFirst: pageHasJornadaColumn, maxTimes: pageHasJornadaColumn ? 2 : 4 });
      continue;
    }

    if (currentDay && lineStartsWithTimeRegex.test(line)) appendTimes(currentDay, line, { maxTimes: 2 });
  }

  return {
    page: page.pageNumber,
    days: Array.from(days.values())
  };
}

function isVisionInput(pages: VisionTimeCardPage[] | ProcessedDocumentPage[]): pages is VisionTimeCardPage[] {
  return "days" in (pages[0] ?? {}) && "status" in (pages[0] ?? {});
}

export function parseCartaoPonto(pages: VisionTimeCardPage[] | ProcessedDocumentPage[]): CartaoPontoValue {
  if (!pages.length) return { pages: [] };
  if (isVisionInput(pages)) {
    return {
      pages: pages.map((page, index) => ({
        page: index + 1,
        days: page.days.map((day) => ({
          date_raw: day.date_raw,
          punches: toPunches(day.punches)
        }))
      }))
    };
  }

  return {
    pages: pages.map((page) => parseProcessedTimeCardPage(page))
  };
}
