import { z } from "zod";
import { env } from "@/lib/env";
import { visionPayrollPageSchema, visionTimeCardPageSchema, type VisionPayrollPage, type VisionTimeCardPage } from "@/lib/document-processing/vision-contract";

const payrollSchemaJson = {
  type: "object",
  additionalProperties: false,
  properties: {
    statements: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          reference: { type: "string" },
          total_proventos: { type: "string" },
          total_descontos: { type: "string" },
          liquido_receber: { type: "string" },
          itens: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                code: { type: "string" },
                description: { type: "string" },
                type: { type: "string", enum: ["PROVENTO", "DESCONTO"] },
                reference: { type: "string" },
                value: { type: "string" }
              },
              required: ["code", "description", "type", "reference", "value"]
            }
          }
        },
        required: ["reference", "total_proventos", "total_descontos", "liquido_receber", "itens"]
      }
    }
  },
  required: ["statements"]
} as const;

const timeCardSchemaJson = {
  type: "object",
  additionalProperties: false,
  properties: {
    status: { type: "string", enum: ["OK", "ILEGIVEL_PARA_REVISAO_MANUAL"] },
    reason: { type: "string" },
    days: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          date_raw: { type: "string" },
          punches: { type: "array", items: { type: "string" } }
        },
        required: ["date_raw", "punches"]
      }
    }
  },
  required: ["status", "reason", "days"]
} as const;

class GeminiVisionConfigurationError extends Error {}
export class ManualReviewRequiredError extends Error {}
class GeminiVisionBlockedError extends Error {}

function ensureConfigured() {
  if (!env.geminiApiKey) throw new GeminiVisionConfigurationError("GEMINI_API_KEY não configurada.");
}

function imageToInlineData(image: Buffer) {
  return { mime_type: "image/png", data: image.toString("base64") };
}

const geminiSafetySettings = [
  { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
  { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
  { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
  { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" }
] as const;

function toGeminiSchema(schema: unknown): unknown {
  if (!schema || typeof schema !== "object") return schema;
  if (Array.isArray(schema)) return schema.map(toGeminiSchema);
  const source = schema as Record<string, unknown>;
  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(source)) {
    if (key === "additionalProperties") continue;
    if (key === "type" && typeof value === "string") {
      output.type = value.toUpperCase();
      continue;
    }
    if (key === "properties" && value && typeof value === "object" && !Array.isArray(value)) {
      output.properties = Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([propertyKey, propertyValue]) => [propertyKey, toGeminiSchema(propertyValue)]));
      continue;
    }
    if (key === "items") {
      output.items = toGeminiSchema(value);
      continue;
    }
    output[key] = toGeminiSchema(value);
  }
  return output;
}

function extractOutputText(payload: unknown): string {
  if (typeof payload !== "object" || !payload) throw new Error("Resposta inválida do modelo de visão.");
  const promptBlockReason = (payload as { promptFeedback?: { blockReason?: string } }).promptFeedback?.blockReason;
  if (promptBlockReason) throw new GeminiVisionBlockedError(`Prompt bloqueado pelo Gemini (${promptBlockReason}).`);
  const candidates = (payload as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> }; finishReason?: string; finishMessage?: string }> }).candidates ?? [];
  const blockedCandidate = candidates.find((candidate) => candidate.finishReason && candidate.finishReason !== "STOP" && candidate.finishReason !== "MAX_TOKENS");
  if (blockedCandidate?.finishReason && ["SAFETY", "RECITATION", "LANGUAGE", "BLOCKLIST", "PROHIBITED_CONTENT", "SPII", "IMAGE_SAFETY", "OTHER"].includes(blockedCandidate.finishReason)) {
    throw new GeminiVisionBlockedError(`Resposta bloqueada pelo Gemini (${blockedCandidate.finishReason}${blockedCandidate.finishMessage ? `: ${blockedCandidate.finishMessage}` : ""}).`);
  }
  const text = candidates
    .flatMap((candidate) => candidate.content?.parts ?? [])
    .map((part) => part.text ?? "")
    .join("\n")
    .trim();
  if (!text) throw new Error("Resposta vazia do modelo de visão.");
  return text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "").trim();
}

