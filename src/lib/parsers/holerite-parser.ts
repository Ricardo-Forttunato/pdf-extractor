import type { HoleriteField, HoleriteValue } from "@/domain/transcription/model";

const money = "(?:\\d{1,3}(?:\\.\\d{3})*|\\d+|[?.,]+),[0-9?]{2}";
const valueAtEnd = new RegExp(`(${money})\\s*$`);
const fieldLine = new RegExp(`^(?:(\\d{1,6})\\s+)?(.+?)\\s+(?:(\\d+(?:,\\d+)?)\\s+)?(${money})\\s*$`);
export function parseHolerite(pages: string[]): HoleriteValue {
  return { pages: pages.map((text, index) => {
    const competence = text.match(/(?:compet[êe]ncia|m[êe]s)\s*[:\-]?\s*(\d{2}|\?{2})\D+(\d{4}|\?{4})/i);
    const month = competence?.[1] ?? "??"; const year = competence?.[2] ?? "????";
    let basesSection = false; const fields: HoleriteField[] = []; const bases: HoleriteValue["pages"][number]["bases"] = [];
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim(); if (!line) continue;
      if (/^(?:base|totais?|valor\s+l[ií]quido)\b/i.test(line)) basesSection = true;
      const finalValue = line.match(valueAtEnd)?.[1]; if (!finalValue) continue;
      if (basesSection) { const label = line.replace(valueAtEnd, "").trim(); if (label) bases.push({ label, value: finalValue }); continue; }
      const match = line.match(fieldLine); if (!match) continue;
      fields.push({ code: match[1] ?? "", label: match[2].trim(), reference: match[3] ?? "", value: match[4] });
    }
    return { page: index + 1, year, month, fields, bases };
  }) };
}
