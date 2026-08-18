jest.mock("@/lib/document-processing/build-document-pages", () => ({ buildDocumentPages: jest.fn() }));

import { extractPages } from "@/lib/ocr/extract-pages";
import { buildDocumentPages } from "@/lib/document-processing/build-document-pages";

test("o pipeline converte sempre o PDF em imagens página por página", async () => {
  jest.mocked(buildDocumentPages).mockResolvedValue([
    { pageNumber: 1, image: Buffer.from("page-1"), nativeText: "texto 1", kind: "native" },
    { pageNumber: 2, image: Buffer.from("page-2"), nativeText: "", kind: "scanned" }
  ]);

  await expect(extractPages(new Uint8Array([1, 2, 3]))).resolves.toEqual([Buffer.from("page-1"), Buffer.from("page-2")]);
  expect(buildDocumentPages).toHaveBeenCalledTimes(1);
});
