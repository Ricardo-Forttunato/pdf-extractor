import { parseCartaoPonto } from "@/lib/parsers/cartao-ponto-parser";

describe("parser de cartão", () => {
  it("mantém ordem das páginas, dias e batidas vindas da visão", () => {
    const value = parseCartaoPonto([
      {
        status: "OK",
        reason: "",
        days: [
          { date_raw: "21/05/2019", punches: ["08:25", "18:25"] },
          { date_raw: "22/05/2019", punches: ["??:??"] }
        ]
      }
    ]);

    expect(value.pages[0]?.days).toEqual([
      { date_raw: "21/05/2019", punches: [{ kind: "IN", time_raw: "08:25", time_hhmm: "08:25" }, { kind: "OUT", time_raw: "18:25", time_hhmm: "18:25" }] },
      { date_raw: "22/05/2019", punches: [{ kind: "IN", time_raw: "??:??", time_hhmm: "??:??" }] }
    ]);
  });

  it("preserva dias sem batidas", () => {
    const value = parseCartaoPonto([
      {
        status: "OK",
        reason: "",
        days: [
          { date_raw: "30/08/2012", punches: [] },
          { date_raw: "31/08/2012", punches: [] }
        ]
      }
    ]);

    expect(value.pages[0]?.days).toEqual([
      { date_raw: "30/08/2012", punches: [] },
      { date_raw: "31/08/2012", punches: [] }
    ]);
  });

  it("aglutina múltiplas linhas do mesmo dia a partir do OCR processado", () => {
    const value = parseCartaoPonto([{
      pageNumber: 1,
      kind: "scanned",
      text: [
        "PERIODO 08/2026",
        "2 - SEG 08:00 12:00",
        "2 - SEG 13:00 17:00",
        "3 - TER DESTACAMENTO"
      ].join("\n"),
      lines: [
        "PERIODO 08/2026",
        "2 - SEG 08:00 12:00",
        "2 - SEG 13:00 17:00",
        "3 - TER DESTACAMENTO"
      ]
    }]);

    expect(value.pages[0]).toEqual({
      page: 1,
      days: [
        {
          date_raw: "02/08/2026",
          punches: [
            { kind: "IN", time_raw: "08:00", time_hhmm: "08:00" },
            { kind: "OUT", time_raw: "12:00", time_hhmm: "12:00" },
            { kind: "IN", time_raw: "13:00", time_hhmm: "13:00" },
            { kind: "OUT", time_raw: "17:00", time_hhmm: "17:00" }
          ]
        },
        {
          date_raw: "03/08/2026",
          punches: []
        }
      ]
    });
  });

  it("reordena cronologicamente quatro batidas em layout escaneado sem coluna de jornada", () => {
    const value = parseCartaoPonto([{
      pageNumber: 1,
      kind: "scanned",
      text: [
        "Mês/Ano: 05/2010",
        "17SEG 12:00-1815 15:00-15:15 610 276 Ss"
      ].join("\n"),
      lines: [
        "Mês/Ano: 05/2010",
        "17SEG 12:00-1815 15:00-15:15 610 276 Ss"
      ]
    }]);

    expect(value.pages[0]?.days).toEqual([
      {
        date_raw: "17/05/2010",
        punches: [
          { kind: "IN", time_raw: "12:00", time_hhmm: "12:00" },
          { kind: "OUT", time_raw: "15:00", time_hhmm: "15:00" },
          { kind: "IN", time_raw: "15:15", time_hhmm: "15:15" },
          { kind: "OUT", time_raw: "18:15", time_hhmm: "18:15" }
        ]
      }
    ]);
  });

  it("captura quatro batidas em layout contínuo com data completa e ignora cabeçalho", () => {
    const value = parseCartaoPonto([{
      pageNumber: 1,
      kind: "scanned",
      text: [
        "Cartão de Ponto Página 1 de 38",
        "Data: 09/03/2026",
        "16/12/2019 SEG 07:00d 12:00d 13:00d 17:00d",
        "17/12/2019 TER 06:59d 12:00d 13:00d 16:59d"
      ].join("\n"),
      lines: [
        "Cartão de Ponto Página 1 de 38",
        "Data: 09/03/2026",
        "16/12/2019 SEG 07:00d 12:00d 13:00d 17:00d",
        "17/12/2019 TER 06:59d 12:00d 13:00d 16:59d"
      ]
    }]);

    expect(value.pages[0]?.days).toEqual([
      {
        date_raw: "16/12/2019",
        punches: [
          { kind: "IN", time_raw: "07:00", time_hhmm: "07:00" },
          { kind: "OUT", time_raw: "12:00", time_hhmm: "12:00" },
          { kind: "IN", time_raw: "13:00", time_hhmm: "13:00" },
          { kind: "OUT", time_raw: "17:00", time_hhmm: "17:00" }
        ]
      },
      {
        date_raw: "17/12/2019",
        punches: [
          { kind: "IN", time_raw: "06:59", time_hhmm: "06:59" },
          { kind: "OUT", time_raw: "12:00", time_hhmm: "12:00" },
          { kind: "IN", time_raw: "13:00", time_hhmm: "13:00" },
          { kind: "OUT", time_raw: "16:59", time_hhmm: "16:59" }
        ]
      }
    ]);
  });
});
