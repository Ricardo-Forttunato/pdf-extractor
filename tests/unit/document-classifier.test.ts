import { classifyDocumentPage, countUsefulCharacters } from "@/lib/document-processing/document-classifier";

describe("classificador de página do documento", () => {
  it("ignora espaços e pontuação ao medir texto útil", () => {
    expect(countUsefulCharacters("  AB-12 / \n")).toBe(4);
  });

  it("classifica como scanned quando o texto nativo é insuficiente", () => {
    expect(classifyDocumentPage("")).toBe("scanned");
    expect(classifyDocumentPage("ponto")).toBe("scanned");
  });

  it("classifica como mixed quando há texto nativo parcial", () => {
    expect(classifyDocumentPage("12345678901234567890 texto parcial")).toBe("mixed");
  });

  it("classifica como native quando há texto nativo suficiente", () => {
    expect(classifyDocumentPage("A".repeat(80))).toBe("native");
  });
});
