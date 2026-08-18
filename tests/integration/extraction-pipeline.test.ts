jest.mock("@/infrastructure/pdf/native-text-extractor", () => ({ extractNativeText: jest.fn() }));
jest.mock("@/infrastructure/pdf/page-renderer", () => ({ renderPdfPages: jest.fn() }));
jest.mock("@/infrastructure/ocr/tesseract-js-adapter", () => ({ recognizePage: jest.fn() }));

import { parseCartaoPonto } from "@/lib/parsers/cartao-ponto-parser";
import { extractPages } from "@/lib/ocr/extract-pages";
import { extractNativeText } from "@/infrastructure/pdf/native-text-extractor";
import { renderPdfPages } from "@/infrastructure/pdf/page-renderer";
import { recognizePage } from "@/infrastructure/ocr/tesseract-js-adapter";

test("o pipeline preserva incerteza em vez de inventar caractere", () => { expect(parseCartaoPonto(["01/01/2020 ??:??"]).pages[0]?.days[0]?.punches[0]?.time_raw).toBe("??:??"); });

test("usa texto nativo como primeira opção e só faz OCR abaixo do limiar", async () => {
  const nativeShort = "x".repeat(49);
  const nativeLong = "texto nativo suficiente ".repeat(3);
  jest.mocked(extractNativeText).mockResolvedValue([nativeShort, nativeLong]);
  jest.mocked(renderPdfPages).mockResolvedValue(["page-1" as never, "page-2" as never]);
  jest.mocked(recognizePage).mockResolvedValue("ocr page 1 com texto suficiente para ultrapassar o limiar mínimo");

  await expect(extractPages(new Uint8Array([1, 2, 3]))).resolves.toEqual([
    "ocr page 1 com texto suficiente para ultrapassar o limiar mínimo",
    nativeLong
  ]);
  expect(renderPdfPages).toHaveBeenCalledTimes(1);
  expect(recognizePage).toHaveBeenCalledTimes(1);
  expect(recognizePage).toHaveBeenCalledWith("page-1");
});
