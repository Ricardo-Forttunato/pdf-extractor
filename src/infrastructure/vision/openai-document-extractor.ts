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

class OpenAiVisionConfigurationError extends Error {}
export class ManualReviewRequiredError extends Error {}

function ensureConfigured() {
  if (!env.openAiApiKey) throw new OpenAiVisionConfigurationError("OPENAI_API_KEY não configurada.");
}

function imageToDataUrl(image: Buffer) {
  return `data:image/png;base64,${image.toString("base64")}`;
}

function extractOutputText(payload: unknown): string {
  if (typeof payload !== "object" || !payload) throw new Error("Resposta inválida do modelo de visão.");
  const direct = (payload as { output_text?: unknown }).output_text;
  if (typeof direct === "string" && direct.trim()) return direct;
  const output = (payload as { output?: Array<{ content?: Array<{ type?: string; text?: string }> }> }).output ?? [];
  const text = output
    .flatMap((item) => item.content ?? [])
    .filter((content) => content.type === "output_text" || content.type === "text")
    .map((content) => content.text ?? "")
    .join("\n")
    .trim();
  if (!text) throw new Error("Resposta vazia do modelo de visão.");
  return text;
}

async function requestStructuredJson<T>(image: Buffer, prompt: string, schemaName: string, schema: Record<string, unknown>, parser: z.ZodSchema<T>): Promise<T> {
  ensureConfigured();
  const response = await fetch(`${env.openAiBaseUrl}/responses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.openAiApiKey}`
    },
    body: JSON.stringify({
      model: env.openAiVisionModel,
      input: [{
        role: "user",
        content: [
          { type: "input_text", text: prompt },
          { type: "input_image", image_url: imageToDataUrl(image), detail: "high" }
        ]
      }],
      text: {
        format: {
          type: "json_schema",
          name: schemaName,
          schema,
          strict: true
        }
      }
    })
  });
  if (!response.ok) throw new Error(`Falha no modelo de visão: ${response.status}`);
  const payload = await response.json();
  return parser.parse(JSON.parse(extractOutputText(payload)));
}

export async function extractPayrollPage(image: Buffer): Promise<VisionPayrollPage> {
  const result = await requestStructuredJson(
    image,
    [
      "Extraia um holerite brasileiro a partir desta imagem.",
      "A imagem pode conter documento escaneado, texto colorido, múltiplas colunas e mais de um demonstrativo na mesma página.",
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
  return error instanceof OpenAiVisionConfigurationError;
}
