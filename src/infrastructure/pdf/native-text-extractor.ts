import { loadPdf, type PdfPage } from "@/infrastructure/pdf/pdfjs";

const rowTolerance = 2;
const gapForSpace = 1;

interface PositionedText {
  str: string;
  x: number;
  y: number;
  width: number;
}

function toLines(items: PositionedText[]) {
  const rows: Array<{ y: number; items: PositionedText[] }> = [];
  for (const item of items) {
    const row = rows.find((candidate) => Math.abs(candidate.y - item.y) <= rowTolerance);
    if (row) row.items.push(item);
    else rows.push({ y: item.y, items: [item] });
  }
  return rows
    .sort((left, right) => right.y - left.y)
    .map((row) => {
      const sorted = row.items.sort((left, right) => left.x - right.x);
      let text = "";
      let previousEnd = 0;
      for (const item of sorted) {
        const gap = item.x - previousEnd;
        if (text && gap > gapForSpace) text += " ";
        text += item.str;
        previousEnd = item.x + item.width;
      }
      return text.replace(/\s+/g, " ").trim();
    })
    .filter(Boolean);
}

export async function extractNativePageText(page: PdfPage): Promise<string> {
  const content = await page.getTextContent();
  const items = content.items
    .map((item) => ({ str: item.str?.trim() ?? "", x: item.transform?.[4] ?? 0, y: item.transform?.[5] ?? 0, width: item.width ?? 0 }))
    .filter((item) => item.str);
  return toLines(items).join("\n");
}

export async function extractNativeText(bytes: Uint8Array): Promise<string[]> {
  const pdf = await loadPdf(bytes); const pages: string[] = [];
  for (let number = 1; number <= pdf.numPages; number += 1) {
    pages.push(await extractNativePageText(await pdf.getPage(number)));
  }
  return pages;
}
