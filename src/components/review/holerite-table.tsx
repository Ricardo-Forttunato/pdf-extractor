"use client";
import {
  Alert,
  Box,
  Button,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import type { HoleriteValue } from "@/domain/transcription/model";
import { holeriteWarnings } from "@/domain/warnings/derive-warnings";
import { WarningRow } from "@/components/review/warning-row";

export function HoleriteTable({
  value,
  onChange,
}: {
  value: HoleriteValue;
  onChange: (value: HoleriteValue) => void;
}) {
  const warnings = holeriteWarnings(value);
  return (
    <Stack spacing={2} aria-label="Transcrição de holerite">
      <Box>
        <Button
          variant="outlined"
          onClick={() =>
            onChange({
              pages: [
                ...value.pages,
                {
                  page: value.pages.length + 1,
                  month: "",
                  year: "",
                  reference: "",
                  divergence_calculo: false,
                  fields: [
                    {
                      code: "",
                      label: "",
                      reference: "",
                      value: "",
                      kind: "PROVENTO",
                    },
                  ],
                  bases: [{ label: "", value: "" }],
                },
              ],
            })
          }
        >
          Adicionar página
        </Button>
      </Box>
      {value.pages.map((page, pageIndex) => (
        <Paper key={page.page} variant="outlined">
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            sx={{
              alignItems: { sm: "center" },
              px: 2,
              py: 1.25,
              borderBottom: 1,
              borderColor: "divider",
            }}
          >
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Página {page.page}
              </Typography>
              <TextField
                fullWidth
                label="Referência"
                value={page.reference}
                onChange={(event) => {
                  const next = structuredClone(value);
                  next.pages[pageIndex]!.reference = event.target.value;
                  onChange(next);
                }}
                size="small"
                sx={{ mt: 1, maxWidth: 260 }}
              />
            </Box>
            <TextField
              label="Mês"
              value={page.month}
              onChange={(event) => {
                const next = structuredClone(value);
                next.pages[pageIndex]!.month = event.target.value;
                onChange(next);
              }}
              size="small"
            />
            <TextField
              label="Ano"
              value={page.year}
              onChange={(event) => {
                const next = structuredClone(value);
                next.pages[pageIndex]!.year = event.target.value;
                onChange(next);
              }}
              size="small"
            />
          </Stack>
          {page.divergence_calculo && (
            <Alert severity="warning" sx={{ m: 2, mb: 0 }}>
              Divergência de cálculo detectada: líquido diferente de proventos
              menos descontos.
            </Alert>
          )}
          <Table size="small">
            <TableBody>
              <WarningRow warnings={warnings[pageIndex] ?? []}>
                <TableCell colSpan={5} sx={{ p: 0, border: 0 }}>
                  <Stack spacing={2} sx={{ p: 2 }}>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                      <Button
                        size="small"
                        onClick={() => {
                          const next = structuredClone(value);
                          next.pages[pageIndex]!.fields.push({
                            code: "",
                            label: "",
                            reference: "",
                            value: "",
                            kind: "PROVENTO",
                          });
                          onChange(next);
                        }}
                      >
                        Adicionar verba
                      </Button>
                      <Button
                        size="small"
                        onClick={() => {
                          const next = structuredClone(value);
                          next.pages[pageIndex]!.bases.push({
                            label: "",
                            value: "",
                          });
                          onChange(next);
                        }}
                      >
                        Adicionar base
                      </Button>
                    </Stack>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Tipo</TableCell>
                          <TableCell>Código</TableCell>
                          <TableCell>Descrição</TableCell>
                          <TableCell>Referência</TableCell>
                          <TableCell>Valor</TableCell>
                          <TableCell>Ações</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {page.fields.map((field, fieldIndex) => (
                          <TableRow key={fieldIndex}>
                            <TableCell>
                              <TextField
                                select
                                fullWidth
                                label="Tipo"
                                value={field.kind}
                                onChange={(event) => {
                                  const next = structuredClone(value);
                                  next.pages[pageIndex]!.fields[
                                    fieldIndex
                                  ]!.kind = event.target.value as
                                    | "PROVENTO"
                                    | "DESCONTO";
                                  onChange(next);
                                }}
                                size="small"
                              >
                                <MenuItem value="PROVENTO">PROVENTO</MenuItem>
                                <MenuItem value="DESCONTO">DESCONTO</MenuItem>
                              </TextField>
                            </TableCell>
                            <TableCell>
                              <TextField
                                fullWidth
                                label="Código"
                                value={field.code}
                                onChange={(event) => {
                                  const next = structuredClone(value);
                                  next.pages[pageIndex]!.fields[
                                    fieldIndex
                                  ]!.code = event.target.value;
                                  onChange(next);
                                }}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                fullWidth
                                label="Descrição"
                                value={field.label}
                                onChange={(event) => {
                                  const next = structuredClone(value);
                                  next.pages[pageIndex]!.fields[
                                    fieldIndex
                                  ]!.label = event.target.value;
                                  onChange(next);
                                }}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                fullWidth
                                label="Referência"
                                value={field.reference}
                                onChange={(event) => {
                                  const next = structuredClone(value);
                                  next.pages[pageIndex]!.fields[
                                    fieldIndex
                                  ]!.reference = event.target.value;
                                  onChange(next);
                                }}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                fullWidth
                                label="Valor"
                                value={field.value}
                                onChange={(event) => {
                                  const next = structuredClone(value);
                                  next.pages[pageIndex]!.fields[
                                    fieldIndex
                                  ]!.value = event.target.value;
                                  onChange(next);
                                }}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Button
                                size="small"
                                color="error"
                                onClick={() => {
                                  const next = structuredClone(value);
                                  next.pages[pageIndex]!.fields.splice(
                                    fieldIndex,
                                    1,
                                  );
                                  if (!next.pages[pageIndex]!.fields.length)
                                    next.pages[pageIndex]!.fields.push({
                                      code: "",
                                      label: "",
                                      reference: "",
                                      value: "",
                                      kind: "PROVENTO",
                                    });
                                  onChange(next);
                                }}
                              >
                                Remover
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {page.bases.length > 0 && (
                      <>
                        <Typography variant="subtitle2">
                          Totais e bases
                        </Typography>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Descrição</TableCell>
                              <TableCell>Valor</TableCell>
                              <TableCell>Ações</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {page.bases.map((base, baseIndex) => (
                              <TableRow key={baseIndex}>
                                <TableCell>
                                  <TextField
                                    fullWidth
                                    label="Descrição"
                                    value={base.label}
                                    onChange={(event) => {
                                      const next = structuredClone(value);
                                      next.pages[pageIndex]!.bases[
                                        baseIndex
                                      ]!.label = event.target.value;
                                      onChange(next);
                                    }}
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell>
                                  <TextField
                                    fullWidth
                                    label="Valor"
                                    value={base.value}
                                    onChange={(event) => {
                                      const next = structuredClone(value);
                                      next.pages[pageIndex]!.bases[
                                        baseIndex
                                      ]!.value = event.target.value;
                                      onChange(next);
                                    }}
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Button
                                    size="small"
                                    color="error"
                                    onClick={() => {
                                      const next = structuredClone(value);
                                      next.pages[pageIndex]!.bases.splice(
                                        baseIndex,
                                        1,
                                      );
                                      if (!next.pages[pageIndex]!.bases.length)
                                        next.pages[pageIndex]!.bases.push({
                                          label: "",
                                          value: "",
                                        });
                                      onChange(next);
                                    }}
                                  >
                                    Remover
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </>
                    )}
                  </Stack>
                </TableCell>
              </WarningRow>
            </TableBody>
          </Table>
        </Paper>
      ))}
    </Stack>
  );
}
