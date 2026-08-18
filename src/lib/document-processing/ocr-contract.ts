export interface OcrLine {
  text: string;
  bbox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  confidence?: number;
}

export interface OcrPageResult {
  text: string;
  lines: OcrLine[];
  averageConfidence?: number;
}
