import type { TranscriptionValue } from "@/domain/transcription/model";
import { parseCartaoPonto } from "@/lib/parsers/cartao-ponto-parser";
import { parseHolerite } from "@/lib/parsers/holerite-parser";
import { extractPages } from "@/lib/ocr/extract-pages";
import { validateTranscription } from "@/domain/transcription/validation";
import { logger } from "@/infrastructure/logging/logger";
import { transcriptionStore } from "@/infrastructure/storage/in-memory-transcription-store";
import { extractPayrollPage, extractTimeCardPage, isVisionConfigurationError, ManualReviewRequiredError } from "@/infrastructure/vision/openai-document-extractor";
let active = false; const pending: string[] = [];
async function run(id: string) {
  const job = transcriptionStore.get(id); if (!job) return;
  active = true; logger.event("job_started", id);
  try {
    const pages = await extractPages(job.sourcePdf);
    if (job.tipo === "holerite") {
      const extracted = [];
      for (const page of pages) extracted.push(await extractPayrollPage(page));
      const parsed: TranscriptionValue = parseHolerite(extracted);
      transcriptionStore.complete(id, validateTranscription(job.tipo, parsed));
      logger.event("job_completed", id);
    } else {
      const extracted = [];
      for (const page of pages) extracted.push(await extractTimeCardPage(page));
      const parsed: TranscriptionValue = parseCartaoPonto(extracted);
      transcriptionStore.complete(id, validateTranscription(job.tipo, parsed));
      logger.event("job_completed", id);
    }
  }
  catch (cause) {
    if (cause instanceof ManualReviewRequiredError) {
      transcriptionStore.markManualReview(id, cause.message || "Documento ilegível para revisão manual.");
      logger.event("job_manual_review", id, cause);
    } else if (isVisionConfigurationError(cause)) {
      transcriptionStore.fail(id, "A integração de OCR/Vision não está configurada.");
      logger.event("job_failed", id, cause);
    } else {
      transcriptionStore.fail(id, "Não foi possível processar o documento com segurança.");
      logger.event("job_failed", id, cause);
    }
  }
  finally { active = false; const next = pending.shift(); if (next) void run(next); }
}
export function scheduleTranscription(id: string) { if (active) pending.push(id); else void run(id); }
