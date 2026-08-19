"use client";
import { createTheme } from "@mui/material/styles";
import { colors } from "@/components/ui/tokens";
export { colors } from "@/components/ui/tokens";
export const theme = createTheme({ palette: { primary: { main: colors.exportHeader } }, components: { MuiTableCell: { styleOverrides: { head: { fontWeight: 700 } } } } });
