import { createCanvas } from "@napi-rs/canvas";
import { loadPdf } from "@/infrastructure/pdf/pdfjs";
export async function renderPdfPages(bytes: Uint8Array): Promise<Buffer[]> {
  const pdf = await loadPdf(bytes); const images: Buffer[] = [];
  for (let number = 1; number <= pdf.numPages; number += 1) {
    const page = await pdf.getPage(number); const viewport = page.getViewport({ scale: 2 }); const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
    await page.render({ canvasContext: canvas.getContext("2d") as unknown as CanvasRenderingContext2D, viewport }).promise; images.push(canvas.toBuffer("image/png"));
  }
  return images;
}
