jest.mock("@/infrastructure/pdf/page-renderer", () => ({ renderPdfPages: jest.fn() }));

import { extractPages } from "@/lib/ocr/extract-pages";
import { renderPdfPages } from "@/infrastructure/pdf/page-renderer";

test("o pipeline converte sempre o PDF em imagens página por página", async () => {
  jest.mocked(renderPdfPages).mockResolvedValue([Buffer.from("page-1"), Buffer.from("page-2")]);

  await expect(extractPages(new Uint8Array([1, 2, 3]))).resolves.toEqual([Buffer.from("page-1"), Buffer.from("page-2")]);
  expect(renderPdfPages).toHaveBeenCalledTimes(1);
});
