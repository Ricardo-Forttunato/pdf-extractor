import type { CartaoPontoValue, DocumentType, HoleriteValue, TranscriptionValue } from "@/domain/transcription/model";

export function createEmptyCartaoValue(): CartaoPontoValue {
  return {
    pages: [{
      page: 1,
      days: [{
        date_raw: "",
        punches: [
          { kind: "IN", time_raw: "", time_hhmm: "" },
          { kind: "OUT", time_raw: "", time_hhmm: "" }
        ]
      }]
    }]
  };
}

export function createEmptyHoleriteValue(): HoleriteValue {
  return {
    pages: [{
      page: 1,
      year: "",
      month: "",
      reference: "",
      divergence_calculo: false,
      fields: [{
        code: "",
        label: "",
        reference: "",
        value: "",
        kind: "PROVENTO"
      }],
      bases: [{
        label: "",
        value: ""
      }]
    }]
  };
}

export function createEmptyTranscriptionValue(type: DocumentType): TranscriptionValue {
  return type === "cartao-ponto" ? createEmptyCartaoValue() : createEmptyHoleriteValue();
}
