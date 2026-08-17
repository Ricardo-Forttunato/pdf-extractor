"use client";
import { Alert, Box } from "@mui/material";
import { useEffect, useState } from "react";
import { getPdf } from "@/components/upload/pdf-session";
export function ReviewSplitView({ id, children }: { id: string; children: React.ReactNode }) { const [url, setUrl] = useState<string>(); useEffect(() => { const file = getPdf(id); if (!file) return; const next = URL.createObjectURL(file); setUrl(next); return () => URL.revokeObjectURL(next); }, [id]); return <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3, alignItems: "start" }}><Box>{url ? <iframe title="PDF original" src={url} style={{ width: "100%", minHeight: 650, border: 0 }} /> : <Alert severity="info">A prévia local do PDF não está disponível nesta sessão. Reenvie o documento para compará-lo visualmente.</Alert>}</Box><Box>{children}</Box></Box>; }
