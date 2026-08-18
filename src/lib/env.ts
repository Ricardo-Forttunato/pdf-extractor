const positiveInteger = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
};
const optionalString = (value: string | undefined) => value?.trim() || undefined;
export const env = {
  maxUploadBytes: positiveInteger(process.env.MAX_UPLOAD_BYTES, 10_485_760),
  retentionHours: positiveInteger(process.env.JOB_RETENTION_HOURS, 24),
  ocrTimeoutMs: positiveInteger(process.env.OCR_TIMEOUT_MS, 120_000),
  maxConcurrentOcrJobs: positiveInteger(process.env.MAX_CONCURRENT_OCR_JOBS, 1),
  openAiApiKey: optionalString(process.env.OPENAI_API_KEY),
  openAiVisionModel: optionalString(process.env.OPENAI_VISION_MODEL) ?? "gpt-5.5",
  openAiBaseUrl: optionalString(process.env.OPENAI_BASE_URL) ?? "https://api.openai.com/v1"
} as const;
