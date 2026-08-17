import type { CartaoPontoValue, HoleriteValue } from "@/domain/transcription/model";
export const cartaoFixture: CartaoPontoValue = { pages: [{ page: 1, days: [{ date_raw: "01/01/2020", punches: [{ kind: "IN", time_raw: "08:00", time_hhmm: "08:00" }, { kind: "OUT", time_raw: "17:00", time_hhmm: "17:00" }] }] }] };
export const holeriteFixture: HoleriteValue = { pages: [{ page: 1, month: "01", year: "2020", fields: [{ code: "0010", label: "Provento", reference: "", value: "1.000,00" }], bases: [{ label: "Base INSS", value: "1.000,00" }] }] };
