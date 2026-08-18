/** @jest-environment node */
describe("openai vision adapter", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv, OPENAI_API_KEY: "test-key" };
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  test("extrai payroll estruturado da resposta json do modelo", async () => {
    const { extractPayrollPage } = await import("@/infrastructure/vision/openai-document-extractor");
    jest.spyOn(global, "fetch").mockResolvedValue(new Response(JSON.stringify({
      output_text: JSON.stringify({
        statements: [{
          reference: "01/2020",
          total_proventos: "100,00",
          total_descontos: "10,00",
          liquido_receber: "90,00",
          itens: []
        }]
      })
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
  });

  test("converte retorno ilegível do cartão em exceção de revisão manual", async () => {
    const { extractTimeCardPage, ManualReviewRequiredError } = await import("@/infrastructure/vision/openai-document-extractor");
    jest.spyOn(global, "fetch").mockResolvedValue(new Response(JSON.stringify({
      output_text: JSON.stringify({
        status: "ILEGIVEL_PARA_REVISAO_MANUAL",
        reason: "Folha manuscrita sem legibilidade suficiente.",
        days: []
      })
    }), { status: 200 }));

    await expect(extractTimeCardPage(Buffer.from("img"))).rejects.toThrow(ManualReviewRequiredError);
  });
});
