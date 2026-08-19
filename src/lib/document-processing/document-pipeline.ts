import { extractPageWithTesseract } from "@/infrastructure/ocr/tesseract-page-adapter";
import { buildDocumentPages } from "@/lib/document-processing/build-document-pages";
import { countUsefulCharacters } from "@/lib/document-processing/document-classifier";
import type { ProcessedDocumentPage } from "@/lib/document-processing/document-page";
import { assertPageCanBeProcessed } from "@/lib/document-processing/manual-review-policy";
import { normalizeOcrOutput, normalizePlainText } from "@/lib/document-processing/normalize-ocr-output";

function splitLines(text: string) {
  return text.split(/\r?\n/g).map((line) => line.trim()).filter(Boolean);
}

export async function runDocumentPipeline(bytes: Uint8Array): Promise<ProcessedDocumentPage[]> {
  const pages = await buildDocumentPages(bytes);
  const processed: ProcessedDocumentPage[] = [];

  for (const page of pages) {
    if (page.kind === "native") {
      const text = normalizePlainText(page.nativeText);
      processed.push({
        pageNumber: page.pageNumber,
        kind: page.kind,
        text,
        lines: splitLines(text)
      });
      continue;
    }

    const ocr = normalizeOcrOutput(await extractPageWithTesseract(page.image));
    const nativeText = normalizePlainText(page.nativeText);
    const preferNative = page.kind === "mixed" && countUsefulCharacters(nativeText) > countUsefulCharacters(ocr.text);
    const text = preferNative ? nativeText : ocr.text;
    const lines = preferNative ? splitLines(nativeText) : ocr.lines.map((line) => line.text);
    const result: ProcessedDocumentPage = {
      pageNumber: page.pageNumber,
      kind: page.kind,
      text,
      lines,
      averageConfidence: ocr.averageConfidence
    };
    assertPageCanBeProcessed(result);
    processed.push(result);
  }

  return processed;
}
