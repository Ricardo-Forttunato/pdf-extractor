/** @jest-environment node */
import { validatePdf } from "@/infrastructure/pdf/validate-pdf";
test("rejeita assinatura PDF falsificada e arquivo acima do limite", async () => { await expect(validatePdf(new TextEncoder().encode("não é PDF"))).rejects.toThrow("PDF"); await expect(validatePdf(new Uint8Array(10_485_761))).rejects.toThrow("10 MiB"); });
