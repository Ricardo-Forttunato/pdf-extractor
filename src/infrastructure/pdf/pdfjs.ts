export async function loadPdf(data: Uint8Array) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs") as unknown as { getDocument: (source: { data: Uint8Array; disableWorker: boolean }) => { promise: Promise<PdfDocument> } };
  return pdfjs.getDocument({ data, disableWorker: true }).promise;
}
export interface PdfPage {
  getTextContent(): Promise<{ items: Array<{ str?: string; transform?: number[]; width?: number; hasEOL?: boolean }> }>;
  getViewport(options: { scale: number }): { width: number; height: number };
  render(options: { canvasContext: CanvasRenderingContext2D; viewport: { width: number; height: number } }): { promise: Promise<void> };
}
export interface PdfDocument { numPages: number; getPage(pageNumber: number): Promise<PdfPage>; }
