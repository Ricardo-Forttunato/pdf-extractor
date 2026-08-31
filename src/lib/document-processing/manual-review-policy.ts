import { countUsefulCharacters } from "@/lib/document-processing/document-classifier";
import type { ProcessedDocumentPage } from "@/lib/document-processing/document-page";
import type {
  DocumentType,
  TranscriptionValue,
} from "@/domain/transcription/model";
import { isKnownValidMonth } from "@/domain/transcription/validation";

export class ManualReviewRequiredError extends Error {}

export function assertPageCanBeProcessed(page: ProcessedDocumentPage) {
  const usefulCharacters = countUsefulCharacters(page.text);
  if (page.kind === "native") return;
  if (usefulCharacters >= 5) return;
  if (page.lines.some((line) => countUsefulCharacters(line) >= 3)) return;
  throw new ManualReviewRequiredError(
    `Página ${page.pageNumber} sem conteúdo legível suficiente para OCR.`,
  );
}

export function assertTranscriptionCanBeAutoCompleted(
  type: DocumentType,
  pages: ProcessedDocumentPage[],
  value: TranscriptionValue,
) {
  const scannedLikePages = pages.filter((page) => page.kind !== "native");
  if (!scannedLikePages.length) return;

  if (type === "cartao-ponto") {
    const parsed =
      value as import("@/domain/transcription/model").CartaoPontoValue;
    const totalDays = parsed.pages.reduce(
      (sum, page) => sum + page.days.length,
      0,
    );
    const totalPunches = parsed.pages.reduce(
      (sum, page) =>
        sum + page.days.reduce((inner, day) => inner + day.punches.length, 0),
      0,
    );
    const pagesWithDays = parsed.pages.filter(
      (page) => page.days.length > 0,
    ).length;
    const pagesWithPunches = parsed.pages.filter((page) =>
      page.days.some((day) => day.punches.length > 0),
    ).length;
    const threshold = Math.ceil(parsed.pages.length / 2);
    if (
      totalDays === 0 ||
      totalPunches === 0 ||
      pagesWithDays < threshold ||
      pagesWithPunches < threshold
    ) {
      throw new ManualReviewRequiredError(
        "O cartão de ponto digitalizado não gerou dados estruturados confiáveis.",
      );
    }
    return;
  }

  const parsed = value as import("@/domain/transcription/model").HoleriteValue;
  const validCompetences = parsed.pages.filter(
    (page) => /^\d{4}$/.test(page.year) && isKnownValidMonth(page.month),
  ).length;
  const pagesWithLiquido = parsed.pages.filter((page) =>
    page.bases.some((base) => base.label === "LIQUIDO A RECEBER"),
  ).length;
  const pagesWithEnoughFields = parsed.pages.filter(
    (page) => page.fields.length >= 2,
  ).length;
  const pagesWithRequiredBases = parsed.pages.filter((page) =>
    ["TOTAL PROVENTOS", "TOTAL DESCONTOS", "LIQUIDO A RECEBER"].every((label) =>
      page.bases.some((base) => base.label === label),
    ),
  ).length;
  const threshold = Math.ceil(parsed.pages.length / 2);

  if (
    validCompetences < threshold ||
    pagesWithLiquido < threshold ||
    pagesWithEnoughFields < threshold ||
    pagesWithRequiredBases < parsed.pages.length
  ) {
    throw new ManualReviewRequiredError(
      "O holerite digitalizado não gerou dados estruturados confiáveis.",
    );
  }
}
