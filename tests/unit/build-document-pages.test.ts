/** @jest-environment node */
jest.mock("@/infrastructure/pdf/pdfjs", () => ({ loadPdf: jest.fn() }));
jest.mock("@/infrastructure/pdf/page-renderer", () => ({ renderPdfPage: jest.fn() }));
jest.mock("@/infrastructure/pdf/native-text-extractor", () => ({ extractNativePageText: jest.fn() }));

import { buildDocumentPages } from "@/lib/document-processing/build-document-pages";
import { loadPdf } from "@/infrastructure/pdf/pdfjs";
import { renderPdfPage } from "@/infrastructure/pdf/page-renderer";
import { extractNativePageText } from "@/infrastructure/pdf/native-text-extractor";

describe("buildDocumentPages", () => {
  it("monta as páginas com imagem, texto nativo e classificação", async () => {
    const firstPage = { id: "page-1" };
    const secondPage = { id: "page-2" };
    jest.mocked(loadPdf).mockResolvedValue({
      numPages: 2,
      getPage: jest.fn(async (pageNumber: number) => pageNumber === 1 ? firstPage : secondPage)
    } as never);
    jest.mocked(extractNativePageText)
      .mockResolvedValueOnce("texto nativo suficiente ".repeat(5))
      .mockResolvedValueOnce("");
    jest.mocked(renderPdfPage)
      .mockResolvedValueOnce(Buffer.from("img-1"))
      .mockResolvedValueOnce(Buffer.from("img-2"));

    await expect(buildDocumentPages(new Uint8Array([1, 2, 3]))).resolves.toEqual([
      {
        pageNumber: 1,
        image: Buffer.from("img-1"),
        nativeText: "texto nativo suficiente ".repeat(5),
        kind: "native"
      },
      {
        pageNumber: 2,
        image: Buffer.from("img-2"),
        nativeText: "",
        kind: "scanned"
      }
    ]);
  });
});
