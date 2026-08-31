import ExcelJS from "exceljs";
import type { TranscriptionValue } from "@/domain/transcription/model";
import {
  cartaoWarnings,
  holeriteWarnings,
  presentation,
} from "@/domain/warnings/derive-warnings";
import { cartaoExportModel } from "@/lib/exporters/cartao-export-model";
import { holeriteExportModel } from "@/lib/exporters/holerite-export-model";
import { colors } from "@/components/ui/tokens";
export async function toXlsx(value: TranscriptionValue): Promise<Buffer> {
  const cartao = value.pages.length === 0 || "days" in value.pages[0]!;
  const model = cartao
    ? cartaoExportModel(
        value as import("@/domain/transcription/model").CartaoPontoValue,
      )
    : holeriteExportModel(
        value as import("@/domain/transcription/model").HoleriteValue,
      );
  const warnings = cartao
    ? cartaoWarnings(
        value as import("@/domain/transcription/model").CartaoPontoValue,
      )
    : holeriteWarnings(
        value as import("@/domain/transcription/model").HoleriteValue,
      );
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Transcrição");
  const header = sheet.addRow(model.headers);
  header.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: `FF${colors.exportHeader.slice(1)}` },
    };
  });
  model.rows.forEach((row, rowIndex) => {
    const excelRow = sheet.addRow(model.headers.map((key) => row[key] ?? ""));
    const style = presentation(warnings[rowIndex] ?? []);
    if (style.fill)
      excelRow.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: `FF${style.fill!.slice(1)}` },
        };
      });
    if (style.firstCellLeftBorder)
      excelRow.getCell(1).border = {
        left: {
          style: "medium",
          color: { argb: `FF${style.firstCellLeftBorder.slice(1)}` },
        },
      };
  });
  sheet.columns.forEach((column) => {
    column.width = 18;
  });
  return Buffer.from(await workbook.xlsx.writeBuffer());
}
