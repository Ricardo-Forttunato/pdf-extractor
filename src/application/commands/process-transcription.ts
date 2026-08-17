import type { DocumentType, TranscriptionValue } from "@/domain/transcription/model";
import { parseCartaoPonto } from "@/lib/parsers/cartao-ponto-parser";
import { parseHolerite } from "@/lib/parsers/holerite-parser";
import { extractPages } from "@/lib/ocr/extract-pages";
import { validateTranscription } from "@/domain/transcription/validation";
import { logger } from "@/infrastructure/logging/logger";
import { transcriptionStore } from "@/infrastructure/storage/in-memory-transcription-store";
let active = false; const pending: string[] = [];
async function run(id: string) {
  const job = transcriptionStore.get(id); if (!job) return;
  active = true; logger.event("job_started", id);
  try { const pages = await extractPages(job.sourcePdf); const parsed: TranscriptionValue = job.tipo === "cartao-ponto" ? parseCartaoPonto(pages) : parseHolerite(pages); transcriptionStore.complete(id, validateTranscription(job.tipo, parsed)); logger.event("job_completed", id); }
  catch { transcriptionStore.fail(id, "Não foi possível processar o documento com segurança."); logger.event("job_failed", id); }
  finally { active = false; const next = pending.shift(); if (next) void run(next); }
}
export function scheduleTranscription(id: string) { if (active) pending.push(id); else void run(id); }
export const parserFor = (type: DocumentType) => type === "cartao-ponto" ? parseCartaoPonto : parseHolerite;
