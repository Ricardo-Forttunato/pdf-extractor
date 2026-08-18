import { z } from "zod";

const nonEmpty = z.string().trim().min(1);

export const visionPayrollItemSchema = z.object({
  code: z.string().default(""),
  description: nonEmpty,
  type: z.enum(["PROVENTO", "DESCONTO"]),
  reference: z.string().default(""),
  value: nonEmpty
});

export const visionPayrollStatementSchema = z.object({
  reference: nonEmpty,
  total_proventos: nonEmpty,
  total_descontos: nonEmpty,
  liquido_receber: nonEmpty,
  itens: z.array(visionPayrollItemSchema)
});

export const visionPayrollPageSchema = z.object({
  statements: z.array(visionPayrollStatementSchema)
});

export const visionTimeCardDaySchema = z.object({
  date_raw: nonEmpty,
  punches: z.array(nonEmpty)
});

export const visionTimeCardPageSchema = z.object({
  status: z.enum(["OK", "ILEGIVEL_PARA_REVISAO_MANUAL"]),
  reason: z.string().default(""),
  days: z.array(visionTimeCardDaySchema)
});

export type VisionPayrollPage = z.infer<typeof visionPayrollPageSchema>;
export type VisionPayrollStatement = z.infer<typeof visionPayrollStatementSchema>;
export type VisionTimeCardPage = z.infer<typeof visionTimeCardPageSchema>;
