export const documentTypes = ["cartao-ponto", "holerite"] as const;
export type DocumentType = (typeof documentTypes)[number];
export type TranscriptionStatus = "processando" | "concluido" | "erro" | "ILEGIVEL_PARA_REVISAO_MANUAL";
export type ExportFormat = "xlsx" | "csv" | "json";
export interface Punch { kind: "IN" | "OUT"; time_raw: string; time_hhmm: string; }
export interface CartaoDay { date_raw: string; punches: Punch[]; }
export interface CartaoPage { page: number; days: CartaoDay[]; }
export interface CartaoPontoValue { pages: CartaoPage[]; }
export interface HoleriteField { code: string; label: string; reference: string; value: string; kind: "PROVENTO" | "DESCONTO"; }
export interface HoleriteBase { label: string; value: string; }
export interface HoleritePage { page: number; year: string; month: string; reference: string; divergence_calculo: boolean; fields: HoleriteField[]; bases: HoleriteBase[]; }
export interface HoleriteValue { pages: HoleritePage[]; }
export type TranscriptionValue = CartaoPontoValue | HoleriteValue;
export interface TranscriptionJob { id: string; tipo: DocumentType; status: TranscriptionStatus; erro: string | null; value: TranscriptionValue | null; sourcePdf: Uint8Array; createdAt: Date; updatedAt: Date; expiresAt: Date; }
export type GetTranscriptionResponse =
 | { id: string; tipo: DocumentType; status: "processando"; erro: null; value: null }
 | { id: string; tipo: DocumentType; status: "concluido"; erro: null; value: TranscriptionValue }
 | { id: string; tipo: DocumentType; status: "erro"; erro: string; value: null }
 | { id: string; tipo: DocumentType; status: "ILEGIVEL_PARA_REVISAO_MANUAL"; erro: string; value: null };
