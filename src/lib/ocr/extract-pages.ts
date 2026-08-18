import { buildDocumentPages } from "@/lib/document-processing/build-document-pages";

export async function extractPages(bytes: Uint8Array): Promise<Buffer[]> {
  const rendered = (await buildDocumentPages(bytes)).map((page) => page.image);
  if (!rendered.length) throw new Error("Não foi possível converter o PDF em imagens.");
  return rendered;
}
