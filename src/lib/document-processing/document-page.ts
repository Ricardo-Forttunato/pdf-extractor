export type DocumentPageKind = "native" | "scanned" | "mixed";

export interface DocumentPageInput {
  pageNumber: number;
  image: Buffer;
  nativeText: string;
  kind: DocumentPageKind;
}

export interface ProcessedDocumentPage {
  pageNumber: number;
  kind: DocumentPageKind;
  text: string;
  lines: string[];
  averageConfidence?: number;
}
