"use client";
import { Alert, Box } from "@mui/material";
import { useEffect, useState } from "react";
import { getPdf } from "@/components/upload/pdf-session";

export function ReviewSplitView({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    const file = getPdf(id);
    if (!file) return;
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [id]);
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) minmax(0, 1fr)" },
        gap: 2,
        minHeight: 0,
        flex: 1,
      }}
    >
      <Box
        sx={{
          minHeight: { xs: 420, md: 0 },
          height: "100%",
          border: 1,
          borderColor: "divider",
          borderRadius: 1,
          overflow: "hidden",
        }}
      >
        {url ? (
          <iframe
            title="PDF original"
            src={url}
            style={{
              width: "100%",
              height: "100%",
              minHeight: "100%",
              border: 0,
            }}
          />
        ) : (
          <Alert severity="info">
            A prévia local do PDF não está disponível nesta sessão. Reenvie o
            documento para compará-lo visualmente.
          </Alert>
        )}
      </Box>
      <Box
        sx={{
          minHeight: 0,
          height: "100%",
          overflow: "auto",
          border: 1,
          borderColor: "divider",
          borderRadius: 1,
          p: 2,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
