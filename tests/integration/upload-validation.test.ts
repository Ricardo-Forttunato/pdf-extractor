/** @jest-environment node */
jest.mock("@/infrastructure/pdf/pdfjs", () => ({
  loadPdf: jest.fn(async (bytes: Uint8Array) => {
    structuredClone(bytes.buffer, { transfer: [bytes.buffer as ArrayBuffer] });
    return { numPages: 1 };
  }),
}));
import { validatePdf } from "@/infrastructure/pdf/validate-pdf";
import { POST } from "@/app/api/transcricoes/route";
test("rejeita assinatura PDF falsificada e arquivo acima do limite", async () => {
  await expect(
    validatePdf(new TextEncoder().encode("não é PDF")),
  ).rejects.toThrow("PDF");
  await expect(validatePdf(new Uint8Array(10_485_761))).rejects.toThrow(
    "10 MiB",
  );
});
test("aceita arquivo multipart sem depender do global File", async () => {
  const data = new FormData();
  data.set(
    "arquivo",
    new Blob(["não é PDF"], { type: "application/pdf" }),
    "amostra.pdf",
  );
  data.set("tipo", "cartao-ponto");
  const response = await POST({ formData: async () => data } as Request);
  await expect(response.json()).resolves.toEqual({
    erro: "Envie um arquivo PDF válido.",
  });
});
test("preserva os bytes do PDF depois da validação", async () => {
  const bytes = new TextEncoder().encode("%PDF-1.7");
  const originalLength = bytes.byteLength;
  await validatePdf(bytes);
  expect(bytes.byteLength).toBe(originalLength);
  expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe("%PDF-");
});
