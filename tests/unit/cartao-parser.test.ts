import { parseCartaoPonto } from "@/lib/parsers/cartao-ponto-parser";
describe("parser de cartão", () => {
  it("mantém ordem, batidas e incerteza", () => {
    const value = parseCartaoPonto(["21/05/2019 08:25 18:25\n22/05/2019 ??:??"]);
    expect(value.pages[0]?.days).toEqual([
      { date_raw: "21/05/2019", punches: [{ kind: "IN", time_raw: "08:25", time_hhmm: "08:25" }, { kind: "OUT", time_raw: "18:25", time_hhmm: "18:25" }] },
      { date_raw: "22/05/2019", punches: [{ kind: "IN", time_raw: "??:??", time_hhmm: "??:??" }] }
    ]);
  });

  it("aglutina linhas do mesmo dia, ignora a jornada e retorna vazio sem batidas", () => {
    const value = parseCartaoPonto([[
      "Mes/Ano : 8 / 2012",
      "17 - TER 08:00 09:09 13:01 HE-BCO DE HORAS 00:13",
      "17 - TER 08:00 14:16 18:50 HE-REMUNERADA 00:13",
      "29 - QUA 08:00 10:22 13:55 ABN/DEC.CHEFIA 01:10",
      "14:58 18:15",
      "30 - QUI 08:00 DESTACAMENTO",
      "31 - SEX 08:00"
    ].join("\n")]);
    expect(value.pages[0]?.days).toEqual([
      {
        date_raw: "17/08/2012",
        punches: [
          { kind: "IN", time_raw: "09:09", time_hhmm: "09:09" },
          { kind: "OUT", time_raw: "13:01", time_hhmm: "13:01" },
          { kind: "IN", time_raw: "14:16", time_hhmm: "14:16" },
          { kind: "OUT", time_raw: "18:50", time_hhmm: "18:50" }
        ]
      },
      {
        date_raw: "29/08/2012",
        punches: [
          { kind: "IN", time_raw: "10:22", time_hhmm: "10:22" },
          { kind: "OUT", time_raw: "13:55", time_hhmm: "13:55" },
          { kind: "IN", time_raw: "14:58", time_hhmm: "14:58" },
          { kind: "OUT", time_raw: "18:15", time_hhmm: "18:15" }
        ]
      },
      { date_raw: "30/08/2012", punches: [] },
      { date_raw: "31/08/2012", punches: [] }
    ]);
  });
});
