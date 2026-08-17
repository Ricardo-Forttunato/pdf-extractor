export const logger = {
  event(event: "job_started" | "job_completed" | "job_failed", id: string, cause?: unknown) {
    const error = cause instanceof Error ? cause.message : cause === undefined ? undefined : String(cause);
    console.info(JSON.stringify({ event, id, ...(error ? { error } : {}) }));
  }
};
