import { extractNativePageText } from "@/infrastructure/pdf/native-text-extractor";
import { renderPdfPage } from "@/infrastructure/pdf/page-renderer";
import { loadPdf } from "@/infrastructure/pdf/pdfjs";
import { classifyDocumentPage } from "@/lib/document-processing/document-classifier";
import type { DocumentPageInput } from "@/lib/document-processing/document-page";

export async function buildDocumentPages(bytes: Uint8Array): Promise<DocumentPageInput[]> {
  const pdf = await loadPdf(bytes);
  const pages: DocumentPageInput[] = [];

  for (let number = 1; number <= pdf.numPages; number += 1) {
    const page = await pdf.getPage(number);
    const nativeText = await extractNativePageText(page);
    const image = await renderPdfPage(page);
    pages.push({
      pageNumber: number,
      image,
      nativeText,
      kind: classifyDocumentPage(nativeText)
    });
  }

  if (!pages.length) throw new Error("Não foi possível montar as páginas do documento.");
  return pages;
}
