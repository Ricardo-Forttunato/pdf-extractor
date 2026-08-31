"use client";
import {Box, Button, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography} from "@mui/material";
import type { CartaoPontoValue } from "@/domain/transcription/model";
import { cartaoWarnings } from "@/domain/warnings/derive-warnings";
import { WarningRow } from "@/components/review/warning-row";

const periodFor = (dates: string[]) =>
  [
    ...new Set(
      dates.map((date) => {
        const parts = date.split("/");
        return parts.length === 3 ? `${parts[1]}/${parts[2]}` : date;
      }),
    ),
  ].join(", ");
const labelFor = (kind: "IN" | "OUT") => (kind === "IN" ? "Entrada" : "Saída");
const emptyPunch = (kind: "IN" | "OUT") => ({
  kind,
  time_raw: "",
  time_hhmm: "",
});

export function CartaoTable({
  value,
  onChange,
}: {
  value: CartaoPontoValue;
  onChange: (value: CartaoPontoValue) => void;
}) {
  const warnings = cartaoWarnings(value);
  let warningIndex = 0;
  const setPunchTime = (
    pageIndex: number,
    dayIndex: number,
    punchIndex: number,
    nextValue: string,
    kind: "IN" | "OUT",
  ) => {
    const next = structuredClone(value);
    while (
      next.pages[pageIndex]!.days[dayIndex]!.punches.length <= punchIndex
    ) {
      const nextKind =
        next.pages[pageIndex]!.days[dayIndex]!.punches.length % 2 === 0
          ? "IN"
          : "OUT";
      next.pages[pageIndex]!.days[dayIndex]!.punches.push(emptyPunch(nextKind));
    }
    next.pages[pageIndex]!.days[dayIndex]!.punches[punchIndex] =
      next.pages[pageIndex]!.days[dayIndex]!.punches[punchIndex] ??
      emptyPunch(kind);
    next.pages[pageIndex]!.days[dayIndex]!.punches[punchIndex]!.time_hhmm =
      nextValue;
    onChange(next);
  };
  return (
    <Stack spacing={2} aria-label="Transcrição de cartão de ponto">
      <Box>
        <Button
          variant="outlined"
          onClick={() =>
            onChange({
              pages: [
                ...value.pages,
                {
                  page: value.pages.length + 1,
                  days: [
                    {
                      date_raw: "",
                      punches: [emptyPunch("IN"), emptyPunch("OUT")],
                    },
                  ],
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
          <Box
            sx={{ px: 2, py: 1.25, borderBottom: 1, borderColor: "divider" }}
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              sx={{ alignItems: { sm: "center" } }}
            >
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Página {page.page}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Período:{" "}
                  {periodFor(page.days.map((day) => day.date_raw)) ||
                    "não identificado"}
                </Typography>
              </Box>
              <Button
                size="small"
                onClick={() => {
                  const next = structuredClone(value);
                  next.pages[pageIndex]!.days.push({
                    date_raw: "",
                    punches: [emptyPunch("IN"), emptyPunch("OUT")],
                  });
                  onChange(next);
                }}
              >
                Adicionar dia
              </Button>
            </Stack>
          </Box>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Data</TableCell>
                <TableCell>Entrada</TableCell>
                <TableCell>Saída</TableCell>
                <TableCell>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {page.days.flatMap((day, dayIndex) => {
                const currentWarnings = warnings[warningIndex++] ?? [];
                const pairs = Array.from(
                  { length: Math.max(1, Math.ceil(day.punches.length / 2)) },
                  (_, index) =>
                    [
                      day.punches[index * 2],
                      day.punches[index * 2 + 1],
                    ] as const,
                );
                return pairs.map(([entry, exit], pairIndex) => (
                  <WarningRow
                    key={`${page.page}-${dayIndex}-${pairIndex}`}
                    warnings={currentWarnings}
                  >
                    <TableCell>
                      {pairIndex === 0 ? (
                        <TextField
                          fullWidth
                          label="Data"
                          value={day.date_raw}
                          onChange={(event) => {
                            const next = structuredClone(value);
                            next.pages[pageIndex]!.days[dayIndex]!.date_raw =
                              event.target.value;
                            onChange(next);
                          }}
                          size="small"
                        />
                      ) : (
                        ""
                      )}
                    </TableCell>
                    {([entry, exit] as const).map((punch, localIndex) => {
                      const kind = localIndex === 0 ? "IN" : "OUT";
                      const punchIndex = pairIndex * 2 + localIndex;
                      return (
                        <TableCell key={`${kind}-edit`}>
                          <TextField
                            fullWidth
                            label={labelFor(kind)}
                            value={punch?.time_hhmm ?? ""}
                            onChange={(event) =>
                              setPunchTime(
                                pageIndex,
                                dayIndex,
                                punchIndex,
                                event.target.value,
                                kind,
                              )
                            }
                            size="small"
                          />
                        </TableCell>
                      );
                    })}
                    <TableCell>
                      {pairIndex === 0 && (
                        <Stack
                          direction={{ xs: "column", sm: "row" }}
                          spacing={1}
                        >
                          <Button
                            size="small"
                            onClick={() => {
                              const next = structuredClone(value);
                              next.pages[pageIndex]!.days[
                                dayIndex
                              ]!.punches.push(
                                emptyPunch("IN"),
                                emptyPunch("OUT"),
                              );
                              onChange(next);
                            }}
                          >
                            Adicionar par
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            onClick={() => {
                              const next = structuredClone(value);
                              next.pages[pageIndex]!.days.splice(dayIndex, 1);
                              if (!next.pages[pageIndex]!.days.length)
                                next.pages[pageIndex]!.days.push({
                                  date_raw: "",
                                  punches: [
                                    emptyPunch("IN"),
                                    emptyPunch("OUT"),
                                  ],
                                });
                              onChange(next);
                            }}
                          >
                            Remover dia
                          </Button>
                        </Stack>
                      )}
                    </TableCell>
                  </WarningRow>
                ));
              })}
            </TableBody>
          </Table>
        </Paper>
      ))}
    </Stack>
  );
}
