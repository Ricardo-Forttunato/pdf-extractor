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
});
