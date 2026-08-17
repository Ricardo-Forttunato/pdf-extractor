import type { CartaoPontoValue, Punch } from "@/domain/transcription/model";
import { isKnownValidTime } from "@/domain/transcription/validation";

const dateToken = /\b(?:\d{2}|\?\?)\/(?:\d{2}|\?\?)\/(?:\d{4}|\?{4})\b/g;
const timeToken = /(?:[0-2?][0-9?]):[0-5?][0-9?]/g;
export function parseCartaoPonto(pages: string[]): CartaoPontoValue {
  return { pages: pages.map((text, index) => {
    const lines = text.split(/\r?\n/); const days = [] as CartaoPontoValue["pages"][number]["days"];
    for (const line of lines) {
      const date = line.match(dateToken)?.[0]; if (!date) continue;
      const times = line.match(timeToken) ?? [];
      const punches: Punch[] = times.map((time, punchIndex) => ({ kind: punchIndex % 2 === 0 ? "IN" : "OUT", time_raw: time, time_hhmm: isKnownValidTime(time) ? time : time }));
      days.push({ date_raw: date, punches });
    }
    return { page: index + 1, days };
  }) };
}
