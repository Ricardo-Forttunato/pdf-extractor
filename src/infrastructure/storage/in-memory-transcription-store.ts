import type { DocumentType, GetTranscriptionResponse, TranscriptionJob, TranscriptionValue } from "@/domain/transcription/model";
import { env } from "@/lib/env";
export class InMemoryTranscriptionStore {
  private readonly jobs = new Map<string, TranscriptionJob>();
  create(id: string, tipo: DocumentType, sourcePdf: Uint8Array): TranscriptionJob { const now = new Date(); const job: TranscriptionJob = { id, tipo, status: "processando", erro: null, value: null, sourcePdf, createdAt: now, updatedAt: now, expiresAt: new Date(now.getTime() + env.retentionHours * 3_600_000) }; this.jobs.set(id, job); return job; }
  get(id: string): TranscriptionJob | undefined { const job = this.jobs.get(id); if (job && job.expiresAt <= new Date()) { this.jobs.delete(id); return undefined; } return job; }
  complete(id: string, value: TranscriptionValue) { const job = this.get(id); if (!job || job.status !== "processando") return; job.status = "concluido"; job.value = value; job.erro = null; job.updatedAt = new Date(); }
  fail(id: string, erro: string) { const job = this.get(id); if (!job || job.status !== "processando") return; job.status = "erro"; job.value = null; job.erro = erro; job.sourcePdf = new Uint8Array(); job.updatedAt = new Date(); }
  replace(id: string, value: TranscriptionValue) { const job = this.get(id); if (!job || job.status !== "concluido") throw new Error("A transcrição ainda não está disponível para edição."); job.value = value; job.updatedAt = new Date(); }
  response(id: string): GetTranscriptionResponse | undefined { const job = this.get(id); if (!job) return undefined; return { id: job.id, tipo: job.tipo, status: job.status, erro: job.erro, value: job.value } as GetTranscriptionResponse; }
  clearExpired() { for (const id of this.jobs.keys()) this.get(id); }
}
export const transcriptionStore = new InMemoryTranscriptionStore();
