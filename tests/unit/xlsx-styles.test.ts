/** @jest-environment node */
import ExcelJS from "exceljs";
import { toXlsx } from "@/infrastructure/export/xlsx-writer";
test("XLSX aplica estilo do cabeçalho e alertas", async () => { const bytes = await toXlsx({ pages: [{ page: 1, days: [{ date_raw: "01/01/2020", punches: [{ kind: "IN", time_raw: "??:??", time_hhmm: "??:??" }] }] }] }); const workbook = new ExcelJS.Workbook(); await workbook.xlsx.load(bytes as never); const sheet = workbook.worksheets[0]!; expect(sheet.getCell("A1").font?.bold).toBe(true); expect((sheet.getCell("A2").fill as ExcelJS.FillPattern).fgColor?.argb).toBe("FFFFF3CD"); });
