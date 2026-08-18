"use client";
import { Alert, Box, Button, Container, FormControl, InputLabel, MenuItem, Paper, Select, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { ExportFormat, GetTranscriptionResponse, TranscriptionValue } from "@/domain/transcription/model";
import { CartaoTable } from "@/components/review/cartao-table";
import { HoleriteTable } from "@/components/review/holerite-table";
import { ReviewSplitView } from "@/components/review/review-split-view";
import { UploadForm } from "@/components/upload/upload-form";

export default function ReviewPage() {
  const { id } = useParams<{ id: string }>(); const [response, setResponse] = useState<GetTranscriptionResponse>(); const [value, setValue] = useState<TranscriptionValue>(); const [message, setMessage] = useState<string>(); const [format, setFormat] = useState<ExportFormat>("xlsx");
  useEffect(() => { fetch(`/api/transcricoes/${id}`, { cache: "no-store" }).then((result) => result.json()).then((body: GetTranscriptionResponse) => { setResponse(body); if (body.status === "concluido") setValue(body.value); }).catch(() => setMessage("Não foi possível carregar a transcrição.")); }, [id]);
  const save = async () => { if (!value) return; const result = await fetch(`/api/transcricoes/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ value }) }); if (!result.ok) { const body = await result.json() as { erro?: string }; setMessage(body.erro ?? "A correção é inválida."); } else setMessage("Correções salvas."); };
  const toolbar = <Paper elevation={2} sx={{ p: 1.5, flexShrink: 0 }}><UploadForm compact /></Paper>;
  if (!response) return <Container maxWidth={false} sx={{ height: "100dvh", py: 1.5, display: "flex", flexDirection: "column", gap: 1.5 }}>{toolbar}<Typography sx={{ p: 2 }}>Carregando…</Typography></Container>;
  if (response.status !== "concluido" || !value) return <Container maxWidth={false} sx={{ height: "100dvh", py: 1.5, display: "flex", flexDirection: "column", gap: 1.5 }}>{toolbar}<Alert severity="error">{response.status === "erro" ? response.erro : "A transcrição ainda está sendo processada."}</Alert></Container>;
  const cartao = response.tipo === "cartao-ponto";
  return <Container maxWidth={false} sx={{ height: "100dvh", py: 1.5, display: "flex", flexDirection: "column", gap: 1.5, overflow: "hidden" }}>{toolbar}{message && <Alert severity={message === "Correções salvas." ? "success" : "error"} sx={{ flexShrink: 0 }}>{message}</Alert>}<Box sx={{ minHeight: 0, flex: 1, display: "flex", flexDirection: "column" }}><ReviewSplitView id={id}><Stack spacing={2}><Box sx={{ position: "sticky", top: -16, zIndex: 1, pt: 2, pb: 1.5, backgroundColor: "background.paper", borderBottom: 1, borderColor: "divider" }}><Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { sm: "center" } }}><Button variant="contained" onClick={save}>Salvar correções</Button><FormControl size="small" sx={{ minWidth: 150 }}><InputLabel id="formato-label">Arquivo</InputLabel><Select labelId="formato-label" label="Arquivo" value={format} onChange={(event) => setFormat(event.target.value as ExportFormat)}>{(["xlsx", "csv", "json"] as const).map((item) => <MenuItem key={item} value={item}>{item.toUpperCase()}</MenuItem>)}</Select></FormControl><Button component="a" variant="outlined" href={`/api/transcricoes/${id}/planilha?formato=${format}`}>Baixar arquivo</Button></Stack></Box><Typography variant="h6">Valores extraídos</Typography>{cartao ? <CartaoTable value={value as import("@/domain/transcription/model").CartaoPontoValue} onChange={setValue} /> : <HoleriteTable value={value as import("@/domain/transcription/model").HoleriteValue} onChange={setValue} />}</Stack></ReviewSplitView></Box></Container>;
}
