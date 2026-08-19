import type { Metadata } from "next";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { theme } from "@/components/ui/theme";
export const metadata: Metadata = { title: "Quick Filler", description: "Transcrição de documentos trabalhistas" };
export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="pt-BR"><body><ThemeProvider theme={theme}><CssBaseline />{children}</ThemeProvider></body></html>; }
