import type { CartaoPontoValue, Punch } from "@/domain/transcription/model";
import { isKnownValidTime } from "@/domain/transcription/validation";

const fullDateLine = /\b((?:\d{2}|\?\?)\/(?:\d{2}|\?\?)\/(?:\d{4}|\?{4}))\b/;
const monthYearLine = /Mes\/Ano\s*:\s*(\d{1,2}|\?{1,2})\s*\/\s*(\d{4}|\?{4})/i;
const dayLine = /^(\d{1,2})\s*-\s*([A-ZÇ]{3})\b/i;
const observedTimeToken = /(?:[01]\d|2[0-3]|\?\?):(?:[0-5]\d|\?\?)/g;

function appendPunches(day: CartaoPontoValue["pages"][number]["days"][number], times: string[]) {
  for (const time of times) day.punches.push({
    kind: day.punches.length % 2 === 0 ? "IN" : "OUT",
    time_raw: time,
    time_hhmm: isKnownValidTime(time) ? time : time
  });
}

function punchTimesFromLine(line: string, dropSchedule: boolean) {
  const extracted = line.match(observedTimeToken) ?? [];
  const withoutSchedule = dropSchedule ? extracted.slice(1) : extracted;
  return withoutSchedule.length > 2 ? withoutSchedule.slice(0, 2) : withoutSchedule;
}

function buildDate(day: string, month: string, year: string) {
  if (!/^\d{1,2}$/.test(day) || !/^\d{1,2}$/.test(month) || !/^\d{4}$/.test(year)) return `${day.padStart(2, "?")}/${month.padStart(2, "?")}/${year.padEnd(4, "?")}`;
  return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
}

export function parseCartaoPonto(pages: string[]): CartaoPontoValue {
  return { pages: pages.map((text, index) => {
    const lines = text.split(/\r?\n/); const days = [] as CartaoPontoValue["pages"][number]["days"];
    const monthYear = text.match(monthYearLine);
    const month = monthYear?.[1] ?? "??";
    const year = monthYear?.[2] ?? "????";
    const byDate = new Map<string, (typeof days)[number]>();
    let currentDay: (typeof days)[number] | undefined;
    for (const line of lines) {
      const dateMatch = line.match(fullDateLine);
      if (dateMatch) {
        const punches: Punch[] = punchTimesFromLine(line, false).map((time, punchIndex) => ({ kind: punchIndex % 2 === 0 ? "IN" : "OUT", time_raw: time, time_hhmm: isKnownValidTime(time) ? time : time }));
        days.push({ date_raw: dateMatch[1], punches });
        currentDay = days[days.length - 1];
        continue;
      }
      const groupedDay = line.match(dayLine);
      if (groupedDay) {
        const date = buildDate(groupedDay[1]!, month, year);
        currentDay = byDate.get(date);
        if (!currentDay) {
          currentDay = { date_raw: date, punches: [] };
          byDate.set(date, currentDay);
          days.push(currentDay);
        }
        appendPunches(currentDay, punchTimesFromLine(line, true));
        continue;
      }
      if (!currentDay) continue;
      appendPunches(currentDay, punchTimesFromLine(line, false));
    }
    return { page: index + 1, days };
  }) };
}
