import { createOpaqueId } from "@/lib/ids";
import { validatePdf, PdfValidationError } from "@/infrastructure/pdf/validate-pdf";
import { transcriptionStore } from "@/infrastructure/storage/in-memory-transcription-store";
import { scheduleTranscription } from "@/application/commands/process-transcription";
export const runtime = "nodejs";
const error = (message: string, status = 400) => Response.json({ erro: message }, { status });
const isUploadedFile = (value: FormDataEntryValue | null): value is File =>
  typeof value === "object" && value !== null && typeof (value as Pick<Blob, "arrayBuffer">).arrayBuffer === "function";

export async function POST(request: Request) {
  try { const data = await request.formData(); const file = data.get("arquivo"); const tipo = data.get("tipo");
    // Do not use `instanceof File`: Node 18 does not expose File as a global,
    // although Next still supplies a file-like value from multipart form data.
    if (!isUploadedFile(file) || !["cartao-ponto", "holerite"].includes(String(tipo))) return error("Informe um PDF e o tipo de documento.");
    const bytes = new Uint8Array(await file.arrayBuffer()); await validatePdf(bytes); const id = createOpaqueId(); transcriptionStore.create(id, tipo as "cartao-ponto" | "holerite", bytes); scheduleTranscription(id); return Response.json({ id }, { status: 202 });
  } catch (cause) { return error(cause instanceof PdfValidationError ? cause.message : "Não foi possível receber o documento."); }
}
