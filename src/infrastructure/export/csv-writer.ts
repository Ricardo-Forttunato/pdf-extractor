import type { TabularExport } from "@/lib/exporters/cartao-export-model";
const escape = (value: string) => /[",\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
export function toCsv(model: TabularExport): string { return [model.headers, ...model.rows.map((row) => model.headers.map((header) => row[header] ?? ""))].map((row) => row.map(escape).join(",")).join("\n"); }
