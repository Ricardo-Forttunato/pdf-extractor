import type { HoleriteBase, HoleriteField, HoleritePage, HoleriteValue } from "@/domain/transcription/model";
import type { ProcessedDocumentPage } from "@/lib/document-processing/document-page";
import type { VisionPayrollPage, VisionPayrollStatement } from "@/lib/document-processing/vision-contract";

const monthByName = { jan: "01", fev: "02", mar: "03", abr: "04", mai: "05", jun: "06", jul: "07", ago: "08", set: "09", out: "10", nov: "11", dez: "12" } as const;
const moneyPattern = /-?\d{1,3}(?:\.\d{3})*,\d{2}/g;

const canonicalBaseMatchers = [
  { pattern: /BASE\s*DE\s*C[ÁA]LCULO\s*DO\s*INSS/i, label: "BASE DE CALCULO DO INSS" },
  { pattern: /TOTAL\s*(?:DE\s*)?(?:RENDIMENTOS|PROVENTOS|PROVENTOS\s*BRUTO|TOT\.?\s*RENDIMENTOS)/i, label: "TOTAL PROVENTOS" },
  { pattern: /TOTAL\s*DESCONTOS|PROVENTOS\s*RETIDOS/i, label: "TOTAL DESCONTOS" },
  { pattern: /SALA?R?I?O?\s*L[IÍ]QUIDO\s*NO\s*M[EÊ]S|L[IÍ]QUIDO\s*A\s*RECEBER|PROVENTOS\s*L[IÍ]QUIDOS|L[IÍ]Q[ÜU]IDO/i, label: "LIQUIDO A RECEBER" },
  { pattern: /VALOR\s*DO\s*FGTS|FGTS\s*DO\s*M[EÊ]S|PROVIS[ÃA]O\s*FGTS/i, label: "VALOR DO FGTS" },
  { pattern: /BASE\s*DE\s*C[ÁA]LCULO\s*DO\s*IRF|BASE\s*I\.?R\.?R\.?F\.?/i, label: "BASE DE CALCULO DO IRF" }
] as const;

function normalizeCompetence(reference: string) {
  const numeric = reference.match(/(\d{1,2})\D+(\d{4})/);
  if (numeric) return { month: numeric[1]!.padStart(2, "0"), year: numeric[2]! };
  const named = reference.match(/(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez|setembro|outubro|novembro|dezembro)[a-z]*[-/\s]*(\d{2,4})/i);
  if (named) {
    const year = named[2]!.length === 2 ? `20${named[2]}` : named[2]!;
    const key = named[1]!.slice(0, 3).toLowerCase() as keyof typeof monthByName;
    return { month: monthByName[key] ?? "??", year };
  }
  return { month: "??", year: "????" };
}

function parseMoney(value: string) {
  if (!/^-?[\d.]+,\d{2}$/.test(value.trim())) return undefined;
  return Number(value.replaceAll(".", "").replace(",", "."));
}

function normalizeMoney(value: string) {
  return value.replace(/^-/, "");
}

function hasCalculationDifference(totalProventos: string, totalDescontos: string, liquidoReceber: string) {
  const totalProventosNumber = parseMoney(totalProventos);
  const totalDescontosNumber = parseMoney(totalDescontos);
  const liquidoNumber = parseMoney(liquidoReceber);
  if (totalProventosNumber === undefined || totalDescontosNumber === undefined || liquidoNumber === undefined) return true;
  return Math.round((totalProventosNumber - totalDescontosNumber) * 100) !== Math.round(liquidoNumber * 100);
}

function statementToPage(statement: VisionPayrollStatement, index: number): HoleritePage {
  const { month, year } = normalizeCompetence(statement.reference);
  return {
    page: index + 1,
    year,
    month,
    reference: statement.reference,
    divergence_calculo: hasCalculationDifference(statement.total_proventos, statement.total_descontos, statement.liquido_receber),
    fields: statement.itens.map((item) => ({
      code: item.code,
      label: item.description,
      reference: item.reference,
      value: item.value,
      kind: item.type
    })),
    bases: [
      { label: "TOTAL PROVENTOS", value: statement.total_proventos },
      { label: "TOTAL DESCONTOS", value: statement.total_descontos },
      { label: "LIQUIDO A RECEBER", value: statement.liquido_receber }
    ]
  };
}

function createBaseMap() {
  return new Map<string, HoleriteBase>();
}

