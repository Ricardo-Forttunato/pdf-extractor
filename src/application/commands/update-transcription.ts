import type {
  DocumentType,
  TranscriptionValue,
} from "@/domain/transcription/model";
import { validateTranscription } from "@/domain/transcription/validation";
import { transcriptionStore } from "@/infrastructure/storage/in-memory-transcription-store";
export function updateTranscription(
  id: string,
  type: DocumentType,
  value: TranscriptionValue,
) {
  const valid = validateTranscription(type, value);
  transcriptionStore.replace(id, valid);
}