async function requestStructuredJson<T>(image: Buffer, prompt: string, schemaName: string, schema: Record<string, unknown>, parser: z.ZodSchema<T>): Promise<T> {
  ensureConfigured();
  const response = await fetch(`${env.geminiBaseUrl}/models/${env.geminiVisionModel}:generateContent?key=${env.geminiApiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      safetySettings: geminiSafetySettings,
      contents: [{
        parts: [
          { text: prompt },
          { inline_data: imageToInlineData(image) }
        ]
      }],
      generation_config: {
        response_mime_type: "application/json",
        response_schema: toGeminiSchema({
          title: schemaName,
          ...schema
        })
      }
    })
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Falha no modelo de visão: ${response.status}${body ? ` - ${body.slice(0, 600)}` : ""}`);
  }
  const payload = await response.json();
  try {
    return parser.parse(JSON.parse(extractOutputText(payload)));
  } catch (error) {
    if (error instanceof GeminiVisionBlockedError) throw new ManualReviewRequiredError(error.message);
    if (error instanceof SyntaxError || error instanceof z.ZodError) {
      throw new ManualReviewRequiredError("O provider de visão não retornou dados estruturados confiáveis.");
    }
    throw error;
  }
}

export async function extractPayrollPage(image: Buffer): Promise<VisionPayrollPage> {
  const result = await requestStructuredJson(
    image,
    [
      "Extraia um holerite brasileiro a partir desta imagem.",
      "A imagem pode conter documento escaneado, texto colorido, múltiplas colunas e mais de um demonstrativo na mesma página.",
      "Ignore completamente nomes, CPF, PIS, matrícula, endereço, assinatura, QR code e qualquer identificador pessoal ou sensível.",
      "Extraia somente referência, totais monetários e itens de proventos/descontos.",
      "Retorne todos os demonstrativos encontrados em statements.",
      "Para cada statement, preencha obrigatoriamente: reference, total_proventos, total_descontos, liquido_receber e itens.",
      "Cada item deve ser classificado em type PROVENTO ou DESCONTO.",
      "Preserve valores monetários observados no formato brasileiro quando possível."
    ].join(" "),
    "payroll_page_extraction",
    payrollSchemaJson,
    visionPayrollPageSchema
  );
  return {
    statements: result.statements.map((statement) => ({
      ...statement,
      itens: statement.itens.map((item) => ({
        ...item,
        code: item.code ?? "",
        reference: item.reference ?? ""
      }))
    }))
  };
}

export async function extractTimeCardPage(image: Buffer): Promise<VisionTimeCardPage> {
  const result = await requestStructuredJson(
    image,
    [
      "Extraia um cartão de ponto brasileiro a partir desta imagem.",
      "A imagem pode ser um escaneamento com ruído, baixa qualidade ou folha manuscrita.",
      "Ignore completamente nomes, CPF, matrícula, assinaturas e qualquer outro identificador pessoal ou sensível.",
      "Extraia somente datas e horários de batida observáveis.",
      "Retorne status OK somente quando for possível identificar dias e batidas com confiança suficiente.",
      "Se a imagem estiver ilegível ou não permitir extração estruturada confiável, retorne status ILEGIVEL_PARA_REVISAO_MANUAL e explique em reason.",
      "Em days, inclua somente batidas reais observadas. Ignore colunas fixas de jornada prevista."
    ].join(" "),
    "timecard_page_extraction",
    timeCardSchemaJson,
    visionTimeCardPageSchema
  );
  const normalized = { ...result, reason: result.reason ?? "" };
  if (normalized.status === "ILEGIVEL_PARA_REVISAO_MANUAL") throw new ManualReviewRequiredError(normalized.reason || "Documento ilegível para revisão manual.");
  return normalized;
}

export function isVisionConfigurationError(error: unknown): error is Error {
  return error instanceof GeminiVisionConfigurationError;
}