function setBase(bases: Map<string, HoleriteBase>, label: string, value: string) {
  bases.set(label, { label, value: normalizeMoney(value) });
}

function findCanonicalBasesInLine(line: string, bases: Map<string, HoleriteBase>) {
  for (const matcher of canonicalBaseMatchers) {
    if (!matcher.pattern.test(line)) continue;
    const value = [...line.matchAll(moneyPattern)].map((match) => match[0]).at(-1);
    if (value) setBase(bases, matcher.label, value);
  }
}

function buildPage(reference: string, fields: HoleriteField[], basesMap: Map<string, HoleriteBase>): HoleritePage {
  const totalProventos = basesMap.get("TOTAL PROVENTOS")?.value ?? "?,??";
  const totalDescontos = basesMap.get("TOTAL DESCONTOS")?.value ?? deriveDiscountTotal(fields) ?? "?,??";
  const liquidoReceber = basesMap.get("LIQUIDO A RECEBER")?.value ?? "?,??";
  if (!basesMap.has("TOTAL DESCONTOS") && totalDescontos !== "?,??") setBase(basesMap, "TOTAL DESCONTOS", totalDescontos);
  const { month, year } = normalizeCompetence(reference);
  return {
    page: 0,
    year,
    month,
    reference,
    divergence_calculo: hasCalculationDifference(totalProventos, totalDescontos, liquidoReceber),
    fields,
    bases: Array.from(basesMap.values())
  };
}

function deriveDiscountTotal(fields: HoleriteField[]) {
  let total = 0;
  for (const field of fields) {
    if (field.kind !== "DESCONTO") continue;
    total += parseMoney(field.value) ?? 0;
  }
  return total > 0 ? total.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : undefined;
}

function isDiscountLabel(label: string) {
  return /INSS|IRRF|IMPOSTO|ADIANTAMENTO|CONV\.|ODONTO|PREVI|CASSI|DESCONTO|VALE|SEGURO|REFEI[CÇ][AÃ]O|ASS\s*MEDICA/i.test(label);
}

function isStructuralLabel(label: string) {
  return /^(TOT|TOTAL|LIQ|L[IÍ]QUIDO|BASE|SAL[ÁA]RIO BASE\s*:|SAL[ÁA]RIO HORA\s*:|DEP\.)/i.test(label.trim());
}

function toField(code: string, label: string, reference: string, value: string, kind?: "PROVENTO" | "DESCONTO"): HoleriteField {
  return {
    code,
    label: label.trim(),
    reference: reference.trim(),
    value: normalizeMoney(value),
    kind: kind ?? (isDiscountLabel(label) || value.startsWith("-") ? "DESCONTO" : "PROVENTO")
  };
}

function parseEntrySegment(segment: string, side: "left" | "right"): HoleriteField | undefined {
  const trimmed = segment.replace(/[|]+/g, " ").replace(/\s+/g, " ").trim();
  if (!trimmed) return undefined;
  const codeMatch = trimmed.match(/^([/\dA-Z]{2,5})\s+(.*)$/);
  const code = codeMatch && /[\d/]/.test(codeMatch[1]!) ? codeMatch[1]! : "";
  const body = code ? codeMatch![2]! : trimmed;
  const moneyMatches = [...body.matchAll(moneyPattern)];
  if (!moneyMatches.length) return undefined;
  const reference = moneyMatches.length > 1 ? moneyMatches[moneyMatches.length - 2]![0] : "";
  const value = moneyMatches[moneyMatches.length - 1]![0];
  const description = body.slice(0, moneyMatches[0]!.index ?? 0).replace(/\s+/g, " ").trim();
  if (!description) return undefined;
  if (isStructuralLabel(description)) return undefined;
  return toField(code, description, reference, value, side === "right" ? "DESCONTO" : undefined);
}

function splitByCodeStarts(line: string) {
  const matches = [...line.matchAll(/(?:^|\s)(\d{2,4}|\/[A-Z0-9]{2,4})\s+[A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇ]/gi)];
  return matches.map((match) => (match.index ?? 0) + (match[0].startsWith(" ") ? 1 : 0));
}

function extractReference(lines: string[]) {
  const joined = lines.join("\n");
  const explicit = joined.match(/(?:M[EÊ]S\/ANO|M[EÊ]S|PER[IÍ]ODO|REFER[ÊE]NCIA|COMPET[ÊE]NCIA)\s*[:\-]?\s*((?:\d{1,2}\D+\d{4})|(?:(?:jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez|setembro|outubro|novembro|dezembro)[a-z]*[-/\s]*\d{2,4}))/i);
  if (explicit) return explicit[1]!.trim();
  const fallback = joined.match(/(?:\d{1,2}\/\d{4})|(?:(?:jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez|setembro|outubro|novembro|dezembro)[a-z]*[-/\s]*\d{2,4})/i);
  return fallback?.[0]?.trim() ?? "??/????";
}

