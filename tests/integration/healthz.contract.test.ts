/** @jest-environment node */
import { GET } from "@/app/healthz/route";
test("healthz retorna 200", () => expect(GET().status).toBe(200));
