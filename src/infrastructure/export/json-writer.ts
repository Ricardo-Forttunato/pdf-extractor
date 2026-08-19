import type { TranscriptionValue } from "@/domain/transcription/model";
export const toJson = (value: TranscriptionValue) => JSON.stringify(value, null, 2);