function parseFichaFinanceiraPage(page: ProcessedDocumentPage): HoleritePage[] {
  const blocks: string[][] = [];
  let current: string[] = [];
  for (const line of page.lines) {
    if (/^Folha Normal$/i.test(line) && current.length) {
      blocks.push(current);
      current = [line];
      continue;
    }
    if (/Documento assinado/i.test(line)) break;
    if (/^Folha Normal$/i.test(line) || current.length) current.push(line);
  }
  if (current.length) blocks.push(current);

  return blocks.map((lines) => {
    const fields: HoleriteField[] = [];
    const bases = createBaseMap();
    const reference = extractReference(lines);

    for (const line of lines) {
      findCanonicalBasesInLine(line, bases);
      if (/^TOTALDESCONTOS/i.test(line)) {
        const value = line.match(moneyPattern)?.[0];
        if (value) setBase(bases, "TOTAL DESCONTOS", value);
        continue;
      }
      if (/^TOT\.?RENDIMENTOS/i.test(line)) {
        const value = line.match(moneyPattern)?.[0];
        if (value) setBase(bases, "TOTAL PROVENTOS", value);
      }

      const baseAnchors = canonicalBaseMatchers
        .map((matcher) => ({ matcher, index: line.search(matcher.pattern) }))
        .filter((entry) => entry.index >= 0)
        .sort((left, right) => left.index - right.index);
      const lineWithoutBase = baseAnchors.length ? line.slice(0, baseAnchors[0]!.index).trim() : line;
      const codeStarts = splitByCodeStarts(lineWithoutBase);

      if (codeStarts.length >= 2) {
        const left = parseEntrySegment(lineWithoutBase.slice(0, codeStarts[1]!), "left");
        const right = parseEntrySegment(lineWithoutBase.slice(codeStarts[1]!), "right");
      if (left && !/^TOT\.?RENDIMENTOS|^TOTALDESCONTOS/i.test(left.label)) fields.push(left);
      if (right) fields.push(right);
        continue;
      }

      if (codeStarts.length === 1 && codeStarts[0]! > 0) {
        const left = parseEntrySegment(lineWithoutBase.slice(0, codeStarts[0]!), "left");
        const right = parseEntrySegment(lineWithoutBase.slice(codeStarts[0]!), "right");
      if (left && !/^TOT\.?RENDIMENTOS|^TOTALDESCONTOS/i.test(left.label)) fields.push(left);
      if (right) fields.push(right);
        continue;
      }

      const single = parseEntrySegment(lineWithoutBase, "left");
      if (single && !canonicalBaseMatchers.some((matcher) => matcher.pattern.test(single.label))) fields.push(single);
    }

    return buildPage(reference, fields, bases);
  });
}

function parseDeclaracaoPage(page: ProcessedDocumentPage): HoleritePage[] {
  const blocks: string[][] = [];
  let current: string[] = [];
  for (const line of page.lines) {
    if (/^M[êe]s\/Ano:/i.test(line) && current.length) {
      blocks.push(current);
      current = [line];
      continue;
    }
    if (/Impresso por|Documento assinado/i.test(line)) break;
    if (/^M[êe]s\/Ano:/i.test(line) || current.length) current.push(line);
  }
  if (current.length) blocks.push(current);

  return blocks.map((lines) => {
    const reference = extractReference(lines);
    const fields: HoleriteField[] = [];
    const bases = createBaseMap();

    for (const line of lines) {
      const baseGross = line.match(/Proventos\s*Bruto:\s*(-?\d{1,3}(?:\.\d{3})*,\d{2})/i);
      if (baseGross) setBase(bases, "TOTAL PROVENTOS", baseGross[1]!);
      const baseNet = line.match(/Proventos\s*L[ií]quidos?:\s*(-?\d{1,3}(?:\.\d{3})*,\d{2})/i);
      if (baseNet) setBase(bases, "LIQUIDO A RECEBER", baseNet[1]!);
      const fgts = line.match(/Provis[ãa]o\s*FGTS:\s*(-?\d{1,3}(?:\.\d{3})*,\d{2})/i);
      if (fgts) setBase(bases, "VALOR DO FGTS", fgts[1]!);

      const item = line.match(/^([/\dA-Z]{2,5})\s+(.+?)\s+(-?\d{1,3}(?:\.\d{3})*,\d{2})(?:\s+(-?\d{1,3}(?:\.\d{3})*,\d{2}))?$/i);
      if (!item) continue;
      const code = item[1]!;
      const label = item[2]!;
      const referenceValue = item[4] ? item[3]! : "";
      const value = item[4] ?? item[3]!;
      if (!isStructuralLabel(label)) fields.push(toField(code, label, referenceValue, value));
    }

    return buildPage(reference, fields, bases);
  });
}

