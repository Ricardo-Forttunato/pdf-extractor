"use client";
import { Alert, Box, CircularProgress, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { GetTranscriptionResponse } from "@/domain/transcription/model";
export function TranscriptionStatus({ id }: { id: string }) {
  const [error, setError] = useState<string>();
  const router = useRouter();
  useEffect(() => {
    let stopped = false;
    let delay = 1000;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const response = await fetch(`/api/transcricoes/${id}`, {
          cache: "no-store",
        });
        const result = (await response.json()) as GetTranscriptionResponse;
        if (stopped) return;
        if (
          result.status === "concluido" ||
          result.status === "ILEGIVEL_PARA_REVISAO_MANUAL"
        ) {
          router.push(`/transcricoes/${id}`);
          return;
        }
        if (result.status === "erro") {
          setError(result.erro);
          return;
        }
        delay = Math.min(delay * 2, 3000);
        timer = setTimeout(poll, delay);
      } catch {
        if (!stopped) setError("Não foi possível acompanhar o processamento.");
      }
    };
    void poll();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [id, router]);
  return error ? (
    <Alert severity="error">{error}</Alert>
  ) : (
    <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
      <CircularProgress size={22} />
      <Typography role="status">Processando documento…</Typography>
    </Box>
  );
}
