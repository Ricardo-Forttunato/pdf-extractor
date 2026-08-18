import type { HoleriteBase, HoleriteField, HoleriteValue } from "@/domain/transcription/model";

const money = "(?:\\d{1,3}(?:\\.\\d{3})*|\\d+|[?.,]+),[0-9?]{2}";
const reference = "\\d+(?:[.,]\\d+)?";
const statementHeader = /^(?:Folha Normal|Adiantamento - PLR|13 Salario)$/i;
const monthNames = { jan: "01", fev: "02", mar: "03", abr: "04", mai: "05", jun: "06", jul: "07", ago: "08", set: "09", out: "10", nov: "11", dez: "12" } as const;
const monthLine = /M[eê]s\s*:\s*([a-zç]{3})-(\d{2})/i;
const competenceLine = /(?:compet[êe]ncia|m[eê]s)\s*[:\-]?\s*(\d{2}|\?{2})\D+(\d{4}|\?{4})/i;
const baseDefinitions = [
  { raw: "REMUNERAÇÃOMES", label: "REMUNERACAO MES" },
  { raw: "DIAS/HORASTRAB", label: "DIAS/HORAS TRAB" },
  { raw: "BASEDECALCULODOINSS", label: "BASE DE CALCULO DO INSS" },
  { raw: "BASEDECALCULODOIRF", label: "BASE DE CALCULO DO IRF" },
  { raw: "BASEDECALCULODOFGTS", label: "BASE DE CALCULO DO FGTS" },
  { raw: "VALORDOFGTS", label: "VALOR DO FGTS" },
  { raw: "TOT.RENDIMENTOS", label: "TOTAL RENDIMENTOS" },
  { raw: "TOTALDESCONTOS", label: "TOTAL DESCONTOS" },
  { raw: "SALARIOLIQUIDONOMES", label: "SALARIO LIQUIDO NO MES" },
  { raw: "VALORDOIRFARECOLHER", label: "VALOR DO IRF A RECOLHER" }
] as const;
const baseHeadPattern = baseDefinitions.map(({ raw }) => raw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
const fieldLine = new RegExp(`(?<!\\S)(\\d{1,4})\\s+(.+?)\\s+(?:((${reference}))\\s+)?(${money})(?=(?:\\s+(?:${baseHeadPattern})\\b)|(?:\\s+\\d{1,4}\\s+\\S)|$)`, "g");
const genericBaseLine = new RegExp(`^(.*?)\\s+(${money})\\s*$`);

function extractCompetence(lines: string[]) {
  for (const line of lines) {
    const named = line.match(monthLine);
    if (named) {
      const month = monthNames[named[1]!.toLowerCase() as keyof typeof monthNames] ?? "??";
      return { month, year: `20${named[2]}` };
    }
    const numeric = line.match(competenceLine);
    if (numeric) return { month: numeric[1] ?? "??", year: numeric[2] ?? "????" };
  }
  return { month: "??", year: "????" };
}

function splitStatements(pages: string[]) {
  const lines = pages.flatMap((page) => page.split(/\r?\n/).map((line) => line.trim()).filter(Boolean));
  const statements: string[][] = [];
  let current: string[] | undefined;
  let previous = "";
  for (const line of lines) {
    if (monthLine.test(line) || competenceLine.test(line)) {
      if (current?.length) statements.push(current);
      current = statementHeader.test(previous) ? [previous, line] : [line];
    } else if (current) current.push(line);
    previous = line;
  }
  if (current?.length) statements.push(current);
  return statements;
}

function parseLine(line: string) {
  const fields: Array<HoleriteField & { index: number }> = [];
  const bases: Array<HoleriteBase & { index: number }> = [];
  const masked = line.split("");
  for (const match of line.matchAll(fieldLine)) {
    const [value, code, label, , capturedReference, capturedValue] = match;
    if (!value || match.index === undefined) continue;
    fields.push({ index: match.index, code, label: label.trim(), reference: capturedReference ?? "", value: capturedValue });
    masked.splice(match.index, value.length, ..." ".repeat(value.length));
  }
  const residue = masked.join("");
  for (const definition of baseDefinitions) {
    const pattern = new RegExp(`${definition.raw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s+(${money})`, "g");
    for (const match of residue.matchAll(pattern)) {
      if (match.index === undefined) continue;
      bases.push({ index: match.index, label: definition.label, value: match[1]! });
    }
  }
  if (!fields.length && !bases.length) {
    const match = line.match(genericBaseLine);
    if (match) bases.push({ index: 0, label: match[1]!.trim(), value: match[2]! });
  }
  return { fields: fields.sort((left, right) => left.index - right.index), bases: bases.sort((left, right) => left.index - right.index) };
}

export function parseHolerite(pages: string[]): HoleriteValue {
  return { pages: splitStatements(pages).map((lines, index) => {
    const { month, year } = extractCompetence(lines);
    const fields: HoleriteField[] = [];
    const bases: HoleriteValue["pages"][number]["bases"] = [];
    for (const line of lines) {
      const parsed = parseLine(line);
      for (const field of parsed.fields) fields.push({ code: field.code, label: field.label, reference: field.reference, value: field.value });
      for (const base of parsed.bases) bases.push({ label: base.label, value: base.value });
    }
    return { page: index + 1, year, month, fields, bases };
  }) };
}
