import type { OcrLine, OcrPageResult } from "@/lib/document-processing/ocr-contract";

function normalizeTextValue(text: string) {
  return text
    .replace(/[^\S\r\n]+/g, " ")
    .replace(/(\d{1,2})\s*:\s*(\d{2})/g, "$1:$2")
    .replace(/(\d)\s*\.\s*(\d{3}\b)/g, "$1.$2")
    .replace(/(\d)\s*,\s*(\d{2}\b)/g, "$1,$2")
    .replace(/\s+\/\s+/g, "/")
    .replace(/\s+-\s+/g, " - ")
    .trim();
}

function normalizeLine(line: OcrLine): OcrLine {
  return {
    ...line,
    text: normalizeTextValue(line.text)
  };
}

export function normalizeOcrOutput(result: OcrPageResult): OcrPageResult {
  const lines = result.lines.map(normalizeLine).filter((line) => line.text);
  const text = lines.map((line) => line.text).join("\n").trim() || normalizeTextValue(result.text);
  return {
    ...result,
    text,
    lines
  };
}

export function normalizePlainText(text: string) {
  return text
    .split(/\r?\n/g)
    .map((line) => normalizeTextValue(line))
    .filter(Boolean)
    .join("\n");
}
