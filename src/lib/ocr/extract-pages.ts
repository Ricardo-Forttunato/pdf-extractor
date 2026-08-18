import { renderPdfPages } from "@/infrastructure/pdf/page-renderer";
export async function extractPages(bytes: Uint8Array): Promise<Buffer[]> {
  const rendered = await renderPdfPages(bytes);
  if (!rendered.length) throw new Error("Não foi possível converter o PDF em imagens.");
  return rendered;
}
