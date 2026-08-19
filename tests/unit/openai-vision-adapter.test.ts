/** @jest-environment node */
describe("openai vision adapter", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv, GEMINI_API_KEY: "test-key" };
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  test("extrai payroll estruturado da resposta json do modelo", async () => {
    const { extractPayrollPage } = await import("@/infrastructure/vision/openai-document-extractor");
    const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue(new Response(JSON.stringify({
      candidates: [{
        content: {
          parts: [{
            text: JSON.stringify({
              statements: [{
                reference: "01/2020",
                total_proventos: "100,00",
                total_descontos: "10,00",
                liquido_receber: "90,00",
                itens: []
              }]
            })
          }]
        }
      }]
    }), { status: 200 }));

    await expect(extractPayrollPage(Buffer.from("img"))).resolves.toEqual({
      statements: [{
        reference: "01/2020",
        total_proventos: "100,00",
        total_descontos: "10,00",
        liquido_receber: "90,00",
        itens: []
      }]
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [, options] = fetchSpy.mock.calls[0]!;
    const body = JSON.parse(String(options?.body));
    expect(body.contents[0].parts[1].inline_data).toEqual({
      mime_type: "image/png",
      data: Buffer.from("img").toString("base64")
    });
    expect(body.generation_config.response_mime_type).toBe("application/json");
    expect(body.generation_config.response_schema.type).toBe("OBJECT");
    expect(body.generation_config.response_schema.properties.statements.type).toBe("ARRAY");
    expect(body.safetySettings).toEqual([
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" }
    ]);
  });

  test("converte retorno ilegível do cartão em exceção de revisão manual", async () => {
    const { extractTimeCardPage, ManualReviewRequiredError } = await import("@/infrastructure/vision/openai-document-extractor");
    jest.spyOn(global, "fetch").mockResolvedValue(new Response(JSON.stringify({
      candidates: [{
        content: {
          parts: [{
            text: JSON.stringify({
              status: "ILEGIVEL_PARA_REVISAO_MANUAL",
              reason: "Folha manuscrita sem legibilidade suficiente.",
              days: []
            })
          }]
        }
      }]
    }), { status: 200 }));

    await expect(extractTimeCardPage(Buffer.from("img"))).rejects.toThrow(ManualReviewRequiredError);
  });

  test("converte bloqueio SPII do Gemini em exceção de revisão manual", async () => {
    const { extractTimeCardPage, ManualReviewRequiredError } = await import("@/infrastructure/vision/openai-document-extractor");
    jest.spyOn(global, "fetch").mockResolvedValue(new Response(JSON.stringify({
      candidates: [{
        finishReason: "SPII",
        finishMessage: "Sensitive Personally Identifiable Information detected."
      }]
    }), { status: 200 }));

    await expect(extractTimeCardPage(Buffer.from("img"))).rejects.toThrow(ManualReviewRequiredError);
  });

  test("converte resposta fora do schema em exceção de revisão manual", async () => {
    const { extractTimeCardPage, ManualReviewRequiredError } = await import("@/infrastructure/vision/openai-document-extractor");
    jest.spyOn(global, "fetch").mockResolvedValue(new Response(JSON.stringify({
      candidates: [{
        content: {
          parts: [{
            text: JSON.stringify({
              foo: "bar"
            })
          }]
        }
      }]
    }), { status: 200 }));

    await expect(extractTimeCardPage(Buffer.from("img"))).rejects.toThrow(ManualReviewRequiredError);
  });
});
