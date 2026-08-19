import type { DocumentPageKind } from "@/lib/document-processing/document-page";

const nativeThreshold = 80;
const mixedThreshold = 20;

export function countUsefulCharacters(text: string) {
  return text.replace(/[^\p{L}\p{N}]+/gu, "").length;
}

export function classifyDocumentPage(nativeText: string): DocumentPageKind {
  const usefulCharacters = countUsefulCharacters(nativeText);
  if (usefulCharacters >= nativeThreshold) return "native";
  if (usefulCharacters >= mixedThreshold) return "mixed";
  return "scanned";
}
