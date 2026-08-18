import { createCanvas } from "@napi-rs/canvas";
import { loadPdf, type PdfDocument, type PdfPage } from "@/infrastructure/pdf/pdfjs";

export async function renderPdfPage(page: PdfPage, scale = 2): Promise<Buffer> {
  const viewport = page.getViewport({ scale });
  const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
  await page.render({ canvasContext: canvas.getContext("2d") as unknown as CanvasRenderingContext2D, viewport }).promise;
  return canvas.toBuffer("image/png");
}

export async function renderPdfDocumentPages(pdf: PdfDocument): Promise<Buffer[]> {
  const images: Buffer[] = [];
  for (let number = 1; number <= pdf.numPages; number += 1) {
    images.push(await renderPdfPage(await pdf.getPage(number)));
  }
  return images;
}

export async function renderPdfPages(bytes: Uint8Array): Promise<Buffer[]> {
  return renderPdfDocumentPages(await loadPdf(bytes));
}
