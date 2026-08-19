import { normalizeOcrOutput, normalizePlainText } from "@/lib/document-processing/normalize-ocr-output";

describe("normalização do OCR", () => {
  it("normaliza espaços e formatos de hora e moeda", () => {
    expect(normalizePlainText("08 : 25\n1 . 234 , 56")).toBe("08:25\n1.234,56");
  });

  it("normaliza as linhas estruturadas do OCR", () => {
    expect(normalizeOcrOutput({
      text: "08 : 25\n1 . 234 , 56",
      lines: [{ text: "08 : 25" }, { text: "1 . 234 , 56" }]
    })).toEqual({
      text: "08:25\n1.234,56",
      lines: [{ text: "08:25" }, { text: "1.234,56" }]
    });
  });
});