function parseDemonstrativoPage(page: ProcessedDocumentPage): HoleritePage[] {
  const reference = extractReference(page.lines);
  const fields: HoleriteField[] = [];
  const bases = createBaseMap();

  for (const line of page.lines) {
    const total = line.match(/^Total\s+(\d{1,3}(?:\.\d{3})*,\d{2})\s+(\d{1,3}(?:\.\d{3})*,\d{2})/i);
    if (total) {
      setBase(bases, "TOTAL PROVENTOS", total[1]!);
      setBase(bases, "TOTAL DESCONTOS", total[2]!);
      continue;
    }
    const liquid = line.match(/L[ií][qüu]ido\s+(\d{1,3}(?:\.\d{3})*,\d{2})/i);
    if (liquid) {
      setBase(bases, "LIQUIDO A RECEBER", liquid[1]!);
      continue;
    }
    const inss = line.match(/Base\s*I\.?N\.?S\.?S\.?\s*:\s*(\d{1,3}(?:\.\d{3})*,\d{2})/i);
    if (inss) setBase(bases, "BASE DE CALCULO DO INSS", inss[1]!);
    const fgts = line.match(/F\.?G\.?T\.?S\.?\s*do\s*M[eê]s\s*:\s*(\d{1,3}(?:\.\d{3})*,\d{2})/i);
    if (fgts) setBase(bases, "VALOR DO FGTS", fgts[1]!);
    const irrf = line.match(/Base\s*I\.?R\.?R\.?F\.?\s*:\s*(\d{1,3}(?:\.\d{3})*,\d{2})/i);
    if (irrf) setBase(bases, "BASE DE CALCULO DO IRF", irrf[1]!);

      const item = line.match(/^([/\dA-Z]{2,5})\s+(.+?)\s+(-?\d{1,3}(?:\.\d{3})*,\d{2})(?:\s+(-?\d{1,3}(?:\.\d{3})*,\d{2}))?$/i);
      if (!item) continue;
    const code = item[1]!;
    const label = item[2]!;
    const referenceValue = item[4] ? item[3]! : "";
    const value = item[4] ?? item[3]!;
      if (!isStructuralLabel(label)) fields.push(toField(code, label, referenceValue, value));
  }

  return [buildPage(reference, fields, bases)];
}

