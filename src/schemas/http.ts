import { z } from "zod";
import {
  cartaoValueSchema,
  holeriteValueSchema,
  transcriptionValueSchema,
} from "@/schemas/transcription";

export const createResponseSchema = z.object({ id: z.string().min(1) });
export const updateRequestSchema = z.object({
  value: transcriptionValueSchema,
});
export const getResponseSchema = z.union([
  z.object({
    id: z.string(),
    tipo: z.enum(["cartao-ponto", "holerite"]),
    status: z.literal("processando"),
    erro: z.null(),
    value: z.null(),
  }),
  z.object({
    id: z.string(),
    tipo: z.literal("cartao-ponto"),
    status: z.literal("concluido"),
    erro: z.null(),
    value: cartaoValueSchema,
  }),
  z.object({
    id: z.string(),
    tipo: z.literal("holerite"),
    status: z.literal("concluido"),
    erro: z.null(),
    value: holeriteValueSchema,
  }),
  z.object({
    id: z.string(),
    tipo: z.enum(["cartao-ponto", "holerite"]),
    status: z.literal("ILEGIVEL_PARA_REVISAO_MANUAL"),
    erro: z.string().min(1),
    value: z.null(),
  }),
  z.object({
    id: z.string(),
    tipo: z.enum(["cartao-ponto", "holerite"]),
    status: z.literal("erro"),
    erro: z.string().min(1),
    value: z.null(),
  }),
]);
export const exportFormatSchema = z.enum(["xlsx", "csv", "json"]);
