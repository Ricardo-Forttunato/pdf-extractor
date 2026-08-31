import { createWorker } from "tesseract.js";
import { env } from "@/lib/env";
export async function recognizePage(image: Buffer): Promise<string> {
  const worker = await createWorker("por");
  try {
    const recognized = await Promise.race([
      worker.recognize(image),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("OCR timeout")), env.ocrTimeoutMs),
      ),
    ]);
    return recognized.data.text.replace(/[^\S\r\n]+/g, " ").trim();
  } finally {
    await worker.terminate();
  }
}
