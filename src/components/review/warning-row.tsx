import { TableRow } from "@mui/material";
import type { DerivedWarning } from "@/domain/warnings/model";
import { presentation } from "@/domain/warnings/derive-warnings";
export function WarningRow({
  warnings,
  children,
}: {
  warnings: DerivedWarning[];
  children: React.ReactNode;
}) {
  const style = presentation(warnings);
  return (
    <TableRow
      sx={{
        backgroundColor: style.fill ?? undefined,
        "& td:first-of-type": {
          borderLeft: style.firstCellLeftBorder
            ? `4px solid ${style.firstCellLeftBorder}`
            : undefined,
        },
      }}
      title={warnings.map((warning) => warning.message).join(" ")}
    >
      {children}
    </TableRow>
  );
}
