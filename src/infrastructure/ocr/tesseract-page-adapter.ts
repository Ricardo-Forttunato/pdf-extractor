import { recognizePage } from "@/infrastructure/ocr/tesseract-js-adapter";
import type { OcrPageResult } from "@/lib/document-processing/ocr-contract";

function toLines(text: string) {
  return text
    .split(/\r?\n/g)
    .map((line) => line.replace(/[^\S\r\n]+/g, " ").trim())
    .filter(Boolean);
}

export async function extractPageWithTesseract(image: Buffer): Promise<OcrPageResult> {
  const text = await recognizePage(image);
  return {
    text,
    lines: toLines(text).map((line) => ({ text: line }))
  };
}
