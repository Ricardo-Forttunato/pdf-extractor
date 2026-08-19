import { env } from "@/lib/env";
import { loadPdf } from "@/infrastructure/pdf/pdfjs";

export class PdfValidationError extends Error {}
export async function validatePdf(bytes: Uint8Array): Promise<void> {
  if (!bytes.length || bytes.byteLength > env.maxUploadBytes) throw new PdfValidationError("O arquivo deve ser um PDF de até 10 MiB.");
  if (new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-") throw new PdfValidationError("Envie um arquivo PDF válido.");
  // pdfjs transfers its input buffer to its worker. Validate a copy so the
  // original upload remains available to the OCR job scheduled afterwards.
  try { const pdf = await loadPdf(bytes.slice()); if (!pdf.numPages) throw new Error("sem páginas"); }
  catch { throw new PdfValidationError("O PDF está corrompido, protegido ou não possui páginas."); }
}
