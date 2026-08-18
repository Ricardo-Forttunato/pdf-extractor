import { z } from "zod";

const observed = z.string().min(1);
export const punchSchema = z.object({ kind: z.enum(["IN", "OUT"]), time_raw: observed, time_hhmm: observed });
export const cartaoValueSchema = z.object({ pages: z.array(z.object({ page: z.number().int().positive(), days: z.array(z.object({ date_raw: observed, punches: z.array(punchSchema) })) })) });
export const holeriteFieldSchema = z.object({ code: z.string(), label: observed, reference: z.string(), value: observed, kind: z.enum(["PROVENTO", "DESCONTO"]) });
export const holeriteBaseSchema = z.object({ label: observed, value: observed });
export const holeriteValueSchema = z.object({ pages: z.array(z.object({ page: z.number().int().positive(), year: observed, month: observed, reference: observed, divergence_calculo: z.boolean(), fields: z.array(holeriteFieldSchema), bases: z.array(holeriteBaseSchema) })) });
export const transcriptionValueSchema = z.union([cartaoValueSchema, holeriteValueSchema]);
