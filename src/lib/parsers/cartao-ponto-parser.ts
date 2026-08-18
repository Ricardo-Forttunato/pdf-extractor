import type { CartaoPontoValue, Punch } from "@/domain/transcription/model";
import type { VisionTimeCardPage } from "@/lib/document-processing/vision-contract";
import { isKnownValidTime } from "@/domain/transcription/validation";

export function parseCartaoPonto(pages: VisionTimeCardPage[]): CartaoPontoValue {
  return {
    pages: pages.map((page, index) => ({
      page: index + 1,
      days: page.days.map((day) => ({
        date_raw: day.date_raw,
        punches: day.punches.map((time, punchIndex): Punch => ({
          kind: punchIndex % 2 === 0 ? "IN" : "OUT",
          time_raw: time,
          time_hhmm: isKnownValidTime(time) ? time : time
        }))
      }))
    }))
  };
}
