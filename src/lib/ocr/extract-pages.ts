import { extractNativeText } from "@/infrastructure/pdf/native-text-extractor";
import { renderPdfPages } from "@/infrastructure/pdf/page-renderer";
import { recognizePage } from "@/infrastructure/ocr/tesseract-js-adapter";
const usable = (value: string) => value.replace(/\s/g, "").length >= 50;
export async function extractPages(bytes: Uint8Array): Promise<string[]> {
  const nativePages = await extractNativeText(bytes); const rendered = nativePages.some((page) => !usable(page)) ? await renderPdfPages(bytes) : [];
  const output = await Promise.all(nativePages.map(async (page, index) => usable(page) ? page : recognizePage(rendered[index]!)));
  if (output.some((page) => !usable(page))) throw new Error("Não foi possível ler todas as páginas do documento.");
  return output;
}
