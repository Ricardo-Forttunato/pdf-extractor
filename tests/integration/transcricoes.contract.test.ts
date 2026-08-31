/** @jest-environment node */
import { GET, PUT } from "@/app/api/transcricoes/[id]/route";
import { GET as exportGet } from "@/app/api/transcricoes/[id]/planilha/route";
import { cartaoFixture, holeriteFixture } from "@/test/helpers/fakes";
import { transcriptionStore } from "@/infrastructure/storage/in-memory-transcription-store";
const context = (id: string) => ({ params: Promise.resolve({ id }) });
test("GET preserva o contrato de ciclo de vida e PUT persiste substituição", async () => {
  transcriptionStore.create("opaque-test", "cartao-ponto", new Uint8Array());
  const processing = await GET(
    new Request("http://local"),
    context("opaque-test"),
  );
  expect(await processing.json()).toEqual({
    id: "opaque-test",
    tipo: "cartao-ponto",
    status: "processando",
    erro: null,
    value: null,
  });
  transcriptionStore.complete("opaque-test", cartaoFixture);
  const replacement = structuredClone(cartaoFixture);
  replacement.pages[0]!.days[0]!.punches[0]!.time_hhmm = "08:15";
  expect(
    (
      await PUT(
        new Request("http://local", {
          method: "PUT",
          body: JSON.stringify({ value: replacement }),
        }),
        context("opaque-test"),
      )
    ).status,
  ).toBe(204);
  expect(
    (
      await (
        await GET(new Request("http://local"), context("opaque-test"))
      ).json()
    ).value.pages[0].days[0].punches[0].time_hhmm,
  ).toBe("08:15");
});
test("exportações são explícitas e usam o valor salvo", async () => {
  transcriptionStore.create("export-test", "cartao-ponto", new Uint8Array());
  transcriptionStore.complete("export-test", cartaoFixture);
  for (const format of ["xlsx", "csv", "json"]) {
    const response = await exportGet(
      new Request(
        `http://local/api/transcricoes/export-test/planilha?formato=${format}`,
      ),
      context("export-test"),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("content-disposition")).toContain(`.${format}`);
  }
});
test("GET expõe status de revisão manual sem crashar o contrato", async () => {
  transcriptionStore.create("manual-test", "cartao-ponto", new Uint8Array());
  transcriptionStore.markManualReview(
    "manual-test",
    "ILEGIVEL_PARA_REVISAO_MANUAL",
  );
  const response = await GET(
    new Request("http://local"),
    context("manual-test"),
  );
  expect(await response.json()).toEqual({
    id: "manual-test",
    tipo: "cartao-ponto",
    status: "ILEGIVEL_PARA_REVISAO_MANUAL",
    erro: "ILEGIVEL_PARA_REVISAO_MANUAL",
    value: null,
  });
});
test("PUT permite concluir uma transcrição que estava em revisão manual", async () => {
  transcriptionStore.create("manual-edit", "holerite", new Uint8Array());
  transcriptionStore.markManualReview(
    "manual-edit",
    "ILEGIVEL_PARA_REVISAO_MANUAL",
  );
  expect(
    (
      await PUT(
        new Request("http://local", {
          method: "PUT",
          body: JSON.stringify({ value: holeriteFixture }),
        }),
        context("manual-edit"),
      )
    ).status,
  ).toBe(204);
  expect(
    await (
      await GET(new Request("http://local"), context("manual-edit"))
    ).json(),
  ).toEqual({
    id: "manual-edit",
    tipo: "holerite",
    status: "concluido",
    erro: null,
    value: holeriteFixture,
  });
});
