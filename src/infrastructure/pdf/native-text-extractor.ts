import { loadPdf } from "@/infrastructure/pdf/pdfjs";
export async function extractNativeText(bytes: Uint8Array): Promise<string[]> {
  const pdf = await loadPdf(bytes); const pages: string[] = [];
  for (let number = 1; number <= pdf.numPages; number += 1) { const content = await (await pdf.getPage(number)).getTextContent(); pages.push(content.items.map((item) => item.str ?? "").join(" ")); }
  return pages;
}
