import { isKnownValidDate, isKnownValidTime } from "@/domain/transcription/validation";
test("não normaliza data e hora impossíveis", () => { expect(isKnownValidDate("38/07/2020")).toBe(false); expect(isKnownValidTime("25:70")).toBe(false); });
