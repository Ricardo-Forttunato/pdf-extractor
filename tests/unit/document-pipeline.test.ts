/** @jest-environment node */
jest.mock("@/lib/document-processing/build-document-pages", () => ({ buildDocumentPages: jest.fn() }));
jest.mock("@/infrastructure/ocr/tesseract-page-adapter", () => ({ extractPageWithTesseract: jest.fn() }));

import { extractPageWithTesseract } from "@/infrastructure/ocr/tesseract-page-adapter";
import { buildDocumentPages } from "@/lib/document-processing/build-document-pages";
import { runDocumentPipeline } from "@/lib/document-processing/document-pipeline";
import { ManualReviewRequiredError } from "@/lib/document-processing/manual-review-policy";

describe("document pipeline", () => {
  it("usa texto nativo em páginas native e OCR em páginas scanned", async () => {
    jest.mocked(buildDocumentPages).mockResolvedValue([
      {
        pageNumber: 1,
        image: Buffer.from("img-1"),
        nativeText: "08 : 25\n1 . 234 , 56",
        kind: "native"
      },
      {
        pageNumber: 2,
        image: Buffer.from("img-2"),
        nativeText: "",
        kind: "scanned"
      }
    ]);
    jest.mocked(extractPageWithTesseract).mockResolvedValue({
      text: "10 : 15\n11 : 45",
      lines: [{ text: "10 : 15" }, { text: "11 : 45" }]
    });

    await expect(runDocumentPipeline(new Uint8Array([1, 2, 3]))).resolves.toEqual([
      {
        pageNumber: 1,
        kind: "native",
        text: "08:25\n1.234,56",
        lines: ["08:25", "1.234,56"]
      },
      {
        pageNumber: 2,
        kind: "scanned",
        text: "10:15\n11:45",
        lines: ["10:15", "11:45"],
        averageConfidence: undefined
      }
    ]);
  });

  it("prefere texto nativo em páginas mixed quando ele for mais rico", async () => {
    jest.mocked(buildDocumentPages).mockResolvedValue([{
      pageNumber: 1,
      image: Buffer.from("img-1"),
      nativeText: "referencia 08/2026 total 1.234,56",
      kind: "mixed"
    }]);
    jest.mocked(extractPageWithTesseract).mockResolvedValue({
      text: "1234",
      lines: [{ text: "1234" }]
    });

    await expect(runDocumentPipeline(new Uint8Array([1]))).resolves.toEqual([{
      pageNumber: 1,
      kind: "mixed",
      text: "referencia 08/2026 total 1.234,56",
      lines: ["referencia 08/2026 total 1.234,56"],
      averageConfidence: undefined
    }]);
  });

  it("marca revisão manual quando OCR não retorna conteúdo suficiente", async () => {
    jest.mocked(buildDocumentPages).mockResolvedValue([{
      pageNumber: 1,
      image: Buffer.from("img-1"),
      nativeText: "",
      kind: "scanned"
    }]);
    jest.mocked(extractPageWithTesseract).mockResolvedValue({
      text: "",
      lines: []
    });

    await expect(runDocumentPipeline(new Uint8Array([1]))).rejects.toThrow(ManualReviewRequiredError);
  });
});
