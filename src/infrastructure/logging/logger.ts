export const logger = { event(event: "job_started" | "job_completed" | "job_failed", id: string) { console.info(JSON.stringify({ event, id })); } };
