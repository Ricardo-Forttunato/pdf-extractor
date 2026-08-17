import { parseCartaoPonto } from "@/lib/parsers/cartao-ponto-parser";
test("o pipeline preserva incerteza em vez de inventar caractere", () => { expect(parseCartaoPonto(["01/01/2020 ??:??"]).pages[0]?.days[0]?.punches[0]?.time_raw).toBe("??:??"); });