function parseReciboPage(page: ProcessedDocumentPage): HoleritePage[] {
  const blocks: string[][] = [];
  let current: string[] = [];
  for (const line of page.lines) {
    if (/Recibo de Pagamento/i.test(line) && current.length) {
      blocks.push(current);
      current = [line];
      continue;
    }
    if (/PJE assinado/i.test(line)) break;
    if (/Recibo de Pagamento/i.test(line) || current.length) current.push(line);
  }
  if (current.length) blocks.push(current);

  return blocks.map((lines) => {
    const fields: HoleriteField[] = [];
    const bases = createBaseMap();
    const reference = extractReference(lines);

    for (const line of lines) {
      findCanonicalBasesInLine(line, bases);
      if (/OTAL\s+DE\s+PROVENTOS/i.test(line)) {
        const values = [...line.matchAll(moneyPattern)].map((match) => match[0]);
        if (values[0]) setBase(bases, "TOTAL PROVENTOS", values[0]);
        if (values[1]) setBase(bases, "TOTAL DESCONTOS", values[1]);
        continue;
      }
      if (/OTAL\s+DE\s+DESCONTOS/i.test(line)) {
        const values = [...line.matchAll(moneyPattern)].map((match) => match[0]);
        if (values[0]) setBase(bases, "TOTAL DESCONTOS", values[0]);
        continue;
      }
      if (/[ÍI]QUIDO\s+A\s+RECEBER/i.test(line)) {
        const values = [...line.matchAll(moneyPattern)].map((match) => match[0]);
        if (values[0]) setBase(bases, "LIQUIDO A RECEBER", values[0]);
        continue;
      }
      const allMoney = [...line.matchAll(moneyPattern)].map((match) => match[0]);
      if (!allMoney.length) continue;

      if (/L[IÍ]QUIDO A RECEBER/i.test(line) && allMoney[0]) setBase(bases, "LIQUIDO A RECEBER", allMoney[0]);

      const clean = line.replace(/[|]+/g, " ").replace(/\s+/g, " ").trim();
      if (/TOTAL DE PROVENTOS|TOTAL DE DESCONTOS|L[IÍ]QUIDO A RECEBER/i.test(clean)) continue;
      if (/sal[áa]rio Base|sal\. Contrib\. INSS|Base C[áa]lc\. FGTS|FGTS M[eê]s|Base C[áa]lc\. IRRF/i.test(clean)) {
        const values = [...clean.matchAll(moneyPattern)].map((match) => match[0]);
        if (values[1]) setBase(bases, "BASE DE CALCULO DO INSS", values[1]!);
        if (values[3]) setBase(bases, "VALOR DO FGTS", values[3]!);
        if (values[4]) setBase(bases, "BASE DE CALCULO DO IRF", values[4]!);
        continue;
      }

      if (allMoney.length >= 2) {
        const firstMoneyIndex = clean.indexOf(allMoney[0]!);
        const secondMoneyIndex = clean.indexOf(allMoney[1]!, firstMoneyIndex + allMoney[0]!.length);
        const leftLabel = clean.slice(0, firstMoneyIndex).replace(/^[-–—]+/, "").trim();
        const between = clean.slice(firstMoneyIndex + allMoney[0]!.length, secondMoneyIndex).replace(/^[-–—]+/, "").trim();
        if (leftLabel && !isStructuralLabel(leftLabel)) fields.push(toField("", leftLabel, "", allMoney[0]!));
        if (between && !isStructuralLabel(between)) fields.push(toField("", between, "", allMoney[1]!, "DESCONTO"));
        continue;
      }

      if (allMoney.length === 1) {
        const label = clean.slice(0, clean.indexOf(allMoney[0]!)).replace(/^[-–—]+/, "").trim();
        if (label && !isStructuralLabel(label)) fields.push(toField("", label, "", allMoney[0]!));
      }
    }

    return buildPage(reference, fields, bases);
  });
}

function parseGenericProcessedPage(page: ProcessedDocumentPage): HoleritePage[] {
  const reference = extractReference(page.lines);
  const fields: HoleriteField[] = [];
  const bases = createBaseMap();

  for (const line of page.lines) {
    findCanonicalBasesInLine(line, bases);
    if (canonicalBaseMatchers.some((matcher) => matcher.pattern.test(line))) continue;
    const field = parseEntrySegment(line, "left");
    if (field) fields.push(field);
  }

  return [buildPage(reference, fields, bases)];
}

function parseProcessedPayrollPage(page: ProcessedDocumentPage): HoleritePage[] {
  const joined = page.lines.join("\n");
  if (/FICHAFINANCEIRA-PERIODO/i.test(joined)) return parseFichaFinanceiraPage(page);
  if (/Declara[çc][ãa]o Remunera[çc][ãa]o - Folha de Pagamento/i.test(joined)) return parseDeclaracaoPage(page);
  if (/DEMONSTRATIVO D E? P A G A M E N T O|DEMONSTRATIVO DE PAGAMENTO MENSAL/i.test(joined)) return parseDemonstrativoPage(page);
  if (/Recibo de Pagamento/i.test(joined)) return parseReciboPage(page);
  return parseGenericProcessedPage(page);
}

function isVisionInput(pages: VisionPayrollPage[] | ProcessedDocumentPage[]): pages is VisionPayrollPage[] {
  return "statements" in (pages[0] ?? {});
}

export function parseHolerite(pages: VisionPayrollPage[] | ProcessedDocumentPage[]): HoleriteValue {
  if (!pages.length) return { pages: [] };
  if (isVisionInput(pages)) {
    const statements = pages.flatMap((page) => page.statements);
    return {
      pages: statements.map((statement, index) => statementToPage(statement, index))
    };
  }

  const parsedPages = pages.flatMap((page) => parseProcessedPayrollPage(page));
  return {
    pages: parsedPages.map((page, index) => ({ ...page, page: index + 1 }))
  };
}
