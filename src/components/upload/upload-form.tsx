"use client";
import {
  Alert,
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { rememberPdf } from "@/components/upload/pdf-session";
import { TranscriptionStatus } from "@/components/upload/transcription-status";
import type { DocumentType } from "@/domain/transcription/model";

export function UploadForm({ compact = false }: { compact?: boolean }) {
  const [file, setFile] = useState<File>();
  const [tipo, setTipo] = useState<DocumentType>("cartao-ponto");
  const [id, setId] = useState<string>();
  const [error, setError] = useState<string>();
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) {
      setError("Selecione um PDF.");
      return;
    }
    setError(undefined);
    const data = new FormData();
    data.set("arquivo", file);
    data.set("tipo", tipo);
    try {
      const response = await fetch("/api/transcricoes", {
        method: "POST",
        body: data,
      });
      const body = (await response.json()) as { id?: string; erro?: string };
      if (!response.ok || !body.id)
        throw new Error(body.erro ?? "Não foi possível enviar o documento.");
      rememberPdf(body.id, file);
      setId(body.id);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível enviar o documento.",
      );
    }
  };
  return (
    <Box
      component="form"
      onSubmit={submit}
      sx={compact ? { width: "100%" } : { maxWidth: 680 }}
    >
      <Stack spacing={compact ? 1 : 3}>
        {!compact && (
          <>
            <Typography variant="h4">Quick Filler</Typography>
            <Typography>
              Envie um cartão de ponto ou holerite em PDF para revisar e
              exportar.
            </Typography>
          </>
        )}
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1}
          sx={{ alignItems: { md: "center" } }}
        >
          <Button
            component="label"
            variant="outlined"
            sx={{
              justifyContent: "flex-start",
              minWidth: { md: 280 },
              maxWidth: { md: 420 },
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {file?.name ?? "Selecionar PDF"}
            <input
              hidden
              type="file"
              accept="application/pdf,.pdf"
              onChange={(event) => {
                setFile(event.target.files?.[0]);
                setId(undefined);
              }}
            />
          </Button>
          <FormControl size="small" sx={{ minWidth: 190 }}>
            <InputLabel id="tipo-label">Tipo</InputLabel>
            <Select
              labelId="tipo-label"
              label="Tipo"
              value={tipo}
              onChange={(event) => setTipo(event.target.value as DocumentType)}
            >
              <MenuItem value="cartao-ponto">Cartão de ponto</MenuItem>
              <MenuItem value="holerite">Holerite</MenuItem>
            </Select>
          </FormControl>
          <Button type="submit" variant="contained" disabled={Boolean(id)}>
            Processar
          </Button>
        </Stack>
        {error && <Alert severity="error">{error}</Alert>}
        {id && <TranscriptionStatus id={id} />}
      </Stack>
    </Box>
  );
}
